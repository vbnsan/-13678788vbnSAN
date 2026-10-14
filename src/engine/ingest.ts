export interface RawSegment {
  from: number;
  to: number;
  text: string;
}

export function parseSrt(raw: string): RawSegment[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n\s*\n/);
  const segments: RawSegment[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length < 2) continue;

    // Find the time line containing '-->'
    const timeIndex = lines[0].includes('-->') ? 0 : (lines[1]?.includes('-->') ? 1 : -1);
    if (timeIndex === -1) continue;

    const timeLine = lines[timeIndex];
    const match = timeLine.match(/(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/);
    if (!match) continue;

    const from =
      parseInt(match[1], 10) * 3600 +
      parseInt(match[2], 10) * 60 +
      parseInt(match[3], 10) +
      parseInt(match[4].padEnd(3, '0'), 10) / 1000;

    const to =
      parseInt(match[5], 10) * 3600 +
      parseInt(match[6], 10) * 60 +
      parseInt(match[7], 10) +
      parseInt(match[8].padEnd(3, '0'), 10) / 1000;

    const textLines = lines.slice(timeIndex + 1);
    const text = textLines
      .join(' ')
      .replace(/<[^>]*>/g, '') // remove HTML tags
      .trim();

    if (text) {
      segments.push({
        from: Math.max(0, from),
        to: Math.max(from + 0.4, to),
        text,
      });
    }
  }

  return segments;
}

export function parseTextToSegments(
  text: string,
  wpm: number = 150,
  gap: number = 0.15,
  maxCharsPerLine: number = 30
): RawSegment[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const sentences = clean.split(/(?<=[.!?؟:؛\n])\s+/u).filter(s => s.trim().length > 0);
  const segments: RawSegment[] = [];
  let currentTime = 0.0;

  for (const sentence of sentences) {
    const words = sentence.trim().split(/\s+/);
    // Chunk words based on max chars
    const chunks: string[] = [];
    let cur = '';

    for (const w of words) {
      const candidate = cur ? `${cur} ${w}` : w;
      if (candidate.length > maxCharsPerLine && cur) {
        chunks.push(cur);
        cur = w;
      } else {
        cur = candidate;
      }
    }
    if (cur) chunks.push(cur);

    for (const chunk of chunks) {
      const wordCount = chunk.split(/\s+/).length;
      // Duration in seconds: (words / wpm) * 60
      const duration = Math.max(1.2, (wordCount / (wpm / 60)));
      segments.push({
        from: Math.round(currentTime * 100) / 100,
        to: Math.round((currentTime + duration) * 100) / 100,
        text: chunk,
      });
      currentTime += duration + gap;
    }
  }

  return segments;
}

export function fitSegmentsToDuration(segments: RawSegment[], targetDuration: number): RawSegment[] {
  if (segments.length === 0 || targetDuration <= 0) return segments;

  const currentEnd = Math.max(...segments.map(s => s.to));
  if (currentEnd <= 0) return segments;

  const factor = targetDuration / currentEnd;
  return segments.map(s => ({
    from: Math.round(s.from * factor * 100) / 100,
    to: Math.round(s.to * factor * 100) / 100,
    text: s.text,
  }));
}

export async function extractFromUrl(url: string): Promise<{ title: string; text: string }> {
  try {
    const response = await fetch('/api/extract-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      const data = await response.json();
      return { title: data.title || '', text: data.text || '' };
    }
  } catch (err) {
    console.warn('Backend URL extraction failed, fallback to direct fetch', err);
  }

  // Fallback direct fetch (if CORS allows)
  try {
    const res = await fetch(url);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const paragraphs = Array.from(doc.querySelectorAll('p, h2, h3'))
      .map(p => p.textContent?.trim() || '')
      .filter(t => t.length > 30);

    return {
      title,
      text: paragraphs.slice(0, 10).join('\n\n'),
    };
  } catch {
    throw new Error('امکان دریافت محتوای این لینک وجود ندارد. لطفاً متن صفحه را کپی کرده و در تب متن قرار دهید.');
  }
}
