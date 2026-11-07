// "Silver Gelatin Contact Sheet & China-Marker Proof (银盐接触印相 × 红铅笔暗房手记)"
// Dual-Aspect Scene Renderer:
//   - Horizontal (1920×1080, 16:9): Magnum Darkroom Contact Sheet & Enlarger Work-Print Spread
//   - Vertical (1080×1440, 3:4): Collectors' Darkroom Contact Strips & Master Dodge/Burn Proof Plate
// Layers:
//   - L_silver: Silver-gelatin photographic emulsion (35mm Leica film strips, sprocket holes,
//     Kodak Tri-X 400 edge codes, 12-frame documentary sequence, Zone System step wedge, and 8×10" Work-Print)
//   - L_wax: Crimson (#E63B2E) & Yellow (#F2B830) China-Marker / Grease-Pencil wax annotations,
//     dodging/burning arrows, reject X-marks, and the anodized metal bezel of the 8× Schneider Loupe.

import { clamp, lerp, hash, vnoise } from '/core/lib.js';
import { W, H } from './gl.js';

export const PAL = {
  baryta: '#EFEAD9',
  silverBlack: '#0B0C0E',
  silverDark: '#1C1E22',
  silverMid: '#7A7E85',
  silverLight: '#C8C6BE',
  amberCode: '#D89B48',
  redWax: '#E63B2E',
  yellowWax: '#F2B830',
  whiteWax: '#F7F4EB',
};

const F_MONO = '"Courier New", "Noto Serif SC", monospace';
const F_SERIF = '"Playfair Display", "Noto Serif SC", Georgia, serif';
const F_CN = '"Noto Serif SC", "Source Han Serif SC", serif';

function makeLayer(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d') };
}

export function createLayers(w = W, h = H) {
  return {
    L_silver: makeLayer(w, h),
    L_wax: makeLayer(w, h),
  };
}

export function clearLayers(layers, w = W, h = H) {
  for (const k of Object.keys(layers)) {
    layers[k].ctx.clearRect(0, 0, w, h);
  }
}

// ============================================================================
// 1. SILVER-GELATIN DOCUMENTARY FRAME SCENES (Drawn into 35mm frames & Work-Print)
// ============================================================================

