import {
  ContentAnalysisResult,
  ContentArchetype,
  GsapAccentEffect,
  GsapEasingType,
  GsapTransitionType,
  MotionPlan,
  MotionSegment,
  MotionSkill,
  MotionStyle,
  MotionTheme,
  SegmentKind,
  ThemeArchetypePreset,
} from '../types/motion';

// Presets for the 7 core project archetypes
export const THEME_ARCHETYPES: Record<ContentArchetype, ThemeArchetypePreset> = {
  technology: {
    id: 'technology',
    nameFa: 'تکنولوژی و هوش مصنوعی',
    nameEn: 'Cyber Tech & AI',
    icon: 'Cpu',
    description: 'تم سایبری نئونی مدرن با خطوط شبکه، ورود گلیچ و سرعت پردازشی بالا',
    keywords: [
      'هوش مصنوعی', 'فناوری', 'تکنولوژی', 'کامپیوتر', 'الگوریتم', 'دیجیتال', 'کد',
      'برنامه', 'داده', 'سیستم', 'شبکه', 'سرور', 'ربات', 'مدل', 'پرامپت', 'نرم‌افزار',
      'سایبر', 'چیپ', 'پردازش', 'مدرن', 'آینده', 'اینترنت', 'ای پی آی', 'ai', 'tech',
      'cyber', 'code', 'data', 'cloud', 'robot', 'digital', 'neural', 'software',
    ],
    theme: {
      bg: '#040d1a',
      fg: '#e0f2fe',
      accent: '#00f0ff',
      secondary: '#38bdf8',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: true,
      boxStyle: 'cyber',
      effect: 'grid',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'word-spring',
      stagger: 0.024,
      spring: { damping: 13, stiffness: 270 },
      captionSize: 82,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0.85,
    },
    recommendedEntrance: 'glitch-rgb-flicker',
    recommendedEasing: 'expo.out',
    recommendedAccent: 'scanline-sweep',
    speedMultiplier: 1.18,
  },

  news: {
    id: 'news',
    nameFa: 'خبری و گزارش تحلیلی',
    nameEn: 'Breaking News & Journalism',
    icon: 'Newspaper',
    description: 'کنتراست بالای سرخ خبری و سرمه‌ای عمیق، فونت قاطع و تایپوگرافی رسمی',
    keywords: [
      'فوری', 'خبر', 'گزارش', 'اعلام', 'بیانیه', 'رسمی', 'سخنگو', 'وزارت', 'دولت',
      'جلسه', 'رویداد', 'امروز', 'بر اساس', 'اطلاعیه', 'سیاست', 'جهان', 'دادگاه',
      'حادثه', 'پلیس', 'تحولات', 'کشور', 'واکنش', 'توافق', 'نشست', 'news', 'breaking',
      'report', 'official', 'statement', 'press', 'urgent', 'media',
    ],
    theme: {
      bg: '#08101e',
      fg: '#ffffff',
      accent: '#ef4444',
      secondary: '#38bdf8',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: false,
      boxStyle: 'frame',
      effect: 'vignette',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'swipe-highlight',
      stagger: 0.034,
      spring: { damping: 18, stiffness: 210 },
      captionSize: 76,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0.45,
    },
    recommendedEntrance: 'split-stagger-slide',
    recommendedEasing: 'power4.out',
    recommendedAccent: 'burst-particles',
    speedMultiplier: 1.05,
  },

  romantic: {
    id: 'romantic',
    nameFa: 'عاشقانه و احساسی',
    nameEn: 'Romantic & Emotional Poetry',
    icon: 'Heart',
    description: 'پالت مخملی گرم و زرگلد، بوکه نوری رمانتیک، حرکات ملایم و محوشونده',
    keywords: [
      'عشق', 'دوستت', 'قلب', 'دل', 'عاشقانه', 'احساس', 'جانم', 'نگاه', 'چشم',
      'مهربان', 'باران', 'خاطره', 'بوسه', 'آغوش', 'دلتنگی', 'تنهایی', 'نفس', 'یاد',
      'لبخند', 'مهربانی', 'زیبا', 'شیرین', 'آرامش', 'غمگین', 'سکوت', 'love', 'heart',
      'feel', 'soul', 'emotion', 'memory', 'romantic', 'passion', 'tender',
    ],
    theme: {
      bg: '#14060e',
      fg: '#fff1f2',
      accent: '#f43f5e',
      secondary: '#fda4af',
      displayFont: 'Vazirmatn',
      bodyFont: 'Vazirmatn',
      grain: true,
      boxStyle: 'rounded',
      effect: 'bokeh',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'line-fade',
      stagger: 0.052,
      spring: { damping: 22, stiffness: 125 },
      captionSize: 72,
      progressBar: true,
      audioBars: false,
      visualWidgets: false,
      glowIntensity: 0.65,
    },
    recommendedEntrance: 'cinematic-flare-push',
    recommendedEasing: 'circ.inOut',
    recommendedAccent: 'optical-flare',
    speedMultiplier: 0.88,
  },

  cinematic: {
    id: 'cinematic',
    nameFa: 'سینمایی و حماسی',
    nameEn: 'Cinematic & Epic Grandeur',
    icon: 'Film',
    description: 'ابسیدین تیره، طلای پرشکوه، هاله نور اپتیکال و ترنزیشن‌های عریض هالیوودی',
    keywords: [
      'تاریخ', 'حماسه', 'قدرت', 'ارتش', 'پادشاه', 'تمدن', 'ابدی', 'افسانه', 'نبرد',
      'جهان', 'سرنوشت', 'قهرمان', 'سینما', 'تاریکی', 'روشنایی', 'نجات', 'شکوه', 'مرگ',
      'زندگی', 'امپراتوری', 'نبرد', 'فتح', 'راز', 'epic', 'cinema', 'legend', 'hero',
      'empire', 'destiny', 'glory', 'battle', 'cinematic',
    ],
    theme: {
      bg: '#09090b',
      fg: '#fef3c7',
      accent: '#f59e0b',
      secondary: '#eab308',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: true,
      boxStyle: 'film',
      effect: 'vignette',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'kinetic-slide',
      stagger: 0.044,
      spring: { damping: 20, stiffness: 155 },
      captionSize: 80,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0.72,
    },
    recommendedEntrance: 'cinematic-flare-push',
    recommendedEasing: 'power4.out',
    recommendedAccent: 'optical-flare',
    speedMultiplier: 0.94,
  },

  business: {
    id: 'business',
    nameFa: 'اقتصادی، بیزنس و آموزشی',
    nameEn: 'Business, Finance & Growth',
    icon: 'TrendingUp',
    description: 'سبز زمردی رشد سرمایه و آبی مینیمال، تمرکز بر اعداد، نمودار و آمار',
    keywords: [
      'سود', 'درآمد', 'سرمایه', 'بورس', 'سهام', 'دلار', 'طلا', 'فروش', 'بازار',
      'رشد', 'استارتاپ', 'شرکت', 'بیزنس', 'موفقیت', 'مشتری', 'بازاریابی', 'مالی',
      'اقتصادی', 'ارزش', 'هدف', 'درصد', 'تورم', 'سرمایه‌گذاری', 'افزایش', 'کاهش',
      'business', 'finance', 'money', 'stock', 'profit', 'growth', 'market', 'crypto',
    ],
    theme: {
      bg: '#041014',
      fg: '#ecfdf5',
      accent: '#10b981',
      secondary: '#06b6d4',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: false,
      boxStyle: 'minimal',
      effect: 'grid',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'swipe-highlight',
      stagger: 0.032,
      spring: { damping: 16, stiffness: 200 },
      captionSize: 74,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0.5,
    },
    recommendedEntrance: 'split-stagger-slide',
    recommendedEasing: 'power4.out',
    recommendedAccent: 'burst-particles',
    speedMultiplier: 1.1,
  },

  sports: {
    id: 'sports',
    nameFa: 'ورزشی، پرانرژی و وایرال',
    nameEn: 'Sports & High-Energy Hooks',
    icon: 'Flame',
    description: 'زرد نئونی فسفری روی بنفش تیره، پرش‌های فنری الاستیک و ضرباهنگ فوق پرشتاب',
    keywords: [
      'ورزش', 'تمرین', 'گل', 'مسابقه', 'قهرمانی', 'فیتنس', 'رکورد', 'بدنسازی',
      'سرعت', 'پیروزی', 'برنده', 'رقابت', 'چالش', 'انرژی', 'انگیزه', 'فوتبال',
      'باشگاه', 'هیجان', 'سریع', 'تلاش', 'قدرت', 'شکست', 'قهرمان', 'sports', 'fitness',
      'gym', 'energy', 'win', 'challenge', 'workout', 'speed', 'run',
    ],
    theme: {
      bg: '#0d0417',
      fg: '#ffffff',
      accent: '#facc15',
      secondary: '#ec4899',
      displayFont: 'Lalezar',
      bodyFont: 'Vazirmatn',
      grain: false,
      boxStyle: 'rounded',
      effect: 'particles',
      ambientAnimation: true,
    },
    style: {
      captionMode: 'word-spring',
      stagger: 0.02,
      spring: { damping: 10, stiffness: 320 },
      captionSize: 88,
      progressBar: true,
      audioBars: true,
      visualWidgets: true,
      glowIntensity: 0.9,
    },
    recommendedEntrance: 'elastic-pop',
    recommendedEasing: 'elastic.out(1, 0.4)',
    recommendedAccent: 'burst-particles',
    speedMultiplier: 1.25,
  },

  luxury: {
    id: 'luxury',
    nameFa: 'مینیمال و لوکس',
    nameEn: 'Minimalist & Quiet Luxury',
    icon: 'Sparkles',
    description: 'طلای متالیک مات روی مشکی مطلق، تایپوگرافی باوقار و حرکات نرم بدون اغراق',
    keywords: [
      'لوکس', 'مینیمال', 'معماری', 'هنر', 'مد', 'برند', 'عطر', 'کیفیت', 'استایل',
      'خاص', 'اصالت', 'مدرن', 'آرامش', 'جواهر', 'دیزاین', 'طراحی', 'زیبایی',
      'ظرافت', 'ساده', 'صامت', 'luxury', 'minimal', 'elegant', 'fashion', 'art',
      'brand', 'design', 'jewelry', 'parfum', 'chic',
    ],
    theme: {
      bg: '#09090b',
      fg: '#fafafa',
      accent: '#d4af37',
      secondary: '#a1a1aa',
      displayFont: 'Vazirmatn',
      bodyFont: 'Vazirmatn',
      grain: true,
      boxStyle: 'minimal',
      effect: 'vignette',
      ambientAnimation: false,
    },
    style: {
      captionMode: 'line-fade',
      stagger: 0.042,
      spring: { damping: 24, stiffness: 150 },
      captionSize: 72,
      progressBar: false,
      audioBars: false,
      visualWidgets: false,
      glowIntensity: 0.35,
    },
    recommendedEntrance: 'clip-mask-reveal',
    recommendedEasing: 'power4.out',
    recommendedAccent: 'none',
    speedMultiplier: 0.9,
  },
};

