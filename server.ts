import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// URL Extractor
app.post('/api/extract-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'آدرس URL الزامی است' });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MotionStudio/1.0',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return res.status(400).json({ error: `خطا در دریافت صفحه (${response.status})` });
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim() : '';

    // Extract paragraphs and headings
    const paragraphRegex = /<(?:p|h1|h2|h3)[^>]*>([\s\S]*?)<\/(?:p|h1|h2|h3)>/gi;
    let match;
    const textPieces: string[] = [];

    while ((match = paragraphRegex.exec(html)) !== null) {
      const clean = match[1]
        .replace(/<[^>]+>/g, '') // remove inner tags
        .replace(/&[^;]+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (clean.length > 25 && !clean.includes('cookie') && !clean.includes('javascript')) {
        textPieces.push(clean);
      }
      if (textPieces.length >= 12) break;
    }

    res.json({
      title,
      text: textPieces.join('\n\n'),
    });
  } catch (error: any) {
    console.error('Error extracting url:', error);
    res.status(500).json({ error: error.message || 'خطا در واکشی آدرس' });
  }
});

// AI Enhancer (Low token: DeepSeek or Gemini)
app.post('/api/ai-enhance', async (req, res) => {
  try {
    const { provider = 'gemini', apiKey, items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ suggestions: [], estimatedTokens: 0 });
    }

    const systemPrompt = `You are a concise motion graphics subtitle tagger.
For each numbered subtitle text snippet, return a JSON array of objects with:
- "i": the item index
- "kind": "caption" (standard spoken text), "stat" (numbers/percentages/metrics), or "quote" (sayings/quotations)
- "em": array of word indices (0-based) in that snippet that represent high-impact focus words or numbers.
Respond ONLY with a valid JSON array like: [{"i":0,"kind":"caption","em":[1,3]}]`;

    const userContent = JSON.stringify(items);

    if (provider === 'deepseek') {
      const token = apiKey || process.env.DEEPSEEK_API_KEY;
      if (!token) {
        return res.status(400).json({ error: 'کلید DeepSeek API وارد نشده است' });
      }

      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          temperature: 0.1,
          max_tokens: 600,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
        }),
      });

      if (!dsRes.ok) {
        const errText = await dsRes.text();
        return res.status(502).json({ error: `DeepSeek API Error: ${errText}` });
      }

      const dsData = await dsRes.json();
      const content = dsData.choices?.[0]?.message?.content || '';
      const match = content.match(/\[[\s\S]*\]/);
      const suggestions = match ? JSON.parse(match[0]) : [];

      return res.json({
        suggestions,
        estimatedTokens: (dsData.usage?.total_tokens || 100),
      });
    }

    // Default: Gemini API using @google/genai
    const geminiKey = process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI(geminiKey ? { apiKey: geminiKey } : {});

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\nInput segments:\n${userContent}`,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const replyText = response.text || '[]';
    let suggestions = [];
    try {
      suggestions = JSON.parse(replyText);
    } catch {
      const match = replyText.match(/\[[\s\S]*\]/);
      if (match) suggestions = JSON.parse(match[0]);
    }

    res.json({
      suggestions,
      estimatedTokens: 95,
    });
  } catch (error: any) {
    console.error('AI enhance error:', error);
    res.status(500).json({ error: error.message || 'خطا در تحلیل هوش مصنوعی' });
  }
});

// AI Content & Theme Analysis Endpoint (SRT semantic classification, color palette & motion style matching)
app.post('/api/analyze-content', async (req, res) => {
  try {
    const { fullText, segments } = req.body;
    if (!fullText && (!segments || segments.length === 0)) {
      return res.status(400).json({ error: 'متن برای تحلیل محتوا ارسال نشده است' });
    }

    const textToAnalyze = fullText || segments.map((s: any) => s.text).join('\n');
    const segmentSample = (segments || []).slice(0, 15).map((s: any, idx: number) => `[${s.id || idx}]: ${s.text}`).join('\n');

    const systemPrompt = `You are an elite Motion Graphics Art Director and Content Classifier for After Effects and Remotion.
Analyze the provided Persian/English subtitle (SRT) text and determine its genre theme, visual mood, color palette, typography, and animation entrance dynamics.

Valid Archetypes:
1. "technology" (AI, software, code, cybersecurity, futurism, gadgets, algorithms)
2. "news" (breaking news, journalism, politics, announcements, reports, urgent events)
3. "romantic" (love, poetry, feelings, memories, emotional stories, soothing soul)
4. "cinematic" (epic history, legends, empires, war, philosophical grand drama)
5. "business" (finance, market, crypto, stocks, investment, startups, growth, KPI)
6. "sports" (fitness, energetic workout, football, match, high adrenaline, viral hooks)
7. "luxury" (minimalism, architecture, perfumes, haute couture, quiet luxury, elegant design)

