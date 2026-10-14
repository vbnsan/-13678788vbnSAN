import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Maximize2, Volume2, VolumeX, Video, Download, ExternalLink } from 'lucide-react';
import { MotionPlan, MotionSegment } from '../types/motion';
import { VideoExporter } from '../engine/videoRecorder';
import { downloadStandaloneHtml, generateStandaloneHtml } from '../engine/standaloneHtml';
import { VideoExportModal } from './VideoExportModal';
import { drawBackgroundAndEffects, drawMotionSegment } from '../engine/canvasMotionDraw';

interface Props {
  plan: MotionPlan;
  onTimeUpdate?: (time: number) => void;
  onRatingRequest?: () => void;
}

export const MotionCanvasPlayer: React.FC<Props> = ({ plan, onTimeUpdate, onRatingRequest }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [showVideoExportModal, setShowVideoExportModal] = useState(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const videoExporterRef = useRef<VideoExporter | null>(null);
  const activeSegmentAudioRef = useRef<{ id: string; audio: HTMLAudioElement } | null>(null);

  const { w, h, duration, aspectRatio } = plan.meta;
  const { theme, style } = plan;

  // Initialize Web Audio API for visualizer
  const setupAudioContext = useCallback(() => {
    if (!audioRef.current || analyserRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      analyserRef.current = analyser;
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      console.warn('Audio context initialization note:', e);
    }
  }, []);

  // Main Canvas render loop using shared engine
  const drawFrame = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Find active segment for background image & mood
      let activeSeg: MotionSegment | null = null;
      for (const seg of plan.segments) {
        if (t >= seg.from - 0.02 && t <= seg.to + 0.02) {
          activeSeg = seg;
          break;
        }
      }

      // Draw background, stock photo layer, cyber grid, bokeh particles & frame
      drawBackgroundAndEffects(ctx, w, h, t, theme, style, activeSeg);

      // Draw all active segments (captions, bar charts, gauges, stats, quotes)
      for (const seg of plan.segments) {
        if (t >= seg.from - 0.02 && t <= seg.to + 0.02) {
          drawMotionSegment(ctx, seg, t, w, h, theme, style);
        }
      }

      // Audio waveform visualizer (if enabled and audio playing)
      if (style.audioBars && analyserRef.current && freqDataRef.current) {
        analyserRef.current.getByteFrequencyData(freqDataRef.current as any);
        const barCount = 28;
        const barW = (w * 0.44) / barCount;
        for (let i = 0; i < barCount; i++) {
          const val = (freqDataRef.current[Math.floor(i * freqDataRef.current.length / barCount / 2)] || 0) / 255;
          const barH = Math.max(3, val * h * 0.11);
          ctx.fillStyle = i % 5 === 0 ? (theme.accent || '#ff4a24') : 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(w * 0.28 + i * barW, h * 0.9 - barH, barW * 0.6, barH);
        }
      }
    },
    [plan.segments, style, theme, w, h]
  );

  // Animation frame loop
  useEffect(() => {
    let mounted = true;

    const loop = (timestamp: number) => {
      if (!mounted) return;
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000) * playbackRate;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        let nextTime = currentTime + delta;

        if (audioRef.current && !audioRef.current.paused) {
          nextTime = audioRef.current.currentTime;
        } else if (!plan.audio?.src && !isMuted) {
          // Play individual segment audio if available
          const activeSeg = plan.segments.find((s) => nextTime >= s.from && nextTime <= s.to && s.audioTrack?.src);
          if (activeSeg && activeSeg.audioTrack?.src) {
            if (!activeSegmentAudioRef.current || activeSegmentAudioRef.current.id !== activeSeg.id) {
              if (activeSegmentAudioRef.current) {
                activeSegmentAudioRef.current.audio.pause();
              }
              const audio = new Audio(activeSeg.audioTrack.src);
              audio.currentTime = Math.max(0, nextTime - activeSeg.from);
              audio.playbackRate = playbackRate;
              audio.play().catch(() => {});
              activeSegmentAudioRef.current = { id: activeSeg.id, audio };
            }
          } else if (activeSegmentAudioRef.current) {
            activeSegmentAudioRef.current.audio.pause();
            activeSegmentAudioRef.current = null;
          }
        }

        if (nextTime >= duration) {
          nextTime = duration;
          setIsPlaying(false);
          if (audioRef.current) audioRef.current.pause();
          if (activeSegmentAudioRef.current) {
            activeSegmentAudioRef.current.audio.pause();
            activeSegmentAudioRef.current = null;
          }
          if (onRatingRequest) onRatingRequest();
        }

        setCurrentTime(nextTime);
        if (onTimeUpdate) onTimeUpdate(nextTime);
      } else {
        if (activeSegmentAudioRef.current) {
          activeSegmentAudioRef.current.audio.pause();
          activeSegmentAudioRef.current = null;
        }
      }

      drawFrame(currentTime);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (activeSegmentAudioRef.current) {
        activeSegmentAudioRef.current.audio.pause();
        activeSegmentAudioRef.current = null;
      }
    };
  }, [currentTime, drawFrame, duration, isMuted, isPlaying, onRatingRequest, onTimeUpdate, plan.audio?.src, plan.segments, playbackRate]);

  // Sync canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = w;
      canvas.height = h;
      drawFrame(currentTime);
    }
  }, [w, h, drawFrame, currentTime]);

  const togglePlay = () => {
    setupAudioContext();
    if (!isPlaying) {
      if (currentTime >= duration - 0.05) {
        setCurrentTime(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
      }
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play().catch(e => console.warn('Audio play error', e));
      }
      setIsPlaying(true);
    } else {
      if (audioRef.current) audioRef.current.pause();
      if (activeSegmentAudioRef.current) {
        activeSegmentAudioRef.current.audio.pause();
        activeSegmentAudioRef.current = null;
      }
      setIsPlaying(false);
    }
  };

  const handleScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (rect.right - e.clientX) / rect.width));
    const targetTime = percent * duration;
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(targetTime, audioRef.current.duration || duration);
    }
    if (activeSegmentAudioRef.current) {
      activeSegmentAudioRef.current.audio.pause();
      activeSegmentAudioRef.current = null;
    }
    drawFrame(targetTime);
  };

  const resetToStart = () => {
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    if (activeSegmentAudioRef.current) {
      activeSegmentAudioRef.current.audio.pause();
      activeSegmentAudioRef.current = null;
    }
    drawFrame(0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Record and export video
  const handleExportVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsRecordingVideo(true);
    setRecordingProgress(0);

    // Reset to start before recording
    resetToStart();
    setupAudioContext();

    const exporter = new VideoExporter();
    videoExporterRef.current = exporter;

    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.playbackRate = 1.0;
      audioRef.current.play().catch(() => {});
    }

    exporter.startRecording({
      canvas,
      audioElement: audioRef.current,
      duration,
      onProgress: (prog) => {
        setRecordingProgress(Math.round(prog * 100));
      },
      onFinish: (_blob, url) => {
        setIsRecordingVideo(false);
        setIsPlaying(false);
        const a = document.createElement('a');
        a.href = url;
        const slug = (plan.meta.title || 'motion').replace(/\s+/g, '-');
        a.download = `${slug}-video.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
      onError: (err) => {
        setIsRecordingVideo(false);
        alert('خطا در ضبط ویدیو: ' + err.message);
      },
    });
  };

  const previewStandaloneHtmlInNewTab = () => {
    const html = generateStandaloneHtml(plan);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  // Persian numerals
  const toFa = (n: number | string) => {
    const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/\d/g, d => faDigits[+d]);
  };

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${toFa(m)}:${toFa(String(rem).padStart(2, '0'))}`;
  };

  const aspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16] max-w-[340px] md:max-w-[380px]'
      : aspectRatio === '1:1'
      ? 'aspect-square max-w-[500px]'
      : 'aspect-video max-w-full';

  return (
    <div className="flex flex-col gap-3 w-full" ref={containerRef}>
      {/* Audio Element (if audio configured) */}
      {plan.audio?.src && (
        <audio
          ref={audioRef}
          src={plan.audio.src}
          preload="auto"
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Canvas Viewport Frame */}
      <div className="relative w-full flex justify-center bg-black/60 rounded-2xl p-2 md:p-3 border border-white/10 overflow-hidden shadow-2xl">
        <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden shadow-lg border border-white/5`}>
          <canvas ref={canvasRef} className="w-full h-full block object-contain" />

          {/* Film grain effect if enabled */}
          {theme.grain && (
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>")`,
              }}
            />
          )}

          {/* Recording Overlay */}
          {isRecordingVideo && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 z-30 text-white backdrop-blur-sm">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold">در حال ضبط ویدیوی موشن...</div>
              <div className="text-xs text-white/70 font-mono tabular-nums">{recordingProgress}%</div>
            </div>
          )}
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 bg-neutral-900/90 border border-white/10 rounded-xl px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            disabled={isRecordingVideo}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
            title={isPlaying ? 'توقف' : 'پخش'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-[-1px]" />}
          </button>

          <button
            onClick={resetToStart}
            className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
            title="شروع مجدد"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {plan.audio?.src && (
            <button
              onClick={toggleMute}
              className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
              title={isMuted ? 'صدادار' : 'بی‌صدا'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Tabular Time Display */}
        <div className="text-xs font-mono tabular-nums text-white/70 min-w-[85px] text-center select-none" dir="ltr">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Interactive Scrub Bar */}
        <div
          onPointerDown={handleScrub}
          className="flex-1 min-w-[140px] h-7 flex items-center cursor-pointer relative group px-1"
        >
          <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden group-hover:h-2 transition-all">
            <div
              className="h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%`,
                backgroundColor: theme.accent || '#ff4a24',
              }}
            />
          </div>
        </div>

        {/* Speed & Actions */}
        <div className="flex items-center gap-1.5">
          <select
            value={playbackRate}
            onChange={(e) => {
              const r = parseFloat(e.target.value);
              setPlaybackRate(r);
              if (audioRef.current) audioRef.current.playbackRate = r;
            }}
            className="bg-white/5 border border-white/10 text-xs text-white/80 rounded-md px-2 py-1 outline-none cursor-pointer hover:bg-white/10"
            title="سرعت پخش"
          >
            <option value="0.75" className="bg-neutral-900">0.75x</option>
            <option value="1.0" className="bg-neutral-900">1.0x</option>
            <option value="1.25" className="bg-neutral-900">1.25x</option>
            <option value="1.5" className="bg-neutral-900">1.5x</option>
          </select>

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-md hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all"
            title="تمام صفحه"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Export & Sharing Action Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => downloadStandaloneHtml(plan)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
        >
          <Download className="w-4 h-4" />
          <span>دانلود خروجی HTML مستقل</span>
        </button>

        <button
          onClick={previewStandaloneHtmlInNewTab}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white/90 rounded-xl text-xs font-semibold transition-all border border-white/10"
        >
          <ExternalLink className="w-4 h-4" />
          <span>پیش‌نمایش HTML در تب جدید</span>
        </button>

        <button
          onClick={() => setShowVideoExportModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600/80 to-amber-600/80 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all border border-orange-500/40 shadow-md active:scale-98"
        >
          <Video className="w-4 h-4 text-emerald-300" />
          <span>تبدیل به ویدیو MP4 / WebM</span>
        </button>
      </div>

      {/* Dedicated MP4 & Video Export Modal */}
      <VideoExportModal
        plan={plan}
        isOpen={showVideoExportModal}
        onClose={() => setShowVideoExportModal(false)}
      />
    </div>
  );
};
