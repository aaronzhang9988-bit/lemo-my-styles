// Lab Press Grid (工程套印网格) — Demo Film: DeepSeek Architecture (-90% Inference Cost)
// Supports default mode ('custom' = Lab Press Grid) and '?mode=base' (original Swiss Motion Graphics)

import { clamp, lerp, seg, E, snap, lin, steps, E8, E16, BEAT, BAR, rng } from './ease.js';

export const W = 1920, H = 1080, DUR = 28.0;

export const PALETTES = {
  custom: {
    page: '#EDE8DF',
    paper: '#F6F3EC',
    ink: '#0F1B29',
    overprint: '#2A6F97',
    signal: '#FF4F00',
    gridPage: '#D4CEC2',
    gridPaper: '#DFD9CE',
    mute: '#5A626E',
    secondary: '#C8C2B6',
  },
  base: {
    page: '#EAE9E5',
    paper: '#FFFFFF',
    ink: '#111111',
    overprint: '#CFCEC9',
    signal: '#E30613',
    gridPage: '#CFCEC9',
    gridPaper: '#E2E1DC',
    mute: '#77766F',
    secondary: '#CFCEC9',
  }
};

// 12-column frame grid: margin 96, gutter 24, col width 122
const FM = 96, FG = 24, FC = 122;
export const fx = i => FM + i * (FC + FG);

// Right-page specification sheet: cols 6..11 (x = 972, w = 852, y = 76, h = 928)
const SX = fx(6), SY = 76, SW = fx(12) - FG - SX, SH = 928;
// 6 modular columns inside the right sheet (each 126 px wide, margin 48 px)
const SMX = 48, SMY = 64, SCW = 126, SRH = 48, SNC = 6, SNR = 16;
const spx = c => SX + SMX + c * SCW;
const spy = r => SY + SMY + r * SRH;

// Offscreen paper texture canvas (built once)
let paperCanvas = null;
export function buildArchivePaper() {
  paperCanvas = document.createElement('canvas');
  paperCanvas.width = W;
  paperCanvas.height = H;
  const ctx = paperCanvas.getContext('2d');
  const r = rng(42);

  // Low-frequency warm mottling tile upscaled
  const small = document.createElement('canvas');
  small.width = 120;
  small.height = 68;
  const sctx = small.getContext('2d');
  const sim = sctx.createImageData(120, 68);
  for (let i = 0; i < sim.data.length; i += 4) {
    const v = 244 + Math.floor(r() * 11);
    sim.data[i] = v;
    sim.data[i + 1] = v - 2;
    sim.data[i + 2] = v - 6;
    sim.data[i + 3] = 255;
  }
  sctx.putImageData(sim, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(small, 0, 0, W, H);

  // Fine fibre noise
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 14;
    img.data[i] = clamp(img.data[i] + n, 0, 255);
    img.data[i + 1] = clamp(img.data[i + 1] + n, 0, 255);
    img.data[i + 2] = clamp(img.data[i + 2] + n - 2, 0, 255);
  }
  ctx.putImageData(img, 0, 0);

  // Warm edge vignette
  const gr = ctx.createRadialGradient(W / 2, H / 2, 480, W / 2, H / 2, 1180);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(1, 'rgba(115,96,72,0.22)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, W, H);

  // Vertical spread spine fold crease at x = SX - 24 (948)
  const foldX = SX - 24;
  const foldGr = ctx.createLinearGradient(foldX - 14, 0, foldX + 14, 0);
  foldGr.addColorStop(0, 'rgba(120,105,85,0)');
  foldGr.addColorStop(0.48, 'rgba(110,95,75,0.16)');
  foldGr.addColorStop(0.55, 'rgba(255,252,245,0.25)');
  foldGr.addColorStop(1, 'rgba(120,105,85,0)');
  ctx.fillStyle = foldGr;
  ctx.fillRect(foldX - 14, 0, 28, H);
}

// Draw 45-degree rotated halftone dot field inside a clipped rect
function drawHalftoneRect(g, x0, y0, w, h, color, { step = 18, angle = 45, densityFn = null, maxK = 0.56 } = {}) {
  if (w <= 0 || h <= 0) return;
  g.save();
  g.beginPath();
  g.rect(x0, y0, w, h);
  g.clip();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = color;

  const rad = angle * Math.PI / 180, ca = Math.cos(rad), sa = Math.sin(rad);
  const cx = x0 + w / 2, cy = y0 + h / 2;
  const diag = Math.hypot(w, h) / 2 + step;
  const n = Math.ceil(diag / step);

  g.beginPath();
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const u = i * step, v = j * step;
      const px = cx + u * ca - v * sa;
      const py = cy + u * sa + v * ca;
      if (px < x0 - step || px > x0 + w + step || py < y0 - step || py > y0 + h + step) continue;
      const d = densityFn ? clamp(densityFn(px, py), 0, 1) : 0.65;
      if (d < 0.06) continue;
      const r = d * step * maxK;
      g.moveTo(px + r, py);
      g.arc(px, py, r, 0, Math.PI * 2);
    }
  }
  g.fill();
  g.restore();
}

