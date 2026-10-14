import { MotionPlan, MotionSegment, MotionSkill, SegmentKind } from '../types/motion';
import { RawSegment } from './ingest';

export interface PlannerOptions {
  title?: string;
  w: number;
  h: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  allowIntro?: boolean;
  audio?: {
    src: string;
    name?: string;
    duration?: number;
    isDataUrl?: boolean;
  } | null;
}

export function buildMotionPlan(
  rawSegments: RawSegment[],
  skill: MotionSkill,
  options: PlannerOptions
): MotionPlan {
  const { rules } = skill;
  let maxChars = rules.maxCharsPerLine || 30;

  // If vertical format (9:16), shorten line lengths for readability
  if (options.aspectRatio === '9:16') {
    maxChars = Math.max(16, Math.round(maxChars * 0.72));
  } else if (options.aspectRatio === '1:1') {
    maxChars = Math.max(20, Math.round(maxChars * 0.85));
  }

  // 1. Wrap and slice overly long raw segments
  const splitSegments: RawSegment[] = [];
  for (const seg of rawSegments) {
    const lines = wrapText(seg.text, maxChars);
    const n = Math.max(1, lines.length);
    const sliceDuration = (seg.to - seg.from) / n;

    lines.forEach((lineText, idx) => {
      splitSegments.push({
        from: seg.from + idx * sliceDuration,
        to: seg.from + (idx + 1) * sliceDuration,
        text: lineText,
      });
    });
  }

  // 2. Merge tiny micro-segments (< minSeg) into previous
  const minSeg = rules.minSeg || 1.0;
  const merged: RawSegment[] = [];

  for (const s of splitSegments) {
    const last = merged[merged.length - 1];
    if (last && (s.to - s.from) < minSeg) {
      last.text = `${last.text} ${s.text}`.trim();
      last.to = s.to;
    } else {
      merged.push({ ...s });
    }
  }

  // 3. Classify kind and find emphasized keywords (rule-based deterministic!)
  const segments: MotionSegment[] = merged.map((s, idx) => {
    const { kind, visualData } = classifyKindAndVisualData(s.text, skill);
    const em = findEmphasisIndices(s.text, skill.rules.keywords || []);
    return {
      id: `seg-${idx + 1}`,
      from: Math.round(s.from * 100) / 100,
      to: Math.round(s.to * 100) / 100,
      text: s.text,
      kind,
      em,
      visualData,
    };
  });

  // 4. Intro Title Card (if allowed and requested)
  if (options.allowIntro && skill.titleCard.enabled && options.title) {
    const titleDur = skill.titleCard.duration || 2.2;
    segments.forEach(s => {
      s.from = Math.round((s.from + titleDur) * 100) / 100;
      s.to = Math.round((s.to + titleDur) * 100) / 100;
    });

    segments.unshift({
      id: 'seg-title',
      from: 0,
      to: titleDur,
      text: options.title,
      kind: 'title',
      em: [],
    });
  }

  // 5. Outro Card (if enabled and text provided)
  const lastSeg = segments[segments.length - 1];
  let totalEnd = lastSeg ? lastSeg.to : 5;

  if (skill.outroCard.enabled && (skill.outroCard.text || options.title)) {
    const outroText = skill.outroCard.text || options.title || 'MOTION STUDIO';
    const outroDur = skill.outroCard.duration || 2.4;
    const outroStart = totalEnd + 0.3;
    const outroEnd = outroStart + outroDur;

    segments.push({
      id: 'seg-outro',
      from: Math.round(outroStart * 100) / 100,
      to: Math.round(outroEnd * 100) / 100,
      text: outroText,
      kind: 'outro',
      em: [],
    });

    totalEnd = outroEnd;
  }

  const duration = Math.max(totalEnd + 0.5, 3.0);

  return {
    meta: {
      title: options.title || 'موشن استودیو',
      lang: 'fa',
      w: options.w,
      h: options.h,
      duration: Math.round(duration * 100) / 100,
      skillId: skill.id,
      skillTitle: skill.title,
      generatedAt: new Date().toISOString(),
      aspectRatio: options.aspectRatio,
    },
    theme: { ...skill.theme },
    style: { ...skill.style },
    segments,
    audio: options.audio || null,
  };
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/);
  const result: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      result.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) result.push(current);
  return result.length > 0 ? result : [text];
}

