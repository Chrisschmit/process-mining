import { useState, useRef, useEffect, useCallback } from "react";
import VideoScrubber from "./VideoScrubber";
import DraggableContainer from "./DraggableContainer";
import PromptInput from "./PromptInput";
import LiveCaption from "./LiveCaption";
import GlassButton from "./GlassButton";
import { useVLMContext } from "../context/useVLMContext";
import { PROMPTS, TIMING } from "../constants";
import { RecordingManager } from "../utils/RecordingManager";

interface CaptioningViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sourceType: "screen" | "file" | null;
  userInfo: { name: string; function: string } | null;
}

function useCaptioningLoop(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isRunning: boolean,
  promptRef: React.RefObject<string>,
  onCaptionUpdate: (caption: string) => void,
  onError: (error: string) => void,
) {
  const { isLoaded, runInference } = useVLMContext();
  const abortControllerRef = useRef<AbortController | null>(null);
  const onCaptionUpdateRef = useRef(onCaptionUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCaptionUpdateRef.current = onCaptionUpdate;
  }, [onCaptionUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    if (!isRunning || !isLoaded) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    const video = videoRef.current;
    const captureLoop = async () => {
      while (!signal.aborted) {
        if (video && video.readyState >= 2 && !video.paused && video.videoWidth > 0) {
          try {
            const currentPrompt = promptRef.current || "";
            const result = await runInference(video, currentPrompt, onCaptionUpdateRef.current);
            if (result && !signal.aborted) onCaptionUpdateRef.current(result);
          } catch (error) {
            if (!signal.aborted) {
              const message = error instanceof Error ? error.message : String(error);
              onErrorRef.current(message);
              console.error("Error processing frame:", error);
            }
          }
        }
        if (signal.aborted) break;
        await new Promise((resolve) => setTimeout(resolve, TIMING.FRAME_CAPTURE_DELAY));
      }
    };

    // NB: Wrap with a setTimeout to ensure abort controller can run before starting the loop
    // This is necessary for React's strict mode which calls effects twice in development.
    setTimeout(captureLoop, 0);

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isRunning, isLoaded, runInference, promptRef, videoRef]);
}