// Draw headline or giant numeral with +4px/+4px cyan-blue overprint misregistration shadow
function drawMisregText(g, str, x, y, P, isBase, offset = 4) {
  if (!isBase) {
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.fillStyle = P.overprint;
    g.fillText(str, x + offset, y + offset);
    g.restore();
  }
  g.fillStyle = P.ink;
  g.fillText(str, x, y);
}

// Clip-revealed text with optional misregistration
function revealMisregText(g, str, x, y, size, p, q, P, isBase, offset = 4) {
  if (p <= 0 || q >= 1) return;
  const w = g.measureText(str).width + size * 0.15;
  g.save();
  g.beginPath();
  g.rect(x - 4, y - size * 1.08, w + 16, size * 1.38);
  g.clip();
  const dy = (1 - p) * size * 1.08 - q * size * 1.3;
  drawMisregText(g, str, x, y + dy, P, isBase, offset);
  g.restore();
}

// Clip-revealed sharp text (no misregistration, for small notes & HUD)
function revealSharpText(g, str, x, y, size, p, q = 0, color = '#0F1B29') {
  if (p <= 0 || q >= 1) return;
  const w = g.measureText(str).width + size * 0.1;
  g.save();
  g.beginPath();
  g.rect(x - 2, y - size * 1.05, w + 8, size * 1.32);
  g.clip();
  g.fillStyle = color;
  g.fillText(str, x, y + (1 - p) * size * 1.05 - q * size * 1.3);
  g.restore();
}

// Redaction bar reveal: starts as a solid #0F1B29 censor block with [REDACTED] label,
// then at tReveal a vertical safety-orange laser bar wipes it open from left to right
function drawRedactedField(g, { x, y, w, h, label, secretText, highlightText, t, tEnter, tReveal, P, isBase }) {
  const pIn = snap(t, tEnter, E8);
  if (pIn <= 0) return;
  const pOpen = isBase ? 1 : snap(t, tReveal, E8 * 1.5);

  g.save();
  g.beginPath();
  g.rect(x, y, w * pIn, h);
  g.clip();

  // Underlying revealed secret content
  g.fillStyle = isBase ? '#F3F2EE' : '#EAE3D5';
  g.fillRect(x, y, w, h);
  g.strokeStyle = P.ink;
  g.lineWidth = 1.5;
  g.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);

  // Highlight badge on the right side of the revealed box
  if (highlightText) {
    g.font = '700 20px "JetBrains Mono", "Noto Sans SC"';
    const hw = g.measureText(highlightText).width + 24;
    g.fillStyle = P.signal;
    g.fillRect(x + w - hw - 10, y + 8, hw, h - 16);
    g.fillStyle = isBase ? '#FFFFFF' : P.paper;
    g.fillText(highlightText, x + w - hw + 2, y + h / 2 + 7);
  }

  g.font = '700 23px "Noto Sans SC", "Archivo"';
  g.fillStyle = P.ink;
  g.fillText(secretText, x + 16, y + h / 2 + 8);

  // Solid Redaction Censor Bar covering it until tReveal (only in custom Lab Press Grid mode)
  if (!isBase && pOpen < 1) {
    const barX = x + w * pOpen;
    const barW = w * (1 - pOpen);
    g.save();
    g.beginPath();
    g.rect(barX, y, barW, h);
    g.clip();

    g.fillStyle = P.ink;
    g.fillRect(barX, y, barW, h);

    // Diagonal hatch lines on censor bar
    g.strokeStyle = P.overprint;
    g.lineWidth = 1.2;
    for (let hx = barX - h; hx < barX + barW; hx += 14) {
      g.beginPath();
      g.moveTo(hx, y + h);
      g.lineTo(hx + h, y);
      g.stroke();
    }

    // [REDACTED] tag
    g.font = '700 15px "JetBrains Mono", "Noto Sans SC"';
    g.fillStyle = P.paper;
    g.fillText(label || '[REDACTED // 待解密]', barX + 16, y + h / 2 + 6);
    g.restore();

    // Vertical safety-orange laser/knife wipe bar at the leading edge
    if (pOpen > 0.02 && pOpen < 0.98) {
      g.fillStyle = P.signal;
      g.fillRect(barX - 2, y - 4, 4, h + 8);
    }
  }

  g.restore();
}