// Draw a rich B&W silver-gelatin documentary scene inside rect (x, y, w, h)
// sceneType:
//   0 = Rainy Paris cobblestone street & streetlamp halo
//   1 = Café window silhouette with rain streaks
//   2 = HERO FRAME (#21A): The Decisive Moment — figure leaping across puddle under Pont des Arts
//   3 = Jazz cellar saxophonist & smoke shaft
//   4 = Metro iron archway & umbrella crowd
//   5 = Seine river barge & bridge arches in fog
function drawSilverPhotoScene(ctx, x, y, w, h, sceneType = 2, exposureBias = 0.0, seed = 1) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);

  // Base silver-gelatin sky/background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  const b0 = clamp(0.10 + exposureBias, 0.02, 0.95);
  const b1 = clamp(0.28 + exposureBias, 0.05, 0.98);
  bg.addColorStop(0, `rgb(${Math.round(b0 * 255)},${Math.round(b0 * 255)},${Math.round(b0 * 255)})`);
  bg.addColorStop(1, `rgb(${Math.round(b1 * 255)},${Math.round(b1 * 255)},${Math.round(b1 * 255)})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (sceneType === 2) {
    // --- HERO SCENE (#21A): "THE DECISIVE MOMENT" — Leaping over a rain puddle in Paris ---
    // 1) Distant Haussmann facade & bridge arches in misty silver midtones
    ctx.fillStyle = 'rgb(62,64,68)';
    ctx.fillRect(0, h * 0.14, w, h * 0.40);

    // Classical Haussmann windows & iron railings
    ctx.fillStyle = 'rgb(34,36,40)';
    const cols = 7;
    for (let i = 0; i < cols; i++) {
      const wx = (i + 0.35) * (w / cols);
      ctx.fillRect(wx, h * 0.18, w * 0.065, h * 0.16);
      // Lit apartment window in one frame
      if (i === 2 || i === 5) {
        ctx.fillStyle = 'rgb(212,210,202)';
        ctx.fillRect(wx + 2, h * 0.19, w * 0.05, h * 0.13);
        ctx.fillStyle = 'rgb(34,36,40)';
      }
    }

    // 2) Dramatic Streetlamp Volumetric Light Cone on the left-center
    const lampX = w * 0.26, lampY = h * 0.16;
    const cone = ctx.createRadialGradient(lampX, lampY, w * 0.01, lampX, h * 0.55, w * 0.62);
    cone.addColorStop(0.0, 'rgba(245,242,232,0.95)');
    cone.addColorStop(0.22, 'rgba(210,210,204,0.52)');
    cone.addColorStop(0.65, 'rgba(120,124,130,0.18)');
    cone.addColorStop(1.0, 'rgba(20,22,26,0.0)');
    ctx.fillStyle = cone;
    ctx.fillRect(0, 0, w, h);

    // Iron streetlamp post
    ctx.strokeStyle = 'rgb(18,20,24)';
    ctx.lineWidth = Math.max(1.5, w * 0.012);
    ctx.beginPath();
    ctx.moveTo(lampX - w * 0.04, h * 0.62);
    ctx.lineTo(lampX - w * 0.04, lampY);
    ctx.lineTo(lampX, lampY);
    ctx.stroke();

    // Glowing lantern bulb
    ctx.fillStyle = 'rgb(248,246,238)';
    ctx.beginPath();
    ctx.arc(lampX, lampY + h * 0.015, Math.max(2.5, w * 0.022), 0, Math.PI * 2);
    ctx.fill();

    // 3) Wet Cobblestone Ground & Shimmering Mirror Puddle (lower 48% of frame)
    const groundY = h * 0.52;
    ctx.fillStyle = 'rgb(28,30,34)';
    ctx.fillRect(0, groundY, w, h - groundY);

    // Bright mirror-like puddle in center-right reflecting the sky & leaping figure
    const pudGrad = ctx.createRadialGradient(w * 0.56, h * 0.78, w * 0.04, w * 0.54, h * 0.78, w * 0.44);
    pudGrad.addColorStop(0.0, 'rgb(236,234,224)');
    pudGrad.addColorStop(0.55, 'rgb(172,174,170)');
    pudGrad.addColorStop(0.88, 'rgb(75,78,84)');
    pudGrad.addColorStop(1.0, 'rgb(24,26,30)');
    ctx.fillStyle = pudGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.55, h * 0.79, w * 0.41, h * 0.18, -0.04, 0, Math.PI * 2);
    ctx.fill();

    // Concentric raindrop ripples in the puddle where the heel almost touches!
    const touchX = w * 0.44, touchY = h * 0.73;
    ctx.strokeStyle = 'rgba(245,243,235,0.85)';
    for (let r = 1; r <= 3; r++) {
      ctx.lineWidth = Math.max(0.8, w * 0.004);
      ctx.beginPath();
      ctx.ellipse(touchX, touchY, w * 0.035 * r, h * 0.012 * r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 4) Dynamic Leaping Silhouette ("The Decisive Moment" mid-air stride!) + Inverted Reflection
    const drawLeaper = (isRefl = false) => {
      ctx.save();
      ctx.translate(w * 0.54, isRefl ? h * 0.89 : h * 0.53);
      if (isRefl) {
        ctx.scale(1, -0.68);
        ctx.globalAlpha = 0.42;
      }
      const s = w / 240;
      ctx.scale(s, s);

      ctx.fillStyle = 'rgb(14,16,20)';
      ctx.strokeStyle = 'rgb(14,16,20)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Fedora hat & head tilted forward
      ctx.beginPath();
      ctx.arc(12, -52, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(1, -55);
      ctx.lineTo(24, -53);
      ctx.stroke();

      // Billowing trenchcoat torso & flying coattails
      ctx.beginPath();
      ctx.moveTo(8, -44);
      ctx.lineTo(18, -14);
      ctx.lineTo(-22, -6); // dramatic flying coattail behind
      ctx.lineTo(-6, -38);
      ctx.closePath();
      ctx.fill();

      // Front extended leg leaping forward
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(12, -16);
      ctx.lineTo(34, 4);
      ctx.lineTo(48, 18);
      ctx.stroke();

      // Back leg kicking above the ripple
      ctx.beginPath();
      ctx.moveTo(2, -15);
      ctx.lineTo(-18, 6);
      ctx.lineTo(-28, 24);
      ctx.stroke();

      // Extended arms & umbrella in right hand
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(10, -38);
      ctx.lineTo(32, -28);
      ctx.moveTo(4, -38);
      ctx.lineTo(-18, -26);
      ctx.stroke();

      ctx.restore();
    };

    drawLeaper(true);  // Puddle reflection
    drawLeaper(false); // Real leaping figure

    // Silver rim-highlight on the trenchcoat shoulder & hat
    ctx.strokeStyle = 'rgba(242,240,232,0.85)';
    ctx.lineWidth = Math.max(1.0, w * 0.006);
    ctx.beginPath();
    ctx.moveTo(w * 0.51, h * 0.37);
    ctx.lineTo(w * 0.45, h * 0.50);
    ctx.stroke();
  } else if (sceneType === 0) {
    // Rainy Paris Alley & Streetlamp perspective
    const g = ctx.createRadialGradient(w * 0.65, h * 0.28, w * 0.02, w * 0.65, h * 0.45, w * 0.55);
    g.addColorStop(0, 'rgb(242,240,232)');
    g.addColorStop(0.4, 'rgb(115,118,124)');
    g.addColorStop(1, 'rgb(18,20,24)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Perspective alley walls
    ctx.fillStyle = 'rgb(16,18,22)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.34, h * 0.25);
    ctx.lineTo(w * 0.34, h * 0.72);
    ctx.lineTo(0, h);
    ctx.fill();
    // Distant solitary walker
    ctx.fillStyle = 'rgb(12,14,18)';
    ctx.fillRect(w * 0.58, h * 0.48, w * 0.05, h * 0.22);
  } else if (sceneType === 1) {
    // Café Window Silhouette & Neon Reflection
    ctx.fillStyle = 'rgb(24,26,30)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgb(218,216,208)';
    ctx.fillRect(w * 0.12, h * 0.14, w * 0.76, h * 0.56);
    // Window mullions
    ctx.strokeStyle = 'rgb(24,26,30)';
    ctx.lineWidth = Math.max(2, w * 0.02);
    ctx.strokeRect(w * 0.12, h * 0.14, w * 0.76, h * 0.56);
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.14);
    ctx.lineTo(w * 0.5, h * 0.70);
    ctx.stroke();
    // Seated silhouette with coffee cup & cigarette smoke
    ctx.fillStyle = 'rgb(20,22,26)';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.38, w * 0.065, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.26, h * 0.45, w * 0.18, h * 0.25);
  } else if (sceneType === 3) {
    // Jazz Cellar Spotlight & Brass Horn Gleam
    ctx.fillStyle = 'rgb(14,15,18)';
    ctx.fillRect(0, 0, w, h);
    const beam = ctx.createLinearGradient(w * 0.2, 0, w * 0.75, h);
    beam.addColorStop(0, 'rgba(244,242,232,0.88)');
    beam.addColorStop(0.5, 'rgba(140,144,150,0.35)');
    beam.addColorStop(1, 'rgba(14,15,18,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, 0);
    ctx.lineTo(w * 0.45, 0);
    ctx.lineTo(w * 0.92, h);
    ctx.lineTo(w * 0.35, h);
    ctx.fill();
    // Musician silhouette & bright saxophone bell
    ctx.fillStyle = 'rgb(16,18,22)';
    ctx.beginPath();
    ctx.arc(w * 0.48, h * 0.38, w * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w * 0.38, h * 0.46, w * 0.20, h * 0.48);
    ctx.fillStyle = 'rgb(242,240,232)';
    ctx.beginPath();
    ctx.arc(w * 0.66, h * 0.64, w * 0.065, 0, Math.PI * 2);
    ctx.fill();
  } else if (sceneType === 4) {
    // Metro Entrance Arch & Rainy Umbrella Crowd
    ctx.fillStyle = 'rgb(168,170,166)';
    ctx.fillRect(0, 0, w, h * 0.55);
    ctx.fillStyle = 'rgb(32,34,38)';
    ctx.fillRect(0, h * 0.55, w, h * 0.45);
    // Umbrella domes
    for (const [ux, uy, ur] of [[0.28, 0.52, 0.16], [0.58, 0.48, 0.19], [0.80, 0.55, 0.14]]) {
      ctx.fillStyle = 'rgb(18,20,24)';
      ctx.beginPath();
      ctx.arc(w * ux, h * uy, w * ur, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = 'rgb(235,232,224)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(w * ux, h * uy, w * ur, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
  } else {
    // Pont Neuf Bridge Arches & Seine Reflection
    ctx.fillStyle = 'rgb(205,204,198)';
    ctx.fillRect(0, 0, w, h * 0.48);
    ctx.fillStyle = 'rgb(36,38,42)';
    ctx.fillRect(0, h * 0.38, w, h * 0.22);
    // Three bridge arches and bright water reflections
    ctx.fillStyle = 'rgb(232,230,222)';
    for (let i = 0; i < 3; i++) {
      const ax = w * (0.20 + i * 0.30);
      ctx.beginPath();
      ctx.arc(ax, h * 0.60, w * 0.11, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,218,210,0.65)';
      ctx.fillRect(ax - w * 0.08, h * 0.62, w * 0.16, h * 0.28);
      ctx.fillStyle = 'rgb(232,230,222)';
    }
  }

  // Subtle vignette & wet rain streaks inside each 35mm frame
  const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, w * 0.25, w * 0.5, h * 0.5, w * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(8,10,12,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  ctx.restore();
}

// ============================================================================
// 2. 35MM FILM STRIP WITH SPROCKET HOLES & KODAK TRI-X 400 REBATE CODES
// ============================================================================

function draw35mmFilmStrip(ctx, x, y, stripW, stripH, frameStart, scenes) {
  ctx.save();

  // 1) Dense D-max silver-black contact film base
  ctx.fillStyle = PAL.silverBlack;
  ctx.fillRect(x, y, stripW, stripH);

  // 2) Top & Bottom 35mm Sprocket Holes (8 perforations per frame)
  const numFrames = scenes.length;
  const totalPerfs = numFrames * 8;
  const perfPitch = (stripW - 24) / totalPerfs;
  const perfW = perfPitch * 0.54;
  const perfH = 11;

  ctx.fillStyle = PAL.baryta;
  for (let i = 0; i < totalPerfs; i++) {
    const px = x + 12 + i * perfPitch + (perfPitch - perfW) * 0.5;
    // Top sprocket row
    ctx.beginPath();
    ctx.roundRect(px, y + 14, perfW, perfH, 2.2);
    ctx.fill();
    // Bottom sprocket row
    ctx.beginPath();
    ctx.roundRect(px, y + stripH - 14 - perfH, perfW, perfH, 2.2);
    ctx.fill();
  }

  // 3) Kodak Tri-X 400 Film Rebate Markings & Frame Numbers
  const padX = 18;
  const gap = 14;
  const frameW = (stripW - padX * 2 - gap * (numFrames - 1)) / numFrames;
  const frameY = y + 32;
  const frameH = stripH - 64;

  for (let f = 0; f < numFrames; f++) {
    const fx = x + padX + f * (frameW + gap);
    const fNum = frameStart + f;

    // Top rebate code: KODAK SAFETY FILM 5063
    ctx.fillStyle = PAL.amberCode;
    ctx.font = `700 8.5px ${F_MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('KODAK TRI-X PAN FILM  5063', fx + 4, y + 7.5);

    // Bottom rebate frame numbers: e.g. "21" and "▶ 21A"
    ctx.fillText(`▶ ${fNum}`, fx + 12, y + stripH - 6.5);
    ctx.textAlign = 'center';
    ctx.fillText(`${fNum}A`, fx + frameW * 0.55, y + stripH - 6.5);

    // Draw the silver-gelatin photograph inside the 35mm frame
    const [scType, expBias] = scenes[f];
    drawSilverPhotoScene(ctx, fx, frameY, frameW, frameH, scType, expBias, fNum * 17);

    // Subtle film gate border highlight
    ctx.strokeStyle = 'rgba(215, 212, 202, 0.28)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(fx, frameY, frameW, frameH);
  }

  ctx.restore();
}

