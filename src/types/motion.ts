export type SegmentKind = 'caption' | 'stat' | 'quote' | 'title' | 'outro' | 'chart' | 'gauge' | 'comparison' | 'math' | 'lower-third';

export type CaptionMode = 'word-spring' | 'swipe-highlight' | 'word-pop' | 'line-fade' | 'kinetic-slide' | 'neon-glow' | 'typewriter';

export type BackgroundEffect = 'none' | 'particles' | 'grid' | 'vignette' | 'bokeh' | 'waveform-ring' | 'plexus' | 'manim-grid' | 'chromatic';

export interface VisualData {
  chartType?: 'bar' | 'radial' | 'comparison' | 'counter' | 'formula';
  value?: number;
  target?: number;
  label?: string;
  badge?: string;
  trend?: 'up' | 'down' | 'neutral';
  items?: Array<{ label: string; value: number; color?: string; sublabel?: string }>;
  comparison?: {
    itemA: { label: string; value: string; isWinner?: boolean };
    itemB: { label: string; value: string; isWinner?: boolean };
  };
  formula?: string;
  author?: string;
  role?: string;
}

export interface ImageCredit {
  author: string;
  authorUrl?: string;
  source: 'Unsplash' | 'Wikimedia' | 'Curated' | 'Custom';
  photoUrl?: string;
}

export interface StockImageItem {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  downloadUrl?: string;
  alt: string;
  width?: number;
  height?: number;
  author: {
    name: string;
    username?: string;
    portfolioUrl?: string;
  };
  source: 'Unsplash' | 'Wikimedia' | 'Curated' | 'Custom';
  likes?: number;
}

export interface MotionSegment {
  id: string;
  from: number; // in seconds
  to: number;   // in seconds
  text: string;
  kind: SegmentKind;
  em: number[]; // indices of emphasized words
  visualData?: VisualData;
  backgroundImage?: string;
  backgroundDim?: number;   // 0 to 1, default 0.6
  backgroundBlur?: number;  // blur in px, default 0
  kenBurns?: boolean;        // slow cinematic zoom/pan
  imageKeywords?: string;
  imageCredit?: ImageCredit;
  gsapConfig?: GsapLayerConfig;
  audioTrack?: SegmentAudioTrack;
}

export interface SegmentAudioTrack {
  id: string;
  src: string;          // base64 data URL or external URL
  duration: number;     // duration in seconds
  voice?: string;       // e.g. 'fa-ir-maryam', 'fa-ir-nima', 'en-us-studio'
  provider?: 'google-translate' | 'web-speech' | 'gemini' | 'custom';
  speed?: number;       // speed factor (default 1.0)
  pitch?: number;
  volume?: number;      // 0 to 1
  waveform?: number[];  // array of normalized peak values (0 to 1) for visualizer
  status?: 'idle' | 'generating' | 'ready' | 'error';
  error?: string;
}

export interface NarrationSettings {
  voice: string;
  lang: string;
  speed: number;
  pitch: number;
  autoSyncTimeline: boolean;
  gapBetweenSlides: number; // in seconds (e.g. 0.25)
  volume: number;
}

export type GsapTransitionType =
  | 'kinetic-3d-flip'
  | 'elastic-pop'
  | 'split-stagger-slide'
  | 'clip-mask-reveal'
  | 'glitch-rgb-flicker'
  | 'cinematic-flare-push';

export type GsapEasingType =
  | 'power4.out'
  | 'elastic.out(1, 0.4)'
  | 'back.out(2)'
  | 'circ.inOut'
  | 'expo.out'
  | 'bounce.out';

export type GsapAccentEffect =
  | 'burst-particles'
  | 'neon-rings'
  | 'crosshair-target'
  | 'scanline-sweep'
  | 'optical-flare'
  | 'none';

export interface GsapLayerConfig {
  entrance: GsapTransitionType;
  easing: GsapEasingType;
  duration: number; // in seconds (e.g. 0.8)
  stagger: number;  // letter or item stagger (e.g. 0.035)
  accent: GsapAccentEffect;
  perspective3D: number; // e.g. 900
  cameraParallax: boolean;
  chromaticGlitch: boolean;
  overshoot: number; // 0 to 3
}

