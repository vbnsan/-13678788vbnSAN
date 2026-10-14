export type GapGptTextModel =
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3-5-sonnet'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash'
  | 'deepseek-chat'
  | 'gapgpt-4'
  | 'gapgpt-lite';

export type GapGptImageModel =
  | 'flux'
  | 'flux-schnell'
  | 'flux-dev'
  | 'midjourney'
  | 'dall-e-3'
  | 'stable-diffusion-3';

export type GapGptVoiceModel = 'tts-1' | 'tts-1-hd';

export type GapGptVoiceName =
  | 'alloy'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'shimmer';

export type MotionVisualPreset =
  | '3d-clay-glass'
  | 'cyberpunk-neon'
  | 'luxury-gold-dark'
  | 'cinematic-photoreal'
  | 'isometric-tech'
  | 'abstract-fluid'
  | 'kinetic-minimal'
  | 'flat-vector-trend';

export interface MotionVisualPresetInfo {
  id: MotionVisualPreset;
  titleFa: string;
  descriptionFa: string;
  promptPrefix: string;
  recommendedPalette: {
    bg: string;
    fg: string;
    accent: string;
  };
  sampleTag: string;
}

export interface GapGptModelInfo {
  id: string;
  name: string;
  providerName: string;
  category: 'text' | 'image' | 'audio';
  pricingTier: 'free' | 'eco' | 'plus' | 'pro';
  descriptionFa: string;
  recommendedFor: string;
  approxCostFa: string;
  badge?: string;
}

export interface ScriptRewriteItem {
  segmentId: string;
  originalText: string;
  rewrittenText: string;
  hookHeadlineFa?: string;
  emphasisWords: number[];
  segmentKind: 'caption' | 'stat' | 'quote' | 'title';
  imagePromptEn: string;
  soundEffectHint?: 'whoosh' | 'impact' | 'glitch' | 'riser' | 'none';
  selected?: boolean;
}

export interface GeneratedAiImageItem {
  id: string;
  segmentId?: string;
  imageUrl: string;
  prompt: string;
  model: GapGptImageModel;
  stylePreset: MotionVisualPreset;
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
  provider: 'gapgpt' | 'gemini' | 'canvas-gen';
}

export interface GapGptSettings {
  apiKey: string;
  textModel: GapGptTextModel;
  imageModel: GapGptImageModel;
  voiceModel: GapGptVoiceModel;
  voiceName: GapGptVoiceName;
  defaultVisualPreset: MotionVisualPreset;
  aspectRatio: '16:9' | '9:16' | '1:1';
  autoApplyToPlan: boolean;
}