// ============================================================================
// 3. ANSEL ADAMS ZONE SYSTEM STEP WEDGE & ENLARGER MASTER WORK-PRINT
// ============================================================================

function drawZoneStepWedge(ctx, x, y, w, h) {
  ctx.save();
  const zones = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const sw = w / zones.length;

  for (let i = 0; i < zones.length; i++) {
    const u = i / (zones.length - 1);
    const v = Math.round(lerp(12, 242, Math.pow(u, 0.92)));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(x + i * sw, y, sw, h);

    ctx.strokeStyle = PAL.silverBlack;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(x + i * sw, y, sw, h);

    ctx.fillStyle = i < 5 ? PAL.baryta : PAL.silverBlack;
    ctx.font = `700 10px ${F_MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(zones[i], x + (i + 0.5) * sw, y + h * 0.5);
  }
  ctx.restore();
}

// Draw the Enlarger 8×10" Work-Print with F-Stop Test Strips & Dodge/Burn Map
function drawEnlargerWorkPrint(ctx, x, y, w, h) {
  ctx.save();

  // White Baryta easel border around the work print
  ctx.fillStyle = PAL.baryta;
  ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
  ctx.strokeStyle = PAL.silverBlack;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(x - 10, y - 10, w + 20, h + 20);

  // Main Hero Scene (#21A) rendered at full enlarger work-print scale
  drawSilverPhotoScene(ctx, x, y, w, h, 2, 0.0, 210);

  // Right-edge F-Stop Exposure Test Strip Band (8s / 11s / 16s / 22s stepped overlay)
  const stripW = w * 0.17;
  const sx = x + w - stripW;
  const steps = [
    ['f/8 · 6s (-1 EV)', 0.16],
    ['f/8 · 9s (-1/2)', 0.07],
    ['f/8 · 12s (BASE)', 0.0],
    ['f/8 · 18s (+1/2)', -0.09],
    ['f/8 · 24s (+1 EV)', -0.18],
  ];
  const sh = h / steps.length;
  for (let i = 0; i < steps.length; i++) {
    const [label, bias] = steps[i];
    const sy = y + i * sh;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx, sy, stripW, sh);
    ctx.clip();
    if (bias > 0) {
      ctx.fillStyle = `rgba(240,236,225,${bias * 1.4})`;
      ctx.fillRect(sx, sy, stripW, sh);
    } else if (bias < 0) {
      ctx.fillStyle = `rgba(8,10,14,${-bias * 1.6})`;
      ctx.fillRect(sx, sy, stripW, sh);
    }
    ctx.restore();

    // Step divider line & label
    ctx.strokeStyle = 'rgba(239,234,217,0.75)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(sx, sy, stripW, sh);

    ctx.fillStyle = 'rgba(11,12,14,0.72)';
    ctx.fillRect(sx + 4, sy + 5, stripW - 8, 16);
    ctx.fillStyle = PAL.baryta;
    ctx.font = `700 9.5px ${F_MONO}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, sx + 8, sy + 13);
  }

  ctx.restore();
}