// Hydraulic Spec Stamp: double-bordered rectangular engineering stamp with +3.5px cyan overprint shadow on frame & big title
function drawHydraulicStamp(g, { x, y, title, sub, t, tStamp, P, isBase }) {
  if (isBase) return;
  if (t < tStamp - E16) return;
  const p = snap(t, tStamp, E16);
  const scale = lerp(1.38, 1.0, p);
  const alpha = clamp(p * 1.2, 0, 0.96);

  const sw = 304, sh = 100;
  g.save();
  g.translate(x, y);
  g.rotate(-4 * Math.PI / 180);
  g.scale(scale, scale);
  g.globalAlpha = alpha;

  g.fillStyle = 'rgba(246, 243, 236, 0.94)';
  g.fillRect(-sw / 2, -sh / 2, sw, sh);

  const drawFrameAndBigTitle = (dx, dy, color, blend) => {
    g.save();
    g.globalCompositeOperation = blend;
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineWidth = 5;
    g.strokeRect(-sw / 2 + dx, -sh / 2 + dy, sw, sh);
    g.lineWidth = 1.8;
    g.strokeRect(-sw / 2 + 9 + dx, -sh / 2 + 9 + dy, sw - 18, sh - 18);
    g.font = '900 32px "Noto Sans SC", "Archivo"';
    g.fillText(title, -sw / 2 + 20 + dx, 18 + dy);
    g.restore();
  };

  drawFrameAndBigTitle(3.5, 3.5, P.overprint, 'multiply');
  drawFrameAndBigTitle(0, 0, P.signal, 'source-over');

  g.fillStyle = P.ink;
  g.fillRect(-sw / 2 + 9, -sh / 2 + 9, sw - 18, 22);
  g.font = '700 13px "JetBrains Mono"';
  g.fillStyle = P.paper;
  g.fillText('DEEPSEEK ARCH // SPEC VERIFIED', -sw / 2 + 18, -sh / 2 + 25);

  g.font = '700 13px "JetBrains Mono"';
  g.fillStyle = P.ink;
  g.fillText(sub, -sw / 2 + 20, 39);

  g.restore();
}

// Four-corner Engineering HUD (Custom) vs Minimal Corner Notes (Base)
function drawHUD(g, t, ruleNum, offGrid, P, isBase) {
  const pHud = snap(t, 0.5, E8);
  if (pHud <= 0) return;

  const barNum = Math.floor(t / BAR) + 1;
  const beatNum = Math.floor((t % BAR) / BEAT) + 1;
  const barStr = `BAR ${String(barNum).padStart(2, '0')}.${beatNum}`;

  if (isBase) {
    g.font = '500 19px "Archivo", "Noto Sans SC"';
    g.fillStyle = P.mute;
    g.fillText(`Rule 0${ruleNum} / 03 · 120 BPM`, FM, 52);
    g.fillText(`Columns 6 · Rows 16 · Module 126 × 48`, FM, H - 36);
    g.fillText(barStr.toLowerCase(), SX, H - 36);
    return;
  }

  g.save();
  g.globalAlpha = pHud;

  // Top-left HUD box: DOC-SPEC ID + active rule chip
  g.strokeStyle = P.ink;
  g.lineWidth = 1.5;
  g.strokeRect(FM, 24, 440, 34);
  g.fillStyle = P.ink;
  g.fillRect(FM, 24, 168, 34);
  g.font = '700 15px "JetBrains Mono"';
  g.fillStyle = P.paper;
  g.fillText('DOC // DS-ARCH-90', FM + 12, 46);
  g.fillStyle = P.ink;
  g.fillText(`CLAUSE 0${ruleNum}/03 · 推理成本拆解`, FM + 182, 46);

  // Top-right HUD box: Grid lock status + BPM + scale
  const trW = 456, trX = W - FM - trW;
  g.strokeRect(trX, 24, trW, 34);
  g.fillStyle = offGrid ? P.signal : P.overprint;
  g.fillRect(trX + 10, 34, 14, 14);
  g.fillStyle = P.ink;
  g.font = '700 15px "JetBrains Mono"';
  g.fillText(
    offGrid ? 'ROUTE: SPARSE [37B/671B OFF-GRID] · 120 BPM' : 'GRID LOCK: DENSE [671B] · 120 BPM · 24 FPS',
    trX + 32,
    46
  );

  // Bottom-left HUD: Halftone & overprint technical calibration
  g.strokeStyle = P.ink;
  g.beginPath();
  g.moveTo(FM, H - 56);
  g.lineTo(FM + 756, H - 56);
  g.stroke();
  g.font = '700 15px "JetBrains Mono", "Noto Sans SC"';
  g.fillStyle = P.mute;
  g.fillText('MOD 06×16 (126×48 PX)  |  HALFTONE: 45° CYAN (#2A6F97)  |  OVERPRINT OFFSET: +4.0 PX', FM, H - 32);

  // Bottom-right HUD: Live coordinate readout + Bar/Beat counter
  g.beginPath();
  g.moveTo(SX, H - 56);
  g.lineTo(W - FM, H - 56);
  g.stroke();
  const coordStr = offGrid
    ? 'EXPERT ROUTE: COL 04.42 · ACTIVE 5.5% [OFF GRID // 破局]'
    : `KV-CACHE GRID: COL 0${ruleNum}.00 · ROW 08.00 [ON GRID]`;
  g.fillStyle = offGrid ? P.signal : P.ink;
  g.fillText(coordStr, SX, H - 32);
  g.fillStyle = P.ink;
  g.fillText(barStr, W - FM - 95, H - 32);

  // Registration crop marks at the 4 frame corners
  const cm = 14;
  [[FM - 18, 24], [W - FM + 18, 24], [FM - 18, H - 24], [W - FM + 18, H - 24]].forEach(([cx, cy]) => {
    g.strokeStyle = P.overprint;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(cx - cm, cy); g.lineTo(cx + cm, cy);
    g.moveTo(cx, cy - cm); g.lineTo(cx, cy + cm);
    g.stroke();
  });

  g.restore();
}

