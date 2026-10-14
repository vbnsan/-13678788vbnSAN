import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wand2,
  Layers,
  ArrowRightLeft,
  Music,
  Download,
  Info,
  Sliders,
  Radio,
  FileAudio,
} from 'lucide-react';
import { MotionPlan, MotionSegment, SegmentAudioTrack, NarrationSettings } from '../types/motion';
import {
  getAvailableVoices,
  VoiceOption,
  DEFAULT_VOICE_OPTIONS,
  DEFAULT_NARRATION_SETTINGS,
  synthesizeSegmentAudio,
  syncTimelineToAudio,
  bakeMasterSoundtrack,
  AudioPreviewPlayer,
} from '../engine/ttsAudioEngine';

interface Props {
  plan: MotionPlan;
  onUpdatePlan: (updatedPlan: MotionPlan) => void;
  activeTime?: number;
}

export const TtsStudioTab: React.FC<Props> = ({ plan, onUpdatePlan, activeTime = 0 }) => {
  const [voices, setVoices] = useState<VoiceOption[]>(DEFAULT_VOICE_OPTIONS);
  const [settings, setSettings] = useState<NarrationSettings>(
    plan.narrationSettings || DEFAULT_NARRATION_SETTINGS
  );
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingSegmentId, setGeneratingSegmentId] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [playingSegmentId, setPlayingSegmentId] = useState<string | null>(null);
  const [isBakingMaster, setIsBakingMaster] = useState(false);
  const [masterAudioUrl, setMasterAudioUrl] = useState<string | null>(plan.audio?.src || null);
  const [masterPlaying, setMasterPlaying] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const masterAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load available voices on mount
  useEffect(() => {
    let mounted = true;
    getAvailableVoices().then((res) => {
      if (mounted && res && res.length > 0) {
        setVoices(res);
      }
    });
    return () => {
      mounted = false;
      AudioPreviewPlayer.stop();
      if (masterAudioRef.current) masterAudioRef.current.pause();
    };
  }, []);

  // Sync state if plan.audio changes
  useEffect(() => {
    if (plan.audio?.src) {
      setMasterAudioUrl(plan.audio.src);
    }
  }, [plan.audio]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Generate Voice for a Single Segment
  const handleGenerateSingle = async (segment: MotionSegment) => {
    setGeneratingSegmentId(segment.id);
    try {
      const audioTrack = await synthesizeSegmentAudio(segment, settings);

      const updatedSegments = plan.segments.map((s) => (s.id === segment.id ? { ...s, audioTrack } : s));

      let updatedPlan: MotionPlan = {
        ...plan,
        segments: updatedSegments,
        narrationSettings: settings,
      };

      // Auto-sync slide timing if enabled
      if (settings.autoSyncTimeline && audioTrack.duration > 0.5) {
        updatedPlan = syncTimelineToAudio(updatedPlan, settings.gapBetweenSlides);
      }

      onUpdatePlan(updatedPlan);
      showToast(`صدای اسلاید «${segment.text.slice(0, 22)}...» با موفقیت تولید شد.`);
    } catch (err: any) {
      showToast(`خطا در تولید صدا: ${err.message || 'مشکل ارتباطی'}`);
    } finally {
      setGeneratingSegmentId(null);
    }
  };

  // 2. Batch Generate Voice for ALL Segments
  const handleGenerateAll = async () => {
    if (!plan.segments || plan.segments.length === 0) return;
    setIsGeneratingAll(true);
    setBatchProgress({ done: 0, total: plan.segments.length });

    try {
      const newSegments = [...plan.segments];

      for (let i = 0; i < newSegments.length; i++) {
        const seg = newSegments[i];
        setGeneratingSegmentId(seg.id);
        const audioTrack = await synthesizeSegmentAudio(seg, settings);
        newSegments[i] = { ...seg, audioTrack };
        setBatchProgress({ done: i + 1, total: newSegments.length });
      }

      let updatedPlan: MotionPlan = {
        ...plan,
        segments: newSegments,
        narrationSettings: settings,
      };

      // Smart auto-sync timeline to audio speech durations
      if (settings.autoSyncTimeline) {
        updatedPlan = syncTimelineToAudio(updatedPlan, settings.gapBetweenSlides);
      }

      // Automatically bake master soundtrack so canvas player & video recorder are ready immediately
      const masterResult = await bakeMasterSoundtrack(updatedPlan);
      if (masterResult) {
        updatedPlan.audio = {
          src: masterResult.src,
          name: 'گویندگی هوشمند موشن‌گرافیک',
          duration: masterResult.duration,
          isDataUrl: true,
        };
        setMasterAudioUrl(masterResult.src);
      }

      onUpdatePlan(updatedPlan);
      showToast('گویندگی هوشمند برای تمام اسلایدها با موفقیت تولید و با تایم‌لاین همگام شد!');
    } catch (err: any) {
      showToast(`خطا در پردازش دسته‌ای: ${err.message || 'خطا رخ داد'}`);
    } finally {
      setIsGeneratingAll(false);
      setGeneratingSegmentId(null);
    }
  };

  // 3. Play or Pause a Segment Preview
  const handleTogglePlay = (segment: MotionSegment) => {
    if (playingSegmentId === segment.id) {
      AudioPreviewPlayer.stop();
      setPlayingSegmentId(null);
      return;
    }

    if (segment.audioTrack?.src) {
      setPlayingSegmentId(segment.id);
      AudioPreviewPlayer.play(
        segment.audioTrack.src,
        () => setPlayingSegmentId(null),
        settings.speed,
        settings.volume
      );
    } else {
      // Fallback: use Web Speech Synthesis
      setPlayingSegmentId(segment.id);
      AudioPreviewPlayer.speakText(segment.text, 'fa-IR', settings.speed, () => setPlayingSegmentId(null));
    }
  };

  // 4. Sync Entire Timeline to Voice Durations
  const handleSyncTimeline = () => {
    const updatedPlan = syncTimelineToAudio(plan, settings.gapBetweenSlides);
    onUpdatePlan(updatedPlan);
    showToast(`تایم‌لاین با موفقیت بر اساس دیرکرد گویندگی بازچیدمان شد (مدت کل: ${updatedPlan.meta.duration} ثانیه).`);
  };

  // 5. Sync a Single Slide's Duration to its Voice Length
  const handleSyncSingleSlide = (segment: MotionSegment) => {
    if (!segment.audioTrack?.duration) return;
    const audioDur = segment.audioTrack.duration;
    const diff = audioDur - (segment.to - segment.from);

    const updatedSegments = plan.segments.map((s, idx) => {
      if (s.id === segment.id) {
        return { ...s, to: Math.round((s.from + audioDur) * 100) / 100 };
      }
      // Shift subsequent segments
      if (s.from >= segment.to) {
        return {
          ...s,
          from: Math.round((s.from + diff) * 100) / 100,
          to: Math.round((s.to + diff) * 100) / 100,
        };
      }
      return s;
    });

    const maxTo = Math.max(...updatedSegments.map((s) => s.to));
    const updatedPlan = {
      ...plan,
      meta: { ...plan.meta, duration: Math.max(maxTo + 0.5, 3.0) },
      segments: updatedSegments,
    };

    onUpdatePlan(updatedPlan);
    showToast(`اسلاید با مدت گویندگی (${audioDur.toFixed(1)} ثانیه) همگام‌سازی شد.`);
  };

  // 6. Bake Master Narration Soundtrack
  const handleBakeMaster = async () => {
    setIsBakingMaster(true);
    try {
      const result = await bakeMasterSoundtrack(plan);
      if (!result) {
        throw new Error('حداقل یک اسلاید با فایل صوتی معتبر نیاز است.');
      }
      const updatedPlan: MotionPlan = {
        ...plan,
        audio: {
          src: result.src,
          name: 'ساندترک گویندگی تایم‌لاین',
          duration: result.duration,
          isDataUrl: true,
        },
      };
      setMasterAudioUrl(result.src);
      onUpdatePlan(updatedPlan);
      showToast('ساندترک یکپارچه ساخته شد و به پلیر و خروجی ویدیو MP4 متصل گردید!');
    } catch (err: any) {
      showToast(`خطا در میکس ساندترک: ${err.message || 'خطا رخ داد'}`);
    } finally {
      setIsBakingMaster(false);
    }
  };

  // 7. Toggle Master Audio Playback
  const handleToggleMasterPlayback = () => {
    if (!masterAudioRef.current || !masterAudioUrl) return;
    if (masterPlaying) {
      masterAudioRef.current.pause();
      setMasterPlaying(false);
    } else {
      masterAudioRef.current.currentTime = 0;
      masterAudioRef.current
        .play()
        .then(() => setMasterPlaying(true))
        .catch((e) => console.warn('Master audio play error', e));
    }
  };

  const hasAnyAudio = plan.segments.some((s) => s.audioTrack?.src);
  const readyAudioCount = plan.segments.filter((s) => s.audioTrack?.status === 'ready' && s.audioTrack?.src).length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-16 text-right" dir="rtl">
      {/* Hidden Master Audio Element */}
      {masterAudioUrl && (
        <audio
          ref={masterAudioRef}
          src={masterAudioUrl}
          preload="auto"
          onEnded={() => setMasterPlaying(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-sm font-medium animate-bounce border border-emerald-400/40">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-orange-950/80 via-neutral-900 to-neutral-900 border border-orange-500/20 p-6 shadow-2xl">
        <div className="absolute top-0 left-0 -mt-10 -ml-10 w-52 h-52 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Mic className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">ماژول ادغام صدا و گویندگی هوشمند (TTS Studio)</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                Audio Sync v2.5
              </span>
            </div>
            <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
              تولید خودکار گفتار برای هر سگمنت متنی، لایه‌گذاری ساندترک روی موشن‌گرافیک و همگام‌سازی بی‌نقص میلی‌ثانیه‌ای با تایم‌لاین افترافکت و پلیر ویدیو.
            </p>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-3 bg-neutral-950/60 p-3 rounded-xl border border-white/5 shrink-0">
            <div className="text-center px-2">
              <div className="text-xl font-bold text-white font-mono">
                {readyAudioCount} / {plan.segments.length}
              </div>
              <div className="text-[11px] text-neutral-400">صداهای آماده</div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center px-2">
              <div className="text-xl font-bold text-orange-400 font-mono">
                {plan.meta.duration.toFixed(1)}s
              </div>
              <div className="text-[11px] text-neutral-400">مدت تایم‌لاین</div>
            </div>
          </div>
        </div>

        {/* Global Controls & Voice Settings Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Voice Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-orange-400" />
              انتخاب گوینده:
            </label>
            <select
              value={settings.voice}
              onChange={(e) => setSettings({ ...settings, voice: e.target.value })}
              className="w-full bg-neutral-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id} className="bg-neutral-900 text-white">
                  {v.name} ({v.style})
                </option>
              ))}
            </select>
          </div>

          {/* Speed Preset */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              سرعت گویندگی: {settings.speed.toFixed(2)}x
            </label>
            <div className="flex items-center gap-1.5">
              {[0.85, 1.0, 1.2, 1.35].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSettings({ ...settings, speed: spd })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.speed === spd
                      ? 'bg-orange-500 text-white font-bold shadow'
                      : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Slide Gap Timing */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              فاصله بین اسلایدها (مکث): {settings.gapBetweenSlides}s
            </label>
            <div className="flex items-center gap-1.5">
              {[0.15, 0.25, 0.4].map((gap) => (
                <button
                  key={gap}
                  onClick={() => setSettings({ ...settings, gapBetweenSlides: gap })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    settings.gapBetweenSlides === gap
                      ? 'bg-orange-500 text-white font-bold shadow'
                      : 'bg-neutral-950/80 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  {gap}s
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Sync Checkbox */}
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer bg-neutral-950/70 p-2.5 rounded-xl border border-white/10 hover:border-orange-500/40 transition-colors">
              <input
                type="checkbox"
                checked={settings.autoSyncTimeline}
                onChange={(e) => setSettings({ ...settings, autoSyncTimeline: e.target.checked })}
                className="w-4 h-4 rounded text-orange-600 focus:ring-0 cursor-pointer accent-orange-500"
              />
              <span className="text-xs font-medium text-neutral-200">
                همگام‌سازی خودکار تایم‌لاین با مدت صدا
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Batch Generate All Button */}
            <button
              onClick={handleGenerateAll}
              disabled={isGeneratingAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-orange-900/30 disabled:opacity-50"
            >
              {isGeneratingAll ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    در حال تولید صداها ({batchProgress.done} از {batchProgress.total})...
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>تولید صدای هوشمند برای تمام اسلایدها</span>
                </>
              )}
            </button>

            {/* Smart Timeline Sync */}
            <button
              onClick={handleSyncTimeline}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl transition-all border border-white/10"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-orange-400" />
              <span>همگام‌سازی تایم‌لاین با طول گویندگی</span>
            </button>

            {/* Bake Master Soundtrack */}
            <button
              onClick={handleBakeMaster}
              disabled={isBakingMaster || !hasAnyAudio}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl transition-all border border-white/10 disabled:opacity-50"
            >
              {isBakingMaster ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>در حال میکس ساندترک...</span>
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>میکس و ایجاد ساندترک نهایی موشن</span>
                </>
              )}
            </button>
          </div>

          {/* Master Soundtrack Playback Bar */}
          {masterAudioUrl && (
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-300 font-medium">ساندترک یکپارچه فعال است</span>
              <button
                onClick={handleToggleMasterPlayback}
                className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                title={masterPlaying ? 'توقف پخش ساندترک' : 'پخش ساندترک یکپارچه'}
              >
                {masterPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Narration Sync Visualizer Strip */}
      <div className="bg-neutral-900/90 rounded-2xl border border-white/10 p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              نوار زمانی همگام‌سازی گفتار و اسلایدهای موشن (Timeline Voice Blocks)
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            موقعیت فعلی: {activeTime.toFixed(2)}s / {plan.meta.duration.toFixed(2)}s
          </span>
        </div>

        {/* Visual Timeline Bar */}
        <div className="relative w-full h-12 bg-neutral-950 rounded-xl overflow-hidden border border-white/10 flex">
          {plan.segments.map((seg, idx) => {
            const widthPct = Math.max(4, ((seg.to - seg.from) / plan.meta.duration) * 100);
            const hasAudio = !!seg.audioTrack?.src;
            const isPlaying = playingSegmentId === seg.id;
            const isCurrent = activeTime >= seg.from && activeTime <= seg.to;

            return (
              <div
                key={seg.id}
                style={{ width: `${widthPct}%` }}
                className={`h-full relative border-r border-neutral-800 transition-all p-1 flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-orange-950/60 ring-1 ring-orange-500'
                    : hasAudio
                    ? 'bg-neutral-900/90 hover:bg-neutral-800'
                    : 'bg-neutral-950/40 opacity-70'
                }`}
                title={`اسلاید ${idx + 1}: ${seg.text} (${(seg.to - seg.from).toFixed(1)}s)`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-white/90 truncate max-w-[80px]">
                    #{idx + 1} {seg.text.slice(0, 14)}
                  </span>
                  {hasAudio && (
                    <span className="text-[9px] font-mono text-emerald-400">
                      {seg.audioTrack?.duration.toFixed(1)}s
                    </span>
                  )}
                </div>

                {/* Sound wave line inside block */}
                <div className="flex items-end gap-0.5 h-3 w-full overflow-hidden opacity-70">
                  {(seg.audioTrack?.waveform || [0.3, 0.6, 0.9, 0.4, 0.7, 0.5]).map((v, wIdx) => (
                    <div
                      key={wIdx}
                      style={{ height: `${Math.round(v * 100)}%` }}
                      className={`flex-1 rounded-xs transition-all ${
                        isPlaying
                          ? 'bg-orange-400 animate-pulse'
                          : hasAudio
                          ? 'bg-emerald-500'
                          : 'bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Active playhead line */}
          <div
            style={{ left: `${Math.min(100, (activeTime / plan.meta.duration) * 100)}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-orange-400 z-20 shadow-[0_0_8px_#f97316]"
          />
        </div>
      </div>

      {/* Segment Cards List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>سگمنت‌های موشن‌گرافیک و وضعیت صداگذاری</span>
            <span className="text-xs font-normal text-neutral-400">({plan.segments.length} اسلاید)</span>
          </h3>
          <span className="text-xs text-neutral-400">
            برای هر اسلاید می‌توانید به‌طور مجزا صدا تولید، پیش‌نمایش و زمان‌بندی را تنظیم نمایید.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {plan.segments.map((seg, idx) => {
            const hasAudio = !!seg.audioTrack?.src;
            const isPlaying = playingSegmentId === seg.id;
            const isGenerating = generatingSegmentId === seg.id;
            const slideDuration = Math.round((seg.to - seg.from) * 10) / 10;
            const audioDuration = seg.audioTrack?.duration
              ? Math.round(seg.audioTrack.duration * 10) / 10
              : null;
            const durationDiff = audioDuration !== null ? Math.round((audioDuration - slideDuration) * 10) / 10 : null;
            const isSynced = durationDiff !== null && Math.abs(durationDiff) <= 0.4;

            return (
              <div
                key={seg.id}
                className={`p-4 rounded-xl border transition-all ${
                  isPlaying
                    ? 'bg-neutral-900 border-orange-500/60 shadow-lg shadow-orange-950/20'
                    : hasAudio
                    ? 'bg-neutral-900/80 border-white/10 hover:border-white/20'
                    : 'bg-neutral-950/80 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info & Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono text-xs font-bold">
                        اسلاید #{idx + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-neutral-400">
                        {seg.kind === 'caption' && 'توضیحات متنی'}
                        {seg.kind === 'stat' && 'آمار و ارقام'}
                        {seg.kind === 'quote' && 'نقل قول'}
                        {seg.kind === 'chart' && 'نمودار'}
                        {seg.kind === 'math' && 'فرمول علمی'}
                        {seg.kind === 'gauge' && 'شاخص پیشرفت'}
                        {seg.kind === 'title' && 'عنوان اصلی'}
                        {seg.kind === 'outro' && 'کارت پایانی'}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        {seg.from.toFixed(1)}s ➜ {seg.to.toFixed(1)}s (طول اسلاید: {slideDuration}s)
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-white/95 leading-relaxed truncate-2-lines">
                      {seg.text}
                    </p>

                    {/* Synchronization Status Pill */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      {hasAudio ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono">
                            <CheckCircle2 className="w-3 h-3" />
                            صدای گوینده: {audioDuration}s
                          </span>

                          {isSynced ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/30 px-2 py-0.5 rounded-md">
                              همگام با تایم‌لاین ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSyncSingleSlide(seg)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50 px-2 py-0.5 rounded-md transition-colors"
                              title="کلیک برای تنظیم طول اسلاید دقیقاً به اندازه طول صدا"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>اختلاف: {durationDiff && durationDiff > 0 ? `+${durationDiff}s` : `${durationDiff}s`} (همگام‌سازی این اسلاید)</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded-md">
                          <AlertCircle className="w-3 h-3 text-neutral-500" />
                          صدایی برای این اسلاید ایجاد نشده است
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Waveform visualizer & Action buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Mini Waveform Display */}
                    {hasAudio && (
                      <div className="w-24 h-9 bg-neutral-950 rounded-lg p-1.5 flex items-end gap-0.5 border border-white/5">
                        {(seg.audioTrack?.waveform || [0.2, 0.5, 0.8, 0.4, 0.9, 0.6, 0.3]).map((v, wIndex) => (
                          <div
                            key={wIndex}
                            style={{ height: `${Math.max(15, Math.round(v * 100))}%` }}
                            className={`flex-1 rounded-xs transition-all ${
                              isPlaying ? 'bg-orange-400 animate-pulse' : 'bg-emerald-500/80'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Play / Pause Preview Button */}
                    <button
                      onClick={() => handleTogglePlay(seg)}
                      className={`p-2.5 rounded-xl transition-all ${
                        isPlaying
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-950/40 ring-2 ring-orange-400/50'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-white/10'
                      }`}
                      title={isPlaying ? 'توقف پخش' : 'پخش پیش‌نمایش صدا'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    {/* Generate Single Button */}
                    <button
                      onClick={() => handleGenerateSingle(seg)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-white/10 disabled:opacity-50"
                      title="تولید یا بازتولید صدای گوینده"
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span className="hidden sm:inline">در حال ضبط...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5 text-orange-400" />
                          <span>{hasAudio ? 'بازتولید صدا' : 'تولید صدا'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Educational Tips Card */}
      <div className="rounded-xl bg-neutral-900/60 border border-white/5 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-400 leading-relaxed">
          <span className="font-bold text-neutral-200">نکته حرفه‌ای موشن‌گرافیک: </span>
          هنگام تولید موشن‌گرافیک‌های حرفه‌ای، انیمیشن باید دقیقاً هم‌گام با پایان کلمات کلیدی گوینده استپ یا ترنزیشن شود.
          با فعال نگه‌داشتن گزینه «همگام‌سازی خودکار تایم‌لاین»، هر اسلاید به اندازه مدت خوانش متن گسترش می‌یابد و تایم‌لاین بدون هیچ قطعی یا اورلپ اضافه به پیش می‌رود.
        </div>
      </div>
    </div>
  );
};
