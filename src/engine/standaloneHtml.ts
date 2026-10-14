import { MotionPlan } from '../types/motion';

export function generateStandaloneHtml(plan: MotionPlan): string {
  const planJson = JSON.stringify(plan).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const title = plan.meta.title || 'موشن‌گرافیک';
  const isVertical = plan.meta.aspectRatio === '9:16';
  const isSquare = plan.meta.aspectRatio === '1:1';

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: ${plan.theme.bg || '#0e0c10'};
      --fg: ${plan.theme.fg || '#f4efe6'};
      --acc: ${plan.theme.accent || '#ff4a24'};
      --hair: rgba(255, 255, 255, 0.12);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060507;
      color: var(--fg);
      font-family: 'Vazirmatn', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      overflow-x: hidden;
    }
    .container {
      width: 100%;
      max-width: ${isVertical ? '420px' : isSquare ? '680px' : '960px'};
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 13px;
      color: rgba(244, 239, 230, 0.6);
      padding: 0 4px;
    }
    .header h1 {
      font-family: 'Lalezar', cursive;
      font-size: 22px;
      color: var(--fg);
      font-weight: normal;
    }
    .viewport {
      position: relative;
      width: 100%;
      aspect-ratio: ${isVertical ? '9 / 16' : isSquare ? '1 / 1' : '16 / 9'};
      background: var(--bg);
      border: 1px solid var(--hair);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .grain {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.05;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>");
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(20, 17, 24, 0.85);
      backdrop-filter: blur(8px);
      border: 1px solid var(--hair);
      border-radius: 12px;
      padding: 10px 14px;
    }
    button.btn {
      background: none;
      border: 0;
      color: var(--fg);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      cursor: pointer;
      transition: background 0.15s;
    }
    button.btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    button.btn svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }
    .time {
      font-size: 13px;
      color: rgba(244, 239, 230, 0.7);
      min-width: 90px;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .progress-bar {
      flex: 1;
      height: 24px;
      display: flex;
      align-items: center;
      cursor: pointer;
      position: relative;
    }
    .progress-rail {
      width: 100%;
      height: 4px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.15);
    }
    .progress-fill {
      position: absolute;
      right: 0;
      height: 4px;
      border-radius: 4px;
      background: var(--acc);
      width: 0%;
      transition: width 0.05s linear;
    }
    .speed-select {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--hair);
      border-radius: 6px;
      color: var(--fg);
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(title)}</h1>
      <span>تولیدشده با MotionStudio</span>
    </div>

    <div class="viewport" id="viewport">
      <canvas id="stage"></canvas>
      ${plan.theme.grain ? '<div class="grain"></div>' : ''}
    </div>

    <div class="controls">
      <button class="btn" id="playBtn" aria-label="پخش / توقف">
        <svg id="iconPlay" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>
        <svg id="iconPause" viewBox="0 0 24 24" style="display:none"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>
      </button>

      <span class="time" id="timeDisplay">۰:۰۰ / ۰:۰۰</span>

      <div class="progress-bar" id="progressBar">
        <div class="progress-rail"></div>
        <div class="progress-fill" id="progressFill"></div>
      </div>

      <select class="speed-select" id="speedSelect">
        <option value="0.75">0.75x</option>
        <option value="1" selected>1.0x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
      </select>
    </div>
  </div>

  <script>
    window.__PLAN__ = ${planJson};

    (function() {
      const P = window.__PLAN__;
      const TH = P.theme || {};
      const ST = P.style || {};
      const W = P.meta.w || 1920;
      const H = P.meta.h || 1080;
      const DURATION = P.meta.duration || 5.0;

      const canvas = document.getElementById('stage');
      const ctx = canvas.getContext('2d');
      canvas.width = W;
      canvas.height = H;

      const playBtn = document.getElementById('playBtn');
      const iconPlay = document.getElementById('iconPlay');
      const iconPause = document.getElementById('iconPause');
      const timeDisplay = document.getElementById('timeDisplay');
      const progressBar = document.getElementById('progressBar');
      const progressFill = document.getElementById('progressFill');
      const speedSelect = document.getElementById('speedSelect');

      let currentTime = 0;
      let isPlaying = false;
      let playbackRate = 1.0;
      let lastTimestamp = 0;

      // Audio setup (if present)
      let audio = null;
      let analyser = null;
      let freqData = null;

      if (P.audio && P.audio.src) {
        audio = new Audio(P.audio.src);
        audio.preload = 'auto';
        audio.onended = () => { isPlaying = false; updatePlayBtn(); };

        const initAudioCtx = () => {
          try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            const ac = new AC();
            const source = ac.createMediaElementSource(audio);
            analyser = ac.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyser.connect(ac.destination);
            freqData = new Uint8Array(analyser.frequencyBinCount);
          } catch(e) {}
        };
        playBtn.addEventListener('click', initAudioCtx, { once: true });
      }

      function updatePlayBtn() {
        iconPlay.style.display = isPlaying ? 'none' : 'block';
        iconPause.style.display = isPlaying ? 'block' : 'none';
      }

      function togglePlay() {
        isPlaying = !isPlaying;
        if (isPlaying) {
          if (currentTime >= DURATION - 0.05) {
            currentTime = 0;
            if (audio) audio.currentTime = 0;
          }
          if (audio) {
            audio.playbackRate = playbackRate;
            audio.play().catch(() => {});
          }
        } else {
          if (audio) audio.pause();
        }
        updatePlayBtn();
      }

      playBtn.addEventListener('click', togglePlay);

      speedSelect.addEventListener('change', (e) => {
        playbackRate = parseFloat(e.target.value) || 1.0;
        if (audio) audio.playbackRate = playbackRate;
      });

      progressBar.addEventListener('pointerdown', (e) => {
        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (rect.right - e.clientX) / rect.width));
        currentTime = percent * DURATION;
        if (audio) audio.currentTime = Math.min(currentTime, audio.duration || DURATION);
      });

      window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlay();
        }
      });

      // Persian numerals formatter
      const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
      const toFa = (num) => String(num).replace(/\\d/g, d => faDigits[d]);
      const formatTime = (sec) => {
        const s = Math.max(0, Math.floor(sec));
        const m = Math.floor(s / 60);
        const rem = s % 60;
        return toFa(m) + ':' + toFa(String(rem).padStart(2, '0'));
      };

      // Animation Easing & Spring Math
      function easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      }

      function spring(x, damping, stiffness) {
        const d = damping || (ST.spring && ST.spring.damping) || 14;
        const k = stiffness || (ST.spring && ST.spring.stiffness) || 170;
        if (x <= 0) return 0;
        const w0 = Math.sqrt(k);
        const z = d / (2 * w0);
        if (z >= 1) return 1 - Math.exp(-w0 * x);
        const wd = w0 * Math.sqrt(1 - z * z);
        return 1 - Math.exp(-z * w0 * x) * (Math.cos(wd * x) + (z * w0 / wd) * Math.sin(wd * x));
      }

      function drawSegment(seg, t) {
        const exit = Math.max(0, Math.min(1, (seg.to - t) / 0.22));
        if (exit <= 0) return;

        const local = t - seg.from;
        const dur = seg.to - seg.from;
        const scaleFactor = Math.min(1.2, H / 1080);
        const baseSize = (ST.captionSize || 74) * scaleFactor;

        // 1. Title / Outro Card
        if (seg.kind === 'title' || seg.kind === 'outro') {
          const progress = easeInOutCubic(Math.min(1, local / 0.75));
          ctx.globalAlpha = progress * exit;
          const fontSize = baseSize * 1.45;
          ctx.font = 'normal ' + fontSize + 'px ' + (TH.displayFont || 'Lalezar');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = TH.fg || '#f4efe6';
          ctx.fillText(seg.text, W / 2, H / 2 - fontSize * 0.15);

          // Underline bar
          const textMetrics = ctx.measureText(seg.text).width;
          const barWidth = (textMetrics + 40) * progress;
          ctx.fillStyle = TH.accent || '#ff4a24';
          ctx.fillRect(W / 2 - barWidth / 2, H / 2 + fontSize * 0.55, barWidth, Math.max(4, fontSize * 0.06));
          ctx.globalAlpha = 1;
          return;
        }

        // 2. Dynamic Bar Chart (نمودار میله‌ای متحرک)
        if (seg.kind === 'chart') {
          ctx.globalAlpha = exit;
          const animP = Math.min(1, spring(local * 1.4, 15, 180));
          ctx.font = 'bold ' + (baseSize * 0.52) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = TH.fg || '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(seg.text, W / 2, H / 2 - baseSize * 1.5);

          const chartW = Math.min(W * 0.72, 700);
          const startX = W / 2 - chartW / 2;
          const startY = H / 2 - baseSize * 0.6;
          const barH = Math.max(22, baseSize * 0.35);
          const gap = barH * 1.35;

          const items = (seg.visualData && seg.visualData.items) || [
            { label: 'شاخص عملکرد جاری', value: 85, color: TH.accent },
            { label: 'میانگین صنعت', value: 54, color: TH.secondary || '#94a3b8' },
            { label: 'دوره پایه', value: 32, color: 'rgba(255,255,255,0.3)' },
          ];

          items.forEach((item, idx) => {
            const y = startY + idx * gap;
            const targetBarW = (chartW * (item.value / 100)) * animP;

            ctx.textAlign = 'right';
            ctx.font = '500 ' + (baseSize * 0.36) + 'px ' + (TH.bodyFont || 'Vazirmatn');
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillText(item.label, W / 2 + chartW / 2, y - 6);

            ctx.textAlign = 'left';
            ctx.font = 'bold ' + (baseSize * 0.38) + 'px ' + (TH.bodyFont || 'Vazirmatn');
            ctx.fillStyle = item.color || TH.accent;
            ctx.fillText(Math.round(item.value * animP) + '%', W / 2 - chartW / 2, y - 6);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(startX, y, chartW, barH, 6);
              ctx.fill();
            } else {
              ctx.fillRect(startX, y, chartW, barH);
            }

            ctx.fillStyle = item.color || TH.accent;
            if (ctx.roundRect) {
              ctx.beginPath();
              ctx.roundRect(startX + chartW - targetBarW, y, targetBarW, barH, 6);
              ctx.fill();
            } else {
              ctx.fillRect(startX + chartW - targetBarW, y, targetBarW, barH);
            }
          });
          ctx.globalAlpha = 1;
          return;
        }

        // 3. Radial Gauge / Donut
        if (seg.kind === 'gauge') {
          ctx.globalAlpha = exit;
          const animP = Math.min(1, spring(local * 1.5, 14, 190));
          const value = (seg.visualData && seg.visualData.value) || 88;
          const ringRadius = Math.min(W, H) * 0.18;
          const ringThickness = Math.max(14, ringRadius * 0.22);
          const cx = W / 2;
          const cy = H / 2 - baseSize * 0.3;

          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = ringThickness;
          ctx.stroke();

          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + (Math.PI * 2 * (value / 100) * animP);
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, startAngle, endAngle, false);
          ctx.strokeStyle = TH.accent || '#38bdf8';
          ctx.lineWidth = ringThickness;
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.font = 'normal ' + (baseSize * 1.3) + 'px ' + (TH.displayFont || 'Lalezar');
          ctx.fillStyle = TH.fg || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(value * animP) + '٪', cx, cy);

          ctx.font = '600 ' + (baseSize * 0.45) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = TH.fg || '#f4efe6';
          ctx.fillText(seg.text, cx, cy + ringRadius + baseSize * 0.7);

          ctx.globalAlpha = 1;
          return;
        }

        // 4. Big Stat Callout
        if (seg.kind === 'stat') {
          const parts = seg.text.split(' ');
          const numberPart = parts[0];
          const textPart = parts.slice(1).join(' ');
          const sc = Math.min(1, spring(local * 1.5, 12, 190));

          ctx.globalAlpha = exit;

          // Badge pill
          const badgeText = (seg.visualData && seg.visualData.badge) || '▲ شاخص صعودی';
          ctx.font = 'bold ' + (baseSize * 0.32) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          const bW = ctx.measureText(badgeText).width + 24;
          const bH = baseSize * 0.52;
          const bX = W / 2 - bW / 2;
          const bY = H / 2 - baseSize * 1.8;
          ctx.fillStyle = (TH.accent || '#ff4a24') + '33';
          ctx.strokeStyle = TH.accent || '#ff4a24';
          ctx.lineWidth = 1.5;
          if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(bX, bY, bW, bH, 12); ctx.fill(); ctx.stroke();
          }
          ctx.fillStyle = TH.accent || '#ff4a24';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, W / 2, bY + bH / 2);

          ctx.save();
          ctx.translate(W / 2, H / 2 - baseSize * 0.35);
          ctx.scale(sc, sc);
          ctx.fillStyle = TH.accent || '#ff4a24';
          ctx.font = 'normal ' + (baseSize * 1.8) + 'px ' + (TH.displayFont || 'Lalezar');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(numberPart, 0, 0);
          ctx.restore();

          if (textPart) {
            ctx.fillStyle = TH.fg || '#f4efe6';
            ctx.globalAlpha = Math.min(1, local / 0.4) * exit;
            ctx.font = '600 ' + (baseSize * 0.58) + 'px ' + (TH.bodyFont || 'Vazirmatn');
            ctx.textAlign = 'center';
            ctx.fillText(textPart, W / 2, H / 2 + baseSize * 0.88);
          }
          ctx.globalAlpha = 1;
          return;
        }

        // 5. Comparison Split Card
        if (seg.kind === 'comparison') {
          ctx.globalAlpha = exit;
          ctx.font = 'bold ' + (baseSize * 0.52) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = TH.fg || '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(seg.text, W / 2, H / 2 - baseSize * 1.5);

          const comp = (seg.visualData && seg.visualData.comparison) || {
            itemA: { label: 'روش سنتی دستی', value: '۱۴ ساعت زمان' },
            itemB: { label: 'استودیو موشن خودکار', value: '۲ دقیقه' },
          };
          const cardW = Math.min(W * 0.36, 360);
          const cardH = baseSize * 2.2;
          const gap = 20;

          // Card A
          const cardAX = W / 2 - cardW - gap / 2;
          const cardY = H / 2 - cardH / 2 + baseSize * 0.2;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.5;
          if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(cardAX, cardY, cardW, cardH, 12); ctx.fill(); ctx.stroke();
          }
          ctx.textAlign = 'center';
          ctx.font = '500 ' + (baseSize * 0.34) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText(comp.itemA.label, cardAX + cardW / 2, cardY + cardH * 0.35);
          ctx.font = 'bold ' + (baseSize * 0.48) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = '#ffffff';
          ctx.fillText(comp.itemA.value, cardAX + cardW / 2, cardY + cardH * 0.68);

          // Card B
          const cardBX = W / 2 + gap / 2;
          ctx.fillStyle = (TH.accent || '#ff4a24') + '22';
          ctx.strokeStyle = TH.accent || '#ff4a24';
          ctx.lineWidth = 2;
          if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(cardBX, cardY, cardW, cardH, 12); ctx.fill(); ctx.stroke();
          }
          ctx.font = '600 ' + (baseSize * 0.34) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = TH.accent || '#ff4a24';
          ctx.fillText(comp.itemB.label, cardBX + cardW / 2, cardY + cardH * 0.35);
          ctx.font = 'bold ' + (baseSize * 0.52) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = '#ffffff';
          ctx.fillText(comp.itemB.value, cardBX + cardW / 2, cardY + cardH * 0.68);

          ctx.globalAlpha = 1;
          return;
        }

        // 6. Manim Technical / Math Card
        if (seg.kind === 'math') {
          ctx.globalAlpha = exit;
          const formula = (seg.visualData && seg.visualData.formula) || 'f(t) = \\int_0^t e^{-\\lambda x} \\sin(\\omega x) dx';
          ctx.font = 'normal ' + (baseSize * 0.55) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.textAlign = 'center';
          ctx.fillText(seg.text, W / 2, H / 2 - baseSize * 1.1);

          const boxW = Math.min(W * 0.75, 740);
          const boxH = baseSize * 1.6;
          const boxX = W / 2 - boxW / 2;
          const boxY = H / 2 - baseSize * 0.4;
          ctx.fillStyle = 'rgba(8, 20, 36, 0.85)';
          ctx.strokeStyle = TH.accent || '#38bdf8';
          ctx.lineWidth = 2;
          if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(boxX, boxY, boxW, boxH, 12); ctx.fill(); ctx.stroke();
          }
          ctx.font = 'bold ' + (baseSize * 0.65) + 'px monospace, sans-serif';
          ctx.fillStyle = TH.accent || '#38bdf8';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(formula, W / 2, boxY + boxH / 2);
          ctx.globalAlpha = 1;
          return;
        }

        // 7. Broadcast Lower-Third
        if (seg.kind === 'lower-third') {
          const progress = easeInOutCubic(Math.min(1, local / 0.5));
          ctx.globalAlpha = progress * exit;
          const barW = Math.min(W * 0.7, 720) * progress;
          const barH = baseSize * 1.25;
          const barX = W / 2 - barW / 2;
          const barY = H * 0.74;

          ctx.fillStyle = 'rgba(12, 10, 16, 0.92)';
          ctx.strokeStyle = TH.accent;
          ctx.lineWidth = 2;
          if (ctx.roundRect) {
            ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 8); ctx.fill(); ctx.stroke();
          }
          ctx.fillStyle = TH.accent;
          ctx.fillRect(barX, barY, 14, barH);
          ctx.font = 'bold ' + (baseSize * 0.52) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(seg.text, barX + barW - 24, barY + barH * 0.45);
          ctx.globalAlpha = 1;
          return;
        }

        // 3. Quote Callout
        if (seg.kind === 'quote') {
          const progress = easeInOutCubic(Math.min(1, local / 0.5));
          ctx.globalAlpha = progress * exit;
          ctx.fillStyle = TH.accent || '#ff4a24';
          ctx.font = 'normal ' + (baseSize * 1.4) + 'px ' + (TH.displayFont || 'Lalezar');
          ctx.textAlign = 'right';
          ctx.fillText('«', W / 2 + baseSize * 3.5, H / 2 - baseSize * 0.8);

          ctx.fillStyle = TH.fg || '#f4efe6';
          ctx.font = '500 ' + (baseSize * 0.82) + 'px ' + (TH.bodyFont || 'Vazirmatn');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(seg.text, W / 2, H / 2);
          ctx.globalAlpha = 1;
          return;
        }

        // 4. Captions (word-spring, swipe-highlight, word-pop, line-fade, kinetic-slide)
        const words = seg.text.split(' ');
        ctx.font = '700 ' + baseSize + 'px ' + (TH.bodyFont || 'Vazirmatn');
        const gap = baseSize * 0.3;
        let wordWidths = words.map(w => ctx.measureText(w).width);
        let totalW = wordWidths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);

        let size = baseSize;
        if (totalW > W * 0.88) {
          const ratio = (W * 0.88) / totalW;
          size = baseSize * ratio;
          ctx.font = '700 ' + size + 'px ' + (TH.bodyFont || 'Vazirmatn');
          wordWidths = words.map(w => ctx.measureText(w).width);
          totalW = wordWidths.reduce((a, b) => a + b, 0) + (size * 0.3) * (words.length - 1);
        }

        const cy = H * 0.5;
        const mode = ST.captionMode || 'word-spring';

        // VOX Style Swipe-Highlight
        if (mode === 'swipe-highlight') {
          const totalLetters = seg.text.length || 1;
          const activeIndex = Math.min(words.length - 1, Math.floor((local / Math.max(0.1, dur)) * words.length));

          let cx = W / 2 + totalW / 2;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';

          for (let i = 0; i < words.length; i++) {
            cx -= (size * 0.3);
            const wd = wordWidths[i];
            const isActive = i === activeIndex;
            const isPassed = i < activeIndex;

            if (isActive) {
              const pad = size * 0.16;
              ctx.save();
              ctx.globalAlpha = exit;
              ctx.fillStyle = TH.accent || '#ff4a24';
              if (ctx.roundRect) {
                ctx.beginPath();
                ctx.roundRect(cx - wd - pad, cy - size * 0.65, wd + pad * 2, size * 1.3, size * 0.18);
                ctx.fill();
              } else {
                ctx.fillRect(cx - wd - pad, cy - size * 0.65, wd + pad * 2, size * 1.3);
              }
              ctx.fillStyle = TH.bg || '#000000';
              ctx.fillText(words[i], cx, cy);
              ctx.restore();
            } else {
              ctx.globalAlpha = (isPassed ? 0.95 : 0.4) * exit;
              ctx.fillStyle = TH.fg || '#ffffff';
              ctx.fillText(words[i], cx, cy);
            }
            cx -= wd;
          }
          ctx.globalAlpha = 1;
          return;
        }

        // Word-Spring / Kinetic-Slide / Line-Fade
        let currentX = W / 2 + totalW / 2;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < words.length; i++) {
          currentX -= (size * 0.3);
          const wd = wordWidths[i];
          const localWordTime = local - i * (ST.stagger || 0.05);
          const isEmphasized = (seg.em || []).includes(i);
          ctx.globalAlpha = exit;

          if (mode === 'line-fade') {
            const p = easeInOutCubic(Math.min(1, Math.max(0, local / 0.38)));
            ctx.globalAlpha = p * exit;
            ctx.fillStyle = isEmphasized ? (TH.accent || '#ff4a24') : (TH.fg || '#ffffff');
            ctx.fillText(words[i], currentX, cy + (1 - p) * size * 0.4);
          } else if (mode === 'word-pop') {
            const scale = Math.min(1, Math.max(0, spring(localWordTime * 1.8, 12, 220)));
            if (scale > 0.01) {
              ctx.save();
              ctx.translate(currentX - wd / 2, cy);
              ctx.scale(scale, scale);
              ctx.fillStyle = isEmphasized ? (TH.accent || '#ff4a24') : (TH.fg || '#ffffff');
              ctx.textAlign = 'center';
              ctx.fillText(words[i], 0, 0);
              ctx.restore();
            }
          } else { // default word-spring & kinetic
            const p = Math.min(1, Math.max(0, spring(localWordTime * 1.2)));
            ctx.globalAlpha = p * exit;
            ctx.fillStyle = isEmphasized ? (TH.accent || '#ff4a24') : (TH.fg || '#ffffff');
            ctx.font = (isEmphasized ? '900 ' : '700 ') + size + 'px ' + (TH.bodyFont || 'Vazirmatn');
            ctx.fillText(words[i], currentX, cy + (1 - p) * size * 0.65);
            ctx.font = '700 ' + size + 'px ' + (TH.bodyFont || 'Vazirmatn');
          }

          currentX -= wd;
        }

        ctx.globalAlpha = 1;
      }

      // Image cache for slide backgrounds
      const imageCache = {};
      SEGMENTS.forEach((seg) => {
        if (seg.backgroundImage) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = seg.backgroundImage;
          imageCache[seg.backgroundImage] = img;
        }
      });

      function renderFrame(t) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = TH.bg || '#0e0c10';
        ctx.fillRect(0, 0, W, H);
        ctx.direction = 'rtl';

        // Draw slide background image (Unsplash / Curated) with Ken Burns motion & dimming
        let activeSeg = null;
        for (let i = 0; i < SEGMENTS.length; i++) {
          const s = SEGMENTS[i];
          if (t >= s.from - 0.02 && t <= s.to + 0.02) {
            activeSeg = s;
            break;
          }
        }

        if (activeSeg && activeSeg.backgroundImage && imageCache[activeSeg.backgroundImage]) {
          const img = imageCache[activeSeg.backgroundImage];
          if (img.complete && img.naturalWidth > 0) {
            const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
            let zoom = 1.0;
            let panX = 0;
            let panY = 0;
            if (activeSeg.kenBurns !== false) {
              const dur = Math.max(0.1, activeSeg.to - activeSeg.from);
              const p = Math.min(1, Math.max(0, (t - activeSeg.from) / dur));
              zoom = 1.0 + p * 0.07;
              panX = Math.sin(p * Math.PI) * 10;
              panY = Math.cos(p * Math.PI) * 6;
            }
            const dw = img.naturalWidth * scale * zoom;
            const dh = img.naturalHeight * scale * zoom;
            ctx.drawImage(img, (W - dw) / 2 + panX, (H - dh) / 2 + panY, dw, dh);

            const dim = activeSeg.backgroundDim !== undefined ? activeSeg.backgroundDim : 0.62;
            ctx.fillStyle = 'rgba(0,0,0,' + dim + ')';
            ctx.fillRect(0, 0, W, H);

            const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.22, W / 2, H / 2, Math.max(W, H) * 0.75);
            vig.addColorStop(0, 'rgba(0,0,0,0)');
            vig.addColorStop(1, 'rgba(0,0,0,0.55)');
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            if (activeSeg.imageCredit && activeSeg.imageCredit.author) {
              ctx.save();
              ctx.font = '500 11px sans-serif';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
              ctx.direction = 'ltr';
              ctx.textAlign = 'right';
              ctx.fillText('📷 ' + (activeSeg.imageCredit.source || 'Unsplash') + ' · ' + activeSeg.imageCredit.author, W - 24, H - 16);
              ctx.restore();
            }
          }
        }

        // Grid effect
        if (TH.effect === 'grid') {
          ctx.strokeStyle = TH.accent ? (TH.accent + '22') : 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 1;
          const gridSize = 48, off = (t * 16) % gridSize;
          for (let x = off; x < W; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
          for (let y = off; y < H; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        }

        // Manim technical blueprint grid
        if (TH.effect === 'manim-grid') {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
          ctx.lineWidth = 1;
          for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
          for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
          ctx.strokeStyle = (TH.accent || '#38bdf8') + '44';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let x = 0; x < W; x += 6) {
            const y = H * 0.75 + Math.sin(x * 0.015 + t * 2) * 36;
            if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Plexus / Constellation connected network
        if (TH.effect === 'plexus') {
          const count = 24;
          const nodes = [];
          for (let i = 0; i < count; i++) {
            nodes.push({
              x: (i * 127 + Math.cos(t * 0.5 + i) * 60 + W) % W,
              y: (i * 89 + Math.sin(t * 0.6 + i * 1.5) * 55 + H) % H,
            });
          }
          const maxDist = Math.min(W, H) * 0.22;
          ctx.lineWidth = 0.8;
          for (let i = 0; i < count; i++) {
            for (let j = i + 1; j < count; j++) {
              const dx = nodes[i].x - nodes[j].x;
              const dy = nodes[i].y - nodes[j].y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.25;
                ctx.strokeStyle = TH.accent ? (TH.accent + Math.floor(alpha * 255).toString(16).padStart(2, '0')) : ('rgba(255,255,255,' + alpha + ')');
                ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
              }
            }
          }
          for (let i = 0; i < count; i++) {
            ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? (TH.accent || '#38bdf8') : '#ffffff';
            ctx.globalAlpha = 0.45;
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }

        // Particles
        if (TH.effect === 'particles' || TH.effect === 'bokeh') {
          for (let i = 0; i < 16; i++) {
            const px = (i * 137.5 + t * (12 + i * 2)) % W;
            const py = (i * 93.3 + Math.sin(t + i) * 35 + H) % H;
            ctx.beginPath(); ctx.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? (TH.accent || '#ff4a24') : '#ffffff';
            ctx.globalAlpha = 0.08 + Math.sin(t * 2 + i) * 0.05;
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }

        // Clean border framing
        if (TH.boxStyle === 'frame') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 2;
          ctx.strokeRect(32, 32, W - 64, H - 64);
        } else if (TH.boxStyle === 'cyber') {
          ctx.strokeStyle = TH.accent || '#00f5a0';
          ctx.lineWidth = 2;
          const len = 24, pad = 24;
          ctx.beginPath(); ctx.moveTo(W - pad - len, pad); ctx.lineTo(W - pad, pad); ctx.lineTo(W - pad, pad + len); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pad + len, pad); ctx.lineTo(pad, pad); ctx.lineTo(pad, pad + len); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(W - pad - len, H - pad); ctx.lineTo(W - pad, H - pad); ctx.lineTo(W - pad, H - pad - len); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(pad + len, H - pad); ctx.lineTo(pad, H - pad); ctx.lineTo(pad, H - pad - len); ctx.stroke();
        }

        // Draw active segments
        for (const seg of P.segments) {
          if (t >= seg.from - 0.01 && t <= seg.to + 0.01) {
            drawSegment(seg, t);
          }
        }

        // Audio waveform visualizer (if audioBars active)
        if (ST.audioBars && analyser && freqData) {
          analyser.getByteFrequencyData(freqData);
          const barCount = 28;
          const barWidth = (W * 0.45) / barCount;
          for (let i = 0; i < barCount; i++) {
            const val = freqData[Math.floor(i * freqData.length / barCount / 2)] / 255;
            const barH = Math.max(3, val * H * 0.12);
            ctx.fillStyle = i % 5 === 0 ? (TH.accent || '#ff4a24') : 'rgba(255, 255, 255, 0.28)';
            ctx.fillRect(W * 0.275 + i * barWidth, H * 0.9 - barH, barWidth * 0.6, barH);
          }
        }
      }

      function loop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000) * playbackRate;
        lastTimestamp = timestamp;

        if (isPlaying) {
          if (audio && !audio.paused) {
            currentTime = audio.currentTime;
          } else {
            currentTime += dt;
          }

          if (currentTime >= DURATION) {
            currentTime = DURATION;
            isPlaying = false;
            updatePlayBtn();
          }
        }

        renderFrame(currentTime);

        const progressPercent = Math.min(100, Math.max(0, (currentTime / DURATION) * 100));
        progressFill.style.width = progressPercent + '%';
        timeDisplay.textContent = formatTime(currentTime) + ' / ' + formatTime(DURATION);

        requestAnimationFrame(loop);
      }

      document.fonts.ready.then(() => {
        requestAnimationFrame(loop);
      });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function downloadStandaloneHtml(plan: MotionPlan): void {
  const html = generateStandaloneHtml(plan);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const slug = (plan.meta.title || 'motion').replace(/\s+/g, '-').substring(0, 30);
  a.download = `${slug}-${Date.now().toString().slice(-4)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