/**
 * Tokenize and normalize Persian and English text
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[‌]/g, ' ') // zero-width non-joiner to space for keyword matching
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()«»؟!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fast, deterministic local NLP classifier for SRT segments
 */
export function analyzeSrtLocally(segments: MotionSegment[]): ContentAnalysisResult {
  const combinedText = segments.map((s) => s.text).join(' ');
  const normalized = normalizeText(combinedText);
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);
  const totalWords = Math.max(1, words.length);

  // 1. Calculate Archetype Match Scores
  const rawScores: Record<ContentArchetype, number> = {
    technology: 0,
    news: 0,
    romantic: 0,
    cinematic: 0,
    business: 0,
    sports: 0,
    luxury: 0,
  };

  const matchedKeywordsByArchetype: Record<ContentArchetype, Set<string>> = {
    technology: new Set(),
    news: new Set(),
    romantic: new Set(),
    cinematic: new Set(),
    business: new Set(),
    sports: new Set(),
    luxury: new Set(),
  };

  (Object.keys(THEME_ARCHETYPES) as ContentArchetype[]).forEach((archKey) => {
    const arch = THEME_ARCHETYPES[archKey];
    for (const kw of arch.keywords) {
      const normKw = normalizeText(kw);
      if (normalized.includes(normKw)) {
        // Boost for exact phrases or multi-word keywords
        const weight = normKw.includes(' ') ? 3.5 : 1.8;
        rawScores[archKey] += weight;
        matchedKeywordsByArchetype[archKey].add(kw);
      }
    }
  });

  // Check for statistical cues (numbers, percentages, currencies)
  const numbersCount = (combinedText.match(/\d+|[۰-۹]+/g) || []).length;
  if (numbersCount > 2) {
    rawScores.business += numbersCount * 0.8;
    rawScores.news += numbersCount * 0.4;
  }

  // Calculate Speech Rate / WPM from timestamps
  let totalDurationSec = 0;
  segments.forEach((s) => {
    totalDurationSec += Math.max(0.5, s.to - s.from);
  });
  const avgWpm = Math.round((totalWords / Math.max(1, totalDurationSec)) * 60);

  // Normalize scores into percentages (0 - 100)
  const scoreValues = Object.values(rawScores);
  const maxScore = Math.max(...scoreValues, 0.1);
  const sumScores = scoreValues.reduce((a, b) => a + b, 0);

  let dominantTheme: ContentArchetype = 'technology';
  let highestVal = -1;

  const percentageScores: Record<ContentArchetype, number> = {
    technology: 10,
    news: 10,
    romantic: 10,
    cinematic: 10,
    business: 10,
    sports: 10,
    luxury: 10,
  };

  for (const k of Object.keys(THEME_ARCHETYPES) as ContentArchetype[]) {
    const raw = rawScores[k];
    if (sumScores > 0) {
      percentageScores[k] = Math.round((raw / sumScores) * 100);
    } else {
      percentageScores[k] = 14;
    }
    if (raw > highestVal) {
      highestVal = raw;
      dominantTheme = k;
    }
  }

  // Calculate confidence level (0.65 to 0.98)
  const confidence = sumScores > 0 ? Math.min(0.98, 0.65 + (highestVal / sumScores) * 0.33) : 0.72;

  // Collect top detected keywords
  const allKeywords = Array.from(matchedKeywordsByArchetype[dominantTheme]).slice(0, 6);
  if (allKeywords.length === 0) {
    allKeywords.push(...THEME_ARCHETYPES[dominantTheme].keywords.slice(0, 4));
  }

  // Sentiment determination
  let sentiment: ContentAnalysisResult['sentiment'] = 'neutral';
  if (dominantTheme === 'romantic') sentiment = 'poetic';
  else if (dominantTheme === 'news') sentiment = 'urgent';
  else if (dominantTheme === 'business') sentiment = 'analytical';
  else if (dominantTheme === 'sports') sentiment = 'passionate';
  else if (dominantTheme === 'technology') sentiment = 'positive';
  else if (dominantTheme === 'cinematic') sentiment = 'passionate';

  const preset = THEME_ARCHETYPES[dominantTheme];

  // Persian summary explanation
  const summaryFa = generateSummaryFa(dominantTheme, preset.nameFa, allKeywords, avgWpm, confidence);

  // Segment level suggestions
  const segmentSuggestions = segments.map((seg, idx) => {
    const segNorm = normalizeText(seg.text);
    const hasNum = /\d+|[۰-۹]+|درصد|%/.test(seg.text);
    const isQuestion = seg.text.includes('؟') || seg.text.includes('?');
    const isQuote = seg.text.includes('«') || seg.text.includes('"') || /گفته|گفت|می‌گوید/.test(seg.text);

    let suggestedKind: SegmentKind = 'caption';
    if (hasNum) suggestedKind = 'stat';
    else if (isQuote) suggestedKind = 'quote';

    let entrance = preset.recommendedEntrance;
    let accent = preset.recommendedAccent;

    // First slide gets grand entrance
    if (idx === 0) {
      entrance = dominantTheme === 'technology' ? 'glitch-rgb-flicker' : 'kinetic-3d-flip';
      accent = dominantTheme === 'romantic' ? 'optical-flare' : 'burst-particles';
    }

    return {
      segmentId: seg.id,
      mood: preset.nameFa,
      suggestedKind,
      entrance,
      accent,
    };
  });

  return {
    dominantTheme,
    confidence: Math.round(confidence * 100) / 100,
    scores: percentageScores,
    sentiment,
    summaryFa,
    detectedKeywords: allKeywords,
    avgWpm,
    recommendedPalette: {
      bg: preset.theme.bg,
      fg: preset.theme.fg,
      accent: preset.theme.accent,
      secondary: preset.theme.secondary || '#38bdf8',
      nameFa: preset.nameFa,
    },
    recommendedTypography: {
      displayFont: preset.theme.displayFont,
      bodyFont: preset.theme.bodyFont,
      captionSize: preset.style.captionSize,
      descriptionFa: `فونت عنوان: ${preset.theme.displayFont} | فونت متن: ${preset.theme.bodyFont} (${preset.style.captionSize}px)`,
    },
    recommendedAnimation: {
      speedMultiplier: preset.speedMultiplier,
      entrance: preset.recommendedEntrance,
      easing: preset.recommendedEasing,
      accent: preset.recommendedAccent,
      stagger: preset.style.stagger,
      springDamping: preset.style.spring.damping,
      springStiffness: preset.style.spring.stiffness,
      boxStyle: preset.theme.boxStyle || 'minimal',
      effect: preset.theme.effect || 'none',
    },
    segmentSuggestions,
    analyzedAt: new Date().toISOString(),
    provider: 'local-nlp',
  };
}