Return pure JSON matching this exact schema:
{
  "dominantTheme": "technology" | "news" | "romantic" | "cinematic" | "business" | "sports" | "luxury",
  "confidence": number between 0.70 and 0.99,
  "scores": {
    "technology": number (0-100),
    "news": number (0-100),
    "romantic": number (0-100),
    "cinematic": number (0-100),
    "business": number (0-100),
    "sports": number (0-100),
    "luxury": number (0-100)
  },
  "sentiment": "positive" | "negative" | "neutral" | "urgent" | "poetic" | "analytical" | "passionate",
  "summaryFa": "string (1-2 sentences in fluent Persian describing theme, mood and reason for animation choices)",
  "detectedKeywords": ["string", "string", "string", "string"],
  "recommendedPalette": {
    "bg": "hex code (e.g. #050b14)",
    "fg": "hex code (e.g. #e2f8ff)",
    "accent": "hex code (e.g. #00f0ff)",
    "secondary": "hex code (e.g. #3b82f6)",
    "nameFa": "string in Persian (e.g. آبی نئونی سایبری)"
  },
  "recommendedTypography": {
    "displayFont": "Lalezar" or "Vazirmatn",
    "bodyFont": "Vazirmatn",
    "captionSize": number (68 to 88),
    "descriptionFa": "string in Persian"
  },
  "recommendedAnimation": {
    "speedMultiplier": number (0.8 to 1.3),
    "entrance": "kinetic-3d-flip" | "elastic-pop" | "split-stagger-slide" | "clip-mask-reveal" | "glitch-rgb-flicker" | "cinematic-flare-push",
    "easing": "power4.out" | "elastic.out(1, 0.4)" | "back.out(2)" | "circ.inOut" | "expo.out" | "bounce.out",
    "accent": "burst-particles" | "neon-rings" | "crosshair-target" | "scanline-sweep" | "optical-flare" | "none",
    "stagger": number (0.02 to 0.06),
    "springDamping": number (10 to 24),
    "springStiffness": number (120 to 320),
    "boxStyle": "minimal" | "rounded" | "frame" | "film" | "cyber",
    "effect": "none" | "particles" | "grid" | "vignette" | "bokeh" | "chromatic" | "plexus"
  }
}`;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\nFull SRT Content:\n${textToAnalyze.substring(0, 3000)}\n\nSample Segments:\n${segmentSample}`,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.15,
          },
        });

        const reply = response.text || '';
        let parsed = null;
        try {
          parsed = JSON.parse(reply);
        } catch {
          const match = reply.match(/\{[\s\S]*\}/);
          if (match) parsed = JSON.parse(match[0]);
        }

        if (parsed && parsed.dominantTheme) {
          return res.json({
            ...parsed,
            provider: 'gemini',
            analyzedAt: new Date().toISOString(),
          });
        }
      } catch (geminiErr) {
        console.warn('Gemini content analysis fallback to local:', geminiErr);
      }
    }

    // Return null to let frontend local NLP engine run with instant precision
    res.json({ provider: 'local-nlp', useLocalNlp: true });
  } catch (error: any) {
    console.error('Content analysis error:', error);
    res.status(500).json({ error: error.message || 'خطا در تحلیل محتوا' });
  }
});

// ==========================================
// GapGPT Platform v2 Integration Endpoints
// (Base URL: https://api.gapgpt.app/v1)
// ==========================================

// Helper: Generate procedural trend motion graphic SVG data URL
function generateTrendSvgDataUrl(
  preset: string,
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  conceptText: string = ''
): string {
  const width = aspectRatio === '9:16' ? 1080 : aspectRatio === '1:1' ? 1080 : 1920;
  const height = aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1080;

  let bgGradient = '';
  let shapes = '';

  switch (preset) {
    case 'cyberpunk-neon':
      bgGradient = `
        <defs>
          <linearGradient id="cyberBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#030712"/>
            <stop offset="50%" stop-color="#080e22"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
          <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.3"/>
          </linearGradient>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#cyberBg)"/>
      `;
      shapes = `
        <!-- Cyber grid -->
        <g opacity="0.18">
          ${Array.from({ length: 12 }, (_, i) => `<line x1="${(i * width) / 12}" y1="0" x2="${(i * width) / 12}" y2="${height}" stroke="#00f0ff" stroke-width="1"/>`).join('')}
          ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${(i * height) / 12}" x2="${width}" y2="${(i * height) / 12}" stroke="#00f0ff" stroke-width="1"/>`).join('')}
        </g>
        <!-- Hologram rings -->
        <circle cx="${width * 0.7}" cy="${height * 0.4}" r="${width * 0.22}" fill="none" stroke="url(#neonCyan)" stroke-width="3" filter="url(#neonGlow)"/>
        <circle cx="${width * 0.7}" cy="${height * 0.4}" r="${width * 0.15}" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="12,16" opacity="0.75" filter="url(#neonGlow)"/>
        <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" stroke="#00f0ff" stroke-width="2" opacity="0.6" filter="url(#neonGlow)"/>
      `;
      break;

    case 'luxury-gold-dark':
      bgGradient = `
        <defs>
          <radialGradient id="luxBg" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stop-color="#1c1917"/>
            <stop offset="60%" stop-color="#0c0a09"/>
            <stop offset="100%" stop-color="#050403"/>
          </radialGradient>
          <linearGradient id="goldFlow" x1="0%" y1="0%" x2="100%" y2="80%">
            <stop offset="0%" stop-color="#fef08a" stop-opacity="0.95"/>
            <stop offset="50%" stop-color="#d97706" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#78350f" stop-opacity="0.3"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#luxBg)"/>
      `;
      shapes = `
        <!-- Flowing metallic ribbon curves -->
        <path d="M 0,${height * 0.8} Q ${width * 0.3},${height * 0.2} ${width * 0.6},${height * 0.6} T ${width},${height * 0.25}" fill="none" stroke="url(#goldFlow)" stroke-width="4" opacity="0.85"/>
        <path d="M 0,${height * 0.85} Q ${width * 0.32},${height * 0.25} ${width * 0.62},${height * 0.65} T ${width},${height * 0.3}" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.5"/>
        <circle cx="${width * 0.25}" cy="${height * 0.35}" r="${width * 0.1}" fill="#fef08a" opacity="0.04"/>
        <circle cx="${width * 0.8}" cy="${height * 0.65}" r="${width * 0.16}" fill="#d97706" opacity="0.03"/>
      `;
      break;

    case 'cinematic-photoreal':
      bgGradient = `
        <defs>
          <linearGradient id="cineBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#090a0f"/>
            <stop offset="60%" stop-color="#10131d"/>
            <stop offset="100%" stop-color="#050608"/>
          </linearGradient>
          <radialGradient id="cineFlare" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stop-color="#f97316" stop-opacity="0.45"/>
            <stop offset="40%" stop-color="#ea580c" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#cineBg)"/>
        <rect width="${width}" height="${height}" fill="url(#cineFlare)"/>
      `;
      shapes = `
        <!-- Anamorphic cinematic horizontal streaks -->
        <line x1="0" y1="${height * 0.35}" x2="${width}" y2="${height * 0.35}" stroke="#fb923c" stroke-width="3" opacity="0.5"/>
        <line x1="0" y1="${height * 0.35}" x2="${width}" y2="${height * 0.35}" stroke="#fed7aa" stroke-width="1" opacity="0.8"/>
        <!-- Bokeh circles -->
        <circle cx="${width * 0.4}" cy="${height * 0.5}" r="45" fill="#f97316" opacity="0.12"/>
        <circle cx="${width * 0.65}" cy="${height * 0.4}" r="80" fill="#38bdf8" opacity="0.08"/>
        <circle cx="${width * 0.2}" cy="${height * 0.7}" r="60" fill="#fb923c" opacity="0.06"/>
      `;
      break;

    case 'abstract-fluid':
      bgGradient = `
        <defs>
          <linearGradient id="fluidBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f0728"/>
            <stop offset="50%" stop-color="#1e103a"/>
            <stop offset="100%" stop-color="#090515"/>
          </linearGradient>
          <linearGradient id="fluidGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#c084fc"/>
            <stop offset="50%" stop-color="#ec4899"/>
            <stop offset="100%" stop-color="#3b82f6"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#fluidBg)"/>
      `;
      shapes = `
        <!-- Apple style fluid blob shapes -->
        <path d="M ${width * 0.1},${height * 0.5} C ${width * 0.25},${height * 0.15} ${width * 0.6},${height * 0.2} ${width * 0.8},${height * 0.45} C ${width * 0.95},${height * 0.7} ${width * 0.5},${height * 0.95} ${width * 0.2},${height * 0.8} Z" fill="url(#fluidGrad)" opacity="0.45"/>
        <circle cx="${width * 0.75}" cy="${height * 0.3}" r="${width * 0.14}" fill="#ec4899" opacity="0.25"/>
      `;
      break;

    case '3d-clay-glass':
    default:
      bgGradient = `
        <defs>
          <linearGradient id="clayBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0b0f19"/>
            <stop offset="50%" stop-color="#141c2e"/>
            <stop offset="100%" stop-color="#090d16"/>
          </linearGradient>
          <linearGradient id="glassSphere" x1="20%" y1="20%" x2="80%" y2="80%">
            <stop offset="0%" stop-color="#60a5fa" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#clayBg)"/>
      `;
      shapes = `
        <!-- Floating 3D clay balls & glass panels -->
        <circle cx="${width * 0.8}" cy="${height * 0.35}" r="${width * 0.13}" fill="url(#glassSphere)" opacity="0.6"/>
        <circle cx="${width * 0.2}" cy="${height * 0.7}" r="${width * 0.08}" fill="#818cf8" opacity="0.35"/>
        <rect x="${width * 0.15}" y="${height * 0.2}" width="${width * 0.7}" height="${height * 0.6}" rx="32" fill="#ffffff" fill-opacity="0.03" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1.5"/>
      `;
      break;
  }

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      ${bgGradient}
      ${shapes}
    </svg>
  `.trim();

  const base64 = Buffer.from(svgContent).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// 1. GapGPT: Models & Pricing Registry API