// ============================================================================
// 4. CHINA-MARKER / GREASE-PENCIL WAX ANNOTATIONS & 8× SCHNEIDER LOUPE BEZEL
// ============================================================================

// Draw a waxy, multi-stroke hand-drawn grease-pencil box around a selected frame
function drawGreaseSelectBox(ctx, x, y, w, h, color = PAL.redWax, label = 'SELECT #21A ★') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Two overlapping organic hand-drawn grease-pencil passes
  for (let pass = 0; pass < 2; pass++) {
    const j = (pass - 0.5) * 2.4;
    ctx.lineWidth = pass === 0 ? 4.8 : 2.8;
    ctx.globalAlpha = pass === 0 ? 0.92 : 0.75;
    ctx.beginPath();
    ctx.moveTo(x - 6 + j, y - 4 - j);
    ctx.lineTo(x + w + 7 - j, y - 5 + j);
    ctx.lineTo(x + w + 5 + j, y + h + 6 - j);
    ctx.lineTo(x - 7 - j, y + h + 5 + j);
    ctx.closePath();
    ctx.stroke();
  }

  // Crop L-brackets extending outward
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 3.6;
  const ext = 14;
  for (const [cx, cy, dx, dy] of [
    [x - 6, y - 5, -1, -1],
    [x + w + 6, y - 5, 1, -1],
    [x - 6, y + h + 5, -1, 1],
    [x + w + 6, y + h + 5, 1, 1],
  ]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * ext);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * ext, cy);
    ctx.stroke();
  }

  if (label) {
    ctx.font = `700 11.5px ${F_MONO}`;
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(11, 12, 15, 0.85)';
    ctx.fillRect(x + w - tw - 18, y + 6, tw + 12, 18);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + w - tw - 18, y + 6, tw + 12, 18);
    ctx.fillStyle = color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w - 12, y + 15);
  }
  ctx.restore();
}