/**
 * Generate human-friendly Persian summary for the analysis
 */
function generateSummaryFa(
  theme: ContentArchetype,
  nameFa: string,
  keywords: string[],
  avgWpm: number,
  confidence: number
): string {
  const pct = Math.round(confidence * 100);
  const kwList = keywords.length > 0 ? `کلیدواژه‌های اصلی: [${keywords.join('، ')}]` : '';

  switch (theme) {
    case 'technology':
      return `محتوای SRT با ضریب اطمینان ${pct}٪ در دسته‌بندی «${nameFa}» شناسایی شد. ${kwList}. پالت سایبری نئونی، موشن گلیچ RGB و سرعت انیمیشن پرشتاب به صورت اختصاصی تنظیم شدند.`;
    case 'news':
      return `متن دارای لحن رسمی و خبری با اطمینان ${pct}٪ است. ${kwList}. کنتراست رنگی قرمز خبری و سرمه‌ای، همراه با ورود اسلایدی متن و کادربندی مستند فعال شد.`;
    case 'romantic':
      return `محتوای اثر عاطفی، شاعرانه و احساسی (${pct}٪) تشخیص داده شد. ${kwList}. پالت مخملی و رزگلد، حرکات محوشونده آرام و نورپردازی بوکه اختصاص یافت.`;
    case 'cinematic':
      return `محتوای متن حماسی، تاریخی و سینمایی (${pct}٪) ارزیابی شد. ${kwList}. طلای متالیک، کادر فیلم هالیوودی و ترنزیشن‌های اپتیکال برای شکوه بصری پیشنهاد شدند.`;
    case 'business':
      return `تحلیل متن نشان‌دهنده محتوای بیزنس، رشد مالی و آماری است (${pct}٪). ${kwList}. رنگ سبز رشد، کارت‌های شفاف و انیمیشن‌های هایلایت هوشمند تطبیق یافتند.`;
    case 'sports':
      return `ضرباهنگ پرانرژی و هیجان‌انگیز ورزشی/وایرال (${pct}٪) با ریتم گفتار ${avgWpm} کلمه در دقیقه. پالت زرد فسفری و پرش‌های فنری الاستیک برای بیشترین درگیری مخاطب فعال شد.`;
    case 'luxury':
      return `محتوا با تمرکز بر اصالت، هنر و مینیمالیسم لوکس (${pct}٪) سنجیده شد. رنگ‌های آرام، تایپوگرافی تمیز و موشن ماسک بدون زوائد انتخاب شدند.`;
  }
}