app.get('/api/gapgpt/models', (_req, res) => {
  res.json({
    platform: 'GapGPT Platform v2',
    docsUrl: 'https://gapgpt.app/platform-v2/docs/quickstart',
    pricingUrl: 'https://gapgpt.app/platform-v2/pricing',
    baseUrl: 'https://api.gapgpt.app/v1',
    models: {
      text: [
        { id: 'gpt-4o', name: 'OpenAI GPT-4o', tier: 'pro', cost: '۵۰ تومان / ۱K توکن', description: 'پرچمدار هوش مصنوعی و بهترین در بازنویسی موشن های ویروسی' },
        { id: 'gpt-4o-mini', name: 'OpenAI GPT-4o Mini', tier: 'eco', cost: '۵ تومان / ۱K توکن', description: 'سریع و فوق‌العاده اقتصادی برای کارهای روتین' },
        { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'pro', cost: '۶۵ تومان / ۱K توکن', description: 'برترین هوش برای نگارش سناریوهای عاطفی، روایی و سینمایی' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tier: 'plus', cost: '۴۵ تومان / ۱K توکن', description: 'پنجره کانتکست عظیم برای تحلیل پادکست‌ها و متون حجیم' },
        { id: 'deepseek-chat', name: 'DeepSeek Chat V3', tier: 'eco', cost: '۳ تومان / ۱K توکن', description: 'ارزان‌ترین مدل هوشمند با دقت بالا' },
        { id: 'gapgpt-4', name: 'GapGPT-4', tier: 'plus', cost: 'بسته بومی', description: 'مدل اختصاصی بهینه‌شده برای فرهنگ و اصطلاحات فارسی' },
      ],
      image: [
        { id: 'flux', name: 'Black Forest Labs FLUX', tier: 'pro', cost: '۱۵۰ تومان / عکس', description: 'ترندترین مدل روز دنیا برای تولید بک‌گراندهای های‌کوالیتی و 3D' },
        { id: 'midjourney', name: 'Midjourney v6', tier: 'pro', cost: '۲۸۰ تومان / عکس', description: 'نورپردازی سینمایی و شاهکارهای هنری با عمق میدان شگفت‌انگیز' },
        { id: 'dall-e-3', name: 'OpenAI DALL·E 3', tier: 'plus', cost: '۱۸۰ تومان / عکس', description: 'وفاداری حداکثری به پرامپت و هماهنگی المان‌ها' },
        { id: 'stable-diffusion-3', name: 'Stable Diffusion 3', tier: 'eco', cost: '۵۰ تومان / عکس', description: 'سریع برای تست و تولید پترن‌های پس‌زمینه' },
      ],
      audio: [
        { id: 'tts-1', name: 'OpenAI TTS (Standard)', tier: 'plus', cost: '۶۰ تومان / دقیقه', description: 'تولید طبیعی گفتار با ۶ صدای جذاب استودیویی' },
        { id: 'tts-1-hd', name: 'OpenAI TTS-HD (Studio)', tier: 'pro', cost: '۱۲۰ تومان / دقیقه', description: 'صدای شفاف و فاقد هرگونه فشرده‌سازی جهت تبلیغات و تیزر' },
      ],
    },
  });
});