function classifyKindAndVisualData(
  text: string,
  skill: MotionSkill
): { kind: SegmentKind; visualData?: any } {
  const trimmed = text.trim();

  // 1. Quote detection
  if (
    (trimmed.startsWith('«') && trimmed.endsWith('»')) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('“') && trimmed.endsWith('”'))
  ) {
    return { kind: 'quote' };
  }

  // 2. Comparison detection: A vs B or Before vs After
  if (
    /(قبل\s*(و|یا|\/)\s*بعد|سنتی\s*در\s*برابر|مقایسه\s*دو|روش\s*قدیم|در\s*مقایسه\s*با)/u.test(trimmed)
  ) {
    return {
      kind: 'comparison',
      visualData: {
        comparison: {
          itemA: { label: 'روش سنتی و دستی', value: '۱۴ ساعت زمان', isWinner: false },
          itemB: { label: 'استودیو موشن خودکار', value: '۲ دقیقه زمان', isWinner: true },
        },
      },
    };
  }

  // 3. Manim Math / Technical Formula detection
  if (
    /(فرمول|معادله|تابع|مشتق|انتگرال|ریاضی|همگرایی|تانسور)/u.test(trimmed)
  ) {
    return {
      kind: 'math',
      visualData: {
        formula: 'f(t) = \\sum_{n=1}^\\infty \\frac{1}{n} \\sin(n\\omega t) + \\mathcal{H}(t)',
      },
    };
  }

  // 4. Broadcast Lower-Third detection
  if (
    /(دکتر|مهندس|مدیر\s*عامل|کارشناس|گزارشگر|خبرنگار|تحلیل‌گر)/u.test(trimmed) &&
    trimmed.length < 65
  ) {
    return {
      kind: 'lower-third',
      visualData: {
        label: 'استودیو خبری بین‌المللی',
      },
    };
  }

  // 5. Bar Chart Detection: mentions comparison, indicators, shares, or multiple figures
  if (
    /نمودار|مقایسه|شاخص|سهم بازار|توزیع|روند|تطبیقی/u.test(trimmed) &&
    (/[0-9۰-۹]/u.test(trimmed) || /درصد|٪|%/u.test(trimmed))
  ) {
    const numbers = extractNumbers(trimmed);
    const mainVal = numbers[0] || 75;
    const secondVal = numbers[1] || Math.max(25, Math.round(mainVal * 0.65));

    return {
      kind: 'chart',
      visualData: {
        chartType: 'bar',
        value: mainVal,
        items: [
          { label: 'شاخص رشد جاری (Q3)', value: mainVal, color: skill.theme.accent, sublabel: 'عملکرد شاخص' },
          { label: 'میانگین دوره قبل', value: secondVal, color: skill.theme.secondary || '#38bdf8', sublabel: 'دوره پیشین' },
          { label: 'دوره پایه هدف', value: Math.max(15, Math.round(secondVal * 0.6)), color: 'rgba(255,255,255,0.4)', sublabel: 'سطح آغازین' },
        ],
      },
    };
  }

  // 6. Radial Donut Gauge: mentions target, progress rate, or single strong percentage
  if (
    /(پیشرفت|تارگت|رضایت|نرخ رشد|تحقق|دقت)/u.test(trimmed) &&
    /(\d+|[۰-۹]+)\s*(درصد|٪|%)/u.test(trimmed)
  ) {
    const numbers = extractNumbers(trimmed);
    const val = numbers[0] || 85;
    return {
      kind: 'gauge',
      visualData: {
        chartType: 'radial',
        value: val,
      },
    };
  }

  // 7. Large Statistic / Metric Delta
  if (
    /^[0-9۰-۹]/u.test(trimmed) ||
    /(\d+|[۰-۹]+)\s*(درصد|٪|%|میلیون|میلیارد|برابر|هزار)/u.test(trimmed)
  ) {
    return {
      kind: 'stat',
      visualData: {
        badge: /کاهش|افت|نزول/u.test(trimmed) ? '▼ روند نزولی' : '▲ شاخص صعودی رکورد',
      },
    };
  }

  return { kind: 'caption' };
}

function extractNumbers(str: string): number[] {
  const faToEn: Record<string, string> = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  const normalized = str.replace(/[۰-۹]/g, d => faToEn[d] || d);
  const matches = normalized.match(/\d+(\.\d+)?/g);
  return matches ? matches.map(n => Math.min(100, Math.max(1, parseFloat(n)))) : [];
}

function findEmphasisIndices(text: string, customKeywords: string[]): number[] {
  const words = text.trim().split(/\s+/);
  const indices: number[] = [];

  const defaultKeywords = new Set([
    'مهم', 'کلیدی', 'رشد', 'تحول', 'آینده', 'خطر', 'انقلاب', 'هدف', 'اصول',
    'موفقیت', 'راز', 'فوری', 'عجیب', 'بهترین', 'نکته',
    ...customKeywords,
  ]);

  words.forEach((word, index) => {
    const cleanWord = word.replace(/[.,!؟:؛«»"()]/g, '');

    // 1. Numerals or percentages (0-9 or ۰-۹ or % or ٪)
    if (/[0-9۰-۹%٪]/.test(cleanWord)) {
      indices.push(index);
      return;
    }

    // 2. High-value keyword matches
    if (defaultKeywords.has(cleanWord)) {
      indices.push(index);
      return;
    }

    // 3. Exclamation marks or question punchlines
    if (word.includes('!') || word.includes('؟')) {
      indices.push(index);
    }
  });

  return indices;
}