export interface MotionTheme {
  bg: string;
  fg: string;
  accent: string;
  secondary?: string;
  displayFont: string;
  bodyFont: string;
  grain: boolean;
  boxStyle?: 'minimal' | 'rounded' | 'frame' | 'film' | 'cyber';
  effect?: BackgroundEffect;
  ambientAnimation?: boolean;
}

export interface MotionSpringConfig {
  damping: number;
  stiffness: number;
}

export interface MotionStyle {
  captionMode: CaptionMode;
  stagger: number; // delay between words in seconds (e.g. 0.05)
  spring: MotionSpringConfig;
  captionSize: number; // base font size in px (e.g. 74)
  progressBar: boolean;
  audioBars: boolean;
  visualWidgets?: boolean; // dynamic charts & badges
  glowIntensity?: number;  // 0 to 1
}

export interface MotionRules {
  wpm: number;
  maxCharsPerLine: number;
  minSeg: number;
  maxSeg: number;
  gap: number;
  keywords: string[];
}

export interface MotionSkill {
  id: string;
  title: string;
  version: number;
  description: string;
  extends?: string;
  theme: MotionTheme;
  style: MotionStyle;
  rules: MotionRules;
  titleCard: {
    duration: number;
    enabled: boolean;
  };
  outroCard: {
    duration: number;
    text: string;
    enabled: boolean;
  };
  sampleTexts?: {
    caption?: string;
    stat?: string;
    chart?: string;
    quote?: string;
  };
}

export interface MotionPlanMeta {
  title: string;
  lang: string;
  w: number;
  h: number;
  duration: number;
  skillId: string;
  skillTitle: string;
  generatedAt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export interface MotionPlan {
  meta: MotionPlanMeta;
  theme: MotionTheme;
  style: MotionStyle;
  segments: MotionSegment[];
  audio?: {
    src: string;
    name?: string;
    duration?: number;
    isDataUrl?: boolean;
  } | null;
  narrationSettings?: NarrationSettings;
  contentAnalysis?: ContentAnalysisResult;
}

export type ContentArchetype =
  | 'technology'
  | 'news'
  | 'romantic'
  | 'cinematic'
  | 'business'
  | 'sports'
  | 'luxury';

export interface ThemeArchetypePreset {
  id: ContentArchetype;
  nameFa: string;
  nameEn: string;
  icon: string;
  description: string;
  keywords: string[];
  theme: MotionTheme;
  style: MotionStyle;
  recommendedEntrance: GsapTransitionType;
  recommendedEasing: GsapEasingType;
  recommendedAccent: GsapAccentEffect;
  speedMultiplier: number;
}

export interface ContentAnalysisResult {
  dominantTheme: ContentArchetype;
  confidence: number; // 0 to 1
  scores: Record<ContentArchetype, number>; // archetype -> score percentage 0 to 100
  sentiment: 'positive' | 'negative' | 'neutral' | 'urgent' | 'poetic' | 'analytical' | 'passionate';
  summaryFa: string;
  detectedKeywords: string[];
  avgWpm: number;
  recommendedPalette: {
    bg: string;
    fg: string;
    accent: string;
    secondary: string;
    nameFa: string;
  };
  recommendedTypography: {
    displayFont: string;
    bodyFont: string;
    captionSize: number;
    descriptionFa: string;
  };
  recommendedAnimation: {
    speedMultiplier: number;
    entrance: GsapTransitionType;
    easing: GsapEasingType;
    accent: GsapAccentEffect;
    stagger: number;
    springDamping: number;
    springStiffness: number;
    boxStyle: 'minimal' | 'rounded' | 'frame' | 'film' | 'cyber';
    effect: BackgroundEffect;
  };
  segmentSuggestions?: Array<{
    segmentId: string;
    mood: string;
    suggestedKind: SegmentKind;
    entrance: GsapTransitionType;
    accent: GsapAccentEffect;
  }>;
  analyzedAt: string;
  provider: 'local-nlp' | 'gemini' | 'deepseek';
}

export interface SkillLesson {
  id: string;
  skillId: string;
  score: number; // 1 to 5
  feedbackNote?: string;
  motionTitle: string;
  timestamp: number;
}

export type InputMode = 'srt' | 'text' | 'audio' | 'link';
