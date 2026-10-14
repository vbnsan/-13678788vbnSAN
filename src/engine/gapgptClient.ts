import {
  GapGptImageModel,
  GapGptModelInfo,
  GapGptSettings,
  GapGptTextModel,
  MotionVisualPreset,
  MotionVisualPresetInfo,
  ScriptRewriteItem,
} from '../types/gapgpt';
import { MotionPlan } from '../types/motion';

export const GAPGPT_DEFAULT_SETTINGS: GapGptSettings = {
  apiKey: '',
  textModel: 'gpt-4o',
  imageModel: 'flux',
  voiceModel: 'tts-1',
  voiceName: 'onyx',
  defaultVisualPreset: '3d-clay-glass',
  aspectRatio: '16:9',
  autoApplyToPlan: true,
};

export const MOTION_VISUAL_PRESETS: MotionVisualPresetInfo[] = [
  {
    id: '3d-clay-glass',
    titleFa: 'سه‌بعدی کِلِی و گلس‌مورفیسم (ترند روز)',
    descriptionFa: 'المان‌های سه‌بعدی نرم و پاستلی با شیشه‌های مات، نورپردازی استودیویی و سایه‌های نرم',
    promptPrefix: 'Trending 3D claymorphism and frosted glassmorphic shapes, soft pastel studio lighting, minimal floating geometric spheres and curved ribbons, clean composition, depth of field, Octane render 8K, Behance motion design award style, no text',
    recommendedPalette: { bg: '#0b0f19', fg: '#f1f5f9', accent: '#38bdf8' },
    sampleTag: 'ترند اینستاگرام و سوشال',
  },
  {
    id: 'cyberpunk-neon',
    titleFa: 'سایبرپانک و نئون دیجیتال',
    descriptionFa: 'خطوط درخشان نئونی، هولوگرام‌های انتزاعی، بردهای مداری و پس‌زمینه تیره آینده‌نگرانه',
    promptPrefix: 'Futuristic cyberpunk neon abstract motion background, dark obsidian surfaces with glowing cyan and magenta light trails, circuit board traces, holographic grid, atmospheric volumetric fog, high tech aesthetic, 8K wallpaper, no text',
    recommendedPalette: { bg: '#050713', fg: '#e0f2fe', accent: '#06b6d4' },
    sampleTag: 'هوش مصنوعی و تکنولوژی',
  },
  {
    id: 'luxury-gold-dark',
    titleFa: 'لوکس مات مشکی و طلایی (Quiet Luxury)',
    descriptionFa: 'بافت‌های مخملی تیره با ورقه‌های طلایی مواج، المان‌های هندسی اشرافی و مینیمال',
    promptPrefix: 'Minimalist quiet luxury motion graphic background, dark charcoal matte silk textures, flowing liquid gold ribbons, subtle metallic reflection, elegant premium composition, architectural minimalism, 8K ultra detailed, no text',
    recommendedPalette: { bg: '#0c0a09', fg: '#fef08a', accent: '#f59e0b' },
    sampleTag: 'کسب‌وکار، طلا و سرمایه',
  },
  {
    id: 'cinematic-photoreal',
    titleFa: 'سینمایی فوتورئالیستیک (Cinematic 8K)',
    descriptionFa: 'نورپردازی دراماتیک با لنز آنامورفیک، پودر نور، عمق میدان سینمایی و فضای عمیق',
    promptPrefix: 'Dramatic cinematic 8K photorealistic scene, moody cinematic lighting, shallow depth of field with creamy bokeh, anamorphic lens flare, particulate dust in sunbeam, atmospheric haze, movie still shot on ARRI Alexa, no text',
    recommendedPalette: { bg: '#08080c', fg: '#f8fafc', accent: '#f97316' },
    sampleTag: 'مستند و روایی',
  },
  {
    id: 'isometric-tech',
    titleFa: 'ایزومتریک مدرن و دیاگرام داده',
    descriptionFa: 'شبکه‌های داده، ساختمان‌های مکعبی انتزاعی، جریان‌های ارتباطی و اینفوگرافیک سه‌بعدی',
    promptPrefix: 'Clean modern isometric technology visual, floating modular glass servers and data visualization blocks, glowing neon data streams, minimalist low-poly tech architecture, soft isometric projection, Behance trending, no text',
    recommendedPalette: { bg: '#090d16', fg: '#e2e8f0', accent: '#6366f1' },
    sampleTag: 'استارتاپ و داده‌ورزی',
  },
  {
    id: 'abstract-fluid',
    titleFa: 'امواج مایع و گرادیان متحرک (Fluid Gradient)',
    descriptionFa: 'امواج کروی رنگارنگ، فرم‌های آلی مواج با گرادیان‌های گرم و زنده مشابه تیزرهای اپل',
    promptPrefix: 'Smooth liquid organic waves, abstract iridescent fluid simulation, colorful smooth gradient morphing shapes, glossy sheen, Apple keynote style motion graphic wallpaper, elegant fluid dynamics, 8K clean studio render, no text',
    recommendedPalette: { bg: '#0e0b16', fg: '#fae8ff', accent: '#d946ef' },
    sampleTag: 'خلاقانه و تیزر محصول',
  },
  {
    id: 'flat-vector-trend',
    titleFa: 'فلت وکتور مدرن (Trendy Flat Motion)',
    descriptionFa: 'اشکال هندسی تیز، رنگ‌های شاداب، ترکیب‌بندی جسورانه بر پایه طراحی گرافیک معاصر',
    promptPrefix: 'Modern trendy flat vector motion graphic backdrop, bold geometric Bauhaus shapes, vibrant contrasting contemporary palette, subtle grain overlay, clean vector art, Dribbble trending illustration, no text',
    recommendedPalette: { bg: '#0f172a', fg: '#f8fafc', accent: '#10b981' },
    sampleTag: 'یوتیوب و محتوای آموزشی',
  },
];