/**
 * Main analysis function: uses backend Gemini API when available, falls back to deterministic local NLP
 */
export async function analyzeContentWithAi(
  segments: MotionSegment[],
  fullText?: string
): Promise<ContentAnalysisResult> {
  const localResult = analyzeSrtLocally(segments);

  try {
    const textPayload = fullText || segments.map((s) => s.text).join('\n');
    const response = await fetch('/api/analyze-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullText: textPayload,
        segments: segments.slice(0, 15).map((s) => ({ id: s.id, text: s.text })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.dominantTheme && data.provider === 'gemini') {
        return {
          dominantTheme: data.dominantTheme,
          confidence: data.confidence || localResult.confidence,
          scores: { ...localResult.scores, ...(data.scores || {}) },
          sentiment: data.sentiment || localResult.sentiment,
          summaryFa: data.summaryFa || localResult.summaryFa,
          detectedKeywords: data.detectedKeywords?.length ? data.detectedKeywords : localResult.detectedKeywords,
          avgWpm: localResult.avgWpm,
          recommendedPalette: data.recommendedPalette || localResult.recommendedPalette,
          recommendedTypography: data.recommendedTypography || localResult.recommendedTypography,
          recommendedAnimation: data.recommendedAnimation || localResult.recommendedAnimation,
          segmentSuggestions: localResult.segmentSuggestions,
          analyzedAt: data.analyzedAt || new Date().toISOString(),
          provider: 'gemini',
        };
      }
    }
  } catch (err) {
    console.warn('AI analysis API unreachable, using local NLP classifier:', err);
  }

  return localResult;
}

