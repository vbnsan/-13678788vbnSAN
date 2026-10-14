import { MotionPlan, MotionSegment, MotionStyle, MotionTheme } from '../types/motion';

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function spring(x: number, damping = 14, stiffness = 170): number {
  if (x <= 0) return 0;
  const w0 = Math.sqrt(stiffness);
  const z = damping / (2 * w0);
  if (z >= 1) return 1 - Math.exp(-w0 * x);
  const wd = w0 * Math.sqrt(Math.max(0.01, 1 - z * z));
  return 1 - Math.exp(-z * w0 * x) * (Math.cos(wd * x) + (z * w0 / wd) * Math.sin(wd * x));
}

const imageCache: Map<string, HTMLImageElement> = new Map();

export function getCachedImage(src: string): HTMLImageElement | null {
  if (!src) return null;
  let img = imageCache.get(src);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    imageCache.set(src, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

export function drawBackgroundAndEffects(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  theme: MotionTheme,
  style: MotionStyle,
  activeSegment?: MotionSegment | null
): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // 1. Base background fill
  ctx.fillStyle = theme.bg || '#0c0a0e';
  ctx.fillRect(0, 0, w, h);

  // 2. Stock / Slide Background Image (Unsplash / Curated) with Ken Burns motion & dimming
  if (activeSegment?.backgroundImage) {
    const img = getCachedImage(activeSegment.backgroundImage);
    if (img) {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = Math.max(w / iw, h / ih);

      let zoom = 1.0;
      let panX = 0;
      let panY = 0;
      if (activeSegment.kenBurns !== false) {
        const segDur = Math.max(0.1, activeSegment.to - activeSegment.from);
        const prog = Math.min(1, Math.max(0, (time - activeSegment.from) / segDur));
        zoom = 1.0 + prog * 0.07;
        panX = Math.sin(prog * Math.PI) * 10;
        panY = Math.cos(prog * Math.PI) * 6;
      }

      const drawW = iw * scale * zoom;
      const drawH = ih * scale * zoom;
      const dx = (w - drawW) / 2 + panX;
      const dy = (h - drawH) / 2 + panY;

      ctx.save();
      if (activeSegment.backgroundBlur) {
        ctx.filter = `blur(${activeSegment.backgroundBlur}px)`;
      }
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();

      // Dimming overlay for high text contrast
      const dim = activeSegment.backgroundDim !== undefined ? activeSegment.backgroundDim : 0.62;
      ctx.fillStyle = `rgba(0, 0, 0, ${dim})`;
      ctx.fillRect(0, 0, w, h);

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.22, w / 2, h / 2, Math.max(w, h) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Attribution tag
      if (activeSegment.imageCredit?.author) {
        ctx.save();
        ctx.font = '500 11px Plus Jakarta Sans, Vazirmatn, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.direction = 'ltr';
        ctx.textAlign = 'right';
        ctx.fillText(`📷 ${activeSegment.imageCredit.source || 'Unsplash'} · ${activeSegment.imageCredit.author}`, w - 24, h - 16);
        ctx.restore();
      }
    }
  }

  // 2. Cyber Perspective Grid (ماتریکس و گرید نئونی متحرک)
  if (theme.effect === 'grid') {
    ctx.save();
    ctx.strokeStyle = theme.accent ? `${theme.accent}20` : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const gridSize = 54;
    const offset = (time * 18) % gridSize;

    for (let x = offset; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = offset; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Radial center glow
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.7);
    grad.addColorStop(0, `${theme.accent}1e`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // 3. Manim Blueprint Technical Grid & Math Graph
  if (theme.effect === 'manim-grid') {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Major Axes
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Animated Mathematical Wave in Background (sine oscillation)
    ctx.strokeStyle = `${theme.accent}44`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x < w; x += 6) {
      const y = h * 0.75 + Math.sin(x * 0.015 + time * 2) * 36;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 4. Plexus / Constellation Connected Particles
  if (theme.effect === 'plexus') {
    ctx.save();
    const count = 28;
    const nodes: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < count; i++) {
      const nx = (i * 127 + Math.cos(time * 0.5 + i) * 60 + w) % w;
      const ny = (i * 89 + Math.sin(time * 0.6 + i * 1.5) * 55 + h) % h;
      nodes.push({ x: nx, y: ny });
    }

    // Connect close nodes
    ctx.lineWidth = 0.8;
    const maxDist = Math.min(w, h) * 0.22;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.25;
          ctx.strokeStyle = theme.accent ? `${theme.accent}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}` : `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.arc(nodes[i].x, nodes[i].y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? (theme.accent || '#38bdf8') : '#ffffff';
      ctx.globalAlpha = 0.45;
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Floating Bokeh / Ambient Particles
  if (theme.effect === 'particles' || theme.effect === 'bokeh') {
    ctx.save();
    const particleCount = 24;
    for (let i = 0; i < particleCount; i++) {
      const px = (i * 137.5 + time * (16 + (i % 5) * 3)) % w;
      const py = (i * 93.3 + Math.sin(time + i * 1.5) * 45 + h) % h;
      const radius = 2.5 + (i % 4) * 2.4;
      const alpha = 0.1 + Math.sin(time * 2 + i) * 0.08;

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0 ? (theme.accent || '#ff4a24') : (theme.secondary || '#ffffff');
      ctx.globalAlpha = Math.max(0.02, alpha);
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Cyber HUD Tech Brackets & Crosshairs
  if (theme.boxStyle === 'cyber') {
    ctx.save();
    ctx.strokeStyle = theme.accent || '#00f5a0';
    ctx.lineWidth = 2;
    const len = 32;
    const pad = 24;

    const drawCross = (cx: number, cy: number) => {
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy); ctx.lineTo(cx + 7, cy);
      ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy + 7);
      ctx.stroke();
    };

    drawCross(pad * 2, pad * 2);
    drawCross(w - pad * 2, pad * 2);
    drawCross(pad * 2, h - pad * 2);
    drawCross(w - pad * 2, h - pad * 2);

    // Corner brackets
    ctx.beginPath();
    ctx.moveTo(w - pad - len, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + len);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad + len, pad); ctx.lineTo(pad, pad); ctx.lineTo(pad, pad + len);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w - pad - len, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - len);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pad + len, h - pad); ctx.lineTo(pad, h - pad); ctx.lineTo(pad, h - pad - len);
    ctx.stroke();

    ctx.restore();
  } else if (theme.boxStyle === 'frame') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);
  }

  // 7. Audio Spectrum Waveform Bars
  if (style.audioBars) {
    ctx.save();
    const barCount = 36;
    const barW = Math.max(3, (w * 0.45) / barCount);
    const startX = w / 2 - (barCount * barW * 1.5) / 2;
    const bottomY = h - 42;

    for (let i = 0; i < barCount; i++) {
      const wave = Math.sin(time * 6 + i * 0.45) * 0.5 + Math.cos(time * 3 + i * 0.8) * 0.5;
      const barH = Math.max(4, Math.abs(wave) * 44);
      const x = startX + i * barW * 1.5;

      ctx.fillStyle = theme.accent ? `${theme.accent}aa` : 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(x, bottomY - barH, barW, barH);
    }
    ctx.restore();
  }

  // 8. Lens Vignette
  if (theme.effect === 'vignette') {
    ctx.save();
    const vigGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.28, w / 2, h / 2, w * 0.85);
    vigGrad.addColorStop(0, 'transparent');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

export function drawMotionSegment(
  ctx: CanvasRenderingContext2D,
  seg: MotionSegment,
  t: number,
  w: number,
  h: number,
  theme: MotionTheme,
  style: MotionStyle
): void {
  const exit = Math.max(0, Math.min(1, (seg.to - t) / 0.24));
  if (exit <= 0) return;

  const local = t - seg.from;
  const dur = seg.to - seg.from;
  const scaleFactor = Math.min(1.2, h / 1080);
  const baseSize = (style.captionSize || 74) * scaleFactor;

  // After Effects subtle camera push-in on entry
  const cameraZoom = 1 + Math.sin(Math.min(1, local / 0.65) * Math.PI) * 0.02;
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(cameraZoom, cameraZoom);
  ctx.translate(-w / 2, -h / 2);

  // Glow Bloom effect if configured
  if (style.glowIntensity && style.glowIntensity > 0) {
    ctx.shadowBlur = style.glowIntensity * 16;
    ctx.shadowColor = theme.accent;
  }

  // ==========================================
  // 1. Title / Outro Card
  // ==========================================
  if (seg.kind === 'title' || seg.kind === 'outro') {
    const progress = easeInOutCubic(Math.min(1, local / 0.75));
    ctx.globalAlpha = progress * exit;
    const fontSize = baseSize * 1.45;
    ctx.font = `normal ${fontSize}px '${theme.displayFont || 'Lalezar'}', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.fg || '#f4efe6';
    ctx.fillText(seg.text, w / 2, h / 2 - fontSize * 0.15);

    const textMetrics = ctx.measureText(seg.text).width;
    const barWidth = (textMetrics + 60) * progress;
    ctx.fillStyle = theme.accent || '#ff4a24';
    ctx.fillRect(w / 2 - barWidth / 2, h / 2 + fontSize * 0.55, barWidth, Math.max(5, fontSize * 0.06));
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 2. Dynamic Bar Chart (Multi-Bar Infographic)
  // ==========================================
  if (seg.kind === 'chart') {
    ctx.globalAlpha = exit;
    const animP = Math.min(1, spring(local * 1.4, 15, 180));

    // Title of chart with lower-third indicator badge
    ctx.font = `bold ${baseSize * 0.54}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = theme.fg || '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(seg.text, w / 2, h / 2 - baseSize * 1.7);

    // Render comparison bars
    const chartW = Math.min(w * 0.76, 760);
    const startX = w / 2 - chartW / 2;
    const startY = h / 2 - baseSize * 0.75;
    const barHeight = Math.max(26, baseSize * 0.38);
    const gap = barHeight * 1.45;

    const items = seg.visualData?.items || [
      { label: 'شاخص رشد جاری (Q3)', value: 85, color: theme.accent, sublabel: 'عملکرد شاخص' },
      { label: 'میانگین صنعت و رقبا', value: 54, color: theme.secondary || '#38bdf8', sublabel: 'معیار بازار' },
      { label: 'دوره پایه هدف', value: 32, color: 'rgba(255,255,255,0.4)', sublabel: 'سطح آغازین' },
    ];

    items.forEach((item, idx) => {
      const y = startY + idx * gap;
      const targetBarW = (chartW * (item.value / 100)) * animP;

      // Label & Percent
      ctx.textAlign = 'right';
      ctx.font = `600 ${baseSize * 0.36}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillText(item.label, w / 2 + chartW / 2, y - 8);

      ctx.textAlign = 'left';
      ctx.font = `bold ${baseSize * 0.4}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
      ctx.fillStyle = item.color || theme.accent;
      ctx.fillText(`${Math.round(item.value * animP)}%`, w / 2 - chartW / 2, y - 8);

      // Track background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(startX, y, chartW, barHeight, 6);
        ctx.fill();
      } else {
        ctx.fillRect(startX, y, chartW, barHeight);
      }

      // Animated Fill with gradient
      const barGrad = ctx.createLinearGradient(startX + chartW - targetBarW, y, startX + chartW, y);
      barGrad.addColorStop(0, item.color || theme.accent);
      barGrad.addColorStop(1, `${item.color || theme.accent}cc`);
      ctx.fillStyle = barGrad;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(startX + chartW - targetBarW, y, targetBarW, barHeight, 6);
        ctx.fill();
      } else {
        ctx.fillRect(startX + chartW - targetBarW, y, targetBarW, barHeight);
      }
    });

    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 3. Radial Donut Gauge (گیج دایره‌ای درصد پیشرفت)
  // ==========================================
  if (seg.kind === 'gauge') {
    ctx.globalAlpha = exit;
    const animP = Math.min(1, spring(local * 1.5, 14, 190));
    const value = seg.visualData?.value || 88;
    const ringRadius = Math.min(w, h) * 0.19;
    const ringThickness = Math.max(18, ringRadius * 0.22);
    const cx = w / 2;
    const cy = h / 2 - baseSize * 0.35;

    // Track circle
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = ringThickness;
    ctx.stroke();

    // Progress Arc with glowing stroke
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * (value / 100) * animP);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, startAngle, endAngle, false);
    ctx.strokeStyle = theme.accent || '#38bdf8';
    ctx.lineWidth = ringThickness;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // Center percentage counter
    ctx.font = `normal ${baseSize * 1.4}px '${theme.displayFont || 'Lalezar'}', sans-serif`;
    ctx.fillStyle = theme.fg || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(value * animP)}٪`, cx, cy);

    // Caption below gauge
    ctx.font = `600 ${baseSize * 0.48}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = theme.fg || '#f4efe6';
    ctx.fillText(seg.text, cx, cy + ringRadius + baseSize * 0.8);

    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 4. Large Statistic / KPI Metric Delta Card
  // ==========================================
  if (seg.kind === 'stat') {
    const parts = seg.text.split(' ');
    const numberPart = parts[0];
    const textPart = parts.slice(1).join(' ');
    const sc = Math.min(1, spring(local * 1.5, 12, 190));

    ctx.globalAlpha = exit;

    // Badge pill (e.g. "+142% رشد سالانه" or "هدف محقق‌شده")
    const badgeText = seg.visualData?.badge || '▲ شاخص صعودی';
    const badgeP = Math.min(1, easeInOutCubic(local / 0.4));
    ctx.save();
    ctx.font = `bold ${baseSize * 0.32}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    const bMetrics = ctx.measureText(badgeText);
    const bW = bMetrics.width + 24;
    const bH = baseSize * 0.52;
    const bX = w / 2 - bW / 2;
    const bY = h / 2 - baseSize * 1.8;

    ctx.fillStyle = `${theme.accent}33`;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 12);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, w / 2, bY + bH / 2);
    ctx.restore();

    // Large Animated Number
    ctx.save();
    ctx.translate(w / 2, h / 2 - baseSize * 0.35);
    ctx.scale(sc, sc);
    ctx.fillStyle = theme.accent || '#ff4a24';
    ctx.font = `normal ${baseSize * 1.85}px '${theme.displayFont || 'Lalezar'}', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numberPart, 0, 0);
    ctx.restore();

    if (textPart) {
      ctx.fillStyle = theme.fg || '#f4efe6';
      ctx.globalAlpha = Math.min(1, local / 0.4) * exit;
      ctx.font = `600 ${baseSize * 0.58}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(textPart, w / 2, h / 2 + baseSize * 0.9);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 5. Comparison Split Card (Option A vs Option B)
  // ==========================================
  if (seg.kind === 'comparison') {
    ctx.globalAlpha = exit;
    const animP = Math.min(1, spring(local * 1.4, 14, 180));

    // Title
    ctx.font = `bold ${baseSize * 0.52}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = theme.fg || '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(seg.text, w / 2, h / 2 - baseSize * 1.5);

    const comp = seg.visualData?.comparison || {
      itemA: { label: 'روش سنتی و دستی', value: '۱۴ ساعت زمان', isWinner: false },
      itemB: { label: 'استودیو موشن هوشمند', value: 'کمتر از ۲ دقیقه', isWinner: true },
    };

    const cardW = Math.min(w * 0.36, 360);
    const cardH = baseSize * 2.2;
    const gap = 24;

    // Left Card (itemA)
    const cardAX = w / 2 - cardW - gap / 2;
    const cardY = h / 2 - cardH / 2 + baseSize * 0.2;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(cardAX, cardY, cardW, cardH, 14);
      ctx.fill();
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.font = `500 ${baseSize * 0.34}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(comp.itemA.label, cardAX + cardW / 2, cardY + cardH * 0.35);
    ctx.font = `bold ${baseSize * 0.48}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(comp.itemA.value, cardAX + cardW / 2, cardY + cardH * 0.68);

    // Right Card (itemB - Winner)
    const cardBX = w / 2 + gap / 2;
    ctx.fillStyle = `${theme.accent}18`;
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(cardBX, cardY, cardW, cardH, 14);
      ctx.fill();
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.font = `600 ${baseSize * 0.34}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.fillText(comp.itemB.label, cardBX + cardW / 2, cardY + cardH * 0.35);
    ctx.font = `bold ${baseSize * 0.52}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(comp.itemB.value, cardBX + cardW / 2, cardY + cardH * 0.68);

    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 6. Manim Technical / Formula Card
  // ==========================================
  if (seg.kind === 'math') {
    ctx.globalAlpha = exit;
    const progress = easeInOutCubic(Math.min(1, local / 0.6));
    const formula = seg.visualData?.formula || 'f(t) = \\int_0^t e^{-\\lambda x} \\sin(\\omega x) dx';

    ctx.font = `normal ${baseSize * 0.55}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(seg.text, w / 2, h / 2 - baseSize * 1.1);

    // Tech Formula Box with glowing border
    const boxW = Math.min(w * 0.75, 740);
    const boxH = baseSize * 1.6;
    const boxX = w / 2 - boxW / 2;
    const boxY = h / 2 - baseSize * 0.4;

    ctx.fillStyle = 'rgba(8, 20, 36, 0.85)';
    ctx.strokeStyle = theme.accent || '#38bdf8';
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 12);
      ctx.fill();
      ctx.stroke();
    }

    ctx.font = `bold ${baseSize * 0.65}px monospace, 'Courier New', sans-serif`;
    ctx.fillStyle = theme.accent || '#38bdf8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formula, w / 2, boxY + boxH / 2);

    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 7. Broadcast Lower-Third News Card
  // ==========================================
  if (seg.kind === 'lower-third') {
    const progress = easeInOutCubic(Math.min(1, local / 0.5));
    ctx.globalAlpha = progress * exit;

    const barW = Math.min(w * 0.7, 720) * progress;
    const barH = baseSize * 1.25;
    const barX = w / 2 - barW / 2;
    const barY = h * 0.74;

    // Dark broadcast pill
    ctx.fillStyle = 'rgba(12, 10, 16, 0.92)';
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 8);
      ctx.fill();
      ctx.stroke();
    }

    // Left accent flag
    ctx.fillStyle = theme.accent;
    ctx.fillRect(barX, barY, 14, barH);

    ctx.font = `bold ${baseSize * 0.52}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(seg.text, barX + barW - 24, barY + barH * 0.45);

    const sub = seg.visualData?.label || 'گزارش ویژه استودیو موشن';
    ctx.font = `500 ${baseSize * 0.32}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.fillStyle = theme.accent;
    ctx.fillText(sub, barX + barW - 24, barY + barH * 0.8);

    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 8. Quote Callout with After Effects accent frame
  // ==========================================
  if (seg.kind === 'quote') {
    const progress = easeInOutCubic(Math.min(1, local / 0.5));
    ctx.globalAlpha = progress * exit;
    ctx.fillStyle = theme.accent || '#ff4a24';
    ctx.font = `normal ${baseSize * 1.4}px '${theme.displayFont || 'Lalezar'}', sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText('«', w / 2 + baseSize * 3.2, h / 2 - baseSize * 0.8);

    ctx.fillStyle = theme.fg || '#f4efe6';
    ctx.font = `500 ${baseSize * 0.82}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seg.text, w / 2, h / 2);
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // ==========================================
  // 9. Spoken Captions (word-spring, swipe-highlight, word-pop, line-fade, kinetic-slide)
  // ==========================================
  const words = seg.text.split(' ');
  ctx.font = `700 ${baseSize}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
  const wordGap = baseSize * 0.3;
  let wordWidths = words.map(wrd => ctx.measureText(wrd).width);
  let totalWidth = wordWidths.reduce((a, b) => a + b, 0) + wordGap * (words.length - 1);

  let size = baseSize;
  if (totalWidth > w * 0.88) {
    const ratio = (w * 0.88) / totalWidth;
    size = baseSize * ratio;
    ctx.font = `700 ${size}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    wordWidths = words.map(wrd => ctx.measureText(wrd).width);
    totalWidth = wordWidths.reduce((a, b) => a + b, 0) + (size * 0.3) * (words.length - 1);
  }

  const centerY = h * 0.5;
  const mode = style.captionMode || 'word-spring';

  // VOX / Editorial swipe highlight
  if (mode === 'swipe-highlight') {
    const activeIndex = Math.min(words.length - 1, Math.floor((local / Math.max(0.1, dur)) * words.length));
    let cx = w / 2 + totalWidth / 2;
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
        ctx.fillStyle = theme.accent || '#ff4a24';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(cx - wd - pad, centerY - size * 0.65, wd + pad * 2, size * 1.3, size * 0.18);
          ctx.fill();
        } else {
          ctx.fillRect(cx - wd - pad, centerY - size * 0.65, wd + pad * 2, size * 1.3);
        }
        ctx.fillStyle = theme.bg || '#000000';
        ctx.fillText(words[i], cx, centerY);
        ctx.restore();
      } else {
        ctx.globalAlpha = (isPassed ? 0.95 : 0.4) * exit;
        ctx.fillStyle = theme.fg || '#ffffff';
        ctx.fillText(words[i], cx, centerY);
      }
      cx -= wd;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    return;
  }

  // Word-spring / Kinetic-slide / Word-pop
  let currentX = w / 2 + totalWidth / 2;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < words.length; i++) {
    currentX -= (size * 0.3);
    const wd = wordWidths[i];
    const localWordTime = local - i * (style.stagger || 0.05);
    const isEmphasized = (seg.em || []).includes(i);
    ctx.globalAlpha = exit;

    if (mode === 'line-fade') {
      const p = easeInOutCubic(Math.min(1, Math.max(0, local / 0.38)));
      ctx.globalAlpha = p * exit;
      ctx.fillStyle = isEmphasized ? (theme.accent || '#ff4a24') : (theme.fg || '#ffffff');
      ctx.fillText(words[i], currentX, centerY + (1 - p) * size * 0.4);
    } else if (mode === 'word-pop') {
      const scale = Math.min(1, Math.max(0, spring(localWordTime * 1.8, 12, 220)));
      if (scale > 0.01) {
        ctx.save();
        ctx.translate(currentX - wd / 2, centerY);
        ctx.scale(scale, scale);
        ctx.fillStyle = isEmphasized ? (theme.accent || '#ff4a24') : (theme.fg || '#ffffff');
        ctx.textAlign = 'center';
        ctx.fillText(words[i], 0, 0);
        ctx.restore();
      }
    } else {
      const p = Math.min(1, Math.max(0, spring(localWordTime * 1.2, style.spring.damping, style.spring.stiffness)));
      ctx.globalAlpha = p * exit;
      ctx.fillStyle = isEmphasized ? (theme.accent || '#ff4a24') : (theme.fg || '#ffffff');
      ctx.font = `${isEmphasized ? '900' : '700'} ${size}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
      ctx.fillText(words[i], currentX, centerY + (1 - p) * size * 0.65);
      ctx.font = `700 ${size}px '${theme.bodyFont || 'Vazirmatn'}', sans-serif`;
    }

    currentX -= wd;
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}
