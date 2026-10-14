export interface VideoRecordOptions {
  canvas: HTMLCanvasElement;
  audioElement?: HTMLAudioElement | null;
  duration: number;
  onProgress?: (progress: number) => void;
  onFinish?: (videoBlob: Blob, videoUrl: string) => void;
  onError?: (err: Error) => void;
}

export class VideoExporter {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  public startRecording(options: VideoRecordOptions): void {
    const { canvas, audioElement, duration, onProgress, onFinish, onError } = options;

    try {
      const stream = canvas.captureStream(60);

      // If audio is present, mix in the audio stream
      if (audioElement && (audioElement as any).captureStream) {
        try {
          const audioStream = (audioElement as any).captureStream();
          audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => stream.addTrack(track));
        } catch (e) {
          console.warn('Could not capture audio stream', e);
        }
      }

      // Check supported mime type
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4',
      ];
      const selectedMime = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 4_500_000, // 4.5 Mbps high quality
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: selectedMime });
        const videoUrl = URL.createObjectURL(blob);
        if (onFinish) onFinish(blob, videoUrl);
      };

      this.mediaRecorder.start(250);

      // Track progress
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const prog = Math.min(1, elapsed / duration);
        if (onProgress) onProgress(prog);

        if (elapsed >= duration + 0.2) {
          clearInterval(interval);
          this.stopRecording();
        }
      }, 100);
    } catch (err: any) {
      if (onError) onError(err);
    }
  }

  public stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}