// Bloated legacy MHA KV-Cache rows (enter at t=3.5s, sliced by Knife Cuts at t=6.0, 6.5, 7.0s)
const KV_BLOAT_ROWS = [
  { r: 2, label: 'MHA KV-CACHE #01 // 传统全量键值缓存 128 GB', cutT: 6.0 },
  { r: 5, label: 'MHA KV-CACHE #02 // 冗余注意力头显存 96 GB', cutT: 6.5 },
  { r: 8, label: 'MHA KV-CACHE #03 // 跨卡通信带宽阻塞 112 GB', cutT: 7.0 },
];

// Parameter & Expert Modules on the 6x16 grid
const MATRIX_BLOCKS = [
  // [col, row, rowSpan, isSecondaryHalftone, enterT, finalCol, finalRow, finalSpan]
  [0, 1, 3, false, 2.0, 0, 1, 5],
  [1, 3, 3, true,  2.25, 0, 7, 5],
  [2, 5, 3, false, 2.5, 1, 2, 5],
  [3, 7, 3, true,  2.75, 1, 8, 5],
  [4, 9, 3, false, 3.0, 2, 3, 6],
  [5, 11, 3, true, 3.25, 2, 10, 4],
  [1, 12, 2, false, 3.5, 3, 5, 5],
  [3, 13, 2, true,  3.75, 3, 11, 4],
  [0, 14, 2, false, 4.0, 4, 7, 6],
  [4, 2, 2, true,  4.25, 5, 9, 5],
];

const VARIANT_TITLES = [
  'ARTIFACT // 01 : MLA & MoE TOPOLOGY (显存与稀疏专家拓扑)',
  'ARTIFACT // 02 : MLA LOW-RANK KV COMPRESSION (-93.3% RAM)',
  'ARTIFACT // 03 : MoE 37B/671B ROUTING MATRIX (5.5% ACTIVE)',
  'ARTIFACT // 04 : FP8 DUALPIPE & COST BREAKDOWN (-90.2% COST)',
];

