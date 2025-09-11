import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import LoadingScreen from "./components/LoadingScreen";
import CaptioningView from "./components/CaptioningView";
import WelcomeScreen from "./components/WelcomeScreen";
import InputSourceDialog from "./components/InputSourceDialog";
import type { AppState } from "./types";

export default function App() {
  const [appState, setAppState] = useState<AppState>("welcome");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [sourceType, setSourceType] = useState<"screen" | "file" | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [userInfo, setUserInfo] = useState<{ name: string; function: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleSourceSelected = useCallback((stream: MediaStream, type: "screen" | "file") => {
    setMediaStream(stream);
    setSourceType(type);
    setAppState("loading");
  }, []);

  const handleStart = useCallback((userData: { name: string; function: string }) => {
    setUserInfo(userData);
    setAppState("source-selection");
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setAppState("captioning");
  }, []);


  const setupVideo = useCallback((video: HTMLVideoElement, stream: MediaStream) => {
    const videoFileUrl = (stream as MediaStream & { videoFileUrl?: string }).videoFileUrl;

    if (videoFileUrl) {
      video.srcObject = null;
      video.src = videoFileUrl;
    } else {
      video.src = "";
      video.srcObject = stream;
    }

    const handleCanPlay = () => {
      setIsVideoReady(true);
      video.play().catch(() => {});
    };

    video.addEventListener("canplay", handleCanPlay, { once: true });

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  useEffect(() => {
    if (mediaStream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = null;
      video.load();
      const cleanup = setupVideo(video, mediaStream);
      return cleanup;
    }
  }, [mediaStream, setupVideo]);

  const videoBlurState = useMemo(() => {
    switch (appState) {
      case "welcome":
        return "blur(12px) brightness(0.3) saturate(0.7)";
      case "source-selection":
        return "blur(20px) brightness(0.2) saturate(0.5)";
      case "loading":
        return "blur(8px) brightness(0.4) saturate(0.8)";
      case "captioning":
        return "none";
      default:
        return "blur(12px) brightness(0.3) saturate(0.7)";
    }
  }, [appState]);

  return (
    <div className="App relative h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />

      {mediaStream && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out"
          style={{
            filter: videoBlurState,
            opacity: isVideoReady ? 1 : 0,
          }}
        />
      )}

      {appState !== "captioning" && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
      )}

      {appState === "welcome" && (
        <WelcomeScreen 
          onStart={handleStart}
        />
      )}

      {appState === "source-selection" && <InputSourceDialog onSourceSelected={handleSourceSelected} />}

      {appState === "loading" && <LoadingScreen onComplete={handleLoadingComplete} />}

      {appState === "captioning" && <CaptioningView videoRef={videoRef} sourceType={sourceType} userInfo={userInfo} />}
    </div>
  );
}
