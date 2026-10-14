import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Video,
  Download,
  Film,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Settings,
  HardDrive,
  Clock,
  Layers,
} from 'lucide-react';
import { MotionPlan } from '../types/motion';
import { Mp4VideoRecorder, Mp4ExportOptions } from '../engine/mp4VideoRecorder';

interface Props {
  plan: MotionPlan;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoExportModal: React.FC<Props> = ({ plan, isOpen, onClose }) => {
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [fps, setFps] = useState<30 | 60>(60);
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high');
  const [resolutionPreset, setResolutionPreset] = useState<'original' | '720p' | '1080p'>('original');
  const [includeAudio, setIncludeAudio] = useState(true);

  // Status & Progress
  const [isExporting, setIsExporting] = useState(false);
  const [progressData, setProgressData] = useState<{
    percent: number;
    currentTime: number;
    totalDuration: number;
    currentFrame: number;
    totalFrames: number;
    status: string;
  } | null>(null);

  const [exportResult, setExportResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
    sizeBytes: number;
    format: string;
    width: number;
    height: number;
    duration: number;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  const recorderRef = useRef<Mp4VideoRecorder | null>(null);

  // Supported format check in browser
  const [formatsInfo, setFormatsInfo] = useState<{
    mp4Supported: boolean;
    webmSupported: boolean;
  }>({ mp4Supported: true, webmSupported: true });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = Mp4VideoRecorder.getSupportedFormats();
      setFormatsInfo({
        mp4Supported: info.mp4Supported,
        webmSupported: info.webmSupported,
      });
      if (!info.mp4Supported && info.webmSupported) {
        setFormat('webm');
      }
    }
  }, []);

  if (!isOpen) return null;

  // Compute target width & height based on preset & aspect ratio
  const getExportResolution = () => {
    const isVertical = plan.meta.aspectRatio === '9:16';
    const isSquare = plan.meta.aspectRatio === '1:1';

    if (resolutionPreset === '720p') {
      if (isVertical) return { width: 720, height: 1280 };
      if (isSquare) return { width: 720, height: 720 };
      return { width: 1280, height: 720 };
    }

    if (resolutionPreset === '1080p') {
      if (isVertical) return { width: 1080, height: 1920 };
      if (isSquare) return { width: 1080, height: 1080 };
      return { width: 1920, height: 1080 };
    }

    return { width: plan.meta.w, height: plan.meta.h };
  };

  const handleStartExport = () => {
    setErrorMsg('');
    setExportResult(null);
    setIsExporting(true);
    setProgressData({
      percent: 0,
      currentTime: 0,
      totalDuration: plan.meta.duration,
      currentFrame: 0,
      totalFrames: Math.ceil(plan.meta.duration * fps),
      status: 'آماده‌سازی موتور رندر...',
    });

    const recorder = new Mp4VideoRecorder();
    recorderRef.current = recorder;
    const res = getExportResolution();

    recorder.startExport({
      plan,
      format,
      fps,
      quality,
      customResolution: res,
      includeAudio,
      onProgress: (prog) => {
        setProgressData(prog);
      },
      onSuccess: (result) => {
        setIsExporting(false);
        setExportResult(result);
      },
      onError: (err) => {
        setIsExporting(false);
        setErrorMsg('خطا در تبدیل ویدیو: ' + (err.message || 'خطای نامشخص'));
      },
    });
  };

  const handleCancel = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    setIsExporting(false);
    setProgressData(null);
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const a = document.createElement('a');
    a.href = exportResult.url;
    a.download = exportResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const toFa = (n: number | string) => {
    const faDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/\d/g, d => faDigits[+d]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">تبدیل پلن موشن به فرمت ویدئویی (MP4 / WebM)</h2>
              <p className="text-[11px] text-white/50">تولید مستقیم فایل ویدیویی با استفاده از MediaRecorder API</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isExporting) handleCancel();
              onClose();
            }}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 text-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isExporting && !exportResult && (
            <>
              {/* Format selection */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-white/80">فرمت خروجی ویدیو:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('mp4')}
                    className={`flex flex-col p-3 rounded-xl border text-right transition-all ${
                      format === 'mp4'
                        ? 'bg-orange-600/20 border-orange-500 text-white'
                        : 'bg-black/30 border-white/5 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">MP4 (پیشنهادی)</span>
                      {formatsInfo.mp4Supported && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono">
                          Native H.264
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/50">
                      پشتیبانی کامل در اینستاگرام، تیک‌تاک، یوتیوب، آیفون و اندروید
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('webm')}
                    className={`flex flex-col p-3 rounded-xl border text-right transition-all ${
                      format === 'webm'
                        ? 'bg-orange-600/20 border-orange-500 text-white'
                        : 'bg-black/30 border-white/5 text-white/70 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">WebM</span>
                      <span className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                        VP9 / VP8
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50">
                      حجم فوق‌العاده کم و سازگاری استاندارد وب برای مرورگرها
                    </span>
                  </button>
                </div>
              </div>

              {/* Resolution & FPS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-white/80 block mb-1">رزولوشن خروجی:</label>
                  <select
                    value={resolutionPreset}
                    onChange={(e) => setResolutionPreset(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="original">
                      رزولوشن اصلی پلن ({plan.meta.w}×{plan.meta.h})
                    </option>
                    <option value="1080p">۱۰۸۰p Full HD (۱۰۸۰×۱۹۲۰ / ۱۹۲۰×۱۰۸۰)</option>
                    <option value="720p">۷۲۰p HD سبک (۷۲۰×۱۲۸۰ / ۱۲۸۰×۷۲۰)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-white/80 block mb-1">نرخ فریم (FPS):</label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value, 10) as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                  >
                    <option value="60">۶۰ FPS (فوق‌العاده روان — استاندارد استودیویی)</option>
                    <option value="30">۳۰ FPS (سرعت رندر بالاتر و حجم کمتر)</option>
                  </select>
                </div>
              </div>

              {/* Quality Bitrate */}
              <div>
                <label className="font-semibold text-white/80 block mb-1">کیفیت انکود و بیت‌ریت ویدیو:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard', label: 'استاندارد', rate: '4 Mbps', desc: 'حجم سبک' },
                    { id: 'high', label: 'کیفیت بالا (استودیو)', rate: '8.5 Mbps', desc: 'پیشنهادی' },
                    { id: 'ultra', label: 'اولترا شفاف', rate: '14 Mbps', desc: 'بیشترین وضوح' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuality(q.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        quality === q.id
                          ? 'bg-orange-600/20 border-orange-500 text-white'
                          : 'bg-black/30 border-white/5 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-bold text-xs">{q.label}</div>
                      <div className="text-[10px] text-white/50 font-mono mt-0.5">{q.rate}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio inclusion toggle */}
              {plan.audio?.src && (
                <div className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="incAudio"
                      checked={includeAudio}
                      onChange={(e) => setIncludeAudio(e.target.checked)}
                      className="accent-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="incAudio" className="cursor-pointer text-white/80 select-none">
                      هماهنگ‌سازی و میکس صدای نریشن در فایل ویدیویی
                    </label>
                  </div>
                  <span className="text-[11px] text-white/40 font-mono">Web Audio API</span>
                </div>
              )}
            </>
          )}

          {/* Export in Progress View */}
          {isExporting && progressData && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin" />
                <span className="absolute font-mono text-sm font-bold text-white">
                  {progressData.percent}%
                </span>
              </div>

              <div className="text-center">
                <div className="text-sm font-bold text-white mb-1">{progressData.status}</div>
                <div className="text-[11px] text-white/50 font-mono" dir="ltr">
                  {toFa(progressData.currentFrame)} / {toFa(progressData.totalFrames)} frames ({toFa(progressData.currentTime.toFixed(1))}s / {toFa(progressData.totalDuration.toFixed(1))}s)
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-orange-500 transition-[width] duration-150"
                  style={{ width: `${progressData.percent}%` }}
                />
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="mt-2 px-4 py-1.5 bg-red-950/40 hover:bg-red-900/50 text-red-200 border border-red-500/30 rounded-lg text-xs transition-all"
              >
                توقف عملیات ضبط
              </button>
            </div>
          )}

          {/* Export Completed View */}
          {exportResult && (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">ویدیوی موشن با موفقیت ساخته شد!</div>
                  <div className="text-[11px] text-emerald-300/70 mt-0.5">
                    فرمت {exportResult.format} · رزولوشن {exportResult.width}×{exportResult.height} · حجم {formatFileSize(exportResult.sizeBytes)}
                  </div>
                </div>
              </div>

              {/* Video Player Preview */}
              <div className="relative w-full rounded-xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center">
                <video
                  src={exportResult.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full max-h-[260px] object-contain"
                />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-orange-950/50 active:scale-98"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود ویدیو {exportResult.format}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExportResult(null);
                    setIsExporting(false);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>تنظیم مجدد و رندر دوباره</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!exportResult && !isExporting && (
          <div className="px-5 py-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
            <div className="text-[11px] text-white/50">
              مدت زمان ویدیو: <span className="font-mono text-white/80">{plan.meta.duration} ثانیه</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs transition-all"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleStartExport}
                className="flex items-center gap-2 px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
              >
                <Film className="w-4 h-4" />
                <span>شروع تبدیل و دانلود ویدیو</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