/**
 * Apply the detected or selected theme archetype directly to the MotionPlan
 */
export function applyArchetypeToPlan(
  plan: MotionPlan,
  archetypeId: ContentArchetype,
  options?: {
    customPalette?: { bg?: string; fg?: string; accent?: string; secondary?: string };
    applyToGsapLayers?: boolean;
    syncSpeedMultiplier?: boolean;
  }
): MotionPlan {
  const preset = THEME_ARCHETYPES[archetypeId];
  if (!preset) return plan;

  const newTheme: MotionTheme = {
    ...plan.theme,
    bg: options?.customPalette?.bg || preset.theme.bg,
    fg: options?.customPalette?.fg || preset.theme.fg,
    accent: options?.customPalette?.accent || preset.theme.accent,
    secondary: options?.customPalette?.secondary || preset.theme.secondary,
    displayFont: preset.theme.displayFont,
    bodyFont: preset.theme.bodyFont,
    grain: preset.theme.grain,
    boxStyle: preset.theme.boxStyle,
    effect: preset.theme.effect,
    ambientAnimation: preset.theme.ambientAnimation,
  };

  const newStyle: MotionStyle = {
    ...plan.style,
    captionMode: preset.style.captionMode,
    stagger: preset.style.stagger,
    spring: { ...preset.style.spring },
    captionSize: preset.style.captionSize,
    progressBar: preset.style.progressBar,
    audioBars: preset.style.audioBars,
    visualWidgets: preset.style.visualWidgets,
    glowIntensity: preset.style.glowIntensity,
  };

  // Update segments with matching GSAP layers and entrance effects
  const updatedSegments = plan.segments.map((seg) => {
    if (options?.applyToGsapLayers !== false) {
      return {
        ...seg,
        gsapConfig: {
          entrance: preset.recommendedEntrance,
          easing: preset.recommendedEasing,
          accent: preset.recommendedAccent,
          duration: 0.85,
          stagger: preset.style.stagger,
          perspective3D: 900,
          cameraParallax: true,
          chromaticGlitch: archetypeId === 'technology',
          overshoot: archetypeId === 'sports' ? 2 : 1,
        },
      };
    }
    return seg;
  });

  return {
    ...plan,
    theme: newTheme,
    style: newStyle,
    segments: updatedSegments,
  };
}