// Render a single specification sheet (supports 90-degree rotation reveal at t=18.0..21.5s)
function drawSpecSheet(g, t, P, isBase, variant = 0) {
  const pSheet = variant === 0 ? snap(t, 1.2, BEAT) : 1;
  if (pSheet <= 0) return;

  // Camera Move 2: Rotate the right specification sheet 90 degrees CCW at t=18.0..18.75s,
  // hold while sweeping cost bars (18.75..20.75s), and rotate back at t=20.75..21.25s!
  let rotAngle = 0, rotScale = 1;
  if (variant === 0 && t >= 18.0 && t < 21.4) {
    const pRotIn = snap(t, 18.75, 1.5 * BEAT);
    const pRotOut = snap(t, 21.25, BEAT);
    const rAmt = pRotIn - pRotOut;
    rotAngle = -rAmt * (Math.PI / 2);
    rotScale = lerp(1, 0.84, rAmt);
  }

  const cx = SX + SW / 2, cy = SY + SH / 2;
  g.save();
  g.translate(cx, cy);
  g.rotate(rotAngle);
  g.scale(rotScale, rotScale);
  g.translate(-cx, -cy);

  g.beginPath();
  g.rect(SX, SY, SW, SH * pSheet);
  g.clip();

  // Sheet background
  g.fillStyle = P.paper;
  g.fillRect(SX, SY, SW, SH);
  g.strokeStyle = P.ink;
  g.lineWidth = 2;
  g.strokeRect(SX + 1, SY + 1, SW - 2, SH - 2);

  // Sheet top technical header (hidden during 90-deg rotation so rotated labels don't collide, per §9 Pitfall)
  const inRotHold = variant === 0 && t >= 18.5 && t <= 21.0;
  if (!inRotHold) {
    g.strokeStyle = P.ink;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(SX + SMX, SY + 42);
    g.lineTo(SX + SW - SMX, SY + 42);
    g.stroke();

    g.font = '700 15px "JetBrains Mono", "Noto Sans SC"';
    g.fillStyle = P.ink;
    g.fillText(VARIANT_TITLES[variant] || VARIANT_TITLES[0], SX + SMX, SY + 32);
    g.fillStyle = P.signal;
    g.fillText(t >= 13.0 ? 'COST: -90.2% [$0.55/M]' : 'COST: BASELINE [100%]', SX + SW - SMX - 205, SY + 32);
  }

  // 6x16 Modular Grid lines inside the sheet
  const pGrid = variant === 0 ? snap(t, 1.6, BEAT) : 1;
  g.strokeStyle = P.gridPaper;
  g.lineWidth = 1;
  for (let c = 0; c <= SNC; c++) {
    const x = spx(c);
    g.beginPath();
    g.moveTo(x, spy(0));
    g.lineTo(x, spy(0) + (SNR * SRH) * pGrid);
    g.stroke();
  }
  for (let r = 0; r <= SNR; r++) {
    const y = spy(r);
    g.beginPath();
    g.moveTo(spx(0), y);
    g.lineTo(spx(0) + (SNC * SCW) * pGrid, y);
    g.stroke();
  }

  // Column headers (EXP·01..06)
  if (pGrid > 0.8 && !inRotHold) {
    g.font = '700 13px "JetBrains Mono"';
    g.fillStyle = P.mute;
    for (let c = 0; c < SNC; c++) {
      g.fillText(`EXP·0${c + 1}`, spx(c) + 8, spy(0) - 8);
    }
  }

  // 1) Modular Parameter Blocks (reflow into diagonal cascade after the MoE off-grid break at t=14.4s)
  const tReflow = 14.4;
  MATRIX_BLOCKS.forEach((b, idx) => {
    const [c0, r0, span0, isHalf, tEn, cf, rf, spanF] = b;
    const pIn = variant === 0 ? snap(t, tEn, E8) : 1;
    if (pIn <= 0) return;

    const pRe = variant === 0 ? snap(t, tReflow + idx * 0.05, E8) : 1;
    const c = lerp(c0, (cf + variant) % SNC, pRe);
    const r = lerp(r0, rf, pRe);
    const span = lerp(span0, spanF, pRe);

    const bx = spx(c) + 5;
    const by = spy(r) + 4;
    const bw = SCW - 10;
    const bh = (span * SRH - 8) * pIn;

    if (isHalf) {
      if (isBase) {
        g.fillStyle = P.secondary;
        g.fillRect(bx, by, bw, bh);
      } else {
        g.fillStyle = '#EAE3D5';
        g.fillRect(bx, by, bw, bh);
        drawHalftoneRect(g, bx, by, bw, bh, P.overprint, {
          step: 16,
          angle: 45,
          maxK: 0.58,
          densityFn: (x, y) => 0.35 + 0.55 * clamp((y - by) / Math.max(1, bh), 0, 1)
        });
        g.strokeStyle = P.overprint;
        g.lineWidth = 1.5;
        g.strokeRect(bx, by, bw, bh);
      }
    } else {
      g.fillStyle = P.ink;
      g.fillRect(bx, by, bw, bh);
      if (!isBase && bh > 45 && !inRotHold) {
        g.font = '700 12px "JetBrains Mono"';
        g.fillStyle = P.paper;
        g.fillText(`M·0${idx + 1}`, bx + 8, by + 18);
      }
    }
  });

  // 2) Legacy MHA KV-Cache Bloated Rows (drawn on top of matrix blocks so text is 100% unobstructed before Knife Cut at t=6.0..7.0s)
  if (variant === 0 && t >= 3.2) {
    KV_BLOAT_ROWS.forEach((item, idx) => {
      const pIn = snap(t, 3.6 + idx * E8, E8);
      if (pIn <= 0) return;
      const pCut = snap(t, item.cutT + E8, E8);
      if (pCut >= 1) return;

      const rx = spx(0) + 4, ry = spy(item.r) + 4;
      const rw = (SNC * SCW - 8) * pIn, rh = SRH - 8;
      const collapse = 1 - pCut;

      g.save();
      const midY = ry + rh / 2;
      g.translate(0, midY);
      g.scale(1, Math.max(0.001, collapse));
      g.translate(0, -midY);

      g.fillStyle = isBase ? '#EAE9E5' : '#EFE9DC';
      g.fillRect(rx, ry, rw, rh);
      g.fillStyle = P.signal;
      g.fillRect(rx, ry, 10, rh);
      g.strokeStyle = P.ink;
      g.lineWidth = 2;
      g.strokeRect(rx, ry, rw, rh);

      g.font = '700 17px "JetBrains Mono", "Noto Sans SC"';
      g.fillStyle = P.ink;
      g.fillText(item.label, rx + 22, ry + rh / 2 + 6);
      g.restore();

      // Knife cut line across the midline
      if (t >= item.cutT - E16 && t <= item.cutT + E8) {
        const kl = lin(t, item.cutT - E16, item.cutT);
        g.fillStyle = P.signal;
        g.fillRect(spx(0) - 12, midY - 2, (SNC * SCW + 24) * kl, 4);
      }
    });
  }

  // 3) The Protagonist Signal Element (MoE Active Expert Node: 37B / 5.5%):
  // Enters on-grid at t=10.2s (col 4, row 1), twitches at t=12.5s, flies OFF-GRID linearly at t=13.0..14.2s
  if (t >= 10.0 || variant > 0) {
    const pSigIn = variant === 0 ? snap(t, 10.2, E8) : 1;
    const twitch = (t >= 12.5 && t < 12.75) ? Math.sin((t - 12.5) / 0.25 * Math.PI) * 18 : 0;
    let pFly = 0;
    if (variant > 0 || t >= 14.2) pFly = 1;
    else if (t > 13.0) {
      if (t < 13.5) pFly = lin(t, 13.0, 13.5) * 0.55;
      else if (t < 13.7) pFly = 0.55;
      else pFly = 0.55 + lin(t, 13.7, 14.2) * 0.45;
    }

    const gx0 = spx(4) + 5 + twitch, gy0 = spy(1) + 4, gw0 = SCW - 10, gh0 = SRH * 2 - 8;
    const gx1 = spx(3) + 28, gy1 = spy(1) - 18, gw1 = SCW * 2.45, gh1 = SRH * 4.2;

    const sx = lerp(gx0, gx1, pFly);
    const sy = lerp(gy0, gy1, pFly);
    const sw = lerp(gw0, gw1, pFly) * pSigIn;
    const sh = lerp(gh0, gh1, pFly);

    if (!isBase && pFly > 0.2) {
      drawHalftoneRect(g, sx + 12 * pFly, sy + 12 * pFly, sw, sh, P.overprint, {
        step: 14,
        angle: 45,
        maxK: 0.62,
        densityFn: () => 0.78 * pFly
      });
    }

    g.save();
    g.fillStyle = P.signal;
    g.fillRect(sx, sy, sw, sh);
    g.strokeStyle = P.ink;
    g.lineWidth = 2;
    g.strokeRect(sx, sy, sw, sh);
    g.restore();

    if (pSigIn > 0.7 && !inRotHold) {
      g.save();
      g.beginPath();
      g.rect(sx, sy, sw, sh);
      g.clip();
      g.font = '900 22px "Archivo", "Noto Sans SC"';
      g.fillStyle = P.ink;
      g.fillText(pFly > 0.5 ? 'MoE // 37B 稀疏路由破局' : 'EXPERT 01', sx + 16, sy + 38);
      g.font = '700 14px "JetBrains Mono"';
      g.fillText(
        pFly > 0.5 ? 'OFF-GRID: 5.5% ACTIVE · -90% COST' : 'ON-GRID: COL 04.00',
        sx + 16,
        sy + 64
      );
      if (pFly > 0.8) {
        g.font = '800 74px "Archivo"';
        g.fillStyle = P.ink;
        g.fillText('-90%', sx + 14, sy + sh - 18);
      }
      g.restore();
    }
  }

  // 4) Playhead sweep during the 90-degree rotation hold (t=18.8..20.6s)
  if (variant === 0 && t >= 18.75 && t <= 20.85) {
    const pSweep = lin(t, 18.85, 20.65);
    const sweepY = spy(0) + pSweep * (SNR * SRH);
    g.fillStyle = P.signal;
    g.fillRect(spx(0) - 16, sweepY - 2, SNC * SCW + 32, 4);
  }

  // 5) Hydraulic Spec Stamp slamming onto the bottom-right at t=22.0s (after the 21.5..22.0s silence!)
  if (variant === 0) {
    drawHydraulicStamp(g, {
      x: SX + SW - 202,
      y: SY + SH - 96,
      title: '成本砍掉 90%',
      sub: 'VERIFIED // $0.55 PER 1M TOKENS',
      t,
      tStamp: 22.0,
      P,
      isBase
    });
  }

  g.restore();

  // Screen-space horizontal cost readout labels during the 90° rotation hold (t=18.75..20.85s)
  // Ordered strictly per §9 Pitfall: rotate (18.0..18.75s) -> hold -> wipe in labels!
  if (variant === 0 && t >= 18.75 && t <= 20.85) {
    const pLab = snap(t, 18.95, E8);
    g.save();
    g.fillStyle = P.ink;
    g.fillRect(SX + 38, SY + 64, 776 * pLab, 50);
    g.font = '700 18px "JetBrains Mono", "Noto Sans SC"';
    g.fillStyle = P.paper;
    if (pLab > 0.6) {
      g.fillText('90° COST VIEW // 传统稠密 $20.0  →  DeepSeek 新架构 $0.55 (-90.2%)', SX + 56, SY + 95);
    }
    // Horizontal readout inside the rotated safety-orange protagonist block
    if (pLab > 0.5) {
      g.font = '900 38px "Archivo"';
      g.fillStyle = P.ink;
      g.fillText('$0.55', SX + 126, SY + 332);
      g.font = '700 13px "JetBrains Mono", "Noto Sans SC"';
      g.fillText('DEEPSEEK -90.2%', SX + 126, SY + 358);
    }
    g.restore();
  }
}

