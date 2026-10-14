import { MotionPlan, MotionSegment } from '../types/motion';
import { drawBackgroundAndEffects, drawMotionSegment } from './canvasMotionDraw';

export interface Mp4ExportOptions {
  plan: MotionPlan;
  format?: 'mp4' | 'webm';
  fps?: 30 | 60;
  quality?: 'standard' | 'high' | 'ultra'; // bitrates: 4Mbps, 8Mbps, 14Mbps
  customResolution?: { width: number; height: number };
  includeAudio?: boolean;
  onProgress?: (progress: {
    percent: number;
    currentTime: number;
    totalDuration: number;
    currentFrame: number;
    totalFrames: number;
    status: string;
  }) => void;
  onSuccess?: (result: {
    blob: Blob;
    url: string;
    filename: string;
    sizeBytes: number;
    format: string;
    width: number;
    height: number;
    duration: number;
  }) => void;
  onError?: (err: Error) => void;
}

export class Mp4VideoRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isCancelled = false;
  private activeCanvas: HTMLCanvasElement | null = null;
  private audioContext: AudioContext | null = null;

  public static getSupportedFormats(): {
    mp4Supported: boolean;
    webmSupported: boolean;
    preferredMimeType: string;
    supportedMimeTypes: string[];
  } {
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      return {
        mp4Supported: false,
        webmSupported: false,
        preferredMimeType: '',
        supportedMimeTypes: [],
      };
    }

    const testTypes = [
      'video/mp4;codecs=avc1.4d002a,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4;codecs=h264',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    const supported = testTypes.filter(t => MediaRecorder.isTypeSupported(t));
    const mp4Supported = supported.some(t => t.includes('video/mp4'));
    const webmSupported = supported.some(t => t.includes('video/webm'));

    return {
      mp4Supported,
      webmSupported,
      preferredMimeType: supported[0] || 'video/webm',
      supportedMimeTypes: supported,
    };
  }

  public async startExport(options: Mp4ExportOptions): Promise<void> {
    this.isCancelled = false;
    this.recordedChunks = [];

    const {
      plan,
      format = 'mp4',
      fps = 60,
      quality = 'high',
      customResolution,
      includeAudio = true,
      onProgress,
      onSuccess,
      onError,
    } = options;

    try {
      // 1. Determine target canvas dimensions
      let targetW = customResolution?.width || plan.meta.w;
      let targetH = customResolution?.height || plan.meta.h;

      // Ensure even dimensions (required by H.264 / MP4 codecs)
      if (targetW % 2 !== 0) targetW += 1;
      if (targetH % 2 !== 0) targetH += 1;

      // 2. Setup Offscreen rendering canvas
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      this.activeCanvas = canvas;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('امکان ایجاد بافت Canvas وجود ندارد.');

      // 3. Determine codec & MIME type
      const formatsInfo = Mp4VideoRecorder.getSupportedFormats();
      let chosenMime = '';

      if (format === 'mp4') {
        const mp4Candidates = [
          'video/mp4;codecs=avc1.4d002a,mp4a.40.2',
          'video/mp4;codecs=avc1',
          'video/mp4;codecs=h264',
          'video/mp4',
        ];
        chosenMime = mp4Candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';

        // If direct MP4 isn't supported in browser, fallback gracefully to WebM
        if (!chosenMime) {
          chosenMime = formatsInfo.preferredMimeType || 'video/webm';
        }
      } else {
        const webmCandidates = [
          'video/webm;codecs=vp9,opus',
          'video/webm;codecs=vp8,opus',
          'video/webm',
        ];
        chosenMime = webmCandidates.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';
      }

      // Bitrate selection
      const bitrates = {
        standard: 4_000_000, // 4 Mbps
        high: 8_500_000,     // 8.5 Mbps
        ultra: 14_000_000,   // 14 Mbps
      };
      const videoBitsPerSecond = bitrates[quality] || 8_500_000;

      // 4. Capture Canvas stream
      const stream = canvas.captureStream(fps);

      // 5. Audio setup (if plan has audio and user enabled audio)
      let audioElement: HTMLAudioElement | null = null;
      if (includeAudio && plan.audio?.src) {
        try {
          audioElement = new Audio(plan.audio.src);
          audioElement.crossOrigin = 'anonymous';
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            this.audioContext = new AudioContextClass();
            const source = this.audioContext.createMediaElementSource(audioElement);
            const destination = this.audioContext.createMediaStreamDestination();
            source.connect(destination);
            // Also keep audio muted in speakers during export so it doesn't blast
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 0;
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
          }
        } catch (audioErr) {
          console.warn('Audio stream mix note:', audioErr);
        }
      }

      // 6. Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: chosenMime,
        videoBitsPerSecond,
      });
      this.mediaRecorder = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      const totalDuration = plan.meta.duration;
      const totalFrames = Math.ceil(totalDuration * fps);

      const renderAtTime = (t: number) => {
        drawBackgroundAndEffects(ctx, targetW, targetH, t, plan.theme, plan.style);
        for (const seg of plan.segments) {
          if (t >= seg.from - 0.02 && t <= seg.to + 0.02) {
            drawMotionSegment(ctx, seg, t, targetW, targetH, plan.theme, plan.style);
          }
        }
      };

      // 7. Start Recorder
      recorder.start(250);
      if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(() => {});
      }

      // 8. Timed Render Loop
      const startTime = performance.now();

      const renderLoop = () => {
        if (this.isCancelled) {
          recorder.stop();
          if (audioElement) audioElement.pause();
          return;
        }

        const now = performance.now();
        const elapsed = (now - startTime) / 1000;
        const currentFrame = Math.min(totalFrames, Math.floor(elapsed * fps));

        renderAtTime(elapsed);

        if (onProgress) {
          onProgress({
            percent: Math.min(100, Math.round((elapsed / totalDuration) * 100)),
            currentTime: Math.min(totalDuration, elapsed),
            totalDuration,
            currentFrame,
            totalFrames,
            status: 'در حال رندر فریم‌ها و ضبط...',
          });
        }

        if (elapsed < totalDuration + 0.3) {
          requestAnimationFrame(renderLoop);
        } else {
          // Finish recording
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
          if (audioElement) audioElement.pause();
        }
      };

      requestAnimationFrame(renderLoop);

      recorder.onstop = () => {
        if (this.isCancelled) return;

        const effectiveMime = chosenMime.includes('mp4') ? 'video/mp4' : 'video/webm';
        const fileExt = chosenMime.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(this.recordedChunks, { type: effectiveMime });
        const videoUrl = URL.createObjectURL(blob);
        const titleSlug = (plan.meta.title || 'motion').replace(/[\s/\\?%*:|"<>]+/g, '-');
        const filename = `${titleSlug}-${targetW}x${targetH}.${fileExt}`;

        if (onSuccess) {
          onSuccess({
            blob,
            url: videoUrl,
            filename,
            sizeBytes: blob.size,
            format: fileExt.toUpperCase(),
            width: targetW,
            height: targetH,
            duration: totalDuration,
          });
        }
      };
    } catch (err: any) {
      if (onError) onError(err);
    }
  }

  public cancel(): void {
    this.isCancelled = true;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
    }
  }
}