// 2. GapGPT: Generate AI Visual Image Endpoint (Flux, Midjourney, DALL-E 3)
app.post('/api/gapgpt/generate-image', async (req, res) => {
  try {
    const {
      prompt,
      model = 'flux',
      preset = '3d-clay-glass',
      aspectRatio = '16:9',
      apiKey,
      segmentId,
      segmentText = '',
    } = req.body;

    if (!prompt && !segmentText) {
      return res.status(400).json({ error: 'پرامپت یا متن اسلاید الزامی است' });
    }

    const cleanPrompt = (prompt || `High-end motion graphic visual background, ${segmentText}`).trim();
    const effectiveKey = apiKey || process.env.GAPGPT_API_KEY;

    const sizeMapping: Record<string, string> = {
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '1:1': '1024x1024',
    };
    const sizeStr = sizeMapping[aspectRatio] || '1792x1024';

    // 1. If GapGPT API key is present, attempt live request to https://api.gapgpt.app/v1/images/generations
    if (effectiveKey) {
      try {
        const gapRes = await fetch('https://api.gapgpt.app/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`,
          },
          body: JSON.stringify({
            model: model, // flux, midjourney, dall-e-3
            prompt: cleanPrompt,
            size: sizeStr,
            n: 1,
            response_format: 'url',
          }),
          signal: AbortSignal.timeout(28000),
        });

        if (gapRes.ok) {
          const gapData = await gapRes.json();
          const imgUrl = gapData.data?.[0]?.url || gapData.data?.[0]?.b64_json;
          if (imgUrl) {
            const formattedUrl = imgUrl.startsWith('data:') || imgUrl.startsWith('http')
              ? imgUrl
              : `data:image/png;base64,${imgUrl}`;
            return res.json({
              imageUrl: formattedUrl,
              promptUsed: cleanPrompt,
              modelUsed: model,
              provider: 'gapgpt',
              revisedPrompt: gapData.data?.[0]?.revised_prompt,
              segmentId,
            });
          }
        } else {
          const errBody = await gapRes.text();
          console.warn('GapGPT Image generation returned non-ok:', gapRes.status, errBody);
        }
      } catch (gapErr: any) {
        console.warn('GapGPT Image generation error, falling back:', gapErr.message);
      }
    }

    // 2. Procedural high-aesthetic trend motion graphic SVG generator
    const proceduralUrl = generateTrendSvgDataUrl(preset, aspectRatio, segmentText);
    res.json({
      imageUrl: proceduralUrl,
      promptUsed: cleanPrompt,
      modelUsed: `${model} (حالت پیش‌نمایش گرافیکی برداری ترند)`,
      provider: 'canvas-gen',
      segmentId,
    });
  } catch (error: any) {
    console.error('GapGPT generate-image error:', error);
    res.status(500).json({ error: error.message || 'خطا در تولید تصویر با هوش مصنوعی' });
  }
});

// 3. GapGPT: AI Script & Motion Copywriting Copilot
app.post('/api/gapgpt/rewrite-script', async (req, res) => {
  try {
    const {
      segments = [],
      model = 'gpt-4o',
      styleMode = 'viral-reels',
      apiKey,
    } = req.body;

    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ error: 'اسلایدی برای بازنویسی ارسال نشده است' });
    }

    const effectiveKey = apiKey || process.env.GAPGPT_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    const styleInstructions: Record<string, string> = {
      'viral-reels': 'Rewriting for TikTok / Instagram Reels viral motion graphics: short, explosive, high-retention phrases (5-8 words per line max), punchy hooks, emotional urgency, strong keywords.',
      'cinematic-documentary': 'Rewriting for Epic Cinematic Motion Documentary: poetic depth, dramatic pauses, profound storytelling, philosophical weight, measured rhythm.',
      'clean-tech': 'Rewriting for Startup & Tech Explainer: concise, metric-driven, crystal-clear value propositions, bold action verbs.',
      'persian-storytelling': 'Rewriting for Warm Persian Narrative: rich and authentic Persian metaphors, smooth rhythmic cadences suitable for podcast/reels.',
    };

    const promptInstructions = styleInstructions[styleMode] || styleInstructions['viral-reels'];

    const systemPrompt = `You are an award-winning Motion Graphics Creative Director and Viral Copywriter.
Transform the provided subtitle/motion segments into trend-setting, high-retention Persian motion graphics copy.
${promptInstructions}

For EACH segment, output:
- "segmentId": exact matching segment id
- "originalText": original text
- "rewrittenText": viral, polished Persian text (must be concise, rhythmic and impactful)
- "hookHeadlineFa": short 2-3 word punchy tag/category (e.g. "راز پنهان", "رشد ۳۰۰٪", "آینده اینجاست")
- "emphasisWords": array of 0-based word indices in "rewrittenText" to emphasize with kinetic color highlight
- "segmentKind": "caption" | "stat" | "quote" | "title"
- "imagePromptEn": an ultra-crisp English art director prompt (15-25 words) for Flux/Midjourney image generation matching the exact visual metaphor of this slide (no text in image, 8K, cinematic lighting)
- "soundEffectHint": "whoosh" | "impact" | "glitch" | "riser" | "none"

Output MUST be a valid JSON array matching the schema:
[
  {
    "segmentId": "string",
    "originalText": "string",
    "rewrittenText": "string",
    "hookHeadlineFa": "string",
    "emphasisWords": [0, 2],
    "segmentKind": "caption",
    "imagePromptEn": "string",
    "soundEffectHint": "whoosh"
  }
]
No other text or explanations.`;

    const inputData = segments.map((s: any) => ({
      id: s.id,
      text: s.text,
    }));

    // 1. If GapGPT key is provided, query GapGPT OpenAI-compatible chat endpoint
    if (effectiveKey) {
      try {
        const gapRes = await fetch('https://api.gapgpt.app/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`,
          },
          body: JSON.stringify({
            model: model, // gpt-4o, claude-3-5-sonnet, deepseek-chat, gapgpt-4
            temperature: 0.3,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: JSON.stringify(inputData) },
            ],
          }),
          signal: AbortSignal.timeout(25000),
        });

        if (gapRes.ok) {
          const gapData = await gapRes.json();
          const content = gapData.choices?.[0]?.message?.content || '[]';
          let items = [];
          try {
            items = JSON.parse(content);
          } catch {
            const match = content.match(/\[[\s\S]*\]/);
            if (match) items = JSON.parse(match[0]);
          }

          if (Array.isArray(items) && items.length > 0) {
            return res.json({
              items,
              modelUsed: model,
              provider: 'gapgpt',
            });
          }
        }
      } catch (gapErr: any) {
        console.warn('GapGPT rewrite fallback to Gemini:', gapErr.message);
      }
    }

    // 2. Fallback to Gemini 2.5 Flash
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `${systemPrompt}\n\nInput Segments:\n${JSON.stringify(inputData)}`,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.25,
          },
        });

        const reply = response.text || '[]';
        let items = [];
        try {
          items = JSON.parse(reply);
        } catch {
          const match = reply.match(/\[[\s\S]*\]/);
          if (match) items = JSON.parse(match[0]);
        }

        return res.json({
          items,
          modelUsed: `${model} (Gemini Engine)`,
          provider: 'gemini',
        });
      } catch (geminiErr: any) {
        console.warn('Gemini rewrite error:', geminiErr.message);
      }
    }

    // 3. Fallback deterministic enhancement if external APIs unavailable
    const fallbackItems = segments.map((s: any) => {
      const words = s.text.trim().split(/\s+/);
      const emphasisWords = words.length > 2 ? [0, words.length - 1] : [0];
      return {
        segmentId: s.id,
        originalText: s.text,
        rewrittenText: s.text,
        hookHeadlineFa: 'نکته کلیدی',
        emphasisWords,
        segmentKind: 'caption',
        imagePromptEn: `Futuristic cinematic motion graphic background, abstract concept of ${s.text.slice(0, 40)}, studio lighting, 8K, no text`,
        soundEffectHint: 'whoosh',
      };
    });

    res.json({
      items: fallbackItems,
      modelUsed: 'deterministic-optimizer',
      provider: 'local',
    });
  } catch (error: any) {
    console.error('GapGPT rewrite-script error:', error);
    res.status(500).json({ error: error.message || 'خطا در بازنویسی سناریوی موشن' });
  }
});