// Main Left Page (The Specification Programme: Giant Numeral, Misregistered Headlines, 3 Redaction Bars, Subtitles)
function drawLeftProgramme(g, t, P, isBase) {
  // Clause 01 (0..9.5s): MLA 显存折叠 (Knife Cuts + Redaction #1)
  // Clause 02 (9.5..17.5s): MoE 稀疏激活 (Off-Grid Break + Redaction #2)
  // Clause 03 (17.5..28.0s): 推理成本破局 (90° Cost View + Silence + Hydraulic Stamp)
  let ruleNum = 1, numStr = '01', cnTitle = 'MLA 显存折叠', enTitle = 'LOW-RANK KV COMPRESSION';
  let subLead = 'CLAUSE 01 // 砍掉显存墙', subMain = '低秩联合压缩切碎冗余缓存，显存占用直降九成。', subHighlight = '直降九成';

  if (t >= 9.5 && t < 17.5) {
    ruleNum = 2; numStr = '02'; cnTitle = 'MoE 稀疏激活', enTitle = 'FINE-GRAINED EXPERT ROUTING';
    subLead = 'CLAUSE 02 // 按需唤醒算力'; subMain = '每Token仅激活5.5%专家参数，脱离稠密网格约束。'; subHighlight = '仅激活5.5%';
  } else if (t >= 17.5) {
    ruleNum = 3; numStr = '03'; cnTitle = '推理成本破局', enTitle = 'FP8 & 90% COST REDUCTION';
    subLead = 'CLAUSE 03 // 架构级降维打击'; subMain = '三大机制叠加，把百万Token推理成本砍掉90%。', subHighlight = '成本砍掉90%';
  }

  const tRuleStart = ruleNum === 1 ? 1.0 : ruleNum === 2 ? 9.5 : 17.5;
  const pEnter = snap(t, tRuleStart + 0.5, BEAT);

  // Left page 45° cyan halftone backdrop block behind the giant numeral (Custom mode only)
  const numX = FM - 8, numY = H - 108;
  if (!isBase) {
    drawHalftoneRect(g, FM, 450, 740 * pEnter, 530, P.overprint, {
      step: 20,
      angle: 45,
      maxK: 0.60,
      densityFn: (x, y) => {
        const dx = (x - (FM + 260)) / 480;
        const dy = (y - 730) / 350;
        return clamp(0.85 - Math.hypot(dx, dy) * 0.75, 0, 1);
      }
    });
  }

  // Giant Numeral (510px Archivo 800) with stepped modular climb and +6px/+6px cyan misregistration shadow
  const pStep = steps(t, tRuleStart, tRuleStart + BEAT * 1.5, 4);
  if (pStep > 0) {
    g.save();
    g.beginPath();
    g.rect(FM - 20, 410, 820, 580);
    g.clip();
    g.font = '800 500px "Archivo"';
    g.letterSpacing = '-12px';
    const climbY = numY + (1 - pStep) * 420;
    drawMisregText(g, numStr, numX, climbY, P, isBase, 6);
    g.letterSpacing = '0px';
    g.restore();
  }

  // Top section rule & English tag
  g.fillStyle = P.signal;
  g.fillRect(FM, 92, 756 * pEnter, 4);
  g.font = '700 20px "JetBrains Mono"';
  revealSharpText(g, `DEEPSEEK SPEC // CLAUSE ${numStr} — ${enTitle}`, FM, 128, 20, pEnter, 0, P.overprint === '#CFCEC9' ? P.mute : P.overprint);

  // Main Chinese Headline (90px Noto Sans SC 900) with +4px/+4px cyan misregistration shadow
  g.font = '900 90px "Noto Sans SC", "Archivo"';
  revealMisregText(g, cnTitle, FM, 228, 90, pEnter, 0, P, isBase, 4);

  // Three Redaction Reveal Boxes on the left page (one per Clause!)
  drawRedactedField(g, {
    x: FM,
    y: 256,
    w: 756,
    h: 52,
    label: '[REDACTED // 机密实测 01 : MLA 键值缓存压缩率]',
    secretText: 'KV 显存占用：直降 93.3%',
    highlightText: '-93.3% KV RAM',
    t,
    tEnter: 2.0,
    tReveal: 7.5,
    P,
    isBase
  });

  drawRedactedField(g, {
    x: FM,
    y: 318,
    w: 756,
    h: 52,
    label: '[REDACTED // 机密实测 02 : MoE 单Token激活参数]',
    secretText: '671B 总参数 → 仅激活 37B',
    highlightText: '5.5% ACTIVE',
    t,
    tEnter: 2.3,
    tReveal: 15.5,
    P,
    isBase
  });

  drawRedactedField(g, {
    x: FM,
    y: 380,
    w: 756,
    h: 52,
    label: '[REDACTED // 机密实测 03 : 百万Token推理总成本]',
    secretText: '推理成本：$20.0 → $0.55 / 1M',
    highlightText: '-90.2% COST',
    t,
    tEnter: 2.6,
    tReveal: 21.0,
    P,
    isBase
  });

  // Grid-aligned inline subtitle at the bottom-left (with safety-orange highlight block behind key phrase)
  const pSub = snap(t, tRuleStart + 0.6, E8);
  if (pSub > 0) {
    const sy = 905;
    g.save();
    g.fillStyle = isBase ? 'rgba(234,233,229,0.94)' : 'rgba(237,232,223,0.94)';
    g.fillRect(FM - 8, sy - 68, 772, 118);
    g.strokeStyle = P.ink;
    g.lineWidth = 1.5;
    g.strokeRect(FM - 8, sy - 68, 772, 118);

    g.font = '700 18px "JetBrains Mono", "Noto Sans SC"';
    g.fillStyle = P.signal;
    g.fillText(subLead, FM + 10, sy - 38);

    g.font = '700 30px "Noto Sans SC", "Archivo"';
    const hiIdx = subMain.indexOf(subHighlight);
    if (!isBase && hiIdx >= 0) {
      const preW = g.measureText(subMain.slice(0, hiIdx)).width;
      const hiW = g.measureText(subHighlight).width;
      g.fillStyle = P.signal;
      g.fillRect(FM + 10 + preW - 4, sy - 25, hiW + 8, 36);
    }
    g.fillStyle = P.ink;
    g.fillText(subMain, FM + 10, sy + 4);
    g.restore();
  }
}