export const GAPGPT_MODELS_REGISTRY: GapGptModelInfo[] = [
  // Text & Motion Copywriting Models
  {
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o (پرچمدار)',
    providerName: 'OpenAI via GapGPT',
    category: 'text',
    pricingTier: 'pro',
    descriptionFa: 'قوی‌ترین مدل هوش مصنوعی برای درک ظرافت‌های زبان، بازنویسی ویروسی و تولید هوشمند پرامپت‌های موشن.',
    recommendedFor: 'سناریونویسی ترند، بازنویسی حرفه‌ای متون طولانی و انتخاب کلمات کلیدی موشن',
    approxCostFa: 'حدود ۵۰ تومان به ازای هر ۱۰۰۰ توکن',
    badge: 'پیشنهادی پرچمدار',
  },
  {
    id: 'gpt-4o-mini',
    name: 'OpenAI GPT-4o Mini',
    providerName: 'OpenAI via GapGPT',
    category: 'text',
    pricingTier: 'eco',
    descriptionFa: 'مدل فوق سریع و بسیار ارزان با عملکرد عالی در بازنویسی جملات کوتاه و برچسب‌گذاری سریع زیرنویس.',
    recommendedFor: 'پروژه‌های حجیم و کارهای روزمره با هزینه بسیار کم',
    approxCostFa: 'حدود ۵ تومان به ازای هر ۱۰۰۰ توکن',
    badge: 'اقتصادی و پرسرعت',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    providerName: 'Anthropic via GapGPT',
    category: 'text',
    pricingTier: 'pro',
    descriptionFa: 'استاد بلامنازع ادبیات، استعاره‌های بصری، لحن‌های شاعرانه، احساسی و سناریوهای مستند سینمایی.',
    recommendedFor: 'موشن‌های سینمایی، ادبی، فلسفی، داستان‌گویی و خلاقیت بصری عمیق',
    approxCostFa: 'حدود ۶۵ تومان به ازای هر ۱۰۰۰ توکن',
    badge: 'خلاق‌ترین مدل',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Google Gemini 1.5 Pro',
    providerName: 'Google via GapGPT',
    category: 'text',
    pricingTier: 'plus',
    descriptionFa: 'پنجره کانتکست میلیونی با هوش چندوجهی فوق‌العاده برای استخراج مفاهیم کلیدی از پادکست‌ها و متون حجیم.',
    recommendedFor: 'اسکریپت‌های طولانی و زیرنویس‌های چند ساعته',
    approxCostFa: 'حدود ۴۵ تومان به ازای هر ۱۰۰۰ توکن',
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    providerName: 'DeepSeek via GapGPT',
    category: 'text',
    pricingTier: 'eco',
    descriptionFa: 'مدل متن باز پیشرفته با عملکرد مشابه GPT-4 با هزینه بسیار ناچیز و سرعت پاسخ‌دهی بالا.',
    recommendedFor: 'برچسب‌گذاری داده‌ها و تحلیل سریع زیرنویس با بودجه کم',
    approxCostFa: 'حدود ۳ تومان به ازای هر ۱۰۰۰ توکن',
  },
  {
    id: 'gapgpt-4',
    name: 'GapGPT-4 (مدل اختصاصی گپ جی‌پی‌تی)',
    providerName: 'GapGPT Native',
    category: 'text',
    pricingTier: 'plus',
    descriptionFa: 'مدل بومی بهینه‌شده برای زبان فارسی با درک اصطلاحات روزمره و تمایلات بومی شبکه اجتماعی.',
    recommendedFor: 'تولید محتوای متناسب با مخاطب اینستاگرام و توییتر فارسی',
    approxCostFa: 'بسته‌های ریالی ویژه پلتفرم',
  },

  // Image Generation Models
  {
    id: 'flux',
    name: 'Black Forest Labs FLUX (Flux 1.1 / Schnell)',
    providerName: 'Black Forest Labs via GapGPT',
    category: 'image',
    pricingTier: 'pro',
    descriptionFa: 'ترندترین و پیشرفته‌ترین مدل تولید تصویر روز دنیا با جزئیات خارق‌العاده، کیفیت استودیویی و پرسپکتیو بی‌نظیر.',
    recommendedFor: 'بک‌گراندها و المان‌های موشن گرافیک ترند، افترافکت و تیزرهای مدرن',
    approxCostFa: 'حدود ۱۲۰ تا ۲۰۰ تومان به ازای هر عکس باکیفیت',
    badge: 'ترند شماره یک جهان',
  },
  {
    id: 'midjourney',
    name: 'Midjourney v6',
    providerName: 'Midjourney via GapGPT',
    category: 'image',
    pricingTier: 'pro',
    descriptionFa: 'استاد زیبایی‌شناسی بصری، کنتراست‌های سینمایی، نورپردازی هنرمندانه و پوسترهای مجلل.',
    recommendedFor: 'تصاویر هنری سینمایی، پرتره‌های دراماتیک و تم‌های لوکس',
    approxCostFa: 'حدود ۲۵۰ تا ۳۵۰ تومان به ازای هر تصویر',
    badge: 'زیباترین خروجی هنری',
  },
  {
    id: 'dall-e-3',
    name: 'OpenAI DALL·E 3',
    providerName: 'OpenAI via GapGPT',
    category: 'image',
    pricingTier: 'plus',
    descriptionFa: 'درک دقیق پرامپت‌های توصیفی پیچیده، هماهنگی عالی اجزا و کیفیت بالای جزئیات وکتور و سه‌بعدی.',
    recommendedFor: 'تصاویری که نیاز به پایبندی شدید به کلمات کلیدی دارند',
    approxCostFa: 'حدود ۱۸۰ تومان به ازای هر تصویر استاندارد',
  },
  {
    id: 'stable-diffusion-3',
    name: 'Stable Diffusion 3 / SDXL',
    providerName: 'Stability AI via GapGPT',
    category: 'image',
    pricingTier: 'eco',
    descriptionFa: 'مدل پرسرعت و ارزان برای تولید پس‌زمینه‌های انتزاعی و والپیپرهای سریع موشن.',
    recommendedFor: 'تست‌های اولیه و رندرهای فوری با هزینه کم',
    approxCostFa: 'حدود ۵۰ تومان به ازای هر تصویر',
  },

  // Audio & Voice Models
  {
    id: 'tts-1',
    name: 'OpenAI TTS (کیفیت استاندارد)',
    providerName: 'OpenAI via GapGPT',
    category: 'audio',
    pricingTier: 'plus',
    descriptionFa: 'تولید گفتار با لحن طبیعی، بدون نویز، با صدای ۶ گوینده حرفه‌ای (Alloy, Onyx, Nova, etc.).',
    recommendedFor: 'گویندگی روی اسلایدهای موشن گرافیک با تاخیر کم',
    approxCostFa: 'حدود ۶۰ تومان به ازای هر دقیقه گفتار',
  },
  {
    id: 'tts-1-hd',
    name: 'OpenAI TTS-HD (کیفیت استودیویی های‌رزولوشن)',
    providerName: 'OpenAI via GapGPT',
    category: 'audio',
    pricingTier: 'pro',
    descriptionFa: 'وضوح صدای فوق‌العاده بالا، جزئیات صوتی شفاف مناسب برای تیزرهای تبلیغاتی و سینمایی.',
    recommendedFor: 'خروجی نهایی پروژه‌های حرفه‌ای و تبلیغات تلویزیونی',
    approxCostFa: 'حدود ۱۲۰ تومان به ازای هر دقیقه گفتار',
    badge: 'کیفیت استودیویی',
  },
];

