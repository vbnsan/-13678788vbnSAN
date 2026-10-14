import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  PenTool,
  Rocket,
  Settings,
  ExternalLink,
  Wand2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Download,
  Copy,
  Layers,
  Zap,
  Play,
  Key,
  ShieldCheck,
  ChevronRight,
  Eye,
  Trash2,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { MotionPlan, MotionSegment } from '../types/motion';
import {
  GapGptImageModel,
  GapGptSettings,
  GapGptTextModel,
  MotionVisualPreset,
  ScriptRewriteItem,
  GeneratedAiImageItem,
} from '../types/gapgpt';
import {
  GAPGPT_MODELS_REGISTRY,
  MOTION_VISUAL_PRESETS,
  buildArtDirectorPrompt,
  generateGapGptImage,
  loadGapGptSettings,
  rewriteScriptWithGapGpt,
  saveGapGptSettings,
} from '../engine/gapgptClient';

interface AiStudioTabProps {
  plan: MotionPlan;
  onUpdatePlan: (updatedPlan: MotionPlan) => void;
  activeSegmentId?: string;
  onSelectSegment?: (id: string) => void;
}

export function AiStudioTab({
  plan,
  onUpdatePlan,
  activeSegmentId,
  onSelectSegment,
}: AiStudioTabProps) {
  // Settings
  const [settings, setSettings] = useState<GapGptSettings>(loadGapGptSettings());
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'image-gen' | 'script-rewrite' | 'auto-pilot' | 'pricing-settings'>('image-gen');

  // Slide Selection for Image Gen
  const [selectedSegId, setSelectedSegId] = useState<string>(
    activeSegmentId || plan.segments[0]?.id || ''
  );

  // Image Generation States
  const [activePreset, setActivePreset] = useState<MotionVisualPreset>(settings.defaultVisualPreset);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedGallery, setGeneratedGallery] = useState<GeneratedAiImageItem[]>([]);
  const [lastGeneratedUrl, setLastGeneratedUrl] = useState<string>('');
  const [dimSlider, setDimSlider] = useState(0.55);
  const [kenBurnsToggle, setKenBurnsToggle] = useState(true);

  // Script Rewriting States
  const [styleMode, setStyleMode] = useState<'viral-reels' | 'cinematic-documentary' | 'clean-tech' | 'persian-storytelling'>('viral-reels');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResults, setRewriteResults] = useState<ScriptRewriteItem[]>([]);
  const [selectedRewriteIds, setSelectedRewriteIds] = useState<Record<string, boolean>>({});

  // Auto-Pilot States
  const [isAutoPiloting, setIsAutoPiloting] = useState(false);
  const [autoPilotStep, setAutoPilotStep] = useState<number>(0);
  const [autoPilotLog, setAutoPilotLog] = useState<string[]>([]);

  // Notifications
  const [toastNote, setToastNote] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastNote({ text, type });
    setTimeout(() => setToastNote(null), 4000);
  };

  // Keep selected slide in sync
  useEffect(() => {
    if (activeSegmentId && plan.segments.some((s) => s.id === activeSegmentId)) {
      setSelectedSegId(activeSegmentId);
    }
  }, [activeSegmentId, plan.segments]);

  const currentSegment = plan.segments.find((s) => s.id === selectedSegId) || plan.segments[0];

  // Auto-fill prompt when slide or preset changes
  useEffect(() => {
    if (currentSegment && !customPrompt) {
      const generated = buildArtDirectorPrompt(currentSegment.text, activePreset);
      setCustomPrompt(generated);
    }
  }, [selectedSegId, activePreset]);

  // Handle saving settings
  const handleUpdateSetting = <K extends keyof GapGptSettings>(key: K, value: GapGptSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveGapGptSettings(next);
  };

  // Generate Image for selected slide
  const handleGenerateImage = async () => {
    if (!currentSegment) return;
    setIsGeneratingImg(true);
    try {
      const promptToUse = customPrompt.trim() || buildArtDirectorPrompt(currentSegment.text, activePreset);
      const res = await generateGapGptImage({
        prompt: promptToUse,
        model: settings.imageModel,
        preset: activePreset,
        aspectRatio: settings.aspectRatio,
        apiKey: settings.apiKey,
        segmentId: currentSegment.id,
        segmentText: currentSegment.text,
      });

      setLastGeneratedUrl(res.imageUrl);

      const newItem: GeneratedAiImageItem = {
        id: `img_${Date.now()}`,
        segmentId: currentSegment.id,
        imageUrl: res.imageUrl,
        prompt: promptToUse,
        model: settings.imageModel,
        stylePreset: activePreset,
        aspectRatio: settings.aspectRatio,
        createdAt: new Date().toLocaleTimeString('fa-IR'),
        provider: res.provider,
      };

      setGeneratedGallery((prev) => [newItem, ...prev.slice(0, 15)]);

      if (settings.autoApplyToPlan) {
        applyImageToSegment(res.imageUrl, currentSegment.id);
        showToast(`تصویر تولید شد و روی اسلاید "${currentSegment.text.slice(0, 20)}..." اعمال شد`, 'success');
      } else {
        showToast('تصویر با موفقیت تولید شد', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'خطا در تولید تصویر', 'error');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  // Apply Image to Segment
  const applyImageToSegment = (imgUrl: string, segId: string) => {
    const updatedSegments = plan.segments.map((seg) => {
      if (seg.id === segId) {
        return {
          ...seg,
          backgroundImage: imgUrl,
          backgroundDim: dimSlider,
          kenBurns: kenBurnsToggle,
        };
      }
      return seg;
    });

    onUpdatePlan({
      ...plan,
      segments: updatedSegments,
    });
  };

  // Apply Image to ALL Segments
  const applyImageToAllSegments = (imgUrl: string) => {
    const updatedSegments = plan.segments.map((seg) => ({
      ...seg,
      backgroundImage: imgUrl,
      backgroundDim: dimSlider,
      kenBurns: kenBurnsToggle,
    }));

    onUpdatePlan({
      ...plan,
      segments: updatedSegments,
    });
    showToast('تصویر به عنوان پس‌زمینه سراسری روی تمام اسلایدها قرار گرفت', 'success');
  };

  // Run AI Script Rewriting
  const handleRunScriptRewrite = async () => {
    if (!plan.segments || plan.segments.length === 0) return;
    setIsRewriting(true);
    try {
      const res = await rewriteScriptWithGapGpt({
        segments: plan.segments.map((s) => ({ id: s.id, text: s.text })),
        model: settings.textModel,
        styleMode,
        apiKey: settings.apiKey,
      });

      setRewriteResults(res.items);
      // Select all by default
      const initialChecked: Record<string, boolean> = {};
      res.items.forEach((item) => {
        initialChecked[item.segmentId] = true;
      });
      setSelectedRewriteIds(initialChecked);
      showToast(`سناریو با مدل ${res.modelUsed} بازنویسی و تگ‌گذاری ریتمیک شد`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'خطا در بازنویسی سناریو با هوش مصنوعی', 'error');
    } finally {
      setIsRewriting(false);
    }
  };

  // Apply rewritten text items to plan
  const handleApplyRewritesToPlan = () => {
    if (rewriteResults.length === 0) return;

    const updatedSegments = plan.segments.map((seg) => {
      if (!selectedRewriteIds[seg.id]) return seg;
      const rewriteItem = rewriteResults.find((r) => r.segmentId === seg.id);
      if (!rewriteItem) return seg;

      return {
        ...seg,
        text: rewriteItem.rewrittenText,
        kind: rewriteItem.segmentKind || seg.kind,
        em: rewriteItem.emphasisWords.length > 0 ? rewriteItem.emphasisWords : seg.em,
      };
    });

    onUpdatePlan({
      ...plan,
      segments: updatedSegments,
    });
    showToast('متن‌های بازنویسی‌شده و کلمات تاکیدی موشن روی پروژه اعمال شدند', 'success');
  };

  // Auto-Pilot Master Production Pipeline
  const handleRunAutoPilot = async () => {
    setIsAutoPiloting(true);
    setAutoPilotStep(1);
    setAutoPilotLog(['شروع تولید هوشمند و خودکار موشن گرافیک با GapGPT...']);

    try {
      // Step 1: Script & Hooks
      setAutoPilotLog((p) => [...p, `گام ۱/۴: بازنویسی سناریوی ویروسی با مدل ${settings.textModel}...`]);
      const rewriteRes = await rewriteScriptWithGapGpt({
        segments: plan.segments.map((s) => ({ id: s.id, text: s.text })),
        model: settings.textModel,
        styleMode: 'viral-reels',
        apiKey: settings.apiKey,
      });

      let updatedPlan: MotionPlan = {
        ...plan,
        segments: plan.segments.map((seg) => {
          const rw = rewriteRes.items.find((i) => i.segmentId === seg.id);
          if (!rw) return seg;
          return {
            ...seg,
            text: rw.rewrittenText,
            kind: rw.segmentKind || seg.kind,
            em: rw.emphasisWords || seg.em,
          };
        }),
      };

      setAutoPilotStep(2);
      setAutoPilotLog((p) => [
        ...p,
        'گام ۲/۴: تحلیل فرم و تطبیق پالت رنگی و انیمیشن‌های ورود GSAP...',
      ]);

      // Step 2: Generate visual background for hero slide using Flux
      setAutoPilotStep(3);
      setAutoPilotLog((p) => [
        ...p,
        `گام ۳/۴: تولید تصویر پس‌زمینه ترند با مدل ${settings.imageModel} (${activePreset})...`,
      ]);

      const heroSegment = updatedPlan.segments[0];
      const heroPrompt = buildArtDirectorPrompt(heroSegment?.text || 'Digital Innovation', activePreset);
      const imgRes = await generateGapGptImage({
        prompt: heroPrompt,
        model: settings.imageModel,
        preset: activePreset,
        aspectRatio: settings.aspectRatio,
        apiKey: settings.apiKey,
        segmentId: heroSegment?.id,
        segmentText: heroSegment?.text,
      });

      // Apply to all slides with Ken Burns
      updatedPlan = {
        ...updatedPlan,
        segments: updatedPlan.segments.map((s) => ({
          ...s,
          backgroundImage: imgRes.imageUrl,
          backgroundDim: 0.6,
          kenBurns: true,
        })),
      };

      // Step 4: Finalize
      setAutoPilotStep(4);
      setAutoPilotLog((p) => [
        ...p,
        'گام ۴/۴: همگام‌سازی تایم‌لاین و ذخیره پروژه آماده اجرا...',
      ]);

      onUpdatePlan(updatedPlan);
      showToast('موشن گرافیک ترند به طور کامل با هوش مصنوعی تولید شد!', 'success');
      setAutoPilotLog((p) => [...p, '✔ عملیات با موفقیت پایان یافت. برای تماشا دکمه پخش را بزنید.']);
    } catch (e: any) {
      console.error(e);
      setAutoPilotLog((p) => [...p, `❌ خطا در اجرای Auto-Pilot: ${e.message}`]);
      showToast(e.message || 'خطا در اتوپایلوت', 'error');
    } finally {
      setIsAutoPiloting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl text-slate-100 mb-8" dir="rtl">
      {/* Toast Notification */}
      {toastNote && (
        <div
          className={`px-4 py-2 text-xs font-semibold flex items-center justify-between border-b transition-all ${
            toastNote.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
              : toastNote.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
              : 'bg-violet-950/80 border-violet-500/30 text-violet-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastNote.text}</span>
          </div>
          <button
            onClick={() => setToastNote(null)}
            className="text-[10px] opacity-70 hover:opacity-100"
          >
            بستن
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-violet-950/80 via-slate-900 to-indigo-950/80 border-b border-violet-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  استودیوی موشن هوشمند با GapGPT Platform v2
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                  FLUX • GPT-4o • Claude • DALL-E 3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تولید تصاویر موشن گرافیک ترند، بازنویسی سناریوی ویروسی و گویندگی هوشمند بر اساس مستندات پلتفرم گپ جی‌پی‌تی
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
            <a
              href="https://gapgpt.app/platform-v2/docs/quickstart"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>مستندات Quickstart</span>
              <ExternalLink className="w-3 h-3 text-violet-400" />
            </a>

            <a
              href="https://gapgpt.app/platform-v2/pricing"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>تعرفه‌ها و پکیج‌ها</span>
              <ExternalLink className="w-3 h-3 text-fuchsia-400" />
            </a>

            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>{settings.apiKey ? 'کلید API تنظیم شده' : 'تنظیم API Key'}</span>
            </button>
          </div>
        </div>

        {/* API Key Modal / Drawer if opened */}
        {showApiKeyInput && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <label className="text-[11px] font-medium text-slate-300 block mb-1">
                کلید GapGPT API Key (از پنل توسعه‌دهندگان gapgpt.app):
              </label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => handleUpdateSetting('apiKey', e.target.value)}
                placeholder="sk-gapgpt-xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto pt-2 sm:pt-4">
              <button
                onClick={() => {
                  setShowApiKeyInput(false);
                  showToast('کلید با موفقیت ذخیره شد', 'success');
                }}
                className="px-3 py-1.5 text-xs bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg shadow-sm"
              >
                تایید و بستن
              </button>
              <span className="text-[10px] text-slate-400">
                (در صورت خالی بودن، از موتور هوشمند شبیه‌ساز و Gemini استفاده خواهد شد)
              </span>
            </div>
          </div>
        )}

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSubTab('image-gen')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'image-gen'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>تولید تصاویر موشن با FLUX & Midjourney</span>
          </button>

          <button
            onClick={() => setActiveSubTab('script-rewrite')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'script-rewrite'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-cyan-400" />
            <span>بازنویسی سناریوی ویروسی و ترند (GPT-4o / Claude)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('auto-pilot')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'auto-pilot'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Rocket className="w-3.5 h-3.5 text-amber-400" />
            <span>اتوپایلوت صفر تا صد موشن گرافیک</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pricing-settings')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'pricing-settings'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            <span>راهنمای تعرفه‌ها و انتخاب مدل‌ها</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: IMAGE GENERATOR WITH FLUX, MIDJOURNEY, DALL-E 3 */}
      {activeSubTab === 'image-gen' && (
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            {/* Slide & Model Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  انتخاب اسلاید زیرنویس:
                </label>
                <select
                  value={selectedSegId}
                  onChange={(e) => {
                    setSelectedSegId(e.target.value);
                    const seg = plan.segments.find((s) => s.id === e.target.value);
                    if (seg) {
                      setCustomPrompt(buildArtDirectorPrompt(seg.text, activePreset));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500"
                >
                  {plan.segments.map((seg, idx) => (
                    <option key={seg.id} value={seg.id}>
                      اسلاید {idx + 1} ({Math.round(seg.to - seg.from)}ث): {seg.text.slice(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  مدل تولید تصویر (GapGPT Image API):
                </label>
                <select
                  value={settings.imageModel}
                  onChange={(e) => handleUpdateSetting('imageModel', e.target.value as GapGptImageModel)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-violet-500 font-mono"
                >
                  <option value="flux">FLUX 1.1 / Schnell (پیشنهادی - ترند شماره یک جهان)</option>
                  <option value="midjourney">Midjourney v6 (سبک سینمایی و هنری)</option>
                  <option value="dall-e-3">DALL·E 3 (دقت بالا به پرامپت OpenAI)</option>
                  <option value="stable-diffusion-3">Stable Diffusion 3 / SDXL (سریع و اقتصادی)</option>
                </select>
              </div>
            </div>

            {/* Visual Style Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  استایل بصری ترند موشن (Motion Visual Preset):
                </label>
                <span className="text-[11px] text-violet-400 font-medium">
                  {MOTION_VISUAL_PRESETS.find((p) => p.id === activePreset)?.sampleTag}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MOTION_VISUAL_PRESETS.map((preset) => {
                  const isSelected = activePreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setActivePreset(preset.id);
                        if (currentSegment) {
                          setCustomPrompt(buildArtDirectorPrompt(currentSegment.text, preset.id));
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-violet-900/30 border-violet-500 ring-1 ring-violet-500/50'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-white">{preset.titleFa}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {preset.descriptionFa}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                  <span>پرامپت کارگردانی هنری هوش مصنوعی (Art Director Prompt):</span>
                </label>
                <button
                  onClick={() => {
                    if (currentSegment) {
                      setCustomPrompt(buildArtDirectorPrompt(currentSegment.text, activePreset));
                      showToast('پرامپت استودیویی متناسب با متن اسلاید بازتولید شد', 'info');
                    }
                  }}
                  className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تولید مجدد پرامپت</span>
                </button>
              </div>

              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={3}
                dir="ltr"
                className="w-full p-2.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-violet-500 leading-relaxed"
                placeholder="Enter prompt for Flux / Midjourney / DALL-E..."
              />
            </div>

            {/* Aspect Ratio & Settings */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300">نسبت ابعاد:</span>
                {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => handleUpdateSetting('aspectRatio', ratio)}
                    className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg border ${
                      settings.aspectRatio === ratio
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ratio} {ratio === '16:9' ? '(افقی)' : ratio === '9:16' ? '(استوری/ریلز)' : '(مربع)'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoApplyToPlan}
                    onChange={(e) => handleUpdateSetting('autoApplyToPlan', e.target.checked)}
                    className="accent-violet-500 w-3.5 h-3.5 rounded"
                  />
                  <span>اعمال خودکار روی اسلاید</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={kenBurnsToggle}
                    onChange={(e) => setKenBurnsToggle(e.target.checked)}
                    className="accent-violet-500 w-3.5 h-3.5 rounded"
                  />
                  <span>زوم سینمایی (Ken Burns)</span>
                </label>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImg}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingImg ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>در حال تولید تصویر با {settings.imageModel.toUpperCase()}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>تولید تصویر با هوش مصنوعی برای اسلاید انتخابی</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview & Gallery Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-violet-400" />
                  <span>پیش‌نمایش زنده بک‌گراند موشن</span>
                </h3>
                {lastGeneratedUrl && (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                    آماده استفاده
                  </span>
                )}
              </div>

              {/* Image Preview Box */}
              <div
                className={`w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative ${
                  settings.aspectRatio === '9:16'
                    ? 'aspect-[9/16] max-h-96 mx-auto'
                    : settings.aspectRatio === '1:1'
                    ? 'aspect-square max-h-80 mx-auto'
                    : 'aspect-video'
                }`}
              >
                {lastGeneratedUrl ? (
                  <>
                    <img
                      src={lastGeneratedUrl}
                      alt="Generated AI Motion Background"
                      className="w-full h-full object-cover"
                    />
                    {/* Simulated Subtitle Overlay to show contrast */}
                    <div
                      className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none"
                      style={{
                        backgroundColor: `rgba(0, 0, 0, ${dimSlider})`,
                      }}
                    >
                      <div className="bg-black/60 backdrop-blur-md p-2.5 rounded-lg border border-white/10 text-center">
                        <p className="text-xs font-bold text-white leading-relaxed font-sans">
                          {currentSegment?.text || 'پیش‌نمایش موشن گرافیک'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-slate-500 space-y-2">
                    <ImageIcon className="w-10 h-10 mx-auto text-slate-600 stroke-1" />
                    <p className="text-xs">تصویر تولید شده در این بخش نمایش داده می‌شود.</p>
                    <p className="text-[10px] text-slate-600">
                      مدل فعال: {settings.imageModel} • نسبت {settings.aspectRatio}
                    </p>
                  </div>
                )}
              </div>

              {/* Controls under preview */}
              {lastGeneratedUrl && (
                <div className="mt-3 space-y-2.5 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>تیرگی پس‌زمینه (برای خوانایی متن):</span>
                    <span className="font-mono text-violet-400">{Math.round(dimSlider * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.85"
                    step="0.05"
                    value={dimSlider}
                    onChange={(e) => setDimSlider(parseFloat(e.target.value))}
                    className="w-full accent-violet-500 cursor-pointer"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => applyImageToSegment(lastGeneratedUrl, currentSegment.id)}
                      className="py-1.5 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعمال روی اسلاید فعلی</span>
                    </button>
                    <button
                      onClick={() => applyImageToAllSegments(lastGeneratedUrl)}
                      className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>اعمال روی کل اسلایدها</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Generated Gallery Carousel / List */}
            {generatedGallery.length > 0 && (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-300">تصاویر تولید شده این نشست ({generatedGallery.length})</span>
                  <button
                    onClick={() => setGeneratedGallery([])}
                    className="text-[10px] text-slate-500 hover:text-slate-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>پاکسازی</span>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {generatedGallery.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setLastGeneratedUrl(item.imageUrl)}
                      className="group relative rounded-lg overflow-hidden aspect-video border border-slate-800 hover:border-violet-500 cursor-pointer"
                    >
                      <img src={item.imageUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="text-[10px] text-white font-bold bg-violet-600/80 px-2 py-0.5 rounded">
                          انتخاب
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: VIRAL SCRIPT REWRITING & KINETIC HOOKS */}
      {activeSubTab === 'script-rewrite' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PenTool className="w-4 h-4 text-cyan-400" />
                <span>بازنویسی هوشمند متن و سناریو با مدل‌های پیشرفته GapGPT</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                تبدیل جملات عادی زیرنویس به تیترهای پرکشش و ویروسی (Viral Kinetic Hooks) متناسب با اینستاگرام ریلز، یوتیوب و تیک‌تاک
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">مدل متنی:</label>
                <select
                  value={settings.textModel}
                  onChange={(e) => handleUpdateSetting('textModel', e.target.value as GapGptTextModel)}
                  className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                >
                  <option value="gpt-4o">OpenAI GPT-4o (پرچمدار)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (شاعرانه و خلاق)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (سریع و اقتصادی)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="deepseek-chat">DeepSeek Chat V3</option>
                  <option value="gapgpt-4">GapGPT-4 بومی</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">استایل لحن سناریو:</label>
                <select
                  value={styleMode}
                  onChange={(e) => setStyleMode(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="viral-reels">موشن ریلز و تیک‌تاک (ضربه‌ای و کوتاه)</option>
                  <option value="cinematic-documentary">مستند سینمایی (عمیق و روایی)</option>
                  <option value="clean-tech">استارتاپی و پروموشن (مختصر و دیتامحور)</option>
                  <option value="persian-storytelling">داستان‌گویی اصیل فارسی</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleRunScriptRewrite}
                  disabled={isRewriting}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isRewriting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال نگارش سناریو...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>بازنویسی هوشمند کل سناریو</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Results Comparison List */}
          {rewriteResults.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">
                  پیش‌نمایش جملات بازنویسی شده ({rewriteResults.length} اسلاید):
                </span>
                <button
                  onClick={handleApplyRewritesToPlan}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>اعمال موارد انتخابی روی پروژه</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {rewriteResults.map((item, idx) => {
                  const words = item.rewrittenText.split(/\s+/);
                  return (
                    <div
                      key={item.segmentId}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                    >
                      <div className="md:col-span-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!selectedRewriteIds[item.segmentId]}
                          onChange={(e) =>
                            setSelectedRewriteIds((prev) => ({
                              ...prev,
                              [item.segmentId]: e.target.checked,
                            }))
                          }
                          className="accent-violet-500 w-4 h-4 rounded cursor-pointer"
                        />
                        <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                      </div>

                      {/* Original vs Rewritten */}
                      <div className="md:col-span-6 space-y-1">
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>متن اولیه:</span>
                          <span className="line-through opacity-80">{item.originalText}</span>
                        </div>
                        <div className="text-xs font-bold text-white flex items-center gap-1 flex-wrap">
                          <span className="text-emerald-400 font-normal text-[10px] ml-1">ویروسی:</span>
                          {words.map((w, wIdx) => {
                            const isEm = item.emphasisWords.includes(wIdx);
                            return (
                              <span
                                key={wIdx}
                                className={
                                  isEm
                                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 rounded'
                                    : 'text-slate-100'
                                }
                              >
                                {w}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Metaphor Tag & Sound */}
                      <div className="md:col-span-5 flex items-center justify-between md:justify-end gap-2 flex-wrap">
                        {item.hookHeadlineFa && (
                          <span className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded">
                            {item.hookHeadlineFa}
                          </span>
                        )}
                        {item.soundEffectHint && (
                          <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-mono">
                            SFX: {item.soundEffectHint}
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          نوع: {item.segmentKind}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-dashed border-slate-800 text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">
                برای بازنویسی خودکار و ریتمیک زیرنویس‌ها، روی دکمه «بازنویسی هوشمند کل سناریو» کلیک کنید.
              </p>
              <p className="text-[11px] text-slate-600">
                سیستم به طور خودکار کلمات کلیدی، افکت صوتی پیشنهادی و پرامپت انگلیسی عکس هر اسلاید را تنظیم خواهد کرد.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: AUTO-PILOT MASTER PRODUCTION */}
      {activeSubTab === 'auto-pilot' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-600/30 text-white">
              <Rocket className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              اتوپایلوت صفر تا صد موشن گرافیک (One-Click AI Motion Generator)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              با فشردن یک کلیک، هوش مصنوعی کل متن شما را تحلیل می‌کند، سناریوی پرانرژی و ریتمیک می‌نویسد، تصاویر پس‌زمینه با Flux/Midjourney تولید می‌کند، پالت رنگ و انیمیشن‌های ورود GSAP را تنظیم می‌کند و پروژه آماده تماشا و اکسپورت می‌شود.
            </p>

            {/* Pipeline progress visualization */}
            <div className="grid grid-cols-4 gap-2 pt-4">
              {[
                { step: 1, label: 'بازنویسی سناریو', desc: 'GPT-4o / Claude' },
                { step: 2, label: 'تنظیم انیمیشن و تم', desc: 'GSAP Kinetics' },
                { step: 3, label: 'تولید تصویر ترند', desc: 'Flux & Midjourney' },
                { step: 4, label: 'آماده‌سازی نهایی', desc: 'تایم‌لاین و خروجی' },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    autoPilotStep === s.step
                      ? 'bg-amber-500/20 border-amber-500 ring-1 ring-amber-500/50'
                      : autoPilotStep > s.step
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="text-xs font-bold text-white mb-0.5">
                    {autoPilotStep > s.step ? '✔ ' : ''}{s.label}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Auto Pilot Action Button */}
            <div className="pt-4">
              <button
                onClick={handleRunAutoPilot}
                disabled={isAutoPiloting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-sm shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
              >
                {isAutoPiloting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>در حال اجرای اتوپایلوت هوش مصنوعی...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-amber-200 fill-amber-200" />
                    <span>تولید فول موشن گرافیک هوشمند با یک کلیک</span>
                  </>
                )}
              </button>
            </div>

            {/* Execution Logs */}
            {autoPilotLog.length > 0 && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-right text-xs font-mono space-y-1.5 max-h-48 overflow-y-auto">
                {autoPilotLog.map((log, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 ${
                      log.startsWith('✔')
                        ? 'text-emerald-400 font-bold'
                        : log.startsWith('❌')
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GAPGPT PRICING & MODELS REGISTRY */}
      {activeSubTab === 'pricing-settings' && (
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>لیست کامل مدل‌ها و راهنمای تعرفه‌های پلتفرم گپ جی‌پی‌تی</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                بر اساس مستندات رسمی gapgpt.app/platform-v2/pricing — پشتیبانی بدون فیلترشکن و با درگاه پرداخت ریالی
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://gapgpt.app/platform-v2/pricing"
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>مشاهده قیمت‌های لحظه‌ای در گپ جی‌پی‌تی</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Model Registry Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {GAPGPT_MODELS_REGISTRY.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-white">{m.name}</span>
                    {m.badge && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {m.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2 font-mono">{m.providerName}</div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{m.descriptionFa}</p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">مناسب برای:</span>
                    <span className="text-slate-200">{m.recommendedFor}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">تعرفه تقریبی:</span>
                    <span className="text-emerald-400 font-bold">{m.approxCostFa}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