// Master render(t) function
export function renderFilm(g, t, { mode = 'custom' } = {}) {
  const isBase = mode === 'base';
  const P = isBase ? PALETTES.base : PALETTES.custom;
  const offGrid = t >= 13.0;
  const ruleNum = t < 9.5 ? 1 : t < 17.5 ? 2 : 3;

  g.save();
  // 1. Base page background
  g.fillStyle = P.page;
  g.fillRect(0, 0, W, H);

  // 2. 12-column master frame grid lines
  const pFrameGrid = snap(t, 0.5, BEAT);
  g.strokeStyle = P.gridPage;
  g.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const x0 = fx(i), x1 = x0 + FC;
    g.beginPath();
    g.moveTo(x0, 0); g.lineTo(x0, H * pFrameGrid);
    g.moveTo(x1, 0); g.lineTo(x1, H * pFrameGrid);
    g.stroke();
  }

  // 3. Camera transforms:
  // Move 1 (0.0..1.2s): Starts zoomed in (1.42x) on top-left specification header, snaps out to 1.0x at t=1.0s
  // Move 3 (23.2..26.2s): Pulls out to 0.45x to reveal 2x2 wall of 4 blueprint specification sheets inside the HUD frame, snaps back at t=26.0s
  let camScale = 1, camX = W / 2, camY = H / 2;
  const inWall = t >= 23.2 && t < 26.2;
  if (t < 1.2) {
    const pOpen = snap(t, 1.0, BEAT * 1.5);
    camScale = lerp(1.42, 1.0, pOpen);
    camX = lerp(FM + 320, W / 2, pOpen);
    camY = lerp(220, H / 2, pOpen);
  } else if (inWall) {
    const pOut = snap(t, 23.8, BEAT);
    const pBack = snap(t, 26.0, BEAT);
    const wAmt = pOut - pBack;
    camScale = lerp(1, 0.44, wAmt);
    camX = lerp(W / 2, SX + SW * 0.48, wAmt);
    camY = lerp(H / 2, SY + SH * 1.02, wAmt);
  }

  g.save();
  if (inWall) {
    g.beginPath();
    g.rect(0, 66, W, H - 130);
    g.clip();
  }
  g.translate(W / 2, H / 2);
  g.scale(camScale, camScale);
  g.translate(-camX, -camY);

  // Draw Left Programme Page
  drawLeftProgramme(g, t, P, isBase);

  // Draw Right Specification Sheet
  drawSpecSheet(g, t, P, isBase, 0);

  // During the wall pull-out (t=23.2..26.2s), draw the 3 sibling specification sheets
  if (t >= 23.2 && t < 26.2) {
    const offsets = [
      [SW + 48, 0, 1],
      [0, SH + 48, 2],
      [SW + 48, SH + 48, 3],
    ];
    offsets.forEach(([dx, dy, v]) => {
      g.save();
      g.translate(dx, dy);
      drawSpecSheet(g, t, P, isBase, v);
      g.restore();
    });
  }

  g.restore(); // end camera

  // 4. Four-corner Engineering HUD (drawn in screen space)
  drawHUD(g, t, ruleNum, offGrid, P, isBase);

  // 5. Composite warm archive paper mottling, crease & vignette (Custom mode only)
  if (!isBase && paperCanvas) {
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.drawImage(paperCanvas, 0, 0);
    g.restore();

    // Subtle 2-frame stepped paper/ink dust specks
    const r = rng(1000 + Math.floor(t * 12));
    g.fillStyle = 'rgba(255,250,240,0.55)';
    for (let i = 0; i < 180; i++) {
      g.fillRect(r() * W, r() * H, 1.4, 1.4);
    }
    g.fillStyle = 'rgba(15,27,41,0.18)';
    for (let i = 0; i < 45; i++) {
      g.fillRect(r() * W, r() * H, 1.3, 1.3);
    }
  }

  g.restore();
}

