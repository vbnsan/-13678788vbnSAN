import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BarChart3,
  PieChart,
  Type,
  Hash,
  Quote,
  Check,
  Columns,
  Cpu,
  Tv,
} from 'lucide-react';
import { MotionSegment, MotionSkill, SegmentKind } from '../types/motion';
import {
  drawBackgroundAndEffects,
  drawMotionSegment,
} from '../engine/canvasMotionDraw';

interface Props {
  skill: MotionSkill;
  isOpen: boolean;
  onClose: () => void;
  onApplySkill: (skill: MotionSkill) => void;
}

type TestMode = 'caption' | 'chart' | 'gauge' | 'stat' | 'comparison' | 'math' | 'lower-third' | 'quote';

export const SkillPreviewModal: React.FC<Props> = ({
  skill,
  isOpen,
  onClose,
  onApplySkill,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [testMode, setTestMode] = useState<TestMode>('caption');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [isPlaying, setIsPlaying] = useState(true);
  const [customText, setCustomText] = useState(
    skill.sampleTexts?.caption || 'هوش مصنوعی و یادگیری سریع در استودیو موشن'
  );
  const [applied, setApplied] = useState(false);

  const currentTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Update text when switching modes
  const handleModeChange = (mode: TestMode) => {
    setTestMode(mode);
    currentTimeRef.current = 0;
    if (mode === 'chart') {
      setCustomText(skill.sampleTexts?.chart || 'مقایسه شاخص‌های رشد تولید و توزیع');
    } else if (mode === 'gauge') {
      setCustomText('نرخ پیشرفت کل اهداف سالانه');
    } else if (mode === 'stat') {
      setCustomText(skill.sampleTexts?.stat || '۸۸٪ رشد رضایت مخاطبان در سال جاری');
    } else if (mode === 'comparison') {
      setCustomText('مقایسه راهکار دستی سنتی با استودیو موشن خودکار');
    } else if (mode === 'math') {
      setCustomText('معادله همگرایی برازش غیرخطی الگوریتم');
    } else if (mode === 'lower-third') {
      setCustomText('دکتر پارسا رادمنش · مدیر ارشد فناوری هوش مصنوعی');
    } else if (mode === 'quote') {
      setCustomText(skill.sampleTexts?.quote || '«روایتگری، هنر لمس ناخودآگاه مخاطب است»');
    } else {
      setCustomText(skill.sampleTexts?.caption || 'هوش مصنوعی و یادگیری سریع در استودیو موشن');
    }
  };

  // Dimensions
  const getDims = useCallback(() => {
    if (aspectRatio === '9:16') return { w: 1080, h: 1920 };
    if (aspectRatio === '1:1') return { w: 1080, h: 1080 };
    return { w: 1920, h: 1080 };
  }, [aspectRatio]);

  // Construct test segment based on mode
  const getTestSegment = useCallback((): MotionSegment => {
    const kind: SegmentKind = testMode;
    const words = customText.trim().split(/\s+/);
    const emIndices = words
      .map((w, idx) => (/[0-9۰-۹%٪]/.test(w) || idx === 1 ? idx : -1))
      .filter(i => i >= 0);

    return {
      id: 'test-seg',
      from: 0,
      to: 4.5,
      text: customText,
      kind,
      em: emIndices,
      visualData: {
        chartType: testMode === 'gauge' ? 'radial' : testMode === 'math' ? 'formula' : 'bar',
        value: 88,
        badge: testMode === 'stat' ? '▲ +۱۴۲٪ رشد رکورد' : undefined,
        formula: 'f(t) = \\sum_{n=1}^{\\infty} \\frac{1}{n} \\sin(n\\omega t) + \\mathcal{H}(t)',
        label: 'استودیو خبری بین‌المللی',
        comparison: {
          itemA: { label: 'روش سنتی و افترافکت دستی', value: '۱۴ ساعت تدوین' },
          itemB: { label: 'استودیو موشن کدمحور', value: '۲ دقیقه خودکار' },
        },
        items: [
          { label: 'شاخص عملکرد جاری (Q3)', value: 88, color: skill.theme.accent, sublabel: 'عملکرد شاخص' },
          { label: 'هدف تعیین‌شده سالانه', value: 65, color: skill.theme.secondary || '#38bdf8', sublabel: 'تارگت' },
          { label: 'دوره پایه قبلی', value: 35, color: 'rgba(255,255,255,0.4)', sublabel: 'سطح آغازین' },
        ],
      },
    };
  }, [customText, skill.theme.accent, skill.theme.secondary, testMode]);

  // Render loop
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const { w, h } = getDims();

    const loop = (timestamp: number) => {
      if (!mounted) return;
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        currentTimeRef.current += delta;
        if (currentTimeRef.current >= 4.5) {
          currentTimeRef.current = 0; // loop
        }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawBackgroundAndEffects(ctx, w, h, currentTimeRef.current, skill.theme, skill.style);
          drawMotionSegment(
            ctx,
            getTestSegment(),
            currentTimeRef.current,
            w,
            h,
            skill.theme,
            skill.style
          );
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isOpen, isPlaying, getDims, skill, getTestSegment]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplySkill(skill);
    setApplied(true);
    setTimeout(() => {
      setApplied(false);
      onClose();
    }, 1200);
  };

  const aspectClass =
    aspectRatio === '9:16'
      ? 'aspect-[9/16] max-h-[360px]'
      : aspectRatio === '1:1'
      ? 'aspect-square max-h-[360px]'
      : 'aspect-video max-h-[360px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div
              className="w-4 h-4 rounded-full border border-white/20"
              style={{ backgroundColor: skill.theme.accent }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">پیش‌نمایش زنده افترافکت: {skill.title}</h2>
                <span className="text-[10px] bg-white/10 text-white/80 px-1.5 py-0.5 rounded font-mono">
                  {skill.style.captionMode}
                </span>
              </div>
              <span className="text-[11px] text-white/50">
                افکت پس‌زمینه: {skill.theme.effect || 'استاندارد'} · سرعت: {skill.rules.wpm} WPM · فنر: {skill.style.spring.damping}/{skill.style.spring.stiffness}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-5 flex-1 overflow-y-auto flex flex-col gap-3.5 text-xs">
          {/* Visual Element Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/5 rounded-xl overflow-x-auto">
            <button
              onClick={() => handleModeChange('caption')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'caption'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>کپشن فنری</span>
            </button>

            <button
              onClick={() => handleModeChange('chart')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'chart'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>نمودار میله‌ای متحرک</span>
            </button>

            <button
              onClick={() => handleModeChange('gauge')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'gauge'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>گیج درصد پیشرفت</span>
            </button>

            <button
              onClick={() => handleModeChange('stat')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'stat'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>شاخص KPI و دلتا</span>
            </button>

            <button
              onClick={() => handleModeChange('comparison')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'comparison'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>مقایسه دوگانه قبل/بعد</span>
            </button>

            <button
              onClick={() => handleModeChange('math')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'math'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>فرمول Manim و موج</span>
            </button>

            <button
              onClick={() => handleModeChange('lower-third')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'lower-third'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>لورثرد برودکست</span>
            </button>

            <button
              onClick={() => handleModeChange('quote')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                testMode === 'quote'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              <span>نقل قول</span>
            </button>
          </div>

          {/* Interactive Live Canvas Viewport */}
          <div className="relative w-full flex flex-col items-center justify-center bg-black/60 rounded-xl p-2 border border-white/10 overflow-hidden shadow-inner">
            <div className={`relative w-full ${aspectClass} rounded-lg overflow-hidden flex items-center justify-center border border-white/5`}>
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
              {skill.theme.grain && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.05]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>")`,
                  }}
                />
              )}
            </div>

            {/* Quick Controls below canvas */}
            <div className="flex items-center justify-between w-full pt-2 px-1 text-white/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => (currentTimeRef.current = 0)}
                  className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
                  title="شروع مجدد"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-white/40 font-mono">
                  زمان رندر: {currentTimeRef.current.toFixed(1)} ثانیه
                </span>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    aspectRatio === '16:9' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  ۱۶:۹
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    aspectRatio === '9:16' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  ۹:۱۶ (تیک‌تاک/ریلز)
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    aspectRatio === '1:1' ? 'bg-orange-600 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  ۱:۱
                </button>
              </div>
            </div>
          </div>

          {/* Test Sentence Input */}
          <div>
            <label className="text-[11px] text-white/70 block mb-1">
              تست بلادرنگ با متن دلخواه شما:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  currentTimeRef.current = 0;
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                placeholder="متن تست دلخواه خود را تایپ کنید..."
              />
              <button
                type="button"
                onClick={() => (currentTimeRef.current = 0)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs whitespace-nowrap transition-all"
              >
                اجرای مجدد
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl text-xs transition-all"
          >
            بستن
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={applied}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-98"
          >
            {applied ? <Check className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4" />}
            <span>{applied ? 'روی پروژه اعمال شد!' : 'اعمال این اسکیل روی کل پروژه جاری'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