// Draw a Red Grease-Pencil Reject Cross ("X") over an outtake frame
function drawGreaseRejectX(ctx, x, y, w, h, color = PAL.redWax) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 4.2;
  ctx.globalAlpha = 0.85;

  ctx.beginPath();
  ctx.moveTo(x + 14, y + 12);
  ctx.lineTo(x + w - 14, y + h - 12);
  ctx.moveTo(x + w - 14, y + 12);
  ctx.lineTo(x + 14, y + h - 12);
  ctx.stroke();
  ctx.restore();
}

// Draw a Darkroom Dodging / Burning Wax Overlay Contour on the Work-Print
function drawDodgeBurnZone(ctx, cx, cy, rx, ry, color, code, cnDesc, labelX, labelY) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';

  // Wavy grease-pencil contour around dodge/burn region
  ctx.lineWidth = 3.2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const wobble = 1 + 0.06 * Math.sin(a * 5 + cx * 0.1);
    const px = cx + Math.cos(a) * rx * wobble;
    const py = cy + Math.sin(a) * ry * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Leader line to darkroom annotation badge
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx + rx * 0.65, cy - ry * 0.55);
  ctx.lineTo(labelX, labelY);
  ctx.stroke();

  // Dark pill background for legibility over silver print
  const boxW = 206, boxH = 44;
  ctx.fillStyle = 'rgba(11, 12, 15, 0.86)';
  ctx.fillRect(labelX, labelY - 22, boxW, boxH);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.strokeRect(labelX, labelY - 22, boxW, boxH);

  ctx.fillStyle = color;
  ctx.font = `700 12px ${F_MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(code, labelX + 8, labelY - 9);

  ctx.fillStyle = PAL.baryta;
  ctx.font = `600 12px ${F_CN}`;
  ctx.fillText(cnDesc, labelX + 8, labelY + 10);

  ctx.restore();
}

// Draw the Anodized Black Metal Bezel of the 8× Schneider Darkroom Loupe
function drawLoupeBezel(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer knurled black aluminum barrel ring
  ctx.strokeStyle = '#14161A';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.96, 0, Math.PI * 2);
  ctx.stroke();

  // Knurled grip ridges around outer circumference
  ctx.strokeStyle = '#383C44';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r * 0.90), Math.sin(a) * (r * 0.90));
    ctx.lineTo(Math.cos(a) * (r * 1.02), Math.sin(a) * (r * 1.02));
    ctx.stroke();
  }

  // Inner silver chrome lens retaining ring
  ctx.strokeStyle = '#B8BCC2';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.89, 0, Math.PI * 2);
  ctx.stroke();

  // Red anodized Leica/Schneider accent ring
  ctx.strokeStyle = PAL.redWax;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.03, -0.8, 0.8);
  ctx.stroke();

  // Engraved lens label badge at top of bezel
  ctx.fillStyle = '#121418';
  ctx.fillRect(-88, -r * 1.06 - 12, 176, 20);
  ctx.strokeStyle = '#686E78';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(-88, -r * 1.06 - 12, 176, 20);

  ctx.fillStyle = PAL.baryta;
  ctx.font = `700 10px ${F_MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SCHNEIDER 8× LUPE · ASPHERIC', 0, -r * 1.06 - 2);

  ctx.restore();
}

// ============================================================================
// 5. MASTER DUAL-ASPECT SCENE COMPOSITIONS (1920×1080 & 1080×1440)
// ============================================================================