// Foley & sound cue events for mix.py
export function buildEvents() {
  return [
    { t: 0.1, type: 'clack' },
    { t: 0.5, type: 'rule' },
    { t: 1.0, type: 'thunk' },
    { t: 1.2, type: 'paper' },
    { t: 1.6, type: 'rule' },
    { t: 2.0, type: 'snap' },
    { t: 2.25, type: 'snap' },
    { t: 2.5, type: 'snap' },
    { t: 2.75, type: 'snap' },
    { t: 3.0, type: 'snap' },
    { t: 3.25, type: 'snap' },
    { t: 3.6, type: 'clack' },
    { t: 3.85, type: 'clack' },
    { t: 4.1, type: 'clack' },
    { t: 6.0, type: 'knife' },
    { t: 6.5, type: 'knife' },
    { t: 7.0, type: 'knife' },
    { t: 7.5, type: 'redact' },
    { t: 9.5, type: 'thunk' },
    { t: 10.2, type: 'snap' },
    { t: 12.5, type: 'clack' },
    { t: 13.0, type: 'glide' },
    { t: 14.2, type: 'thump' },
    { t: 14.4, type: 'reflow' },
    { t: 15.5, type: 'redact' },
    { t: 17.5, type: 'thunk' },
    { t: 18.0, type: 'rule' },
    { t: 18.75, type: 'clack' },
    { t: 18.95, type: 'snap' },
    { t: 20.75, type: 'rule' },
    { t: 21.0, type: 'redact' },
    { t: 22.0, type: 'stamp' },
    { t: 23.5, type: 'paper' },
    { t: 26.0, type: 'thunk' },
  ];
}
