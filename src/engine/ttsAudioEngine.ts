import { MotionPlan, MotionSegment, SegmentAudioTrack, NarrationSettings } from '../types/motion';

export interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'female' | 'male' | 'neutral';
  style: string;
  provider: 'google-translate' | 'web-speech' | 'gemini' | 'custom';
}

export const DEFAULT_VOICE_OPTIONS: VoiceOption[] = [
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
    name: 'سخنگوی مرورگر (Web Speech API)',
    lang: 'fa',
    gender: 'neutral',
    style: 'موتور صوتی بومی سیستم‌عامل',
    provider: 'web-speech',
  },
];

export const DEFAULT_NARRATION_SETTINGS: NarrationSettings = {
  voice: 'fa-ir-maryam',
  lang: 'fa',
  speed: 1.0,
  pitch: 1.0,
  autoSyncTimeline: true,
  gapBetweenSlides: 0.25,
  volume: 1.0,
};

// Cached AudioContext singleton for duration & waveform analysis
let sharedAudioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Fetch available voices from backend API and merge with browser local speech synthesis voices
 */
export async function getAvailableVoices(): Promise<VoiceOption[]> {
  const voices = [...DEFAULT_VOICE_OPTIONS];
  try {
    const res = await fetch('/api/tts/voices');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.voices) && data.voices.length > 0) {
        return data.voices;
      }
    }
  } catch (e) {
    console.warn('Could not fetch server voices, using defaults', e);
  }
  return voices;
}

/**
 * Decode audio buffer to extract exact duration (seconds) and normalized waveform peaks
 */
export async function analyzeAudio(audioSrc: string, barCount = 32): Promise<{ duration: number; waveform: number[] }> {
  const fallbackWaveform = Array.from({ length: barCount }, (_, i) =>
    Math.max(0.15, Math.sin((i / barCount) * Math.PI) * 0.85 + Math.random() * 0.15)
  );

  const ctx = getAudioContext();
  if (!ctx || !audioSrc) {
    return { duration: 2.5, waveform: fallbackWaveform };
  }

  try {
    // If data URL, convert to ArrayBuffer
    let arrayBuffer: ArrayBuffer;
    if (audioSrc.startsWith('data:')) {
      const base64Part = audioSrc.split(',')[1];
      const binaryString = atob(base64Part);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      const res = await fetch(audioSrc);
      arrayBuffer = await res.arrayBuffer();
    }

    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const duration = Math.round(audioBuffer.duration * 100) / 100;

    // Extract RMS waveform
    const rawData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / barCount);
    const waveform: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[start + j] || 0);
      }
      const avg = sum / blockSize;
      waveform.push(Math.max(0.12, Math.min(1.0, avg * 3.5)));
    }

    return { duration, waveform };
  } catch (err) {
    console.warn('Audio decode notice, using estimated waveform:', err);
    return { duration: 2.5, waveform: fallbackWaveform };
  }
}

/**
 * Synthesize speech for a single motion segment
 */
export async function synthesizeSegmentAudio(
  segment: MotionSegment,
  settings: Partial<NarrationSettings> = {}
): Promise<SegmentAudioTrack> {
  const mergedSettings = { ...DEFAULT_NARRATION_SETTINGS, ...settings };
  const text = segment.text.trim();

  // 1. Browser SpeechSynthesis fallback mode
  if (mergedSettings.voice === 'browser-speech' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const wordCount = text.split(/\s+/).length;
    const estSec = Math.max(1.5, Math.round(((wordCount / 2.25) / mergedSettings.speed) * 10) / 10);
    const fakeWave = Array.from({ length: 28 }, (_, i) => Math.max(0.15, Math.sin((i / 28) * Math.PI) * 0.9));

    return {
      id: `audio-${segment.id}`,
      src: '',
      duration: estSec,
      voice: 'browser-speech',
      provider: 'web-speech',
      speed: mergedSettings.speed,
      pitch: mergedSettings.pitch,
      volume: mergedSettings.volume,
      waveform: fakeWave,
      status: 'ready',
    };
  }

  // 2. Server-side TTS synthesis
  try {
    const response = await fetch('/api/tts/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        lang: mergedSettings.lang,
        speed: mergedSettings.speed,
        voice: mergedSettings.voice,
      }),
    });

    if (!response.ok) {
      throw new Error(`خطای سرور صوتی (${response.status})`);
    }

    const data = await response.json();
    const audioUrl = data.audioUrl;

    // Analyze exact duration & sound wave
    let duration = data.duration || 2.5;
    let waveform = Array.from({ length: 28 }, () => 0.5);

    if (audioUrl) {
      const analysis = await analyzeAudio(audioUrl, 28);
      if (analysis.duration > 0.5) {
        duration = analysis.duration;
      }
      waveform = analysis.waveform;
    }

    return {
      id: `audio-${segment.id}`,
      src: audioUrl,
      duration,
      voice: mergedSettings.voice,
      provider: data.provider || 'google-translate',
      speed: mergedSettings.speed,
      pitch: mergedSettings.pitch,
      volume: mergedSettings.volume,
      waveform,
      status: 'ready',
    };
  } catch (err: any) {
    console.error('Error synthesizing audio:', err);
    return {
      id: `audio-${segment.id}`,
      src: '',
      duration: 2.5,
      voice: mergedSettings.voice,
      provider: 'google-translate',
      speed: mergedSettings.speed,
      status: 'error',
      error: err.message || 'خطا در تولید صدا',
    };
  }
}