export function renderHorizontalScene(layers, t = 6.0) {
  const { L_silver, L_wax } = layers;
  const sCtx = L_silver.ctx;
  const wCtx = L_wax.ctx;

  // --- 1. TOP DARKROOM HEADER BANNER (on L_silver) ---
  sCtx.save();
  sCtx.fillStyle = PAL.silverBlack;
  sCtx.fillRect(54, 48, 1812, 118);

  // Header metadata & title
  sCtx.fillStyle = PAL.amberCode;
  sCtx.font = `700 12px ${F_MONO}`;
  sCtx.textAlign = 'left';
  sCtx.textBaseline = 'middle';
  sCtx.fillText('MAGNUM PHOTOS · PARIS DARKROOM PROOF — CONTACT SHEET № 1956-42  |  LEICA M3 · SUMMICRON 35MM F/2', 74, 72);

  sCtx.fillStyle = PAL.baryta;
  sCtx.font = `700 32px ${F_CN}`;
  sCtx.fillText('决定性瞬间与暗房算术：一张徕卡底片如何变成传世银盐作品？', 74, 112);

  sCtx.fillStyle = PAL.silverLight;
  sCtx.font = `600 13px ${F_MONO}`;
  sCtx.fillText('EMULSION: KODAK TRI-X 400  ·  DEV: D-76 (1:1) 20°C 9m30s  ·  PAPER: ILFORD MULTIGRADE FB WARMTONE (SELENIUM TONED)', 74, 146);

  // Top-right Ansel Adams Zone System Step Wedge (Zones 0 - X)
  sCtx.fillStyle = PAL.amberCode;
  sCtx.font = `700 11px ${F_MONO}`;
  sCtx.textAlign = 'right';
  sCtx.fillText('ANSEL ADAMS ZONE SYSTEM STEP TABLET (0 – X)', 1844, 72);
  drawZoneStepWedge(sCtx, 1340, 92, 504, 54);
  sCtx.restore();

  // --- 2. LEFT 35MM CONTACT SHEET STRIPS (3 Strips × 4 Frames = 12 Frames) ---
  const stripX = 54;
  const stripW = 1040;
  const stripH = 248;

  // Strip 1 (Frames 11 - 14)
  draw35mmFilmStrip(sCtx, stripX, 188, stripW, stripH, 11, [
    [0, -0.08],
    [1, 0.02],
    [4, -0.03],
    [5, 0.04],
  ]);

  // Strip 2 (Frames 19 - 22, containing Hero Frame #21A at index 2!)
  draw35mmFilmStrip(sCtx, stripX, 456, stripW, stripH, 19, [
    [1, -0.10],
    [0, -0.02],
    [2, 0.00], // <-- HERO FRAME #21A ("The Decisive Moment")
    [2, 0.14], // Overexposed +1 EV bracket frame #22A
  ]);

  // Strip 3 (Frames 27 - 30)
  draw35mmFilmStrip(sCtx, stripX, 724, stripW, stripH, 27, [
    [3, -0.04],
    [4, 0.02],
    [5, -0.06],
    [3, 0.05],
  ]);

  // --- 3. RIGHT 8×10" ENLARGER WORK-PRINT & DODGING/BURNING RECIPE ---
  const wpX = 1138, wpY = 198, wpW = 718, wpH = 540;
  drawEnlargerWorkPrint(sCtx, wpX, wpY, wpW, wpH);

  // Bottom-Right Darkroom Print Recipe & Chemical Dossier Card
  sCtx.save();
  const cardX = 1128, cardY = 762, cardW = 738, cardH = 210;
  sCtx.fillStyle = PAL.silverBlack;
  sCtx.fillRect(cardX, cardY, cardW, cardH);
  sCtx.strokeStyle = PAL.amberCode;
  sCtx.lineWidth = 1.5;
  sCtx.strokeRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12);

  sCtx.fillStyle = PAL.amberCode;
  sCtx.font = `700 12px ${F_MONO}`;
  sCtx.textAlign = 'left';
  sCtx.fillText('DARKROOM ENLARGER EXPOSURE & SPLIT-GRADE LOG  ·  PRINT № 21A-FINAL', cardX + 22, cardY + 28);
  sCtx.textAlign = 'right';
  sCtx.fillText('FOCOMAT Ic · 50MM F/8', cardX + cardW - 22, cardY + 28);

  sCtx.strokeStyle = 'rgba(216,155,72,0.45)';
  sCtx.beginPath();
  sCtx.moveTo(cardX + 20, cardY + 42);
  sCtx.lineTo(cardX + cardW - 20, cardY + 42);
  sCtx.stroke();

  const rows = [
    ['① 基础曝光 (BASE EXPOSURE)', 'Ilford Filter #2.5 · f/8 · 12.0 sec  (确立 Zone V 中间调雨夜石板路反差)'],
    ['② 局部遮挡 (DODGE -2/3 EV)', '跳跃人物风衣与礼帽轮廓：心形遮光棒晃动遮挡 3.5 sec，保留暗部银盐细节'],
    ['③ 局部加光 (BURN +1.5 EV)', '上方天空与石桥拱洞：Filter #4.0 硬调滤片压暗 6.0 sec，凝聚街灯体积光束'],
    ['④ 硒调保护 (SELENIUM TONER)', 'Kodak Rapid Selenium (1:19) 3 min · 提升 D-max 碳黑密度与铂金冷灰分阶'],
  ];
  for (let i = 0; i < rows.length; i++) {
    const ry = cardY + 66 + i * 36;
    sCtx.fillStyle = i === 1 ? PAL.yellowWax : i === 2 ? PAL.redWax : PAL.amberCode;
    sCtx.font = `700 13px ${F_CN}`;
    sCtx.textAlign = 'left';
    sCtx.fillText(rows[i][0], cardX + 22, ry);

    sCtx.fillStyle = PAL.baryta;
    sCtx.font = `600 13px ${F_CN}`;
    sCtx.fillText(rows[i][1], cardX + 235, ry);
  }
  sCtx.restore();

  // Bottom-Left Darkroom Stamp
  sCtx.save();
  sCtx.fillStyle = PAL.silverBlack;
  sCtx.font = `700 12px ${F_MONO}`;
  sCtx.textAlign = 'left';
  sCtx.fillText('PROOFED BY: H. CARTIER-BRESSON / MAGNUM LAB  ·  BARYTA FIBER BASE 310GSM  ·  DO NOT CROP', 56, 1012);
  sCtx.restore();

  // --- 4. CHINA-MARKER / GREASE-PENCIL WAX LAYER (L_wax) ---
  // Calculate exact coordinates of Frame #21A in Strip 2 (index 2 of 4)
  const padX = 18, gap = 14;
  const fw = (stripW - padX * 2 - gap * 3) / 4; // 240.5 px
  const fh = stripH - 64; // 184 px
  const f21X = stripX + padX + 2 * (fw + gap); // 581 px
  const f21Y = 456 + 32; // 488 px

  // Red China-Marker Select Box around Frame #21A on Contact Sheet
  drawGreaseSelectBox(wCtx, f21X, f21Y, fw, fh, PAL.redWax, 'SELECT #21A ★ MASTER');

  // Yellow China-Marker Secondary Box around Frame #12A (Strip 1, index 1)
  const f12X = stripX + padX + 1 * (fw + gap);
  drawGreaseSelectBox(wCtx, f12X, 188 + 32, fw, fh, PAL.yellowWax, 'ALT #12A (CAFÉ)');

  // Red Grease-Pencil Reject Crosses ("X") on rejected frames
  drawGreaseRejectX(wCtx, stripX + padX, 188 + 32, fw, fh, PAL.redWax);
  drawGreaseRejectX(wCtx, stripX + padX + 3 * (fw + gap), 456 + 32, fw, fh, PAL.redWax);
  drawGreaseRejectX(wCtx, stripX + padX + 2 * (fw + gap), 724 + 32, fw, fh, PAL.redWax);

  // Dodging & Burning Wax Contours on the Right 8×10" Work-Print
  drawDodgeBurnZone(
    wCtx,
    wpX + wpW * 0.26,
    wpY + wpH * 0.24,
    78,
    54,
    PAL.redWax,
    'BURN +1.5 EV (6.0s)',
    '街灯高光压暗 · 凝聚光束',
    wpX + 22,
    wpY + 42
  );

  drawDodgeBurnZone(
    wCtx,
    wpX + wpW * 0.54,
    wpY + wpH * 0.44,
    62,
    76,
    PAL.yellowWax,
    'DODGE -2/3 EV (3.5s)',
    '跃起风衣遮挡 · 提亮暗部',
    wpX + 22,
    wpY + wpH - 42
  );

  // 8× Schneider Loupe positioned over the puddle ripple & Tri-X rebate of Frame #21A
  const loupeCx = Math.round(f21X + 68), loupeCy = Math.round(f21Y + fh - 16), loupeR = 68;
  drawLoupeBezel(wCtx, loupeCx, loupeCy, loupeR);

  return [loupeCx, loupeCy, loupeR];
}

