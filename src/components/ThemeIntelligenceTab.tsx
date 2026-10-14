import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Palette,
  Sliders,
  Type,
  Zap,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Newspaper,
  Heart,
  Film,
  TrendingUp,
  Flame,
  ArrowRight,
  Eye,
  Layers,
  Wand2,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  ContentAnalysisResult,
  ContentArchetype,
  GsapAccentEffect,
  GsapEasingType,
  GsapTransitionType,
  MotionPlan,
  MotionTheme,
} from '../types/motion';
import {
  THEME_ARCHETYPES,
  analyzeContentWithAi,
  analyzeSrtLocally,
  applyArchetypeToPlan,
  applyPerSegmentAdaptation,
} from '../engine/contentAnalysisEngine';

interface ThemeIntelligenceTabProps {
  plan: MotionPlan;
  onUpdatePlan: (updatedPlan: MotionPlan) => void;
}

export const ThemeIntelligenceTab: React.FC<ThemeIntelligenceTabProps> = ({
  plan,
  onUpdatePlan,
}) => {
  const [analysis, setAnalysis] = useState<ContentAnalysisResult | null>(
    plan.contentAnalysis || null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedArchetype, setSelectedArchetype] = useState<ContentArchetype>('technology');
  const [notification, setNotification] = useState<string | null>(null);

  // Custom live palette edit state
  const [customBg, setCustomBg] = useState(plan.theme.bg);
  const [customFg, setCustomFg] = useState(plan.theme.fg);
  const [customAccent, setCustomAccent] = useState(plan.theme.accent);
  const [customSecondary, setCustomSecondary] = useState(plan.theme.secondary || '#38bdf8');

  // Sync colors when plan changes
  useEffect(() => {
    setCustomBg(plan.theme.bg);
    setCustomFg(plan.theme.fg);
    setCustomAccent(plan.theme.accent);
    setCustomSecondary(plan.theme.secondary || '#38bdf8');
  }, [plan.theme]);

  // Initial local analysis if not yet performed
  useEffect(() => {
    if (!analysis && plan.segments.length > 0) {
      const initial = analyzeSrtLocally(plan.segments);
      setAnalysis(initial);
      setSelectedArchetype(initial.dominantTheme);
    } else if (analysis) {
      setSelectedArchetype(analysis.dominantTheme);
    }
  }, [plan.segments]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Run full AI / Deep semantic analysis
  const handleDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeContentWithAi(plan.segments);
      setAnalysis(res);
      setSelectedArchetype(res.dominantTheme);

      // Save analysis in plan
      onUpdatePlan({
        ...plan,
        contentAnalysis: res,
      });

      showNotification(
        res.provider === 'gemini'
          ? 'تحلیل عمیق هوش مصنوعی با موفقیت انجام شد و تم بهینه پیشنهاد گردید.'
          : 'تحلیل واژگانی و لحن متن با موفقیت به‌روزرسانی شد.'
      );
    } catch (err: any) {
      showNotification('خطا در تحلیل متن: ' + (err.message || 'نامشخص'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply chosen archetype to plan
  const handleApplyArchetype = (archetypeId: ContentArchetype) => {
    const updated = applyArchetypeToPlan(plan, archetypeId, {
      applyToGsapLayers: true,
      syncSpeedMultiplier: true,
    });
    setSelectedArchetype(archetypeId);
    onUpdatePlan(updated);
    showNotification(`تم «${THEME_ARCHETYPES[archetypeId].nameFa}» با موفقیت روی موشن‌گرافیک اعمال شد.`);
  };

  // Apply custom palette updates
  const handleApplyCustomPalette = () => {
    const updatedTheme: MotionTheme = {
      ...plan.theme,
      bg: customBg,
      fg: customFg,
      accent: customAccent,
      secondary: customSecondary,
    };
    onUpdatePlan({
      ...plan,
      theme: updatedTheme,
    });
    showNotification('پالت رنگی سفارشی با موفقیت در لایه‌ها اعمال شد.');
  };

  // Run per-segment adaptation
  const handleApplyPerSegmentAdaptation = () => {
    const updated = applyPerSegmentAdaptation(plan);
    onUpdatePlan(updated);
    showNotification('استایل اختصاصی (آماری، نقل‌قول، ترنزیشن) بر اساس متن هر اسلاید اعمال گردید.');
  };

  // Archetype icon renderer
  const renderIcon = (archetypeId: ContentArchetype, className = 'w-4 h-4') => {
    switch (archetypeId) {
      case 'technology':
        return <Cpu className={className} />;
      case 'news':
        return <Newspaper className={className} />;
      case 'romantic':
        return <Heart className={className} />;
      case 'cinematic':
        return <Film className={className} />;
      case 'business':
        return <TrendingUp className={className} />;
      case 'sports':
        return <Flame className={className} />;
      case 'luxury':
        return <Sparkles className={className} />;
    }
  };

  const currentPreset = THEME_ARCHETYPES[selectedArchetype];

  return (
    <div className="space-y-6 text-right select-none" dir="rtl">
      {/* Toast Alert */}
      {notification && (
        <div className="fixed bottom-6 left-6 z-50 bg-emerald-600/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-xl border border-emerald-400/40 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-medium">{notification}</span>
        </div>
      )}

      {/* Top Banner & Main Action Strip */}
      <div className="bg-gradient-to-r from-purple-950/40 via-orange-950/30 to-amber-950/40 border border-purple-500/20 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                <Wand2 className="w-3 h-3 text-orange-400" />
                موتور تحلیل هوشمند محتوا و تطبیق تم
              </span>
              {analysis && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  {analysis.provider === 'gemini' ? 'هوش مصنوعی Gemini' : 'موتور محلی NLP'}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              تطبیق خودکار پالت رنگی، فونت و انیمیشن با متن‌های زیرنویس
            </h2>
            <p className="text-xs text-white/60 mt-1 max-w-2xl leading-relaxed">
              این ماژول متن‌های SRT را پردازش کرده و بر اساس واژگان، لحن احساسی و ضرباهنگ کلمات، تم بصری (تکنولوژی، خبری، عاشقانه، سینمایی و...) و استایل انیمیشن‌های افتر افکت را روی موشن‌گرافیک تنظیم می‌کند.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleDeepAnalysis}
              disabled={isAnalyzing}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin text-orange-400' : ''}`} />
              <span>{isAnalyzing ? 'در حال تحلیل...' : 'تحلیل مجدد متن'}</span>
            </button>

            <button
              onClick={() => handleApplyArchetype(selectedArchetype)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>اعمال هوشمند تم پیشنهادی</span>
            </button>
          </div>
        </div>

        {/* Detected Summary Insight */}
        {analysis && (
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-white/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">نتیجه بررسی:</span>
              <span className="text-white/70">{analysis.summaryFa}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0 text-[11px] text-white/60">
              <span>ضریب اطمینان: <strong className="text-white font-mono">{Math.round(analysis.confidence * 100)}%</strong></span>
              <span>میانگین سرعت گفتار: <strong className="text-white font-mono">{analysis.avgWpm} WPM</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* 7 Archetype Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-orange-400" />
            <span>پالت‌ها و سبک‌های انیمیشن پروژه (انتخاب یا تطبیق خودکار)</span>
          </h3>
          <span className="text-xs text-white/50">
            برای انتخاب یا پیش‌نمایش روی هر تم کلیک کنید
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(THEME_ARCHETYPES) as ContentArchetype[]).map((archKey) => {
            const arch = THEME_ARCHETYPES[archKey];
            const isSelected = selectedArchetype === archKey;
            const matchScore = analysis?.scores[archKey] || 0;
            const isDominant = analysis?.dominantTheme === archKey;

            return (
              <div
                key={archKey}
                onClick={() => setSelectedArchetype(archKey)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-orange-500/15 to-white/5 border-orange-500/50 shadow-md ring-1 ring-orange-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/[0.08]'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: arch.theme.accent + '33', color: arch.theme.accent }}
                    >
                      {renderIcon(archKey, 'w-3.5 h-3.5')}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {arch.nameFa}
                        {isDominant && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            بهترین تطبیق
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-white/40 font-mono">{arch.nameEn}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-white/60 mb-3 line-clamp-2 leading-relaxed">
                  {arch.description}
                </p>

                {/* Color swatches preview */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: arch.theme.bg }}
                    title="رنگ پس‌زمینه"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: arch.theme.fg }}
                    title="رنگ متن"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: arch.theme.accent }}
                    title="رنگ تاکیدی اصلی"
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: arch.theme.secondary }}
                    title="رنگ ثانویه"
                  />
                  <span className="text-[10px] font-mono text-white/40 mr-auto">
                    {arch.speedMultiplier}x
                  </span>
                </div>

                {/* Match percentage bar */}
                <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, matchScore))}%`,
                      backgroundColor: isDominant ? '#10b981' : arch.theme.accent,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-white/50 mt-1">
                  <span>میزان تطابق متن</span>
                  <span className="font-mono">{matchScore}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Archetype Deep Inspector & Adaptation Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Color Palette & Live Customizer */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <Palette className="w-3.5 h-3.5 text-orange-400" />
              <span>پالت رنگی تم انتخابی ({currentPreset.nameFa})</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-white/70 block mb-1">رنگ پس‌زمینه (Background):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={customBg}
                    onChange={(e) => setCustomBg(e.target.value)}
                    className="bg-black/30 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono flex-1 text-left"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1">رنگ اصلی متن (Foreground):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customFg}
                    onChange={(e) => setCustomFg(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={customFg}
                    onChange={(e) => setCustomFg(e.target.value)}
                    className="bg-black/30 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono flex-1 text-left"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1">رنگ تاکیدی نئونی (Accent):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={customAccent}
                    onChange={(e) => setCustomAccent(e.target.value)}
                    className="bg-black/30 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono flex-1 text-left"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1">رنگ ثانویه و مکمل (Secondary):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customSecondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={customSecondary}
                    onChange={(e) => setCustomSecondary(e.target.value)}
                    className="bg-black/30 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white font-mono flex-1 text-left"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleApplyCustomPalette}
            className="mt-4 w-full py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 flex items-center justify-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>ذخیره تغییرات رنگ روی پروژه</span>
          </button>
        </div>

        {/* Column 2: Typography, Speed & Box Style */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <Type className="w-3.5 h-3.5 text-orange-400" />
              <span>تایپوگرافی و فیزیک حرکت</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-white/60">فونت نمایش عناوین:</span>
                <span className="font-bold text-white">{currentPreset.theme.displayFont}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-white/60">فونت متن اصلی:</span>
                <span className="font-bold text-white">{currentPreset.theme.bodyFont}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-white/60">اندازه پیش‌فرض تیتر:</span>
                <span className="font-mono text-white">{currentPreset.style.captionSize}px</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-white/60">سرعت پخش و موشن:</span>
                <span className="font-mono text-amber-400 font-bold">{currentPreset.speedMultiplier}x</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-white/60">تاخیر استگر واژه‌ها:</span>
                <span className="font-mono text-white">{currentPreset.style.stagger}s</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-white/60">سختی فنر (Stiffness):</span>
                <span className="font-mono text-white">{currentPreset.style.spring.stiffness}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <span className="text-white/60">استایل کادربندی (Box):</span>
                <span className="font-bold text-orange-300 font-mono">{currentPreset.theme.boxStyle || 'minimal'}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/50 flex items-center justify-between">
            <span>افکت پس‌زمینه:</span>
            <span className="text-white font-medium">{currentPreset.theme.effect || 'none'}</span>
          </div>
        </div>

        {/* Column 3: GSAP Entrance Dynamics & Batch Actions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>موتور ورود و جلوه‌های افتر افکت</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10">
                <div className="text-[11px] text-white/50 mb-1">افکت ورود حروف و کلمات:</div>
                <div className="text-xs font-bold text-orange-400 font-mono">
                  {currentPreset.recommendedEntrance}
                </div>
                <div className="text-[10px] text-white/60 mt-1">
                  {currentPreset.recommendedEntrance === 'glitch-rgb-flicker' && 'گلیچ رنگی دیجیتال با پرش کانال‌های نوری'}
                  {currentPreset.recommendedEntrance === 'split-stagger-slide' && 'اسلاید منظم واژه‌ها با جهت متناوب'}
                  {currentPreset.recommendedEntrance === 'cinematic-flare-push' && 'زوم ملایم سینمایی همراه با هاله نور طلایی'}
                  {currentPreset.recommendedEntrance === 'elastic-pop' && 'پرش فنری انفجاری با بازگشت نرم'}
                  {currentPreset.recommendedEntrance === 'clip-mask-reveal' && 'ماسک خطی خطاطی از راست به چپ'}
                  {currentPreset.recommendedEntrance === 'kinetic-3d-flip' && 'چرخش سه‌بعدی حول محور افقی با ژرفانمایی ۹۰۰px'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-white/50 mb-1">منحنی شتاب‌گیری (Easing Curve):</div>
                <div className="text-xs font-bold text-white font-mono">
                  {currentPreset.recommendedEasing}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[11px] text-white/50 mb-1">افکت لایه تاکیدی (Accent Overlay):</div>
                <div className="text-xs font-bold text-amber-300 font-mono">
                  {currentPreset.recommendedAccent}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <button
              onClick={() => handleApplyArchetype(selectedArchetype)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Check className="w-4 h-4 text-white" />
              <span>اعمال سراسری تم «{currentPreset.nameFa}»</span>
            </button>

            <button
              onClick={handleApplyPerSegmentAdaptation}
              className="w-full py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 flex items-center justify-center gap-1.5 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-300" />
              <span>تطبیق هوشمند سگمنت به سگمنت (بر اساس آمار و نقل‌قول)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Segment by Segment SRT Analysis Inspector */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>بررسی لحن و استایل اسلایدهای زیرنویس ({plan.segments.length} اسلاید)</span>
          </h3>
          <span className="text-[11px] text-white/50">
            تحلیل خودکار نوع محتوا (Caption / Stat / Quote) و افکت پیشنهادی
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {plan.segments.map((seg, idx) => {
            const hasNum = /\d+|[۰-۹]+/.test(seg.text);
            const isQuote = seg.text.includes('«') || seg.text.includes('"');

            return (
              <div
                key={seg.id}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-white/10 text-white font-mono text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-white text-xs truncate max-w-md">{seg.text}</p>
                    <div className="flex items-center gap-2 text-[10px] text-white/40 mt-0.5">
                      <span>تایم: <strong className="font-mono">{seg.from.toFixed(1)}s</strong> تا <strong className="font-mono">{seg.to.toFixed(1)}s</strong></span>
                      <span>•</span>
                      <span>ورود: <strong className="font-mono text-white/60">{seg.gsapConfig?.entrance || currentPreset.recommendedEntrance}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasNum && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      داده / آمار
                    </span>
                  )}
                  {isQuote && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      نقل قول
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-white/70 font-mono">
                    {seg.kind}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
