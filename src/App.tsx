import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Film,
  Sliders,
  Server,
  Layers,
  ChevronLeft,
  Info,
  Video,
  Image as ImageIcon,
  Zap,
  Mic,
  Palette,
} from 'lucide-react';
import { MotionPlan } from './types/motion';
import { parseSrt } from './engine/ingest';
import { buildMotionPlan } from './engine/planner';
import { resolveSkill } from './engine/skills';
import { getLocalFallbackStock } from './engine/stockService';
import { downloadStandaloneHtml } from './engine/standaloneHtml';
import { analyzeSrtLocally, applyArchetypeToPlan } from './engine/contentAnalysisEngine';
import { MotionCanvasPlayer } from './components/MotionCanvasPlayer';
import { InputStudio } from './components/InputStudio';
import { PlanInspector } from './components/PlanInspector';
import { SkillManagerTab } from './components/SkillManagerTab';
import { PhpBundleViewer } from './components/PhpBundleViewer';
import { VideoExportModal } from './components/VideoExportModal';
import { StockStudioTab } from './components/StockStudioTab';
import { GsapMotionStudio } from './components/GsapMotionStudio';
import { TtsStudioTab } from './components/TtsStudioTab';
import { ThemeIntelligenceTab } from './components/ThemeIntelligenceTab';
import { AiStudioTab } from './components/AiStudioTab';