// 4. GapGPT: OpenAI TTS Endpoint (/audio/speech)
app.post('/api/gapgpt/tts', async (req, res) => {
  try {
    const {
      text,
      voice = 'onyx',
      model = 'tts-1',
      speed = 1.0,
      apiKey,
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'متن گویندگی الزامی است' });
    }

    const effectiveKey = apiKey || process.env.GAPGPT_API_KEY;

    // Call GapGPT OpenAI TTS endpoint if key present
    if (effectiveKey) {
      try {
        const ttsRes = await fetch('https://api.gapgpt.app/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${effectiveKey}`,
          },
          body: JSON.stringify({
            model: model, // tts-1 or tts-1-hd
            input: text,
            voice: voice, // alloy, echo, fable, onyx, nova, shimmer
            speed: speed,
          }),
          signal: AbortSignal.timeout(18000),
        });

        if (ttsRes.ok) {
          const ab = await ttsRes.arrayBuffer();
          const base64Audio = `data:audio/mp3;base64,${Buffer.from(ab).toString('base64')}`;
          const duration = Math.max(1.5, Math.round((text.split(/\s+/).length / 2.3) * 10) / 10);
          return res.json({
            audioUrl: base64Audio,
            duration,
            format: 'mp3',
            provider: 'gapgpt-openai-tts',
          });
        }
      } catch (e: any) {
        console.warn('GapGPT TTS error, falling back:', e.message);
      }
    }

    // Fallback: Google Translate TTS from existing engine
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text.slice(0, 160)
    )}&tl=fa&client=tw-ob`;

    const gRes = await fetch(ttsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://translate.google.com/',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (gRes.ok) {
      const ab = await gRes.arrayBuffer();
      const base64Audio = `data:audio/mp3;base64,${Buffer.from(ab).toString('base64')}`;
      return res.json({
        audioUrl: base64Audio,
        duration: Math.max(1.5, Math.round((text.split(/\s+/).length / 2.3) * 10) / 10),
        format: 'mp3',
        provider: 'google-translate',
      });
    }

    // Fallback Cadence Wav
    const fb = generateCadenceWavBuffer(text);
    res.json({
      audioUrl: `data:audio/wav;base64,${fb.toString('base64')}`,
      duration: 2.5,
      format: 'wav',
      provider: 'synth-cadence',
    });
  } catch (error: any) {
    console.error('GapGPT TTS endpoint error:', error);
    res.status(500).json({ error: error.message || 'خطا در تولید صدای هوشمند' });
  }
});



// Curated stock photo dictionary with real Unsplash CDN images
const CURATED_STOCK_PHOTOS = [
  {
    id: 'uns-ai-neural',
    thumbUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1920&q=80',
    alt: 'شبکه عصبی و مغز دیجیتال هوش مصنوعی',
    keywords: ['ai', 'artificial intelligence', 'neural', 'brain', 'deep learning', 'هوش مصنوعی', 'ربات'],
    author: { name: 'Cash Macanaya', username: 'cashmacanaya', portfolioUrl: 'https://unsplash.com/@cashmacanaya' },
    source: 'Unsplash',
    likes: 1420,
  },
  {
    id: 'uns-cyber-code',
    thumbUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80',
    alt: 'ماتریکس و کدهای سبز برنامه‌نویسی و امنیت',
    keywords: ['code', 'programming', 'cyber', 'matrix', 'security', 'hack', 'کد', 'امنیت'],
    author: { name: 'Markus Spiske', username: 'markusspiske', portfolioUrl: 'https://unsplash.com/@markusspiske' },
    source: 'Unsplash',
    likes: 980,
  },
  {
    id: 'uns-market-chart',
    thumbUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1920&q=80',
    alt: 'نمودار سهام، بازار مالی و ارزهای دیجیتال',
    keywords: ['finance', 'chart', 'trading', 'stock', 'growth', 'money', 'سرمایه', 'بورس', 'نمودار', 'رشد'],
    author: { name: 'Maxim Hopman', username: 'hopman', portfolioUrl: 'https://unsplash.com/@hopman' },
    source: 'Unsplash',
    likes: 1120,
  },
  {
    id: 'uns-cpu-hardware',
    thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
    alt: 'تراشه سخت‌افزاری، پردازنده و مادربورد',
    keywords: ['hardware', 'chip', 'processor', 'tech', 'computer', 'سخت افزار', 'تراشه', 'فناوری'],
    author: { name: 'Alexandre Debiève', username: 'alexandre_debieve', portfolioUrl: 'https://unsplash.com/@alexandre_debieve' },
    source: 'Unsplash',
    likes: 2100,
  },
  {
    id: 'uns-earth-space',
    thumbUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
    alt: 'کره زمین و شبکه ماهواره‌ای داده در فضا',
    keywords: ['earth', 'space', 'satellite', 'global', 'network', 'cosmos', 'زمین', 'فضا', 'جهانی'],
    author: { name: 'NASA', username: 'nasa', portfolioUrl: 'https://unsplash.com/@nasa' },
    source: 'Unsplash',
    likes: 3890,
  },
  {
    id: 'uns-bitcoin-crypto',
    thumbUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1920&q=80',
    alt: 'بیت کوین و کریپتوکارنسی در پس‌زمینه تیره',
    keywords: ['bitcoin', 'crypto', 'blockchain', 'digital gold', 'بیت کوین', 'ارز دیجیتال'],
    author: { name: 'Executium', username: 'executium', portfolioUrl: 'https://unsplash.com/@executium' },
    source: 'Unsplash',
    likes: 850,
  },
  {
    id: 'uns-city-skyscrapers',
    thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=80',
    alt: 'آسمان‌خراش‌های مدرن و نورهای نئونی شهر در شب',
    keywords: ['city', 'skyscraper', 'architecture', 'night', 'urban', 'modern', 'شهر', 'معماری', 'برج'],
    author: { name: 'Aleksandar Pasaric', username: 'apasaric', portfolioUrl: 'https://unsplash.com/@apasaric' },
    source: 'Unsplash',
    likes: 1650,
  },
  {
    id: 'uns-misty-forest',
    thumbUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    alt: 'جنگل مه‌آلود سرسبز و طبیعت بکر',
    keywords: ['forest', 'nature', 'trees', 'mist', 'green', 'clean energy', 'طبیعت', 'جنگل', 'محیط زیست'],
    author: { name: 'Sebastian Unrau', username: 'sebastian_unrau', portfolioUrl: 'https://unsplash.com/@sebastian_unrau' },
    source: 'Unsplash',
    likes: 2400,
  },
  {
    id: 'uns-team-collaboration',
    thumbUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80',
    alt: 'همکاری تیمی، جلسه استارتاپ و نوآوری',
    keywords: ['team', 'startup', 'meeting', 'collaboration', 'people', 'تیم', 'همکاری', 'کسب و کار', 'جلسه'],
    author: { name: 'Annie Spratt', username: 'anniespratt', portfolioUrl: 'https://unsplash.com/@anniespratt' },
    source: 'Unsplash',
    likes: 1980,
  },
  {
    id: 'uns-dark-waves',
    thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    alt: 'امواج سه‌بعدی انتزاعی لوکس و مینیمال',
    keywords: ['abstract', 'luxury', 'dark', 'fluid', 'minimal', '3d', 'انتزاعی', 'مینیمال', 'مدرن'],
    author: { name: 'Milad Fakurian', username: 'fakurian', portfolioUrl: 'https://unsplash.com/@fakurian' },
    source: 'Unsplash',
    likes: 3120,
  },
  {
    id: 'uns-cinema-studio',
    thumbUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1920&q=80',
    alt: 'دوربین سینمایی، نورپردازی فیلم‌برداری و استودیو',
    keywords: ['cinema', 'movie', 'film', 'camera', 'studio', 'video', 'سینما', 'فیلم', 'ویدیو'],
    author: { name: 'Jakob Owens', username: 'jakobowens1', portfolioUrl: 'https://unsplash.com/@jakobowens1' },
    source: 'Unsplash',
    likes: 2750,
  },
  {
    id: 'uns-quantum-neon',
    thumbUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=400&q=80',
    fullUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1920&q=80',
    alt: 'ذرات درخشان نئونی در کهکشان تاریک',
    keywords: ['particles', 'quantum', 'neon', 'light', 'energy', 'future', 'نور', 'انرژی', 'آینده'],
    author: { name: 'Fabrizio Conti', username: 'fabrizioce', portfolioUrl: 'https://unsplash.com/@fabrizioce' },
    source: 'Unsplash',
    likes: 1470,
  },
];

// Helper: Map text to English keywords for stock image search
function mapTextToEnglishStockKeywords(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('هوش مصنوعی') || t.includes('الگوریتم') || t.includes('یادگیری') || t.includes('ai') || t.includes('ربات')) {
    return 'artificial intelligence technology dark';
  }
  if (t.includes('نمودار') || t.includes('درصد') || t.includes('رشد') || t.includes('سرمایه') || t.includes('بورس') || t.includes('مالی') || t.includes('فروش')) {
    return 'stock market financial growth chart';
  }
  if (t.includes('ارز دیجیتال') || t.includes('بیت') || t.includes('کریپتو') || t.includes('بلاکچین')) {
    return 'cryptocurrency bitcoin blockchain dark';
  }
  if (t.includes('تیم') || t.includes('شرکت') || t.includes('استارتاپ') || t.includes('کسب و کار') || t.includes('مدیریت')) {
    return 'business startup modern office meeting';
  }
  if (t.includes('طبیعت') || t.includes('محیط زیست') || t.includes('انرژی') || t.includes('زمین') || t.includes('سبز')) {
    return 'clean nature green forest environment';
  }
  if (t.includes('فضا') || t.includes('کهکشان') || t.includes('ستاره') || t.includes('آینده') || t.includes('کیهان')) {
    return 'space cosmos galaxy dark stars';
  }
  if (t.includes('کد') || t.includes('برنامه') || t.includes('سایبر') || t.includes('امنیت') || t.includes('شبکه')) {
    return 'cyber coding software security matrix';
  }
  if (t.includes('سینما') || t.includes('فیلم') || t.includes('هنر') || t.includes('نور') || t.includes('تصویر')) {
    return 'cinematic studio lighting dark film';
  }
  return text.trim() || 'modern technology abstract dark';
}

// 1. Stock Image Search API (Unsplash + Curated + Fallbacks)
app.post('/api/stock/search', async (req, res) => {
  try {
    const { query = 'technology', orientation = 'landscape', page = 1, perPage = 18, customKey } = req.body;
    const unsplashKey = customKey || process.env.UNSPLASH_ACCESS_KEY;
    const englishQuery = mapTextToEnglishStockKeywords(query);

    // 1. Try Unsplash Developer API if key is present
    if (unsplashKey) {
      try {
        const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          englishQuery
        )}&page=${page}&per_page=${perPage}&orientation=${orientation}`;

        const unsplashRes = await fetch(unsplashUrl, {
          headers: {
            Authorization: `Client-ID ${unsplashKey}`,
            'Accept-Version': 'v1',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (unsplashRes.ok) {
          const unsplashData = await unsplashRes.json();
          const results = (unsplashData.results || []).map((photo: any) => ({
            id: photo.id,
            thumbUrl: photo.urls?.small || photo.urls?.thumb,
            fullUrl: photo.urls?.regular || photo.urls?.full,
            downloadUrl: photo.links?.download_location,
            alt: photo.description || photo.alt_description || query,
            width: photo.width,
            height: photo.height,
            author: {
              name: photo.user?.name || 'Unsplash Photographer',
              username: photo.user?.username,
              portfolioUrl: photo.user?.links?.html,
            },
            source: 'Unsplash',
            likes: photo.likes || 0,
          }));

          return res.json({
            results,
            total: unsplashData.total || results.length,
            source: 'Unsplash API',
          });
        }
      } catch (unsErr) {
        console.warn('Unsplash API call error, falling back:', unsErr);
      }
    }

    // 2. High-speed curated catalog match with keyword relevance
    const qLower = englishQuery.toLowerCase();
    const qRawLower = query.toLowerCase();

    const matchedCurated = CURATED_STOCK_PHOTOS.filter((photo) => {
      const matchKeyword = photo.keywords.some((k) => qLower.includes(k) || qRawLower.includes(k));
      const matchAlt = photo.alt.toLowerCase().includes(qRawLower);
      return matchKeyword || matchAlt;
    });

    // If matches found or partial
    const finalResults = matchedCurated.length > 0 ? matchedCurated : CURATED_STOCK_PHOTOS;

    res.json({
      results: finalResults,
      total: finalResults.length,
      source: 'Curated High-Res Unsplash Library',
    });
  } catch (error: any) {
    console.error('Stock search endpoint error:', error);
    res.status(500).json({ error: error.message || 'خطا در جستجوی تصاویر استوک' });
  }
});