/**
 * Granular per-segment adaptive styling
 * Inspects each segment text (numbers, keywords, mood) and applies custom visual styling
 */
export function applyPerSegmentAdaptation(plan: MotionPlan): MotionPlan {
  const updatedSegments = plan.segments.map((seg, idx) => {
    const text = seg.text;
    const hasNumbers = /\d+|[۰-۹]+|درصد|%|\$|تومان|میلیارد|میلیون/.test(text);
    const isQuote = text.includes('«') || text.includes('"') || /گفته|گفت|می‌گوید/.test(text);
    const isTech = /هوش مصنوعی|کد|سیستم|الگوریتم|دیجیتال|سرور/.test(text);
    const isEmotional = /عشق|دل|قلب|امید|اشک|لبخند/.test(text);

    let kind = seg.kind;
    if (hasNumbers && kind === 'caption') kind = 'stat';
    else if (isQuote && kind === 'caption') kind = 'quote';

    let entrance: GsapTransitionType = seg.gsapConfig?.entrance || 'split-stagger-slide';
    let accent: GsapAccentEffect = seg.gsapConfig?.accent || 'burst-particles';

    if (hasNumbers) {
      entrance = 'elastic-pop';
      accent = 'burst-particles';
    } else if (isTech) {
      entrance = 'glitch-rgb-flicker';
      accent = 'scanline-sweep';
    } else if (isEmotional) {
      entrance = 'cinematic-flare-push';
      accent = 'optical-flare';
    }

    return {
      ...seg,
      kind,
      gsapConfig: {
        ...(seg.gsapConfig || {
          duration: 0.85,
          stagger: 0.035,
          perspective3D: 900,
          cameraParallax: true,
          chromaticGlitch: false,
          overshoot: 1,
        }),
        entrance,
        accent,
        easing: (hasNumbers ? 'back.out(2)' : 'power4.out') as GsapEasingType,
      },
    };
  });

  return {
    ...plan,
    segments: updatedSegments,
  };
}