/**
 * Synchronize motion plan segment timestamps (from and to) based on audio track durations
 */
export function syncTimelineToAudio(plan: MotionPlan, gap = 0.25): MotionPlan {
  if (!plan || !plan.segments || plan.segments.length === 0) return plan;

  let currentTime = 0;
  const updatedSegments = plan.segments.map((seg, idx) => {
    // If segment has audioTrack, use its duration; otherwise preserve existing delta
    const trackDuration = seg.audioTrack?.duration && seg.audioTrack.duration > 0.5
      ? seg.audioTrack.duration
      : Math.max(1.5, seg.to - seg.from);

    const from = Math.round(currentTime * 100) / 100;
    const to = Math.round((from + trackDuration) * 100) / 100;

    // Increment currentTime with gap for next segment
    currentTime = to + (idx < plan.segments.length - 1 ? gap : 0.5);

    return {
      ...seg,
      from,
      to,
    };
  });

  const totalDuration = Math.round((currentTime) * 10) / 10;

  return {
    ...plan,
    meta: {
      ...plan.meta,
      duration: Math.max(totalDuration, 3.0),
    },
    segments: updatedSegments,
  };
}

/**
 * Encode an AudioBuffer to a WAV Blob
 */
function bufferToWavBlob(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = abuffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  // format chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16);         // length = 16
  setUint16(1);          // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);              // block-align
  setUint16(16);                         // 16-bit

  // data chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (offset < abuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Mix all segment audio tracks into a single master audio track aligned with timeline timestamps
 */
export async function bakeMasterSoundtrack(plan: MotionPlan): Promise<{ src: string; duration: number } | null> {
  const ctx = getAudioContext();
  if (!ctx || !plan.segments || plan.segments.length === 0) return null;

  const validSegments = plan.segments.filter((s) => s.audioTrack && s.audioTrack.src);
  if (validSegments.length === 0) return null;

  try {
    const totalDuration = Math.max(plan.meta.duration, validSegments[validSegments.length - 1].to + 1);
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(totalDuration * sampleRate), sampleRate);

    // Decode all segments concurrently
    await Promise.all(
      validSegments.map(async (seg) => {
        if (!seg.audioTrack?.src) return;
        try {
          let arrayBuffer: ArrayBuffer;
          if (seg.audioTrack.src.startsWith('data:')) {
            const base64 = seg.audioTrack.src.split(',')[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            arrayBuffer = bytes.buffer;
          } else {
            const res = await fetch(seg.audioTrack.src);
            arrayBuffer = await res.arrayBuffer();
          }

          const decoded = await offlineCtx.decodeAudioData(arrayBuffer);
          const sourceNode = offlineCtx.createBufferSource();
          sourceNode.buffer = decoded;

          const gainNode = offlineCtx.createGain();
          gainNode.gain.value = seg.audioTrack.volume ?? 1.0;

          sourceNode.connect(gainNode);
          gainNode.connect(offlineCtx.destination);

          // Trigger speech at the segment's starting timestamp
          sourceNode.start(Math.max(0, seg.from));
        } catch (e) {
          console.warn(`Could not mix audio segment ${seg.id}:`, e);
        }
      })
    );

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = bufferToWavBlob(renderedBuffer);

    // Convert blob to Data URL for persistence
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          src: reader.result as string,
          duration: totalDuration,
        });
      };
      reader.readAsDataURL(wavBlob);
    });
  } catch (err) {
    console.error('Failed to bake master soundtrack:', err);
    return null;
  }
}

/**
 * Preview playback controller for individual audio or SpeechSynthesis
 */
export class AudioPreviewPlayer {
  private static activeAudio: HTMLAudioElement | null = null;

  public static play(src: string, onEnd?: () => void, speed = 1.0, volume = 1.0) {
    this.stop();
    if (!src) return;

    try {
      const audio = new Audio(src);
      audio.playbackRate = speed;
      audio.volume = volume;
      audio.onended = () => {
        this.activeAudio = null;
        if (onEnd) onEnd();
      };
      this.activeAudio = audio;
      audio.play().catch((e) => console.warn('Audio playback error', e));
    } catch (e) {
      console.warn('Cannot play audio preview', e);
    }
  }

  public static speakText(text: string, lang = 'fa-IR', speed = 1.0, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = speed;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  }

  public static stop() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}
