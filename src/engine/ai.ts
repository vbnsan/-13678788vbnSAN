import { MotionPlan } from '../types/motion';

export interface AiEnhanceOptions {
  provider: 'gemini' | 'deepseek';
  apiKey?: string;
  model?: string;
}

export interface AiEnhanceResult {
  plan: MotionPlan;
  estimatedTokens: number;
  providerUsed: string;
}

export async function enhancePlanWithAi(
  plan: MotionPlan,
  options: AiEnhanceOptions
): Promise<AiEnhanceResult> {
  const segmentsToEnhance = plan.segments
    .filter(s => s.kind !== 'title' && s.kind !== 'outro')
    .slice(0, 30); // Cap at 30 segments to minimize token usage

  if (segmentsToEnhance.length === 0) {
    return { plan, estimatedTokens: 0, providerUsed: options.provider };
  }

  const payload = segmentsToEnhance.map((s, idx) => ({
    i: idx,
    t: s.text.substring(0, 50),
  }));

  try {
    const response = await fetch('/api/ai-enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: options.provider,
        apiKey: options.apiKey,
        model: options.model,
        items: payload,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'AI request failed' }));
      throw new Error(err.error || 'خطا در ارتباط با سرویس هوش مصنوعی');
    }

    const data = await response.json();
    const suggestions: Array<{ i: number; kind?: 'caption' | 'stat' | 'quote'; em?: number[] }> = data.suggestions || [];

    const updatedPlan: MotionPlan = {
      ...plan,
      segments: plan.segments.map(s => {
        const segIdx = segmentsToEnhance.findIndex(item => item.id === s.id);
        if (segIdx === -1) return s;

        const match = suggestions.find(item => item.i === segIdx);
        if (!match) return s;

        return {
          ...s,
          kind: match.kind && ['caption', 'stat', 'quote'].includes(match.kind) ? match.kind : s.kind,
          em: Array.isArray(match.em) && match.em.length > 0 ? match.em : s.em,
        };
      }),
    };

    return {
      plan: updatedPlan,
      estimatedTokens: data.estimatedTokens || 120,
      providerUsed: options.provider,
    };
  } catch (error: any) {
    console.warn('AI enhancement fallback:', error);
    throw error;
  }
}