// Local Storage Helper
const SETTINGS_KEY = 'motionstudio_gapgpt_settings_v2';
const GENERATED_IMAGES_KEY = 'motionstudio_generated_images_gallery';

export function loadGapGptSettings(): GapGptSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...GAPGPT_DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load gapgpt settings from localStorage', e);
  }
  return GAPGPT_DEFAULT_SETTINGS;
}

export function saveGapGptSettings(settings: GapGptSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save gapgpt settings to localStorage', e);
  }
}

// Generate an art director prompt based on Persian segment text & style preset
export function buildArtDirectorPrompt(
  textFa: string,
  presetId: MotionVisualPreset,
  customInstructions?: string
): string {
  const preset = MOTION_VISUAL_PRESETS.find((p) => p.id === presetId) || MOTION_VISUAL_PRESETS[0];

  // Extract core concepts
  const cleanText = textFa.replace(/[\r\n]+/g, ' ').trim().slice(0, 120);

  let prompt = `${preset.promptPrefix}. Visual concept inspired by: "${cleanText}". `;
  if (customInstructions) {
    prompt += `Special styling: ${customInstructions}. `;
  }
  prompt += 'Clean background for kinetic motion text overlay, centered negative space, hyperdetailed, masterwork, 8K.';

  return prompt;
}

