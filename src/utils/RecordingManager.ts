export interface FeedbackEntry {
  timestamp: number;
  feedback_text: string;
  frame_number: number;
}

import { TIMING } from '../constants';

const FRAME_CAPTURE_DELAY = TIMING.FRAME_CAPTURE_DELAY;

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private feedbackEntries: FeedbackEntry[] = [];
  private startTimestamp: number = 0;
  private sessionId: string = '';

  constructor() {
    this.reset();
  }

  private reset() {
    this.recordedChunks = [];
    this.feedbackEntries = [];
    this.startTimestamp = 0;
    this.sessionId = '';
  }

  async startRecording(stream: MediaStream, userInfo?: { name: string; function: string }) {
    this.reset();
    this.startTimestamp = Date.now();
    this.sessionId = this.generateSessionId(userInfo);

    // Check if stream already has audio (from InputSourceDialog)
    const hasAudio = stream.getAudioTracks().length > 0;
    
    let combinedStream = stream;
    if (!hasAudio) {
      // Only request microphone if not already present
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioTracks = audioStream.getAudioTracks();
        
        // Create a new stream combining video from screen and audio from microphone
        combinedStream = new MediaStream();
        
        // Add all video tracks from screen capture
        stream.getVideoTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
        
        // Add audio track from microphone
        audioTracks.forEach(track => {
          combinedStream.addTrack(track);
        });
        
        console.log('Microphone audio added to recording');
      } catch (error) {
        console.warn('Could not access microphone, recording without audio:', error);
      }
    } else {
      console.log('Using existing audio track from stream');
    }

    const options = {
      mimeType: 'video/webm;codecs=vp8,opus',
      videoBitsPerSecond: 2500000,
      audioBitsPerSecond: 128000
    };

    this.mediaRecorder = new MediaRecorder(combinedStream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(1000); // Collect data every second
    console.log(`Recording started - Session: ${this.sessionId}`);
  }

  stopRecording(): Promise<{ videoBlob: Blob; csvContent: string; sessionId: string }> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({ videoBlob: new Blob(), csvContent: '', sessionId: '' });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const csvContent = this.generateCSV();
        resolve({ videoBlob, csvContent, sessionId: this.sessionId });
      };

      this.mediaRecorder.stop();
    });
  }

  addFeedback(feedbackText: string) {
    if (this.startTimestamp === 0) return;

    const timestamp = Date.now() - this.startTimestamp;
    // Calculate approximate frame number based on time and capture delay
    const frameNumber = Math.floor(timestamp / FRAME_CAPTURE_DELAY);

    this.feedbackEntries.push({
      timestamp,
      feedback_text: feedbackText,
      frame_number: frameNumber
    });
    
    // Log feedback entry for debugging (remove in production)
  }

  private generateSessionId(userInfo?: { name: string; function: string }): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    let sessionId = `recording_session_${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    
    if (userInfo) {
      // Generate initials from name (first letter of each word)
      const initials = userInfo.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3); // Max 3 characters
      
      // Clean function name (remove spaces, special chars, max 10 chars)
      const functionClean = userInfo.function
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 10);
      
      sessionId = `${initials}_${functionClean}_${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    }
    
    return sessionId;
  }

  private generateCSV(): string {
    let csv = 'timestamp_ms,feedback_text,frame_number\n';
    
    for (const entry of this.feedbackEntries) {
      const escapedFeedback = `"${entry.feedback_text.replace(/"/g, '""')}"`;
      csv += `${entry.timestamp},${escapedFeedback},${entry.frame_number}\n`;
    }
    
    return csv;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}