const INITIAL_SRT = `1
00:00:00,800 --> 00:00:03,800
هوش مصنوعی، بزرگ‌ترین تحول دهه اخیر است

2
00:00:04,100 --> 00:00:07,400
نمودار مقایسه‌ای: بیش از ۸۵ درصد شرکت‌های پیشرو

3
00:00:07,700 --> 00:00:10,800
نرخ پیشرفت و دقت الگوریتم‌ها به ۹۴ درصد رسید

4
00:00:11,100 --> 00:00:14,200
«سرعت یادگیری، تنها مزیت رقابتی پایدار است»

5
00:00:14,600 --> 00:00:17,800
آینده از همین ثانیه شروع می‌شود`;

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'timeline' | 'stock' | 'gsap' | 'tts' | 'theme-ai' | 'ai-studio' | 'skills' | 'php'>('studio');
  const [plan, setPlan] = useState<MotionPlan | null>(null);
  const [activeTime, setActiveTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  const [showVideoExportModal, setShowVideoExportModal] = useState(false);

  // Initialize initial plan on startup with stock images
  useEffect(() => {
    const defaultSkill = resolveSkill('fa-cinema');
    const segments = parseSrt(INITIAL_SRT);
    const initialPlan = buildMotionPlan(segments, defaultSkill, {
      title: 'انقلاب هوش مصنوعی',
      w: 1920,
      h: 1080,
      aspectRatio: '16:9',
      allowIntro: false,
    });

    const stock = getLocalFallbackStock('technology');
    if (stock.results.length > 0) {
      initialPlan.segments = initialPlan.segments.map((seg, idx) => {
        const img = stock.results[idx % stock.results.length];
        return {
          ...seg,
          backgroundImage: img.fullUrl,
          backgroundDim: 0.62,
          kenBurns: true,
          imageKeywords: img.alt,
          imageCredit: {
            author: img.author.name,
            authorUrl: img.author.portfolioUrl,
            source: img.source,
            photoUrl: img.fullUrl,
          },
        };
      });
    }

    const initialAnalysis = analyzeSrtLocally(initialPlan.segments);
    const adaptedInitialPlan = applyArchetypeToPlan(initialPlan, initialAnalysis.dominantTheme, {
      applyToGsapLayers: true,
      syncSpeedMultiplier: true,
    });
    adaptedInitialPlan.contentAnalysis = initialAnalysis;

    setPlan(adaptedInitialPlan);
  }, []);

  const handlePlanGenerated = (newPlan: MotionPlan) => {
    setPlan(newPlan);
  };

  return (
    <div className="min-h-screen bg-[#09080c] text-[#f5f0e8] flex flex-col font-sans-ui selection:bg-orange-600/30">
      {/* 1. Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09080c]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-6">
        {/* Zone 1: Wordmark Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-md shadow-orange-950/40">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl sm:text-2xl tracking-tight text-white font-normal whitespace-nowrap">
            MotionStudio
          </span>
          <span className="hidden md:inline-block text-xs text-white/40 border-r border-white/10 pr-2.5 mr-1 font-normal">
            تبدیل متن و SRT به موشن‌گرافیک HTML
          </span>
        </div>

        {/* Zone 2: Navigation Links (Clean unboxed interactive segmented control) */}
        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setCurrentTab('studio')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'studio'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            استودیو ورودی
          </button>

          <button
            onClick={() => setCurrentTab('timeline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'timeline'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            پلن و تایم‌لاین ({plan?.segments.length || 0})
          </button>

          <button
            onClick={() => setCurrentTab('stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'stock'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
            <span>تصاویر استوک Unsplash</span>
            {plan && plan.segments.filter((s) => s.backgroundImage).length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {plan.segments.filter((s) => s.backgroundImage).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('gsap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'gsap'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>موتور GSAP افتر افکت</span>
          </button>

          <button
            onClick={() => setCurrentTab('tts')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'tts'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-orange-400" />
            <span>صدا و گویندگی TTS</span>
            {plan && plan.segments.filter((s) => s.audioTrack?.src).length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {plan.segments.filter((s) => s.audioTrack?.src).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('theme-ai')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'theme-ai'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span>تحلیل تم و استایل</span>
            {plan?.contentAnalysis && (
              <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] px-1.5 py-0.2 rounded-full font-medium">
                {plan.contentAnalysis.recommendedPalette.nameFa}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('ai-studio')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentTab === 'ai-studio'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>هوش مصنوعی و GapGPT</span>
            <span className="bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30 text-[9px] px-1.5 py-0.2 rounded-full font-mono">
              FLUX & GPT-4o
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('skills')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'skills'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            اسکیل‌ها و آموزش
          </button>

          <button
            onClick={() => setCurrentTab('php')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentTab === 'php'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-white/60 hover:text-white'
            }`}
          >
            کدهای PHP
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowVideoExportModal(true)}
            disabled={!plan}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white/90 hover:text-white rounded-lg text-xs font-semibold transition-all border border-white/10 whitespace-nowrap shrink-0 shadow-sm"
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">تبدیل به ویدیو MP4</span>
            <span className="sm:hidden">ویدیو MP4</span>
          </button>

          <button
            onClick={() => plan && downloadStandaloneHtml(plan)}
            disabled={!plan}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-orange-950/40 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">دانلود HTML مستقل</span>
            <span className="sm:hidden">HTML</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notice Bar for 0 Token & Architecture */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/60 border border-white/5 rounded-xl px-4 py-2.5 mb-6 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">موتور مستقل موشن:</span>
            <span>بدون اتکای اجباری به AI (۰ توکن) با موتور Canvas 60fps و قابلیت آموزش اسکیل‌ها</span>
          </div>

          <div className="flex items-center gap-4 text-white/50 text-[11px] font-mono">
            <span>اسکیل: {plan?.meta.skillTitle || 'سینمایی تیره'}</span>
            <span aria-hidden="true">·</span>
            <span>مدت: {plan?.meta.duration || 0} ثانیه</span>
            <span aria-hidden="true">·</span>
            <span>کادر: {plan?.meta.aspectRatio || '16:9'}</span>
          </div>
        </div>

        {/* Dynamic Viewport Content */}
        {currentTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Input Form Studio */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <InputStudio
                onPlanGenerated={handlePlanGenerated}
                isGenerating={isGenerating}
                setIsGenerating={setIsGenerating}
              />
            </div>

            {/* Right Column: Live Motion Graphics Canvas Player */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {plan ? (
                <MotionCanvasPlayer
                  plan={plan}
                  onTimeUpdate={setActiveTime}
                  onRatingRequest={() => setShowRatingPrompt(true)}
                />
              ) : (
                <div className="aspect-video w-full rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center text-white/40 text-xs">
                  در حال بارگذاری پلن موشن...
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'timeline' && plan && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <PlanInspector
                plan={plan}
                onUpdatePlan={setPlan}
                activeTime={activeTime}
                onOpenStockPicker={() => setCurrentTab('stock')}
              />
            </div>
            <div className="lg:col-span-5 sticky top-20">
              <MotionCanvasPlayer
                plan={plan}
                onTimeUpdate={setActiveTime}
              />
            </div>
          </div>
        )}

        {currentTab === 'stock' && (
          <StockStudioTab
            plan={plan}
            onUpdatePlan={setPlan}
            activeTime={activeTime}
          />
        )}

        {currentTab === 'gsap' && plan && (
          <GsapMotionStudio
            plan={plan}
            onUpdatePlan={setPlan}
          />
        )}

        {currentTab === 'tts' && plan && (
          <TtsStudioTab
            plan={plan}
            onUpdatePlan={setPlan}
            activeTime={activeTime}
          />
        )}

        {currentTab === 'theme-ai' && plan && (
          <ThemeIntelligenceTab
            plan={plan}
            onUpdatePlan={setPlan}
          />
        )}

        {currentTab === 'ai-studio' && plan && (
          <AiStudioTab
            plan={plan}
            onUpdatePlan={setPlan}
            activeSegmentId={plan.segments.find(s => activeTime >= s.from && activeTime <= s.to)?.id}
            onSelectSegment={(id) => {
              const seg = plan.segments.find(s => s.id === id);
              if (seg) setActiveTime(seg.from);
            }}
          />
        )}

        {currentTab === 'skills' && (
          <SkillManagerTab
            currentPlan={plan}
            onSkillSelected={(newSkill) => {
              if (plan) {
                const updatedPlan: MotionPlan = {
                  ...plan,
                  theme: { ...newSkill.theme },
                  style: { ...newSkill.style },
                  meta: {
                    ...plan.meta,
                    skillId: newSkill.id,
                    skillTitle: newSkill.title,
                  },
                };
                setPlan(updatedPlan);
              }
            }}
          />
        )}

        {currentTab === 'php' && (
          <PhpBundleViewer />
        )}
      </main>

      {/* 3. Subtle Footer */}
      <footer className="w-full border-t border-white/10 bg-[#070609] py-5 px-4 text-center text-xs text-white/40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>MotionStudio — موتور تبدیل متن، SRT و صوت به موشن‌گرافیک‌های تحت‌وب مستقل HTML و ویدیو MP4</span>
          <div className="flex items-center gap-4 text-white/50 text-[11px]">
            <span>خروجی MP4 / WebM با MediaRecorder</span>
            <span aria-hidden="true">·</span>
            <span>موتور Canvas 60fps</span>
            <span aria-hidden="true">·</span>
            <span>بدون وابستگی خارجی در خروجی HTML</span>
          </div>
        </div>
      </footer>

      {/* Global MP4 Video Export Modal */}
      {plan && (
        <VideoExportModal
          plan={plan}
          isOpen={showVideoExportModal}
          onClose={() => setShowVideoExportModal(false)}
        />
      )}
    </div>
  );
}