// 2. AI Auto-Match Slide Images API
app.post('/api/stock/auto-match', async (req, res) => {
  try {
    const { segments = [], orientation = 'landscape', customKey } = req.body;

    if (!Array.isArray(segments) || segments.length === 0) {
      return res.json({ matches: [] });
    }

    const unsplashKey = customKey || process.env.UNSPLASH_ACCESS_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let segmentQueries: Array<{ id: string; query: string }> = [];

    // Use Gemini 2.5 Flash to generate precise visual stock queries for each segment
    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const prompt = `You are a motion graphics art director.
For each numbered subtitle segment, provide a 2 to 4 word English stock photo search query (visual subject, lighting, mood) suitable for an Unsplash background.
Segments:
${JSON.stringify(segments.map((s: any) => ({ id: s.id, text: s.text })))}

Output ONLY a JSON array with [{"id": "...", "query": "..."}]. No markdown.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const reply = response.text || '[]';
        try {
          segmentQueries = JSON.parse(reply);
        } catch {
          const match = reply.match(/\[[\s\S]*\]/);
          if (match) segmentQueries = JSON.parse(match[0]);
        }
      } catch (geminiErr) {
        console.warn('Gemini query generator note:', geminiErr);
      }
    }

    // Fallback if AI was unavailable or skipped
    if (!segmentQueries || segmentQueries.length === 0) {
      segmentQueries = segments.map((s: any) => ({
        id: s.id,
        query: mapTextToEnglishStockKeywords(s.text),
      }));
    }

    // Match image for each segment
    const matches = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const queryObj = segmentQueries.find((q) => q.id === seg.id);
      const queryStr = queryObj?.query || mapTextToEnglishStockKeywords(seg.text);

      let chosenImage: any = null;

      // 1. Try Unsplash search if key present
      if (unsplashKey) {
        try {
          const uUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
            queryStr
          )}&page=1&per_page=3&orientation=${orientation}`;
          const uRes = await fetch(uUrl, {
            headers: { Authorization: `Client-ID ${unsplashKey}`, 'Accept-Version': 'v1' },
            signal: AbortSignal.timeout(4000),
          });
          if (uRes.ok) {
            const uData = await uRes.json();
            const photo = uData.results?.[0];
            if (photo) {
              chosenImage = {
                id: photo.id,
                thumbUrl: photo.urls?.small,
                fullUrl: photo.urls?.regular || photo.urls?.full,
                alt: photo.description || photo.alt_description || queryStr,
                author: {
                  name: photo.user?.name || 'Photographer',
                  username: photo.user?.username,
                  portfolioUrl: photo.user?.links?.html,
                },
                source: 'Unsplash',
              };
            }
          }
        } catch (e) {
          // ignore, will use curated
        }
      }

      // 2. Curated library fallback
      if (!chosenImage) {
        const qL = queryStr.toLowerCase();
        const found = CURATED_STOCK_PHOTOS.find((p) => p.keywords.some((k) => qL.includes(k)));
        chosenImage = found || CURATED_STOCK_PHOTOS[i % CURATED_STOCK_PHOTOS.length];
      }

      matches.push({
        segmentId: seg.id,
        query: queryStr,
        image: chosenImage,
      });
    }

    res.json({ matches });
  } catch (error: any) {
    console.error('Stock auto match error:', error);
    res.status(500).json({ error: error.message || 'خطا در تطبیق خودکار تصاویر استوک' });
  }
});