// API Call: Generate AI Image via GapGPT backend endpoint
export async function generateGapGptImage(params: {
  prompt: string;
  model?: GapGptImageModel;
  preset?: MotionVisualPreset;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  apiKey?: string;
  segmentId?: string;
  segmentText?: string;
}): Promise<{
  imageUrl: string;
  promptUsed: string;
  modelUsed: string;
  provider: 'gapgpt' | 'gemini' | 'canvas-gen';
  revisedPrompt?: string;
}> {
  const response = await fetch('/api/gapgpt/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      model: params.model || 'flux',
      preset: params.preset || '3d-clay-glass',
      aspectRatio: params.aspectRatio || '16:9',
      apiKey: params.apiKey,
      segmentId: params.segmentId,
      segmentText: params.segmentText,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Image generation failed' }));
    throw new Error(err.error || 'خطا در ارتباط با سرور تولید تصویر');
  }

  return response.json();
}

// API Call: Rewrite script & generate kinetic motion tags via GapGPT LLMs
export async function rewriteScriptWithGapGpt(params: {
  segments: Array<{ id: string; text: string }>;
  model?: GapGptTextModel;
  styleMode?: 'viral-reels' | 'cinematic-documentary' | 'clean-tech' | 'persian-storytelling';
  apiKey?: string;
}): Promise<{
  items: ScriptRewriteItem[];
  modelUsed: string;
  provider: string;
  titleSuggestionFa?: string;
}> {
  const response = await fetch('/api/gapgpt/rewrite-script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      segments: params.segments,
      model: params.model || 'gpt-4o',
      styleMode: params.styleMode || 'viral-reels',
      apiKey: params.apiKey,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Script rewrite failed' }));
    throw new Error(err.error || 'خطا در بازنویسی هوشمند متن با مدل‌های گپ جی‌پی‌تی');
  }

  return response.json();
}

// API Call: GapGPT OpenAI TTS Synthesis
export async function synthesizeGapGptTts(params: {
  text: string;
  voice?: string;
  model?: string;
  speed?: number;
  apiKey?: string;
}): Promise<{
  audioUrl: string;
  duration: number;
  format: string;
  provider: string;
}> {
  const response = await fetch('/api/gapgpt/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'TTS request failed' }));
    throw new Error(err.error || 'خطا در تولید صدای هوشمند با گپ جی‌پی‌تی');
  }

  return response.json();
}