export function renderVerticalScene(layers, t = 6.0) {
  const { L_silver, L_wax } = layers;
  const sCtx = L_silver.ctx;
  const wCtx = L_wax.ctx;

  // --- 1. TOP DARKROOM HEADER BANNER (1080×1440 Vertical Plate) ---
  sCtx.save();
  sCtx.fillStyle = PAL.silverBlack;
  sCtx.fillRect(48, 46, 984, 114);

  sCtx.fillStyle = PAL.amberCode;
  sCtx.font = `700 11px ${F_MONO}`;
  sCtx.textAlign = 'left';
  sCtx.textBaseline = 'middle';
  sCtx.fillText('MAGNUM PHOTOS · PARIS DARKROOM ARCHIVE — SHEET № 1956-42', 66, 68);
  sCtx.textAlign = 'right';
  sCtx.fillText('KODAK TRI-X 400 · D-76 (1:1)', 1012, 68);

  sCtx.textAlign = 'left';
  sCtx.fillStyle = PAL.baryta;
  sCtx.font = `700 28px ${F_CN}`;
  sCtx.fillText('决定性瞬间：银盐接触印相与红铅笔暗房手记', 66, 106);

  sCtx.fillStyle = PAL.silverLight;
  sCtx.font = `600 12px ${F_MONO}`;
  sCtx.fillText('ILFORD MULTIGRADE FB WARMTONE 310GSM  ·  SELENIUM SPLIT-GRADE PRINT', 66, 140);
  sCtx.restore();

  // --- 2. TWO 35MM CONTACT STRIPS (3 Frames per row) ---
  const stripX = 48, stripW = 984, stripH = 236;
  draw35mmFilmStrip(sCtx, stripX, 178, stripW, stripH, 16, [
    [0, -0.06],
    [1, 0.02],
    [3, -0.02],
  ]);

  draw35mmFilmStrip(sCtx, stripX, 430, stripW, stripH, 20, [
    [4, -0.05],
    [2, 0.00], // <-- HERO FRAME #21A (Middle frame!)
    [2, 0.14],
  ]);

  // --- 3. BOTTOM MASTER ENLARGER WORK-PRINT & STEP WEDGE ---
  const wpX = 58, wpY = 696, wpW = 964, wpH = 490;
  drawEnlargerWorkPrint(sCtx, wpX, wpY, wpW, wpH);

  // Bottom Darkroom Exposure Log Card
  sCtx.save();
  const cardX = 48, cardY = 1210, cardW = 984, cardH = 166;
  sCtx.fillStyle = PAL.silverBlack;
  sCtx.fillRect(cardX, cardY, cardW, cardH);
  sCtx.strokeStyle = PAL.amberCode;
  sCtx.lineWidth = 1.4;
  sCtx.strokeRect(cardX + 6, cardY + 6, cardW - 12, cardH - 12);

  sCtx.fillStyle = PAL.amberCode;
  sCtx.font = `700 12px ${F_MONO}`;
  sCtx.textAlign = 'left';
  sCtx.fillText('ENLARGER PRINT RECIPE · FRAME #21A (PONT DES ARTS, PARIS 1956)', cardX + 20, cardY + 28);
  drawZoneStepWedge(sCtx, cardX + 560, cardY + 14, 404, 28);

  const notes = [
    '① 基础曝光：Ilford FB Warmtone · Filter #2.5 · f/8 · 12.0s  |  ② 局部遮挡 (Dodge)：跃起风衣 -2/3 EV (3.5s)',
    '③ 局部压暗 (Burn)：街灯与石桥高光 Filter #4.0 +1.5 EV (6.0s)  |  ④ 硒调定影：Kodak Selenium Toner 1:19 (3m)',
  ];
  sCtx.fillStyle = PAL.baryta;
  sCtx.font = `600 14px ${F_CN}`;
  sCtx.fillText(notes[0], cardX + 20, cardY + 82);
  sCtx.fillText(notes[1], cardX + 20, cardY + 124);
  sCtx.restore();

  // --- 4. GREASE-PENCIL WAX MARKS & LOUPE ---
  const padX = 18, gap = 14;
  const fw = (stripW - padX * 2 - gap * 2) / 3;
  const fh = stripH - 64;
  const f21X = stripX + padX + 1 * (fw + gap);
  const f21Y = 430 + 32;

  drawGreaseSelectBox(wCtx, f21X, f21Y, fw, fh, PAL.redWax, 'SELECT #21A ★');
  drawGreaseRejectX(wCtx, stripX + padX, 178 + 32, fw, fh, PAL.redWax);
  drawGreaseRejectX(wCtx, stripX + padX + 2 * (fw + gap), 430 + 32, fw, fh, PAL.redWax);

  drawDodgeBurnZone(
    wCtx,
    wpX + wpW * 0.26,
    wpY + wpH * 0.24,
    84,
    56,
    PAL.redWax,
    'BURN +1.5 EV (6.0s)',
    '街灯高光压暗 · 凝聚光束',
    wpX + 24,
    wpY + 42
  );

  drawDodgeBurnZone(
    wCtx,
    wpX + wpW * 0.54,
    wpY + wpH * 0.44,
    68,
    78,
    PAL.yellowWax,
    'DODGE -2/3 EV (3.5s)',
    '跃起风衣遮挡 · 提亮暗部',
    wpX + 24,
    wpY + wpH - 42
  );

  const loupeCx = Math.round(f21X + 76), loupeCy = Math.round(f21Y + fh - 16), loupeR = 66;
  drawLoupeBezel(wCtx, loupeCx, loupeCy, loupeR);

  return [loupeCx, loupeCy, loupeR];
}

export function renderFrame(comp, layers, t = 6.0, mode = 'horizontal') {
  const w = mode === 'vertical' ? 1080 : 1920;
  const h = mode === 'vertical' ? 1440 : 1080;
  clearLayers(layers, w, h);

  const loupe = mode === 'vertical'
    ? renderVerticalScene(layers, t)
    : renderHorizontalScene(layers, t);

  comp.beginBaryta();
  comp.silverPass(layers.L_silver.c);
  comp.waxLoupePass(layers.L_wax.c, loupe);
  comp.finish();
}
