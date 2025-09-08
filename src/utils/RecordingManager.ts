export interface FeedbackEntry {
  timestamp: number;
  feedback_text: string;
  frame_number: number;
}

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private feedbackEntries: FeedbackEntry[] = [];
  private startTimestamp: number = 0;
  private frameCount: number = 0;
  private sessionId: string = '';

  constructor() {
    this.reset();
  }

  private reset() {
    this.recordedChunks = [];
    this.feedbackEntries = [];
    this.startTimestamp = 0;
    this.frameCount = 0;
    this.sessionId = '';
  }

  startRecording(stream: MediaStream) {
    this.reset();
    this.startTimestamp = Date.now();
    this.sessionId = this.generateSessionId();

    const options = {
      mimeType: 'video/webm;codecs=vp8',
      videoBitsPerSecond: 2500000
    };

    this.mediaRecorder = new MediaRecorder(stream, options);

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
    this.frameCount++;

    this.feedbackEntries.push({
      timestamp,
      feedback_text: feedbackText,
      frame_number: this.frameCount
    });
  }

  private generateSessionId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `recording_session_${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
  }

  private generateCSV(): string {
    let csv = 'timestamp,feedback_text,frame_number\n';
    
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