// Helper: Split text into clean chunks for TTS
function splitTextForTts(text: string, maxLen = 160): string[] {
  const clean = text.replace(/[\r\n]+/g, ' ').replace(/[«»"']/g, '').trim();
  if (clean.length <= maxLen) return [clean];
  const words = clean.split(/\s+/);
  const chunks: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxLen) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) chunks.push(cur);
      cur = w;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

// Helper: Generate simple fallback WAV audio buffer (sine wave tone cadence) if external network fails
function generateCadenceWavBuffer(text: string, durationSec = 2.5): Buffer {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const blockAlign = 2; // 16-bit mono
  const byteRate = sampleRate * blockAlign;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // 16 bits
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Generate pleasant gentle ambient narrator tone
  const words = text.split(/\s+/).length || 5;
  const syllableFreq = words * 0.8;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin((Math.PI * i) / numSamples); // gentle fade in/out
    const cadence = 0.5 + 0.5 * Math.sin(2 * Math.PI * syllableFreq * t);
    const sample = Math.sin(2 * Math.PI * 220 * t) * 0.15 * env * cadence;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

// 3. TTS API: Get Available Voices
app.get('/api/tts/voices', (_req, res) => {
  res.json({
    voices: [
      {
        id: 'fa-ir-maryam',
        name: 'مریم (گوینده زن فارسی)',
        lang: 'fa',
        gender: 'female',
        style: 'رسا، شفاف و اداری',
        provider: 'google-translate',
      },
      {
        id: 'fa-ir-nima',
        name: 'نیما (گوینده مرد فارسی)',
        lang: 'fa',
        gender: 'male',
        style: 'انگیزشی و پادکستی',
        provider: 'google-translate',
      },
      {
        id: 'fa-ir-standard',
        name: 'صدای استاندارد پارسی',
        lang: 'fa',
        gender: 'neutral',
        style: 'طبیعی و یکدست',
        provider: 'google-translate',
      },
      {
        id: 'en-us-studio',
        name: 'English Studio Voice (US)',
        lang: 'en',
        gender: 'female',
        style: 'Clear, modern & cinematic',
        provider: 'google-translate',
      },
      {
        id: 'browser-speech',
        name: 'سخنگوی مستقیم مرورگر (Web Speech)',
        lang: 'fa',
        gender: 'neutral',
        style: 'آفلاین و بدون تاخیر',
        provider: 'web-speech',
      },
    ],
  });
});

// 4. TTS API: Synthesize Text to Speech
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const { text = '', lang = 'fa', speed = 1.0, voice = 'fa-ir-standard' } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'متن گویندگی نمی‌تواند خالی باشد.' });
    }

    const cleanText = text.replace(/[\r\n]+/g, ' ').trim();
    const wordCount = cleanText.split(/\s+/).length;
    // Estimated speech duration in seconds: ~135 words per minute in Persian = ~2.25 words/sec
    const estimatedDuration = Math.max(1.5, Math.round(((wordCount / 2.25) / Math.max(0.6, speed)) * 10) / 10);

    // If client requested browser speech API
    if (voice === 'browser-speech') {
      return res.json({
        audioUrl: '',
        duration: estimatedDuration,
        provider: 'web-speech',
        text: cleanText,
        wordCount,
      });
    }

    // Try Google Translate TTS for natural MP3 stream
    try {
      const chunks = splitTextForTts(cleanText, 160);
      const audioBuffers: Buffer[] = [];

      for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        const targetLang = lang.startsWith('fa') ? 'fa' : 'en';
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
          chunk
        )}&tl=${targetLang}&client=tw-ob`;

        const ttsRes = await fetch(ttsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://translate.google.com/',
            'Accept': 'audio/mpeg, audio/*;q=0.9',
          },
          signal: AbortSignal.timeout(6500),
        });

        if (ttsRes.ok) {
          const ab = await ttsRes.arrayBuffer();
          audioBuffers.push(Buffer.from(ab));
        } else {
          console.warn(`TTS chunk response status: ${ttsRes.status}`);
          break;
        }
      }

      if (audioBuffers.length > 0) {
        const combined = Buffer.concat(audioBuffers);
        const base64Audio = `data:audio/mp3;base64,${combined.toString('base64')}`;
        // Google TTS MP3 is ~32kbps = 4000 bytes/sec
        const measuredSec = Math.max(1.2, Math.round((combined.length / 4000) * 10) / 10);

        return res.json({
          audioUrl: base64Audio,
          duration: measuredSec,
          format: 'mp3',
          provider: 'google-translate',
          text: cleanText,
          wordCount,
        });
      }
    } catch (netErr: any) {
      console.warn('Google TTS fetch error, fallback to audio synthesizer:', netErr.message);
    }

    // Fallback: Generate valid audio buffer so client always receives playable audio
    const fallbackBuffer = generateCadenceWavBuffer(cleanText, estimatedDuration);
    const fallbackBase64 = `data:audio/wav;base64,${fallbackBuffer.toString('base64')}`;

    res.json({
      audioUrl: fallbackBase64,
      duration: estimatedDuration,
      format: 'wav',
      provider: 'synth-cadence',
      text: cleanText,
      wordCount,
      isFallback: true,
    });
  } catch (error: any) {
    console.error('TTS synthesize endpoint error:', error);
    res.status(500).json({ error: error.message || 'خطا در تبدیل متن به گفتار' });
  }
});

// 5. TTS API: Batch Synthesize Multiple Segments
app.post('/api/tts/batch', async (req, res) => {
  try {
    const { segments = [], lang = 'fa', speed = 1.0, voice = 'fa-ir-standard' } = req.body;

    if (!Array.isArray(segments) || segments.length === 0) {
      return res.json({ items: [] });
    }

    const items = [];
    for (const seg of segments) {
      if (!seg || !seg.text) continue;
      const clean = String(seg.text).trim();
      const wordCount = clean.split(/\s+/).length;
      const estimatedDuration = Math.max(1.5, Math.round(((wordCount / 2.25) / Math.max(0.6, speed)) * 10) / 10);

      let audioUrl = '';
      let format = 'mp3';
      let duration = estimatedDuration;
      let provider = 'google-translate';

      try {
        const chunks = splitTextForTts(clean, 160);
        const buffers: Buffer[] = [];
        for (const chunk of chunks) {
          const targetLang = lang.startsWith('fa') ? 'fa' : 'en';
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
            chunk
          )}&tl=${targetLang}&client=tw-ob`;
          const r = await fetch(ttsUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              'Referer': 'https://translate.google.com/',
            },
            signal: AbortSignal.timeout(5000),
          });
          if (r.ok) {
            const ab = await r.arrayBuffer();
            buffers.push(Buffer.from(ab));
          }
        }
        if (buffers.length > 0) {
          const combo = Buffer.concat(buffers);
          audioUrl = `data:audio/mp3;base64,${combo.toString('base64')}`;
          duration = Math.max(1.2, Math.round((combo.length / 4000) * 10) / 10);
        }
      } catch (e) {
        // Fallback
        const fb = generateCadenceWavBuffer(clean, estimatedDuration);
        audioUrl = `data:audio/wav;base64,${fb.toString('base64')}`;
        format = 'wav';
        provider = 'synth-cadence';
      }

      items.push({
        segmentId: seg.id,
        audioUrl,
        duration,
        format,
        provider,
        text: clean,
      });
    }

    res.json({ items });
  } catch (error: any) {
    console.error('TTS batch endpoint error:', error);
    res.status(500).json({ error: error.message || 'خطا در تولید دسته‌ای صدا' });
  }
});

// Setup Vite middlewares in dev or serve dist in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MotionStudio server running on http://localhost:${PORT}`);
  });
}

startServer();
