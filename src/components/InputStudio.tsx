import React, { useState } from 'react';
import {
  FileText,
  Subtitles,
  Mic,
  Link2,
  Sparkles,
  Upload,
  PlayCircle,
  HelpCircle,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Eye,
  Play,
} from 'lucide-react';
import { InputMode, MotionPlan, MotionSkill } from '../types/motion';
import { getAllSkills, resolveSkill } from '../engine/skills';
import { parseSrt, parseTextToSegments, fitSegmentsToDuration, extractFromUrl } from '../engine/ingest';
import { buildMotionPlan } from '../engine/planner';
import { enhancePlanWithAi } from '../engine/ai';
import { autoMatchSlideImages } from '../engine/stockService';
import { analyzeSrtLocally, applyArchetypeToPlan } from '../engine/contentAnalysisEngine';
import { rewriteScriptWithGapGpt } from '../engine/gapgptClient';
import { GapGptTextModel } from '../types/gapgpt';
import { SkillPreviewModal } from './SkillPreviewModal';

interface Props {
  onPlanGenerated: (plan: MotionPlan) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
}

const SAMPLE_SRT = `1
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

const SAMPLE_TEXT = `در دنیای شتابان امروز، آن‌هایی که منتظر فرصت کامل می‌مانند، بیش از ۹۰ درصد زمان خود را هدر می‌دهند. قدرت واقعی در شروع کردن با منابع موجود و تکامل در مسیر نهفته است. هر ایده بزرگ، ابتدا تنها یک سطر ساده بود.`;

export const InputStudio: React.FC<Props> = ({ onPlanGenerated, isGenerating, setIsGenerating }) => {
  const [mode, setMode] = useState<InputMode>('srt');
  const [srtText, setSrtText] = useState(SAMPLE_SRT);
  const [rawText, setRawText] = useState(SAMPLE_TEXT);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('انقلاب فناوری');
  const [selectedSkillId, setSelectedSkillId] = useState('iart-tiktok-viral');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Audio State
  const [audioFile, setAudioFile] = useState<{ src: string; name: string; duration: number } | null>(null);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // AI Options
  const [useAi, setUseAi] = useState(false);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'deepseek' | 'gapgpt'>('gapgpt');
  const [deepseekApiKey, setDeepseekApiKey] = useState('');
  const [gapgptApiKey, setGapgptApiKey] = useState('');
  const [gapgptModel, setGapgptModel] = useState<GapGptTextModel>('gpt-4o');
  const [autoMatchStock, setAutoMatchStock] = useState(true);
  const [autoAdaptTheme, setAutoAdaptTheme] = useState(true);

  // Status & notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successNote, setSuccessNote] = useState('');

  const skills = getAllSkills();

  // Load sample SRT
  const handleLoadSampleSrt = () => {
    setSrtText(SAMPLE_SRT);
    setTitleInput('انقلاب فناوری');
    setSuccessNote('نمونه زیرنویس فارسی SRT بارگذاری شد');
    setTimeout(() => setSuccessNote(''), 3000);
  };

  // Handle SRT file upload
  const handleSrtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSrtText(content);
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setTitleInput(nameWithoutExt);
      }
    };
    reader.readAsText(file);
  };

  // Handle Audio file upload
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    const audioEl = new Audio(audioUrl);

    audioEl.onloadedmetadata = () => {
      setAudioFile({
        src: audioUrl,
        name: file.name,
        duration: audioEl.duration || 10,
      });
      setSuccessNote(`فایل صوتی بارگذاری شد (مدت: ${Math.round(audioEl.duration)} ثانیه)`);
      setTimeout(() => setSuccessNote(''), 3000);
    };
  };

  // Live Microphone Recording
  const toggleMicRecording = async () => {
    if (isRecordingMic) {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        setIsRecordingMic(false);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioEl = new Audio(audioUrl);

        audioEl.onloadedmetadata = () => {
          setAudioFile({
            src: audioUrl,
            name: 'صدای ضبط‌شده',
            duration: audioEl.duration || 5,
          });
        };

        // Stop all mic tracks
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecordingMic(true);
    } catch (err: any) {
      setErrorMsg('امکان دسترسی به میکروفون میسر نشد: ' + err.message);
    }
  };

  // Extract from web link
  const handleExtractFromUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('لطفاً آدرس لینک را وارد کنید');
      return;
    }
    setErrorMsg('');
    setIsGenerating(true);
    try {
      const data = await extractFromUrl(urlInput);
      if (data.title) setTitleInput(data.title);
      if (data.text) setRawText(data.text);
      setMode('text');
      setSuccessNote('متن مقاله با موفقیت از لینک استخراج شد');
      setTimeout(() => setSuccessNote(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در استخراج محتوا از لینک');
    } finally {
      setIsGenerating(false);
    }
  };

  // Master Generate Motion handler
  const handleGenerate = async () => {
    setErrorMsg('');
    setIsGenerating(true);

    try {
      const activeSkill = resolveSkill(selectedSkillId);

      // Resolution based on aspect ratio
      let width = 1920;
      let height = 1080;
      if (aspectRatio === '9:16') {
        width = 1080;
        height = 1920;
      } else if (aspectRatio === '1:1') {
        width = 1080;
        height = 1080;
      }

      let rawSegments: Array<{ from: number; to: number; text: string }> = [];
      let allowIntro = false;

      if (mode === 'srt') {
        rawSegments = parseSrt(srtText);
        if (rawSegments.length === 0) {
          throw new Error('متن زیرنویس SRT معتبر نیست یا قالبی نامشخص دارد.');
        }
      } else if (mode === 'text') {
        rawSegments = parseTextToSegments(
          rawText,
          activeSkill.rules.wpm,
          activeSkill.rules.gap,
          activeSkill.rules.maxCharsPerLine
        );
        if (rawSegments.length === 0) {
          throw new Error('متنی برای تبدیل به موشن وارد نشده است.');
        }
        allowIntro = true;
      } else if (mode === 'audio') {
        if (!audioFile) {
          throw new Error('لطفاً یک فایل صوتی انتخاب کنید یا با میکروفون صدا ضبط کنید.');
        }

        const accompanyingText = rawText.trim() || titleInput || 'پخش صدای نریشن';
        rawSegments = parseTextToSegments(accompanyingText, activeSkill.rules.wpm, activeSkill.rules.gap);
        rawSegments = fitSegmentsToDuration(rawSegments, audioFile.duration);
      } else if (mode === 'link') {
        if (!rawText) {
          throw new Error('ابتدا دکمه استخراج محتوا از لینک را بزنید یا متن را وارد کنید.');
        }
        rawSegments = parseTextToSegments(rawText, activeSkill.rules.wpm, activeSkill.rules.gap);
        allowIntro = true;
      }

      // Step 1: Rule-based deterministic motion planning (0 tokens consumed!)
      let plan = buildMotionPlan(rawSegments, activeSkill, {
        title: titleInput,
        w: width,
        h: height,
        aspectRatio,
        allowIntro,
        audio: audioFile ? { src: audioFile.src, name: audioFile.name, duration: audioFile.duration } : null,
      });

      // Step 2: Optional micro AI enhancement if enabled
      if (useAi) {
        try {
          if (aiProvider === 'gapgpt') {
            const gapRes = await rewriteScriptWithGapGpt({
              segments: plan.segments.map((s) => ({ id: s.id, text: s.text })),
              model: gapgptModel,
              styleMode: 'viral-reels',
              apiKey: gapgptApiKey,
            });

            plan.segments = plan.segments.map((seg) => {
              const rw = gapRes.items.find((i) => i.segmentId === seg.id);
              if (!rw) return seg;
              return {
                ...seg,
                text: rw.rewrittenText,
                kind: rw.segmentKind || seg.kind,
                em: rw.emphasisWords && rw.emphasisWords.length > 0 ? rw.emphasisWords : seg.em,
              };
            });
            setSuccessNote(`موشن با مدل ${gapgptModel} از طریق GapGPT هوشمند و ویروسی شد`);
          } else {
            const aiRes = await enhancePlanWithAi(plan, {
              provider: aiProvider,
              apiKey: deepseekApiKey,
            });
            plan = aiRes.plan;
            setSuccessNote(`موشن با هوش مصنوعی پالایش شد (مصرف تقریبی: ${aiRes.estimatedTokens} توکن)`);
          }
        } catch (aiErr: any) {
          console.warn('AI enhance skipped:', aiErr);
          // Fallback to base plan without crashing
        }
      } else {
        setSuccessNote(`موشن با موفقیت ساخته شد (موتور قاعده‌محور، ۰ توکن مصرفی)`);
      }

      // Step 3: Optional automatic stock image matching (Unsplash)
      if (autoMatchStock && plan.segments.length > 0) {
        try {
          const orientation = aspectRatio === '9:16' ? 'portrait' : aspectRatio === '1:1' ? 'squarish' : 'landscape';
          const stockResp = await autoMatchSlideImages(plan.segments, orientation);
          if (stockResp && stockResp.matches && stockResp.matches.length > 0) {
            const matchMap = new Map();
            stockResp.matches.forEach((m) => matchMap.set(m.segmentId, m));
            plan.segments = plan.segments.map((s) => {
              const matched = matchMap.get(s.id);
              if (matched && matched.image) {
                return {
                  ...s,
                  backgroundImage: matched.image.fullUrl,
                  backgroundDim: 0.62,
                  kenBurns: true,
                  imageKeywords: matched.query,
                  imageCredit: {
                    author: matched.image.author.name,
                    authorUrl: matched.image.author.portfolioUrl,
                    source: matched.image.source,
                    photoUrl: matched.image.fullUrl,
                  },
                };
              }
              return s;
            });
          }
        } catch (stockErr) {
          console.warn('Auto stock images match error:', stockErr);
        }
      }

      // Step 4: Content Analysis & Auto-Theme Adaptation (technology, news, romantic, etc.)
      if (autoAdaptTheme && plan.segments.length > 0) {
        try {
          const analysisResult = analyzeSrtLocally(plan.segments);
          plan = applyArchetypeToPlan(plan, analysisResult.dominantTheme, {
            applyToGsapLayers: true,
            syncSpeedMultiplier: true,
          });
          plan.contentAnalysis = analysisResult;
          setSuccessNote(
            `تم پروژه بر اساس تحلیل متن به صورت خودکار روی «${analysisResult.recommendedPalette.nameFa}» تنظیم شد.`
          );
        } catch (themeErr) {
          console.warn('Auto theme adaptation error:', themeErr);
        }
      }

      onPlanGenerated(plan);
      setTimeout(() => setSuccessNote(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در پردازش اطلاعات ورودی');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-neutral-900/60 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur-md">
      {/* Notifications */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successNote && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNote}</span>
        </div>
      )}

      {/* Input Mode Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-black/40 border border-white/5 rounded-xl">
        <button
          onClick={() => setMode('srt')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'srt' ? 'bg-orange-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
          }`}
        >
          <Subtitles className="w-4 h-4" />
          <span>زیرنویس SRT</span>
        </button>

        <button
          onClick={() => setMode('text')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'text' ? 'bg-orange-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>متن خام فارسی</span>
        </button>

        <button
          onClick={() => setMode('audio')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'audio' ? 'bg-orange-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>صوت / ضبط صدا</span>
        </button>

        <button
          onClick={() => setMode('link')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            mode === 'link' ? 'bg-orange-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>لینک وب</span>
        </button>
      </div>

      {/* Mode Specific Inputs */}
      {mode === 'srt' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">متن زیرنویس SRT (زمان‌ها برای سینک نریشن حفظ می‌شوند)</span>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>آپلود فایل .srt</span>
                <input type="file" accept=".srt,.txt,.vtt" onChange={handleSrtFileUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={handleLoadSampleSrt}
                className="text-xs text-white/50 hover:text-white underline decoration-dotted"
              >
                بارگذاری نمونه
              </button>
            </div>
          </div>
          <textarea
            value={srtText}
            onChange={(e) => setSrtText(e.target.value)}
            rows={6}
            dir="auto"
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-white/90 focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="محتوای SRT را اینجا بچسبانید..."
          />
        </div>
      )}

      {mode === 'text' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/70">متن فارسی (جمله‌بندی و زمان‌بندی خودکار بر اساس سرعت خواندن)</span>
            <button
              type="button"
              onClick={() => setRawText(SAMPLE_TEXT)}
              className="text-xs text-white/50 hover:text-white underline decoration-dotted"
            >
              نمونه متن
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={5}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/90 leading-relaxed focus:border-orange-500 focus:outline-none transition-colors"
            placeholder="متن خود را اینجا وارد کنید..."
          />
        </div>
      )}

      {mode === 'audio' && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center p-4 border border-dashed border-white/20 rounded-xl bg-black/20 hover:bg-black/30 cursor-pointer transition-all">
              <Upload className="w-6 h-6 text-orange-400 mb-1" />
              <span className="text-xs font-semibold text-white">انتخاب فایل صوتی</span>
              <span className="text-[11px] text-white/40">MP3, WAV, M4A, OGG</span>
              <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={toggleMicRecording}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                isRecordingMic
                  ? 'border-red-500 bg-red-950/30 text-red-200 animate-pulse'
                  : 'border-white/20 bg-black/20 hover:bg-black/30 text-white'
              }`}
            >
              <Mic className={`w-6 h-6 mb-1 ${isRecordingMic ? 'text-red-400' : 'text-emerald-400'}`} />
              <span className="text-xs font-semibold">{isRecordingMic ? 'در حال ضبط... (کلیک برای اتمام)' : 'ضبط زنده صدا با میکروفون'}</span>
              <span className="text-[11px] text-white/40">بدون نیاز به نصب نرم‌افزار</span>
            </button>
          </div>

          {audioFile && (
            <div className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-orange-400" />
                <span>{audioFile.name}</span>
              </div>
              <span className="font-mono text-white/50">{Math.round(audioFile.duration)} ثانیه</span>
            </div>
          )}

          <div>
            <label className="text-xs text-white/70 block mb-1">
              متن گویندگی همراه (اختیاری — سگمنت‌ها دقیقاً با طول صوت هماهنگ می‌شوند):
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/90 focus:border-orange-500 focus:outline-none"
              placeholder="متن را وارد کنید تا کلمات روی صوت زمان‌بندی شوند..."
            />
          </div>
        </div>
      )}

      {mode === 'link' && (
        <div className="flex flex-col gap-3">
          <label className="text-xs text-white/70 block">آدرس وب‌سایت یا لینک مقاله:</label>
          <div className="flex gap-2">
            <input
              type="url"
              dir="ltr"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/article"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-orange-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleExtractFromUrl}
              disabled={isGenerating}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
            >
              استخراج محتوا
            </button>
          </div>
        </div>
      )}

      {/* Common Setup Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
        {/* Title */}
        <div>
          <label className="text-xs text-white/70 block mb-1">عنوان موشن (کارت تیتر):</label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
            placeholder="عنوان ویدیو..."
          />
        </div>

        {/* Skill Selector */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-white/70">اسکیل موشن (طراحی، نمودار و انیمیشن):</label>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="flex items-center gap-1 text-[11px] text-orange-400 hover:text-orange-300 font-semibold transition-colors"
              title="پیش‌نمایش زنده انیمیشن و نمودارهای این اسکیل"
            >
              <Eye className="w-3 h-3" />
              <span>پیش‌نمایش زنده</span>
            </button>
          </div>
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none cursor-pointer"
          >
            {skills.map((s) => (
              <option key={s.id} value={s.id} className="bg-neutral-900 text-white">
                {s.title}
              </option>
            ))}
          </select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-xs text-white/70 block mb-1">نسبت کادر (Aspect Ratio):</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as any)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none cursor-pointer"
          >
            <option value="16:9" className="bg-neutral-900">افقی ۱۶:۹ (۱۹۲۰×۱۰۸۰ - یوتوب/وب)</option>
            <option value="9:16" className="bg-neutral-900">عمودی ۹:۱۶ (۱۰۸۰×۱۹۲۰ - ریلز/استوری)</option>
            <option value="1:1" className="bg-neutral-900">مربعی ۱:۱ (۱۰۸۰×۱۰۸۰ - پست اینستاگرام)</option>
          </select>
        </div>
      </div>

      {/* AI Low-Token Section Toggle */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-xs font-semibold text-white/90">
              پالایش هوشمند معنایی (کم‌توکن اختیاری)
            </span>
          </label>
          <span className="text-[11px] text-white/50 font-mono">
            {useAi ? '~100 توکن' : '۰ توکن (کاملاً قطعی و آفلاین)'}
          </span>
        </div>

        {useAi && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
            <div>
              <label className="text-[11px] text-white/60 block mb-1">سرویس هوش مصنوعی:</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as any)}
                className="w-full bg-neutral-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
              >
                <option value="gapgpt">پلتفرم GapGPT (مدل‌های GPT-4o, Claude 3.5, Flux)</option>
                <option value="gemini">جمینای فلش سریع (Gemini 2.5 Flash)</option>
                <option value="deepseek">دیپ‌سیک اقتصادی (DeepSeek API)</option>
              </select>
            </div>

            {aiProvider === 'gapgpt' && (
              <div>
                <label className="text-[11px] text-white/60 block mb-1">مدل GapGPT:</label>
                <select
                  value={gapgptModel}
                  onChange={(e) => setGapgptModel(e.target.value as GapGptTextModel)}
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                >
                  <option value="gpt-4o">OpenAI GPT-4o (ویروسی و هوشمندترین)</option>
                  <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (شاعرانه و خلاق)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (سریع و اقتصادی)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="deepseek-chat">DeepSeek Chat V3</option>
                </select>
              </div>
            )}

            {aiProvider === 'deepseek' && (
              <div>
                <label className="text-[11px] text-white/60 block mb-1">کلید DeepSeek API:</label>
                <input
                  type="password"
                  dir="ltr"
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-neutral-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stock Image Auto-Match Toggle */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoMatchStock}
            onChange={(e) => setAutoMatchStock(e.target.checked)}
            className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-xs font-semibold text-white/90">
            اتصال خودکار به تصاویر مرتبط Unsplash در پس‌زمینه
          </span>
        </label>
        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
          استوک رایگان
        </span>
      </div>

      {/* Content Theme Auto-Adaptation Toggle */}
      <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoAdaptTheme}
            onChange={(e) => setAutoAdaptTheme(e.target.checked)}
            className="accent-orange-500 w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-xs font-semibold text-white/90">
            تطبیق خودکار پالت رنگی و موشن با موضوع متن (تکنولوژی، خبری، عاشقانه...)
          </span>
        </label>
        <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
          تحلیل معنایی
        </span>
      </div>

      {/* Master Generation Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-3 bg-orange-600 hover:bg-orange-500 active:scale-98 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-950/40"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isGenerating ? 'در حال پردازش موشن...' : 'تولید موشن‌گرافیک'}</span>
      </button>

      {/* Quick Skill Preview Modal */}
      {showPreviewModal && (
        <SkillPreviewModal
          skill={resolveSkill(selectedSkillId)}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onApplySkill={(s) => {
            setSelectedSkillId(s.id);
            setShowPreviewModal(false);
          }}
        />
      )}
    </div>
  );
};
