import { MotionSegment, StockImageItem } from '../types/motion';

export interface StockSearchParams {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  page?: number;
  perPage?: number;
  apiKey?: string;
}

export interface StockSearchResponse {
  results: StockImageItem[];
  total: number;
  source: string;
}

export interface AutoMatchResponse {
  matches: Array<{
    segmentId: string;
    query: string;
    image: StockImageItem;
  }>;
}

const STORAGE_KEY_UNSPLASH = 'motionstudio_unsplash_key';

export function getStoredUnsplashKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_UNSPLASH) || '';
  } catch {
    return '';
  }
}

export function saveStoredUnsplashKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEY_UNSPLASH, key);
    } else {
      localStorage.removeItem(STORAGE_KEY_UNSPLASH);
    }
  } catch {
    // Ignore storage errors
  }
}

/**
 * Searches stock photos using the backend proxy (Unsplash + Curated + Wikimedia)
 */
export async function searchStockImages(params: StockSearchParams): Promise<StockSearchResponse> {
  const apiKey = params.apiKey || getStoredUnsplashKey();

  try {
    const res = await fetch('/api/stock/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        orientation: params.orientation || 'landscape',
        page: params.page || 1,
        perPage: params.perPage || 18,
        customKey: apiKey,
      }),
    });

    if (!res.ok) {
      throw new Error(`خطا در جستجوی تصاویر (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.warn('Stock image search error, falling back to local library:', error);
    return getLocalFallbackStock(params.query, params.orientation);
  }
}

/**
 * Uses AI to automatically match relevant stock images for all slide segments
 */
export async function autoMatchSlideImages(
  segments: MotionSegment[],
  orientation: 'landscape' | 'portrait' | 'squarish' = 'landscape',
  apiKey?: string
): Promise<AutoMatchResponse> {
  const key = apiKey || getStoredUnsplashKey();

  try {
    const res = await fetch('/api/stock/auto-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segments: segments.map((s) => ({ id: s.id, text: s.text, kind: s.kind })),
        orientation,
        customKey: key,
      }),
    });

    if (!res.ok) {
      throw new Error(`خطا در تطبیق خودکار هوش مصنوعی (${res.status})`);
    }

    const data: AutoMatchResponse = await res.json();
    return data;
  } catch (error) {
    console.warn('Auto match API error, falling back to client heuristic:', error);
    // Heuristic client fallback
    const matches: AutoMatchResponse['matches'] = [];
    const local = getLocalFallbackStock('technology');

    segments.forEach((seg, idx) => {
      const img = local.results[idx % local.results.length];
      matches.push({
        segmentId: seg.id,
        query: 'motion visual',
        image: img,
      });
    });

    return { matches };
  }
}

/**
 * Curated offline / zero-latency Unsplash image catalog
 */
export function getLocalFallbackStock(query?: string, _orientation = 'landscape'): StockSearchResponse {
  const curatedCatalog: StockImageItem[] = [
    {
      id: 'uns-ai-1',
      thumbUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1920&q=80',
      alt: 'هوش مصنوعی و مغز دیجیتال نئونی',
      author: { name: 'Cash Macanaya', username: 'cashmacanaya', portfolioUrl: 'https://unsplash.com/@cashmacanaya' },
      source: 'Unsplash',
      likes: 1420,
    },
    {
      id: 'uns-cyber-1',
      thumbUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80',
      alt: 'ماتریکس و کدهای سایبری سبز',
      author: { name: 'Markus Spiske', username: 'markusspiske', portfolioUrl: 'https://unsplash.com/@markusspiske' },
      source: 'Unsplash',
      likes: 980,
    },
    {
      id: 'uns-finance-1',
      thumbUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1920&q=80',
      alt: 'نمودار تحلیل بازار سرمایه و سهام',
      author: { name: 'Maxim Hopman', username: 'hopman', portfolioUrl: 'https://unsplash.com/@hopman' },
      source: 'Unsplash',
      likes: 1120,
    },
    {
      id: 'uns-tech-chip',
      thumbUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1920&q=80',
      alt: 'چیپست پردازنده سخت‌افزاری و بردهای الکترونیکی',
      author: { name: 'Alexandre Debiève', username: 'alexandre_debieve', portfolioUrl: 'https://unsplash.com/@alexandre_debieve' },
      source: 'Unsplash',
      likes: 2100,
    },
    {
      id: 'uns-space-1',
      thumbUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80',
      alt: 'کره زمین و شبکه داده‌های ماهواره‌ای کیهان',
      author: { name: 'NASA', username: 'nasa', portfolioUrl: 'https://unsplash.com/@nasa' },
      source: 'Unsplash',
      likes: 3890,
    },
    {
      id: 'uns-crypto-1',
      thumbUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1920&q=80',
      alt: 'سکه بیت‌کوین و شبکه بلاک‌چین دیجیتال',
      author: { name: 'Executium', username: 'executium', portfolioUrl: 'https://unsplash.com/@executium' },
      source: 'Unsplash',
      likes: 850,
    },
    {
      id: 'uns-city-night',
      thumbUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=80',
      alt: 'آسمان‌خراش‌ها و کلان‌شهر مدرن در شب',
      author: { name: 'Aleksandar Pasaric', username: 'apasaric', portfolioUrl: 'https://unsplash.com/@apasaric' },
      source: 'Unsplash',
      likes: 1650,
    },
    {
      id: 'uns-nature-forest',
      thumbUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
      alt: 'جنگل مه‌آلود، طبیعت پاک و درختان کهنسال',
      author: { name: 'Sebastian Unrau', username: 'sebastian_unrau', portfolioUrl: 'https://unsplash.com/@sebastian_unrau' },
      source: 'Unsplash',
      likes: 2400,
    },
    {
      id: 'uns-startup-team',
      thumbUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1920&q=80',
      alt: 'جلسه کاری، همفکری تیم استارتاپی و لپ‌تاپ',
      author: { name: 'Annie Spratt', username: 'anniespratt', portfolioUrl: 'https://unsplash.com/@anniespratt' },
      source: 'Unsplash',
      likes: 1980,
    },
    {
      id: 'uns-dark-abstract',
      thumbUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
      alt: 'امواج سه‌بعدی انتزاعی تاریک و لوکس',
      author: { name: 'Milad Fakurian', username: 'fakurian', portfolioUrl: 'https://unsplash.com/@fakurian' },
      source: 'Unsplash',
      likes: 3120,
    },
    {
      id: 'uns-quantum-particles',
      thumbUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1920&q=80',
      alt: 'ذرات کوانتومی نوری در خلاء فضا',
      author: { name: 'Fabrizio Conti', username: 'fabrizioce', portfolioUrl: 'https://unsplash.com/@fabrizioce' },
      source: 'Unsplash',
      likes: 1470,
    },
    {
      id: 'uns-cinema-lens',
      thumbUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80',
      fullUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1920&q=80',
      alt: 'لنز دوربین سینمایی و نور استودیو فیلم‌برداری',
      author: { name: 'Jakob Owens', username: 'jakobowens1', portfolioUrl: 'https://unsplash.com/@jakobowens1' },
      source: 'Unsplash',
      likes: 2750,
    },
  ];

  if (!query) {
    return { results: curatedCatalog, total: curatedCatalog.length, source: 'Curated Unsplash' };
  }

  const q = query.toLowerCase();
  const filtered = curatedCatalog.filter(
    (item) => item.alt.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
  );

  return {
    results: filtered.length > 0 ? filtered : curatedCatalog,
    total: filtered.length > 0 ? filtered.length : curatedCatalog.length,
    source: 'Curated Unsplash',
  };
}
