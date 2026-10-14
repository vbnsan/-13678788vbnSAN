import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Layers,
  Sparkles,
  Sliders,
  Code2,
  Download,
  Copy,
  Check,
  Zap,
  Eye,
  Film,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Tv,
} from 'lucide-react';
import gsap from 'gsap';
import {
  MotionPlan,
  MotionSegment,
  MotionTheme,
  GsapLayerConfig,
  GsapTransitionType,
  GsapEasingType,
  GsapAccentEffect,
} from '../types/motion';
import {
  GSAP_PRESETS,
  getDefaultGsapConfigForKind,
  mountGsapSegmentAnimation,
  generateGsapSnippet,
  generateGsapStandaloneHtml,
} from '../engine/gsapMotionEngine';

interface Props {
  plan: MotionPlan;
  onUpdatePlan: (plan: MotionPlan) => void;
}

export const GsapMotionStudio: React.FC<Props> = ({ plan, onUpdatePlan }) => {
  const [selectedSegIndex, setSelectedSegIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('cinematic-3d');
  const [copiedCode, setCopiedCode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeLayers, setActiveLayers] = useState({
    bg: true,
    fx: true,
    visual: true,
    text: true,
    badge: true,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const activeSegment: MotionSegment | undefined = plan.segments[selectedSegIndex] || plan.segments[0];

  const currentConfig: GsapLayerConfig =
    activeSegment?.gsapConfig ||
    (activeSegment ? getDefaultGsapConfigForKind(activeSegment.kind) : GSAP_PRESETS[0].config);

  // Initialize or re-mount GSAP animation whenever selected segment, config, or plan changes
  useEffect(() => {
    if (!stageRef.current || !activeSegment) return;

    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = mountGsapSegmentAnimation(
      stageRef.current,
      activeSegment,
      plan.theme,
      () => {
        setIsPlaying(false);
      }
    );

    tl.timeScale(playbackSpeed);
    timelineRef.current = tl;

    // Start playback immediately on segment change
    tl.restart();
    setIsPlaying(true);

    return () => {
      tl.kill();
    };
  }, [selectedSegIndex, activeSegment?.id, activeSegment?.gsapConfig, plan.theme, playbackSpeed]);

  const handlePlayPause = () => {
    if (!timelineRef.current) return;
    if (timelineRef.current.isActive()) {
      timelineRef.current.pause();
      setIsPlaying(false);
    } else {
      if (timelineRef.current.progress() >= 1) {
        timelineRef.current.restart();
      } else {
        timelineRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!timelineRef.current) return;
    timelineRef.current.restart();
    setIsPlaying(true);
  };

  const handleUpdateCurrentConfig = (partial: Partial<GsapLayerConfig>) => {
    if (!activeSegment) return;
    const newConfig: GsapLayerConfig = {
      ...currentConfig,
      ...partial,
    };

    const updatedSegments = plan.segments.map((seg, idx) => {
      if (idx === selectedSegIndex) {
        return {
          ...seg,
          gsapConfig: newConfig,
        };
      }
      return seg;
    });

    onUpdatePlan({
      ...plan,
      segments: updatedSegments,
    });
  };

  const handleApplyPreset = (presetId: string) => {
    setActivePresetId(presetId);
    const preset = GSAP_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    handleUpdateCurrentConfig(preset.config);
  };

  const handleApplyPresetToAll = () => {
    const preset = GSAP_PRESETS.find((p) => p.id === activePresetId);
    if (!preset) return;

    const updatedSegments = plan.segments.map((seg) => ({
      ...seg,
      gsapConfig: { ...preset.config },
    }));

    onUpdatePlan({
      ...plan,
      segments: updatedSegments,
    });
  };

  const handleCopyCode = () => {
    if (!activeSegment) return;
    const code = generateGsapSnippet(activeSegment, plan.theme);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadGsapHtml = () => {
    const html = generateGsapStandaloneHtml(plan);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.meta.title || 'motion'}-gsap-render.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const words = activeSegment ? activeSegment.text.split(/\s+/) : [];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-orange-950/40 via-neutral-900/80 to-purple-950/40 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-950/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  موتور پیشرفته موشن‌گرافیک GSAP (سبک افتر افکت)
                </h2>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  GSAP 3.12 Engine
                </span>
              </div>
              <p className="text-xs text-white/60 mt-1 leading-relaxed max-w-2xl">
                رندرهای حرکتی لایه به لایه، تفکیک کلمات سه‌بعدی، افکت‌های نوری، جهش الاستیک و اوورشوت مشابه پلاگین‌های حرفه‌ای After Effects.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={handleApplyPresetToAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white/90 hover:text-white rounded-lg text-xs font-semibold transition-all border border-white/10 shadow-sm whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>اعمال استایل به تمام اسلایدها</span>
            </button>

            <button
              onClick={handleDownloadGsapHtml}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-orange-950/40 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دانلود HTML مستقل GSAP</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Studio Grid: Viewport + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive GSAP Canvas / Viewport */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Segment Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-xs text-white/50 shrink-0 font-medium ml-1">انتخاب اسلاید:</span>
            {plan.segments.map((seg, idx) => (
              <button
                key={seg.id}
                onClick={() => setSelectedSegIndex(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedSegIndex === idx
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40 ring-1 ring-white/20'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>#{idx + 1}</span>
                <span className="max-w-[100px] truncate text-[11px] font-normal">{seg.text}</span>
              </button>
            ))}
          </div>

          {/* Interactive Stage Container (After Effects Viewport) */}
          <div className="relative w-full aspect-video bg-[#0b0910] rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center select-none">
            {/* The Live GSAP Animation Stage */}
            <div
              ref={stageRef}
              className="relative w-full h-full flex items-center justify-center overflow-hidden"
              style={{ perspective: `${currentConfig.perspective3D || 900}px` }}
            >
              {/* Layer 1: Background & Camera Parallax */}
              <div
                className={`gsap-layer-bg absolute inset-0 transition-opacity duration-300 ${
                  activeLayers.bg ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {activeSegment?.backgroundImage ? (
                  <img
                    src={activeSegment.backgroundImage}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-[#120f18] to-[#09080c]" />
                )}
                {/* Dimming & Vignette */}
                <div
                  className="absolute inset-0 bg-[#09080c]"
                  style={{ opacity: activeSegment?.backgroundDim ?? 0.65 }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />
              </div>

              {/* Layer 2: AE Accent VFX (Burst particles / Neon Rings / Scanlines) */}
              <div
                className={`gsap-layer-accent absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300 ${
                  activeLayers.fx ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {currentConfig.accent === 'burst-particles' && (
                  <svg className="w-80 h-80 text-orange-500/40" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
                    <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="40" cy="40" r="6" fill="currentColor" />
                    <circle cx="160" cy="40" r="4" fill="currentColor" />
                    <circle cx="160" cy="160" r="7" fill="currentColor" />
                    <circle cx="40" cy="160" r="5" fill="currentColor" />
                  </svg>
                )}

                {currentConfig.accent === 'neon-rings' && (
                  <div className="w-72 h-72 rounded-full border border-orange-500/30 ring-8 ring-orange-500/10 shadow-[0_0_50px_rgba(249,115,22,0.3)]" />
                )}

                {currentConfig.accent === 'scanline-sweep' && (
                  <div className="gsap-scanline-beam absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee]" />
                )}

                {currentConfig.accent === 'optical-flare' && (
                  <div className="absolute w-[500px] h-32 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent blur-xl rotate-12" />
                )}

                {currentConfig.accent === 'crosshair-target' && (
                  <div className="w-64 h-64 border border-white/20 rounded-lg flex items-center justify-center relative">
                    <div className="w-4 h-0.5 bg-white/40 absolute -top-2" />
                    <div className="w-4 h-0.5 bg-white/40 absolute -bottom-2" />
                    <div className="w-0.5 h-4 bg-white/40 absolute -left-2" />
                    <div className="w-0.5 h-4 bg-white/40 absolute -right-2" />
                  </div>
                )}
              </div>

              {/* Central Content Column */}
              <div className="relative z-10 max-w-2xl px-6 text-center flex flex-col items-center">
                {/* Layer 6: Badge / Kind Pill */}
                {activeSegment && activeSegment.kind !== 'caption' && (
                  <div
                    className={`gsap-layer-badge mb-4 transition-opacity duration-300 ${
                      activeLayers.badge ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-600/25 text-orange-400 border border-orange-500/30 backdrop-blur-md shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        {activeSegment.kind === 'stat' && 'آمار و ارقام کلیدی'}
                        {activeSegment.kind === 'quote' && 'نقل قول برجسته'}
                        {activeSegment.kind === 'chart' && 'نمودار تحلیلی'}
                        {activeSegment.kind === 'math' && 'فرمول علمی Manim'}
                        {activeSegment.kind === 'gauge' && 'شاخص پیشرفت'}
                        {activeSegment.kind === 'comparison' && 'کارت مقایسه‌ای'}
                        {activeSegment.kind === 'title' && 'عنوان اصلی'}
                      </span>
                    </span>
                  </div>
                )}

                {/* Layer 4: Kinetic Split Words */}
                <div
                  className={`flex flex-wrap justify-center gap-2 sm:gap-2.5 transition-opacity duration-300 ${
                    activeLayers.text ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    overflow: currentConfig.entrance === 'clip-mask-reveal' ? 'hidden' : 'visible',
                  }}
                >
                  {words.map((w, wIdx) => {
                    const isEm = activeSegment?.em?.includes(wIdx);
                    return (
                      <span
                        key={wIdx}
                        className={`gsap-word-unit inline-block font-black text-xl sm:text-2xl md:text-3xl leading-snug tracking-tight ${
                          isEm
                            ? 'gsap-em-word text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.4)]'
                            : 'text-white'
                        }`}
                      >
                        {w}
                      </span>
                    );
                  })}
                </div>

                {/* Layer 3: Visual Card / Chart / Formula */}
                {activeSegment?.visualData && (
                  <div
                    className={`gsap-layer-visual mt-5 transition-opacity duration-300 ${
                      activeLayers.visual ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {activeSegment.visualData.value !== undefined && (
                      <div className="bg-white/10 backdrop-blur-md border border-white/15 px-5 py-2.5 rounded-xl inline-flex items-center gap-4 shadow-lg">
                        <span className="text-xs text-white/70">
                          {activeSegment.visualData.label || 'مقدار شاخص'}:
                        </span>
                        <span className="gsap-counter-num text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                          {activeSegment.visualData.value.toLocaleString('fa-IR')}
                        </span>
                      </div>
                    )}

                    {activeSegment.visualData.items && (
                      <div className="w-72 mt-3 space-y-1.5 text-right">
                        {activeSegment.visualData.items.map((item, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-[11px] text-white/80">
                              <span>{item.label}</span>
                              <span className="font-mono">{item.value}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="gsap-bar-fill h-full bg-gradient-to-l from-orange-500 to-amber-400 rounded-full"
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Time Overlay Badge */}
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white/70 border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{activeSegment?.from.toFixed(1)}s → {activeSegment?.to.toFixed(1)}s</span>
            </div>
          </div>

          {/* Transport Controls Bar */}
          <div className="bg-neutral-900/90 border border-white/10 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="w-9 h-9 rounded-lg bg-orange-600 hover:bg-orange-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-md shadow-orange-950/40"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={handleRestart}
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all border border-white/5"
                title="پخش مجدد از ابتدا"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-white/10 mx-1" />

              {/* Speed Toggles */}
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[11px]">
                {[0.5, 1, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-1 rounded font-mono font-medium transition-colors ${
                      playbackSpeed === spd
                        ? 'bg-orange-600 text-white'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Visibility Toggles (After Effects Layer Soloing) */}
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="text-[11px] ml-1 flex items-center gap-1 text-white/40">
                <Layers className="w-3.5 h-3.5" />
                لایه‌ها:
              </span>
              <button
                onClick={() => setActiveLayers((p) => ({ ...p, bg: !p.bg }))}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  activeLayers.bg
                    ? 'bg-neutral-800 text-white border-white/20'
                    : 'bg-transparent text-white/30 border-transparent'
                }`}
              >
                پس‌زمینه
              </button>
              <button
                onClick={() => setActiveLayers((p) => ({ ...p, fx: !p.fx }))}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  activeLayers.fx
                    ? 'bg-neutral-800 text-white border-white/20'
                    : 'bg-transparent text-white/30 border-transparent'
                }`}
              >
                VFX
              </button>
              <button
                onClick={() => setActiveLayers((p) => ({ ...p, text: !p.text }))}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  activeLayers.text
                    ? 'bg-neutral-800 text-white border-white/20'
                    : 'bg-transparent text-white/30 border-transparent'
                }`}
              >
                کلمات
              </button>
              <button
                onClick={() => setActiveLayers((p) => ({ ...p, visual: !p.visual }))}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  activeLayers.visual
                    ? 'bg-neutral-800 text-white border-white/20'
                    : 'bg-transparent text-white/30 border-transparent'
                }`}
              >
                کارت داده
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AE Inspector & Presets */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* Preset Cards Selector */}
          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>پریست‌های استودیویی After Effects</span>
              </h3>
              <span className="text-[10px] font-mono text-white/40">{GSAP_PRESETS.length} پریست</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {GSAP_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all group relative overflow-hidden ${
                    activePresetId === preset.id
                      ? 'bg-neutral-800 border-orange-500 shadow-sm'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15'
                  }`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${preset.previewBg} opacity-20 group-hover:opacity-30 transition-opacity`}
                  />
                  <div className="relative z-10">
                    <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                      {preset.nameFa}
                    </div>
                    <div className="text-[10px] text-white/50 truncate mt-0.5 font-mono">
                      {preset.config.easing}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* AE Layer Settings Tweaker */}
          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <h3 className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                <span>تنظیمات لایه‌ها و تایمینگ GSAP</span>
              </h3>
              <span className="text-[10px] font-mono text-white/50">اسلاید #{selectedSegIndex + 1}</span>
            </div>

            {/* Entrance Style */}
            <div className="space-y-1.5">
              <label className="text-white/70 block text-[11px] font-medium">نوع ورود کلمات (Entrance):</label>
              <select
                value={currentConfig.entrance}
                onChange={(e) =>
                  handleUpdateCurrentConfig({
                    entrance: e.target.value as GsapTransitionType,
                  })
                }
                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="kinetic-3d-flip">چرخش سه‌بعدی و افتادن (3D Flip)</option>
                <option value="elastic-pop">جهش الاستیک و فنری (Elastic Pop)</option>
                <option value="split-stagger-slide">اسلاید پلکانی متناوب (Stagger Slide)</option>
                <option value="clip-mask-reveal">نمایان‌شدن از پشت ماسک (Clip-Mask)</option>
                <option value="glitch-rgb-flicker">گلیچ سایبرپانک و لرزش RGB</option>
                <option value="cinematic-flare-push">پوش دراماتیک با فلر نوری</option>
              </select>
            </div>

            {/* Easing Curve */}
            <div className="space-y-1.5">
              <label className="text-white/70 block text-[11px] font-medium">منحنی ایزینگ فیزیکی (Easing):</label>
              <select
                value={currentConfig.easing}
                onChange={(e) =>
                  handleUpdateCurrentConfig({
                    easing: e.target.value as GsapEasingType,
                  })
                }
                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              >
                <option value="power4.out">power4.out (شارپ و محکم)</option>
                <option value="elastic.out(1, 0.4)">elastic.out (فنری و جهنده)</option>
                <option value="back.out(2)">back.out(2) (اوورشوت افتر افکت)</option>
                <option value="circ.inOut">circ.inOut (سینمایی ملایم)</option>
                <option value="expo.out">expo.out (شتاب تند و فرود آهسته)</option>
                <option value="bounce.out">bounce.out (جهش توپ فیزیکی)</option>
              </select>
            </div>

            {/* Accent Effect */}
            <div className="space-y-1.5">
              <label className="text-white/70 block text-[11px] font-medium">افکت اکسنت لایه VFX:</label>
              <select
                value={currentConfig.accent}
                onChange={(e) =>
                  handleUpdateCurrentConfig({
                    accent: e.target.value as GsapAccentEffect,
                  })
                }
                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="burst-particles">ذرات هندسی انفجاری (Burst Particles)</option>
                <option value="neon-rings">حلقه نئونی تپنده (Neon Rings)</option>
                <option value="scanline-sweep">پرتو اسکن‌لاین لیزری (Laser Sweep)</option>
                <option value="optical-flare">فلر نوری متحرک (Optical Flare)</option>
                <option value="crosshair-target">هدف و خط‌کش HUD سه‌بعدی</option>
                <option value="none">بدون اکسنت اضافه</option>
              </select>
            </div>

            {/* Duration & Stagger Sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-white/60">
                  <span>مدت زمان:</span>
                  <span className="font-mono text-orange-400">{currentConfig.duration}s</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.0"
                  step="0.05"
                  value={currentConfig.duration}
                  onChange={(e) => handleUpdateCurrentConfig({ duration: parseFloat(e.target.value) })}
                  className="w-full accent-orange-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-white/60">
                  <span>تاخیر پلکانی (Stagger):</span>
                  <span className="font-mono text-orange-400">{currentConfig.stagger}s</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.10"
                  step="0.005"
                  value={currentConfig.stagger}
                  onChange={(e) => handleUpdateCurrentConfig({ stagger: parseFloat(e.target.value) })}
                  className="w-full accent-orange-600"
                />
              </div>
            </div>

            {/* 3D Perspective */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-white/60">
                <span>عمق پرسپکتیو سه‌بعدی (3D Perspective):</span>
                <span className="font-mono text-orange-400">{currentConfig.perspective3D}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="1500"
                step="50"
                value={currentConfig.perspective3D}
                onChange={(e) => handleUpdateCurrentConfig({ perspective3D: parseInt(e.target.value) })}
                className="w-full accent-orange-600"
              />
            </div>
          </div>

          {/* Code Export Box */}
          <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-4 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-orange-400" />
                <span>کد جاوااسکریپت GSAP تایم‌لاین</span>
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode ? 'کپی شد!' : 'کپی کد'}</span>
              </button>
            </div>
            <pre className="p-3 bg-black/60 rounded-xl text-[10px] font-mono text-emerald-400/90 overflow-x-auto max-h-36 scrollbar-thin border border-white/5 text-left" dir="ltr">
              {activeSegment ? generateGsapSnippet(activeSegment, plan.theme) : '// No segment selected'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
