import gsap from 'gsap';
import {
  MotionPlan,
  MotionSegment,
  MotionTheme,
  SegmentKind,
  GsapLayerConfig,
  GsapTransitionType,
  GsapEasingType,
  GsapAccentEffect,
} from '../types/motion';

export interface GsapPreset {
  id: string;
  name: string;
  nameFa: string;
  description: string;
  config: GsapLayerConfig;
  previewBg: string;
}

export const GSAP_PRESETS: GsapPreset[] = [
  {
    id: 'cinematic-3d',
    name: 'Cinematic 3D Flip',
    nameFa: 'سینمایی چرخش سه‌بعدی و فلر',
    description: 'عمق پرسپکتیو، ورود سه‌بعدی لایه‌ها، فلر نوری و جهش کنتراست After Effects',
    config: {
      entrance: 'kinetic-3d-flip',
      easing: 'power4.out',
      duration: 0.85,
      stagger: 0.04,
      accent: 'optical-flare',
      perspective3D: 1000,
      cameraParallax: true,
      chromaticGlitch: false,
      overshoot: 1.2,
    },
    previewBg: 'from-amber-600/30 to-rose-950/40',
  },
  {
    id: 'cyberpunk-hud',
    name: 'Cyberpunk HUD & Scanline',
    nameFa: 'سایبرپانک HUD و اسکن‌لاین',
    description: 'خطوط اسکن نئونی، گلیچ رنگی RGB، سرعت بالا و انیمیشن لایه‌های تکنو',
    config: {
      entrance: 'glitch-rgb-flicker',
      easing: 'circ.inOut',
      duration: 0.65,
      stagger: 0.025,
      accent: 'scanline-sweep',
      perspective3D: 800,
      cameraParallax: true,
      chromaticGlitch: true,
      overshoot: 0.6,
    },
    previewBg: 'from-cyan-600/30 to-fuchsia-950/40',
  },
  {
    id: 'elastic-bounce',
    name: 'Elastic Spring Pop',
    nameFa: 'جهش الاستیک و ذرات انفجاری',
    description: 'فنریت فیزیکی افترافکت، پاپ‌آپ ریتمیک کلمات و انفجار ذرات هندسی',
    config: {
      entrance: 'elastic-pop',
      easing: 'elastic.out(1, 0.4)',
      duration: 0.95,
      stagger: 0.05,
      accent: 'burst-particles',
      perspective3D: 600,
      cameraParallax: false,
      chromaticGlitch: false,
      overshoot: 2.2,
    },
    previewBg: 'from-emerald-600/30 to-teal-950/40',
  },
  {
    id: 'mask-reveal',
    name: 'Kinetic Clip-Mask (Swiss AE)',
    nameFa: 'ماسک کراپ متحرک سوئیسی',
    description: 'نمایان‌شدن کات‌دار از پشت ماسک هندسی بدون اوورشوت، فوق‌العاده تمیز و مدرن',
    config: {
      entrance: 'clip-mask-reveal',
      easing: 'expo.out',
      duration: 0.75,
      stagger: 0.03,
      accent: 'crosshair-target',
      perspective3D: 0,
      cameraParallax: true,
      chromaticGlitch: false,
      overshoot: 0,
    },
    previewBg: 'from-blue-600/30 to-slate-950/40',
  },
  {
    id: 'stagger-slide',
    name: 'Split Stagger Slide',
    nameFa: 'اسلاید تفکیکی کلمات با جهش',
    description: 'حرکت پلکانی کلمات از جهات متناوب با اوورشوت نرم و حلقه‌های نئونی',
    config: {
      entrance: 'split-stagger-slide',
      easing: 'back.out(2)',
      duration: 0.8,
      stagger: 0.035,
      accent: 'neon-rings',
      perspective3D: 750,
      cameraParallax: true,
      chromaticGlitch: false,
      overshoot: 1.8,
    },
    previewBg: 'from-violet-600/30 to-purple-950/40',
  },
  {
    id: 'flare-push',
    name: 'Cinematic Push & Flare',
    nameFa: 'پوش دراماتیک و فلر هالیوودی',
    description: 'زوم دوربین رو به جلو همراه با فلر نوری متحرک و تپش نور پس‌زمینه',
    config: {
      entrance: 'cinematic-flare-push',
      easing: 'power4.out',
      duration: 1.0,
      stagger: 0.045,
      accent: 'optical-flare',
      perspective3D: 1200,
      cameraParallax: true,
      chromaticGlitch: false,
      overshoot: 1.0,
    },
    previewBg: 'from-orange-600/30 to-amber-950/40',
  },
];