export default function CaptioningView({ videoRef, sourceType, userInfo }: CaptioningViewProps) {
  const [caption, setCaption] = useState<string>("");
  // For video files, start analysis immediately; for screen recording, wait for user to start
  const [isLoopRunning, setIsLoopRunning] = useState<boolean>(sourceType === "file");
  const [currentPrompt, setCurrentPrompt] = useState<string>(PROMPTS.default);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isMicEnabled, setIsMicEnabled] = useState<boolean>(true);
  const recordingManagerRef = useRef<RecordingManager>(new RecordingManager());
  const lastLoggedCaptionRef = useRef<string>("");
  const lastLogTimeRef = useRef<number>(0);

  // Use ref to store current prompt to avoid loop restarts
  const promptRef = useRef<string>(currentPrompt);

  // Update prompt ref when state changes
  useEffect(() => {
    promptRef.current = currentPrompt;
  }, [currentPrompt]);

  const handleCaptionUpdate = useCallback((newCaption: string) => {
    setCaption(newCaption);
    setError(null);

    // Only log to CSV at the same frequency as frame capture (every TIMING.FRAME_CAPTURE_DELAY ms)
    // and only if the caption has changed significantly (not just streaming tokens)
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTimeRef.current;

    if (
      recordingManagerRef.current.isRecording() &&
      timeSinceLastLog >= TIMING.FRAME_CAPTURE_DELAY &&
      newCaption !== lastLoggedCaptionRef.current &&
      newCaption.length > 0
    ) {
      // Only log if this looks like a complete response (ends with punctuation or is long enough)
      const isCompleteResponse = newCaption.match(/[.!?]$/) || newCaption.length > 100 || timeSinceLastLog > 1000;

      if (isCompleteResponse) {
        recordingManagerRef.current.addFeedback(newCaption);
        lastLoggedCaptionRef.current = newCaption;
        lastLogTimeRef.current = now;
      }
    }
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setCaption(`Error: ${errorMessage}`);
  }, []);

  useCaptioningLoop(videoRef, isLoopRunning, promptRef, handleCaptionUpdate, handleError);

  // const handlePromptChange = useCallback((prompt: string) => {
  //   setCurrentPrompt(prompt);
  //   setError(null);
  // }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      if (sourceType === "screen" && videoRef.current?.srcObject && userInfo) {
        const stream = videoRef.current.srcObject as MediaStream;
        await recordingManagerRef.current.startRecording(stream, userInfo);
        setIsRecording(true);
        setIsLoopRunning(true); // Start VLM captioning when recording starts
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      setError(error instanceof Error ? error.message : "Failed to start recording");
    }
  }, [sourceType, videoRef, userInfo]);

  const handleStopRecording = useCallback(async () => {
    setIsLoopRunning(false); // Stop VLM captioning when recording stops
    const { videoBlob, csvContent, sessionId } = await recordingManagerRef.current.stopRecording();
    setIsRecording(false);

    // Download video
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoLink = document.createElement("a");
    videoLink.href = videoUrl;
    videoLink.download = `${sessionId}.webm`;
    videoLink.click();
    setTimeout(() => URL.revokeObjectURL(videoUrl), 1000);

    // Download CSV
    const csvBlob = new Blob([csvContent], { type: "text/csv" });
    const csvUrl = URL.createObjectURL(csvBlob);
    const csvLink = document.createElement("a");
    csvLink.href = csvUrl;
    csvLink.download = `${sessionId}_feedback.csv`;
    csvLink.click();
    setTimeout(() => URL.revokeObjectURL(csvUrl), 1000);
  }, []);

  const handleChangeScreenShare = useCallback(async () => {
    try {
      // Get new screen share stream
      const newStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: isMicEnabled,
      });

      // Replace video track in current stream
      if (videoRef.current?.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        const oldVideoTrack = currentStream.getVideoTracks()[0];
        const newVideoTrack = newStream.getVideoTracks()[0];

        if (oldVideoTrack && newVideoTrack) {
          currentStream.removeTrack(oldVideoTrack);
          currentStream.addTrack(newVideoTrack);
          oldVideoTrack.stop();
        }

        // Update recording manager's stream if recording
        if (isRecording && recordingManagerRef.current.isRecording()) {
          // Note: This will require updating RecordingManager to support stream replacement
          console.log("Screen share changed while recording");
        }
      }
    } catch (error) {
      console.error("Failed to change screen share:", error);
      setError(error instanceof Error ? error.message : "Failed to change screen share");
    }
  }, [videoRef, isMicEnabled, isRecording]);

  const handleToggleMic = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      
      audioTracks.forEach(track => {
        track.enabled = !isMicEnabled;
      });
      
      setIsMicEnabled(!isMicEnabled);
    }
  }, [videoRef, isMicEnabled]);

  return (
    <div className="absolute inset-0 text-white">
      <div className="r-full h-full">
        {/* Recording Controls - Only show for screen recording */}
        {sourceType === "screen" && (
          <div className="absolute top-4 left-4 z-[200]">
            <GlassButton
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className="px-6 py-3"
              bgColor={isRecording ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)"}
            >
              {isRecording ? "Stop Recording & Analysis" : "Start Recording"}
            </GlassButton>
            {isRecording && <div className="mt-2 text-sm text-red-400">Recording</div>}
            {!isRecording && !isLoopRunning && caption === "" && (
              <div className="mt-2 text-sm text-gray-400">Click to start recording and VLM analysis</div>
            )}
          </div>
        )}

        {/* Screen Share & Mic Controls - Only show for screen recording */}
        {sourceType === "screen" && (
          <div className="absolute top-4 right-4 z-[200] flex gap-2">
            {/* Change Screen Share Button */}
            <div className="shadow-lg">
              <GlassButton
                onClick={handleChangeScreenShare}
                className="p-3"
                bgColor="rgba(59, 130, 246, 0.1)"
                aria-label="Change screen share"
              >
                <img 
                  src="/cast.png" 
                  alt="Screen share" 
                  className="w-6 h-6"
                  style={{ filter: 'invert(1)' }}
                />
              </GlassButton>
            </div>

            {/* Microphone Toggle Button */}
            <div className="shadow-lg">
              <GlassButton
                onClick={handleToggleMic}
                className="p-3"
                bgColor={isMicEnabled ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                aria-label={isMicEnabled ? "Mute microphone" : "Unmute microphone"}
              >
              {isMicEnabled ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              )}
            </GlassButton>
          </div>
        )}

        {/* Video Scrubber - Only show for video files */}
        <VideoScrubber videoRef={videoRef} isVisible={sourceType === "file"} />

        {/* Draggable Prompt Input - Bottom Left (above scrubber) - HIDDEN but functionality preserved */}
        {/* 
        <DraggableContainer
          initialPosition={sourceType === "file" ? { x: 20, y: window.innerHeight - 200 } : "bottom-left"}
          className="z-[150]"
        >
          <PromptInput onPromptChange={handlePromptChange} />
        </DraggableContainer>
        */}

        {/* Draggable Live Caption - Bottom Right (above scrubber) */}
        <DraggableContainer
          initialPosition={
            sourceType === "file" ? { x: window.innerWidth - 170, y: window.innerHeight - 200 } : "bottom-right"
          }
          className="z-[150]"
        >
          <LiveCaption caption={caption} isRunning={isLoopRunning} error={error} />
        </DraggableContainer>
      </div>
    </div>
  );
}