export function getDefaultGsapConfigForKind(kind: SegmentKind): GsapLayerConfig {
  switch (kind) {
    case 'quote':
      return { ...GSAP_PRESETS[0].config }; // cinematic-3d
    case 'stat':
    case 'gauge':
    case 'chart':
      return { ...GSAP_PRESETS[1].config }; // cyberpunk / tech
    case 'math':
      return { ...GSAP_PRESETS[3].config }; // mask reveal swiss
    case 'comparison':
      return { ...GSAP_PRESETS[4].config }; // split stagger slide
    case 'lower-third':
    case 'title':
      return { ...GSAP_PRESETS[5].config }; // flare push
    default:
      return { ...GSAP_PRESETS[0].config };
  }
}

/**
 * Builds and mounts an active GSAP timeline onto a DOM stage container
 */
export function mountGsapSegmentAnimation(
  container: HTMLElement,
  seg: MotionSegment,
  theme: MotionTheme,
  onComplete?: () => void
): gsap.core.Timeline {
  const cfg = seg.gsapConfig || getDefaultGsapConfigForKind(seg.kind);
  const tl = gsap.timeline({
    paused: true,
    onComplete,
  });

  // Layer 1: Background Ken Burns & Camera Parallax
  const bgEl = container.querySelector('.gsap-layer-bg');
  if (bgEl) {
    gsap.set(bgEl, { scale: 1, rotation: 0, opacity: 0.85 });
    if (cfg.cameraParallax) {
      tl.to(
        bgEl,
        {
          scale: 1.12,
          rotation: 0.4,
          duration: Math.max(3, seg.to - seg.from),
          ease: 'power1.out',
        },
        0
      );
    }
  }

  // Layer 2: AE Accent VFX (Burst, Neon rings, Scanline, Flare)
  const fxEl = container.querySelector('.gsap-layer-accent');
  if (fxEl) {
    gsap.set(fxEl, { opacity: 0, scale: 0.5 });
    if (cfg.accent === 'burst-particles') {
      tl.fromTo(
        fxEl,
        { opacity: 0, scale: 0.2, rotation: -30 },
        { opacity: 1, scale: 1.25, rotation: 15, duration: 0.6, ease: 'power2.out' },
        0.05
      ).to(fxEl, { opacity: 0.2, scale: 1.4, duration: 1.2, ease: 'power1.out' }, 0.65);
    } else if (cfg.accent === 'neon-rings') {
      tl.fromTo(
        fxEl,
        { opacity: 0, scale: 0.4 },
        { opacity: 0.9, scale: 1.1, duration: 0.7, ease: 'back.out(1.5)' },
        0.1
      ).to(fxEl, { opacity: 0.4, scale: 1.15, repeat: -1, yoyo: true, duration: 1.5, ease: 'sine.inOut' }, 0.8);
    } else if (cfg.accent === 'scanline-sweep') {
      const line = container.querySelector('.gsap-scanline-beam');
      if (line) {
        tl.fromTo(line, { y: -100, opacity: 0 }, { y: 600, opacity: 0.8, duration: 1.4, ease: 'power2.inOut' }, 0.1);
      }
    } else if (cfg.accent === 'optical-flare') {
      tl.fromTo(
        fxEl,
        { opacity: 0, x: -150, scaleX: 0.3 },
        { opacity: 1, x: 50, scaleX: 1.4, duration: 0.9, ease: 'power3.out' },
        0.05
      ).to(fxEl, { opacity: 0.3, duration: 0.8 }, 0.95);
    }
  }

  // Layer 3: Visual Card / Chart / Formula Layer
  const cardEl = container.querySelector('.gsap-layer-visual');
  if (cardEl) {
    gsap.set(cardEl, { transformPerspective: cfg.perspective3D || 800 });
    tl.fromTo(
      cardEl,
      {
        opacity: 0,
        y: 40,
        scale: 0.88,
        rotationX: cfg.entrance === 'kinetic-3d-flip' ? 25 : 0,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        duration: cfg.duration,
        ease: cfg.easing,
      },
      0.15
    );

    // Number counters if any
    const counterEl = container.querySelector('.gsap-counter-num');
    if (counterEl && seg.visualData?.value !== undefined) {
      const val = seg.visualData.value;
      const obj = { val: 0 };
      tl.to(
        obj,
        {
          val,
          duration: 1.2,
          ease: 'power3.out',
          onUpdate: () => {
            counterEl.textContent = Math.round(obj.val).toLocaleString('fa-IR');
          },
        },
        0.2
      );
    }

    // Chart bars fill
    const bars = container.querySelectorAll('.gsap-bar-fill');
    if (bars.length > 0) {
      tl.fromTo(
        bars,
        { scaleX: 0, transformOrigin: 'right center' },
        { scaleX: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
        0.3
      );
    }
  }

  // Layer 4: Kinetic Split Typography
  const wordEls = container.querySelectorAll('.gsap-word-unit');
  if (wordEls.length > 0) {
    if (cfg.entrance === 'kinetic-3d-flip') {
      tl.fromTo(
        wordEls,
        {
          opacity: 0,
          y: 45,
          rotateX: -85,
          scale: 0.8,
          transformPerspective: cfg.perspective3D || 900,
          transformOrigin: '50% 100%',
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          scale: 1,
          duration: cfg.duration,
          stagger: cfg.stagger,
          ease: cfg.easing,
        },
        0.25
      );
    } else if (cfg.entrance === 'elastic-pop') {
      tl.fromTo(
        wordEls,
        {
          opacity: 0,
          scale: 0.2,
          y: 30,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: cfg.duration,
          stagger: cfg.stagger,
          ease: cfg.easing,
        },
        0.2
      );
    } else if (cfg.entrance === 'clip-mask-reveal') {
      tl.fromTo(
        wordEls,
        {
          yPercent: 120,
          opacity: 0,
        },
        {
          yPercent: 0,
          opacity: 1,
          duration: cfg.duration,
          stagger: cfg.stagger,
          ease: cfg.easing,
        },
        0.2
      );
    } else if (cfg.entrance === 'glitch-rgb-flicker') {
      tl.fromTo(
        wordEls,
        {
          opacity: 0,
          x: (i) => (i % 2 === 0 ? -25 : 25),
          skewX: 15,
        },
        {
          opacity: 1,
          x: 0,
          skewX: 0,
          duration: cfg.duration * 0.8,
          stagger: cfg.stagger,
          ease: 'power2.out',
        },
        0.15
      );
    } else {
      // split-stagger-slide / default
      tl.fromTo(
        wordEls,
        {
          opacity: 0,
          y: 35,
          rotate: (i) => (i % 2 === 0 ? -4 : 4),
        },
        {
          opacity: 1,
          y: 0,
          rotate: 0,
          duration: cfg.duration,
          stagger: cfg.stagger,
          ease: cfg.easing,
        },
        0.2
      );
    }
  }

  // Layer 5: Emphasized word flares
  const emEls = container.querySelectorAll('.gsap-em-word');
  if (emEls.length > 0) {
    tl.to(
      emEls,
      {
        scale: 1.08,
        color: theme.accent || '#ea580c',
        textShadow: `0 0 20px ${theme.accent || '#ea580c'}88`,
        duration: 0.35,
        ease: 'power2.out',
      },
      0.5
    );
  }

  // Layer 6: Badges & Lower-Thirds
  const badgeEl = container.querySelector('.gsap-layer-badge');
  if (badgeEl) {
    tl.fromTo(
      badgeEl,
      { opacity: 0, scale: 0.7, y: -10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(2)' },
      0.3
    );
  }

  return tl;
}

/**
 * Generates an executable GSAP JavaScript snippet for After Effects / Remotion export
 */
export function generateGsapSnippet(seg: MotionSegment, theme?: MotionTheme): string {
  const cfg = seg.gsapConfig || getDefaultGsapConfigForKind(seg.kind);
  const accent = theme?.accent || '#ea580c';

  return `// After Effects / Web Motion Code via GSAP
// Segment #${seg.id} [${seg.from.toFixed(1)}s -> ${seg.to.toFixed(1)}s] - Type: ${seg.kind}
const tl = gsap.timeline({ defaults: { ease: "${cfg.easing}" } });

// 1. Camera & Background Parallax
tl.to(".bg-layer", {
  scale: 1.15,
  rotation: 0.5,
  duration: ${(seg.to - seg.from).toFixed(1)},
  ease: "power1.out"
}, 0);

// 2. VFX Accent Layer (${cfg.accent})
${
  cfg.accent === 'burst-particles'
    ? `tl.fromTo(".burst-particles circle", 
    { scale: 0, opacity: 1 }, 
    { scale: 1.5, opacity: 0, stagger: 0.03, duration: 0.75, ease: "power2.out" }, 0.05);`
    : cfg.accent === 'scanline-sweep'
    ? `tl.fromTo(".scanline-laser", { y: -80, opacity: 0 }, { y: 550, opacity: 0.85, duration: 1.2, ease: "power2.inOut" }, 0.1);`
    : cfg.accent === 'optical-flare'
    ? `tl.fromTo(".lens-flare", { x: -200, opacity: 0, scaleX: 0.3 }, { x: 50, opacity: 1, scaleX: 1.5, duration: 0.85, ease: "power3.out" }, 0.05);`
    : `// Subtle ambient glow
tl.fromTo(".ambient-glow", { opacity: 0 }, { opacity: 0.7, duration: 0.8 }, 0.1);`
}

// 3. Kinetic Split-Text Animation (${cfg.entrance})
tl.fromTo(".word-unit", {
  opacity: 0,
  y: 40,
  rotateX: ${cfg.entrance === 'kinetic-3d-flip' ? -80 : 0},
  scale: ${cfg.entrance === 'elastic-pop' ? 0.3 : 0.85},
  transformPerspective: ${cfg.perspective3D || 900}
}, {
  opacity: 1,
  y: 0,
  rotateX: 0,
  scale: 1,
  duration: ${cfg.duration},
  stagger: ${cfg.stagger},
  ease: "${cfg.easing}"
}, 0.2);

// 4. Keyword Ignite Flare
tl.to(".word-unit.is-emphasized", {
  scale: 1.08,
  color: "${accent}",
  textShadow: "0 0 24px ${accent}",
  duration: 0.4,
  ease: "back.out(1.7)"
}, 0.5);

// 5. Visual Asset / InfoCard Pop
tl.fromTo(".visual-card", {
  opacity: 0,
  scale: 0.85,
  y: 30
}, {
  opacity: 1,
  scale: 1,
  y: 0,
  duration: 0.6,
  ease: "back.out(1.8)"
}, 0.25);
`;
}

/**
 * Generates a full standalone HTML document running GSAP
 */
export function generateGsapStandaloneHtml(plan: MotionPlan): string {
  const serializedPlan = JSON.stringify(plan);
  const title = plan.meta.title || 'موشن‌گرافیک پیشرفته GSAP';

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - رندر شده با GSAP و After Effects Engine</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net">
  <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09080c;
      color: #f5f0e8;
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
    }
    .motion-viewport {
      position: relative;
      width: 100%;
      max-width: 960px;
      aspect-ratio: 16/9;
      background: #0b0910;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 60px -15px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1);
      perspective: 1000px;
    }
    .layer { position: absolute; inset: 0; pointer-events: none; }
    .bg-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform-origin: center center;
    }
    .dim-overlay {
      position: absolute;
      inset: 0;
      background: rgba(9, 8, 12, 0.65);
      backdrop-filter: blur(2px);
    }
    .vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%);
    }
    .stage-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      text-align: center;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(234, 88, 12, 0.2);
      border: 1px solid rgba(234, 88, 12, 0.4);
      color: #fb923c;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 20px;
    }
    .headline {
      font-size: clamp(24px, 4.5vw, 48px);
      font-weight: 900;
      line-height: 1.4;
      max-width: 820px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px 12px;
    }
    .word-unit {
      display: inline-block;
      transform-origin: 50% 100%;
      will-change: transform, opacity;
    }
    .word-unit.is-em {
      color: #f97316;
      text-shadow: 0 0 25px rgba(249, 115, 22, 0.6);
    }
    .visual-card {
      margin-top: 24px;
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      padding: 16px 28px;
      display: inline-flex;
      align-items: center;
      gap: 16px;
    }
    .counter-val {
      font-size: 38px;
      font-weight: 900;
      color: #fbbf24;
      font-family: monospace;
    }
    /* Controls Bar */
    .controls {
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      padding: 10px 18px;
      border-radius: 12px;
    }
    .btn {
      background: #ea580c;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      transition: 0.2s;
    }
    .btn:hover { background: #f97316; }
    .btn-secondary {
      background: rgba(255,255,255,0.1);
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .time-readout { font-family: monospace; font-size: 12px; color: rgba(255,255,255,0.6); }
    .scrubber {
      width: 220px;
      accent-color: #ea580c;
    }
  </style>
</head>
<body>
  <div class="motion-viewport" id="viewport">
    <div class="layer bg-layer" id="bgLayer">
      <img id="bgImg" class="bg-img" src="" style="display: none;" alt="Background" />
      <div class="dim-overlay"></div>
      <div class="vignette"></div>
    </div>

    <div class="stage-content" id="stageContent">
      <div id="badgeContainer"></div>
      <div class="headline" id="headlineContainer"></div>
      <div id="visualContainer"></div>
    </div>
  </div>

  <div class="controls">
    <button class="btn" id="playBtn">پخش / توقف</button>
    <button class="btn btn-secondary" id="restartBtn">شروع مجدد</button>
    <input type="range" id="scrubber" class="scrubber" min="0" max="100" value="0" />
    <span class="time-readout" id="timeDisplay">0.0s / 0.0s</span>
    <span style="font-size: 11px; color: #f97316; font-weight: bold;">موتور ۶۰ فریم GSAP</span>
  </div>

  <script>
    const PLAN = ${serializedPlan};
    const segments = PLAN.segments || [];
    const totalDuration = PLAN.meta.duration || 10;

    let currentSegIdx = -1;
    let masterTimeline = gsap.timeline({ paused: true });

    const headlineEl = document.getElementById('headlineContainer');
    const badgeEl = document.getElementById('badgeContainer');
    const visualEl = document.getElementById('visualContainer');
    const bgImg = document.getElementById('bgImg');
    const playBtn = document.getElementById('playBtn');
    const restartBtn = document.getElementById('restartBtn');
    const scrubber = document.getElementById('scrubber');
    const timeDisplay = document.getElementById('timeDisplay');

    // Build timeline for all segments
    segments.forEach((seg, idx) => {
      masterTimeline.add(() => {
        renderSegment(seg, idx);
      }, seg.from);
    });

    masterTimeline.to({}, { duration: totalDuration });

    masterTimeline.eventCallback('onUpdate', () => {
      const cur = masterTimeline.time();
      const progress = (cur / totalDuration) * 100;
      scrubber.value = progress;
      timeDisplay.textContent = cur.toFixed(1) + 's / ' + totalDuration.toFixed(1) + 's';
    });

    function renderSegment(seg, idx) {
      if (currentSegIdx === idx) return;
      currentSegIdx = idx;

      // Update background
      if (seg.backgroundImage) {
        bgImg.src = seg.backgroundImage;
        bgImg.style.display = 'block';
        gsap.fromTo(bgImg, { scale: 1 }, { scale: 1.14, duration: seg.to - seg.from, ease: 'power1.out' });
      } else {
        bgImg.style.display = 'none';
      }

      // Update badge
      if (seg.kind !== 'caption') {
        const labels = {
          stat: 'آمار و تحلیل داده',
          quote: 'نقل قول ویژه',
          chart: 'نمودار رشد',
          formula: 'فرمول علمی Manim',
          gauge: 'شاخص عملکردی'
        };
        badgeEl.innerHTML = '<div class="badge-pill">' + (labels[seg.kind] || seg.kind) + '</div>';
        gsap.fromTo(badgeEl.firstChild, { opacity: 0, y: -15, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' });
      } else {
        badgeEl.innerHTML = '';
      }

      // Kinetic words
      const words = seg.text.split(/\\s+/);
      headlineEl.innerHTML = words.map((w, wIdx) => {
        const isEm = seg.em && seg.em.includes(wIdx);
        return '<span class="word-unit' + (isEm ? ' is-em' : '') + '">' + w + '</span>';
      }).join(' ');

      const cfg = seg.gsapConfig || {
        entrance: 'kinetic-3d-flip',
        easing: 'power4.out',
        duration: 0.75,
        stagger: 0.035,
        perspective3D: 1000
      };

      const wordUnits = headlineEl.querySelectorAll('.word-unit');
      gsap.fromTo(wordUnits, {
        opacity: 0,
        y: 40,
        rotateX: cfg.entrance === 'kinetic-3d-flip' ? -80 : 0,
        scale: cfg.entrance === 'elastic-pop' ? 0.3 : 0.85
      }, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        duration: cfg.duration,
        stagger: cfg.stagger,
        ease: cfg.easing
      });

      // Visual data card
      if (seg.visualData && seg.visualData.value !== undefined) {
        visualEl.innerHTML = '<div class="visual-card"><span style="color:#aaa; font-size:14px;">' + (seg.visualData.label || 'شاخص') + '</span><span class="counter-val" id="cntVal">0</span></div>';
        const targetVal = seg.visualData.value;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: targetVal,
          duration: 1.2,
          ease: 'power3.out',
          onUpdate: () => {
            const el = document.getElementById('cntVal');
            if (el) el.textContent = Math.round(obj.v).toLocaleString('fa-IR');
          }
        });
      } else {
        visualEl.innerHTML = '';
      }
    }

    // Initialize first segment
    if (segments.length > 0) {
      renderSegment(segments[0], 0);
    }

    playBtn.addEventListener('click', () => {
      if (masterTimeline.paused()) {
        masterTimeline.play();
        playBtn.textContent = 'توقف';
      } else {
        masterTimeline.pause();
        playBtn.textContent = 'پخش';
      }
    });

    restartBtn.addEventListener('click', () => {
      currentSegIdx = -1;
      masterTimeline.restart();
      playBtn.textContent = 'توقف';
    });

    scrubber.addEventListener('input', (e) => {
      const p = parseFloat(e.target.value) / 100;
      masterTimeline.pause();
      masterTimeline.time(p * totalDuration);
      playBtn.textContent = 'پخش';
    });
  </script>
</body>
</html>`;
}
