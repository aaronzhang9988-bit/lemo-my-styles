// New Yorker Gouache Editorial (《纽约客》炭笔水粉插画报) — Scene & Brush Engine
// Supports both 1920×1080 (16:9 Editorial Spread) and 1080×1440 (3:4 Vertical Magazine Column)
import { clamp, lerp, hash, vnoise } from '/core/lib.js';
import { W, H } from './gl.js';

export const PAL = {
  paper:       '#F5EFE4', // 300gsm Warm Cotton Rag
  ultramarine: '#1D3C6B', // 法式群青 (French Ultramarine Gouache)
  terracotta:  '#D14832', // 焦赭朱红 (Burnt Vermilion / Terracotta Gouache)
  ochre:       '#E2A93B', // 芥末暖黄 (Warm Mustard Ochre Gouache)
  sage:        '#587764', // 鼠尾草灰绿 (Muted Sage Olive Gouache)
  dustyRose:   '#C98A7B', // 烟粉灰 (Dusty Editorial Rose Gouache)
  creamWhite:  '#FAF7F0', // 钛白水粉高光 (Titanium White Gouache)
  charcoal:    '#1C1A18', // 柳木干炭笔 (Vine Charcoal Black)
  graphite:    '#7D766C', // 铅笔起稿辅助线 (Graphite Construction Line)
  inkBlack:    '#151311', // 报刊铅字黑 (Letterpress Editorial Ink)
};

function makeLayer() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  return { c, g };
}

const L_gouacheBg = makeLayer();  // Background gouache washes & warm lamp halo
const L_gouacheFg = makeLayer();  // Foreground opaque gouache shapes (with slight editorial misregistration)
const L_charcoal  = makeLayer();  // Loose vine charcoal outlines, cross-hatching & graphite construction marks
const L_type      = makeLayer();  // Razor-sharp editorial serif headlines, drop-caps, masthead & captions

function ensureLayers(w, h) {
  for (const L of [L_gouacheBg, L_gouacheFg, L_charcoal, L_type]) {
    if (L.c.width !== w || L.c.height !== h) {
      L.c.width = w; L.c.height = h;
      L.g.lineCap = 'round'; L.g.lineJoin = 'round';
    } else {
      L.g.clearRect(0, 0, w, h);
    }
  }
}

// Expressive Vine Charcoal Line (with loose hand jitter, variable pressure & optional sketchy double-pass)
export function charcoalLine(L, pts, {
  col = PAL.charcoal,
  w = 3.2,
  alpha = 0.88,
  seed = 1,
  wob = 1.6,
  taper = 0.18,
  doublePass = false,
} = {}) {
  if (pts.length < 2) return;
  const g = L.g;
  const sp = [pts[0].slice()];
  const dists = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(d / 3.5));
    for (let k = 1; k <= steps; k++) {
      const u = k / steps;
      sp.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
      total += d / steps;
      dists.push(total);
    }
  }
  if (sp.length < 2 || total < 1) return;

  const drawPass = (passSeed, widthScale, alphaScale) => {
    const left = [], right = [];
    const tl = Math.max(6, total * taper);
    for (let i = 0; i < sp.length; i++) {
      const s = dists[i];
      const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tn = Math.hypot(tx, ty) || 1;
      tx /= tn; ty /= tn;
      const nx = -ty, ny = tx;

      const off = (vnoise(s / 48 + passSeed * 17.3) - 0.5) * 2.1 * wob;
      const px = sp[i][0] + nx * off, py = sp[i][1] + ny * off;
      const e0 = clamp(s / tl, 0.2, 1.0), e1 = clamp((total - s) / tl, 0.15, 1.0);
      const pr = 0.72 + 0.45 * vnoise(s / 28 + passSeed * 9.1);
      const hw = w * widthScale * 0.5 * Math.min(e0, e1) * pr;

      left.push([px + nx * hw, py + ny * hw]);
      right.push([px - nx * hw, py - ny * hw]);
    }
    g.save();
    g.beginPath();
    left.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
    g.closePath();
    g.fillStyle = col;
    g.globalAlpha = alpha * alphaScale;
    g.fill();
    g.restore();
  };

  drawPass(seed, 1.0, 1.0);
  if (doublePass) {
    drawPass(seed + 37, 0.55, 0.48);
  }
}

// Velvety Matte Gouache Polygon Shape (with intentional 3px New Yorker print/brush offset & dry-brush bristle ends)
export function gouacheShape(L, pts, {
  col = PAL.ultramarine,
  alpha = 0.94,
  offsetX = 3,
  offsetY = 3,
  seed = 1,
  wob = 1.4,
  dryEdge = true,
} = {}) {
  if (pts.length < 3) return;
  const g = L.g;
  // Subdivide polygon edges so the gouache silhouette has organic hand-brushed modulation
  const modPts = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const steps = Math.max(1, Math.ceil(d / 12));
    let nx = -(b[1] - a[1]) / (d || 1), ny = (b[0] - a[0]) / (d || 1);
    for (let k = 0; k < steps; k++) {
      const u = k / steps;
      const disp = (vnoise((i * 10 + u * 4) + seed * 11.7) - 0.5) * 2.2 * wob;
      modPts.push([
        a[0] + (b[0] - a[0]) * u + nx * disp + offsetX,
        a[1] + (b[1] - a[1]) * u + ny * disp + offsetY,
      ]);
    }
  }

  g.save();
  g.beginPath();
  modPts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.closePath();
  g.fillStyle = col;
  g.globalAlpha = alpha;
  g.fill();

  // Optional dry-brush bristle streaks along the perimeter so the gouacheshader catches the cotton tooth
  if (dryEdge) {
    g.strokeStyle = col;
    g.lineWidth = 3.5;
    g.globalAlpha = alpha * 0.42;
    g.stroke();
  }
  g.restore();
}

// Loose Charcoal Hatching Shading inside a Rectangular or Polygon Zone (炭笔排线阴影)
function charcoalHatchRect(L, x, y, w, h, {
  spacing = 9,
  angle = -0.65,
  col = PAL.charcoal,
  alpha = 0.48,
  seed = 1,
} = {}) {
  for (let yy = y; yy <= y + h; yy += spacing) {
    const j0 = (hash(seed + yy) - 0.5) * 4;
    const j1 = (hash(seed * 3 + yy) - 0.5) * 4;
    const dx = Math.cos(angle) * w;
    const dy = Math.sin(angle) * 14;
    charcoalLine(
      L,
      [[x + j0, yy], [x + w * 0.85 + j1, yy + dy]],
      { col, w: 1.8, alpha, seed: seed + yy, wob: 0.9, taper: 0.25 }
    );
  }
}

// Faint Graphite Architect/Artist Construction Compass Arcs & ticks (起稿铅笔辅助线)
function drawGraphiteConstruction(L, cx, cy, r, a0, a1, seed = 1) {
  const pts = [];
  const n = 36;
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  charcoalLine(L, pts, { col: PAL.graphite, w: 1.3, alpha: 0.45, seed, wob: 0.4, taper: 0.08 });
}

// Saul Steinberg / Sempé Style Expressive Climber Figure (穿风衣戴圆眼镜攀登数据阶梯的知识分子小人 + 飘扬红围巾)
function drawClimberFigure(L_gou, L_ch, cx, cy, scale = 1.0) {
  const s = scale;
  // 1. Trench coat body in Warm Ochre / Cream Gouache
  const coat = [
    [cx - 16 * s, cy - 38 * s],
    [cx + 14 * s, cy - 42 * s],
    [cx + 24 * s, cy + 4 * s],
    [cx - 22 * s, cy + 8 * s],
  ];
  gouacheShape(L_gou, coat, { col: PAL.creamWhite, alpha: 0.95, offsetX: 2, offsetY: 2, seed: 201 });

  // 2. Fluttering Burnt Terracotta Scarf (#D14832 — iconic focal splash!)
  const scarf = [
    [cx - 6 * s, cy - 40 * s],
    [cx - 48 * s, cy - 52 * s],
    [cx - 72 * s, cy - 38 * s],
    [cx - 42 * s, cy - 30 * s],
    [cx - 8 * s, cy - 33 * s],
  ];
  gouacheShape(L_gou, scarf, { col: PAL.terracotta, alpha: 0.96, offsetX: 1, offsetY: 2, seed: 202 });
  charcoalLine(L_ch, [...scarf, scarf[0]], { col: PAL.charcoal, w: 2.4 * s, alpha: 0.90, seed: 203, wob: 0.8 });

  // 3. Head, Round Intellectual Glasses & Expressive Nose (Sempé big-nose profile)
  const headPts = [];
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    headPts.push([cx + 4 * s + Math.cos(a) * 11 * s, cy - 54 * s + Math.sin(a) * 12 * s]);
  }
  gouacheShape(L_gou, headPts, { col: PAL.creamWhite, alpha: 0.95, offsetX: 1, offsetY: 1, seed: 204 });
  charcoalLine(L_ch, headPts, { col: PAL.charcoal, w: 2.5 * s, alpha: 0.92, seed: 205, wob: 0.6 });
  // Pointed inquisitive nose & round spectacles
  charcoalLine(L_ch, [[cx + 14 * s, cy - 58 * s], [cx + 25 * s, cy - 54 * s], [cx + 15 * s, cy - 50 * s]], {
    col: PAL.charcoal, w: 2.2 * s, alpha: 0.92, seed: 206, wob: 0.3
  });
  const glass = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    glass.push([cx + 11 * s + Math.cos(a) * 4.5 * s, cy - 56 * s + Math.sin(a) * 4.5 * s]);
  }
  charcoalLine(L_ch, glass, { col: PAL.charcoal, w: 1.8 * s, alpha: 0.92, seed: 207, wob: 0.2 });

  // 4. Coat outline, climbing legs & briefcase
  charcoalLine(L_ch, [...coat, coat[0]], { col: PAL.charcoal, w: 2.8 * s, alpha: 0.92, seed: 208, doublePass: true });
  // Front leg stepping up to next bar, back leg pushing off
  charcoalLine(L_ch, [[cx + 8 * s, cy + 4 * s], [cx + 28 * s, cy - 8 * s], [cx + 32 * s, cy + 16 * s]], {
    col: PAL.charcoal, w: 3.4 * s, alpha: 0.94, seed: 209, wob: 0.5
  });
  charcoalLine(L_ch, [[cx - 10 * s, cy + 6 * s], [cx - 24 * s, cy + 28 * s], [cx - 16 * s, cy + 32 * s]], {
    col: PAL.charcoal, w: 3.4 * s, alpha: 0.94, seed: 210, wob: 0.5
  });
  // Arm holding briefcase
  const bcase = [
    [cx - 34 * s, cy - 12 * s],
    [cx - 12 * s, cy - 12 * s],
    [cx - 12 * s, cy + 4 * s],
    [cx - 34 * s, cy + 4 * s],
  ];
  gouacheShape(L_gou, bcase, { col: PAL.ultramarine, alpha: 0.92, offsetX: 2, offsetY: 2, seed: 211 });
  charcoalLine(L_ch, [...bcase, bcase[0]], { col: PAL.charcoal, w: 2.2 * s, alpha: 0.90, seed: 212 });
}

// Calm Reader Figure under Warm Ochre Reading Lamp (在柱状图底部暖光台灯下安静读书喝咖啡的智者)
function drawCalmReader(L_bg, L_gou, L_ch, cx, cy, scale = 1.0) {
  const s = scale;
  // 1. Warm Mustard Ochre Gouache Lamp Light Cone (#E2A93B)
  const cone = [
    [cx - 38 * s, cy - 118 * s],
    [cx - 125 * s, cy + 48 * s],
    [cx + 95 * s, cy + 48 * s],
    [cx - 18 * s, cy - 118 * s],
  ];
  gouacheShape(L_bg, cone, { col: PAL.ochre, alpha: 0.42, offsetX: 0, offsetY: 0, seed: 240, dryEdge: true });

  // 2. Armchair in Muted Sage Olive Gouache (#587764)
  const chair = [
    [cx - 46 * s, cy - 35 * s],
    [cx - 12 * s, cy - 35 * s],
    [cx - 8 * s, cy + 12 * s],
    [cx + 32 * s, cy + 12 * s],
    [cx + 32 * s, cy + 42 * s],
    [cx - 48 * s, cy + 42 * s],
  ];
  gouacheShape(L_gou, chair, { col: PAL.sage, alpha: 0.94, offsetX: 3, offsetY: 2, seed: 241 });
  charcoalLine(L_ch, [...chair, chair[0]], { col: PAL.charcoal, w: 2.8 * s, alpha: 0.92, seed: 242, doublePass: true });

  // 3. Reader holding an Open Terracotta-Covered Book
  const book = [
    [cx + 12 * s, cy - 22 * s],
    [cx + 42 * s, cy - 32 * s],
    [cx + 46 * s, cy - 6 * s],
    [cx + 16 * s, cy + 2 * s],
  ];
  gouacheShape(L_gou, book, { col: PAL.terracotta, alpha: 0.96, offsetX: 2, offsetY: 2, seed: 243 });
  charcoalLine(L_ch, [...book, book[0]], { col: PAL.charcoal, w: 2.2 * s, alpha: 0.92, seed: 244 });

  // Reader head & relaxed legs
  const head = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    head.push([cx - 6 * s + Math.cos(a) * 11 * s, cy - 42 * s + Math.sin(a) * 11 * s]);
  }
  gouacheShape(L_gou, head, { col: PAL.creamWhite, alpha: 0.96, offsetX: 1, offsetY: 1, seed: 245 });
  charcoalLine(L_ch, head, { col: PAL.charcoal, w: 2.4 * s, alpha: 0.92, seed: 246 });

  // Floor lamp stem & shade
  charcoalLine(L_ch, [[cx - 68 * s, cy + 44 * s], [cx - 68 * s, cy - 115 * s], [cx - 28 * s, cy - 118 * s]], {
    col: PAL.charcoal, w: 2.6 * s, alpha: 0.90, seed: 247
  });
  const shade = [[cx - 48 * s, cy - 115 * s], [cx - 24 * s, cy - 132 * s], [cx - 6 * s, cy - 112 * s]];
  gouacheShape(L_gou, shade, { col: PAL.ochre, alpha: 0.96, offsetX: 2, offsetY: 2, seed: 248 });
  charcoalLine(L_ch, [...shade, shade[0]], { col: PAL.charcoal, w: 2.4 * s, alpha: 0.92, seed: 249 });

  // Small side table with steaming coffee cup
  charcoalLine(L_ch, [[cx + 58 * s, cy + 12 * s], [cx + 102 * s, cy + 12 * s]], { col: PAL.charcoal, w: 2.6 * s, alpha: 0.9, seed: 250 });
  charcoalLine(L_ch, [[cx + 80 * s, cy + 12 * s], [cx + 80 * s, cy + 44 * s]], { col: PAL.charcoal, w: 2.6 * s, alpha: 0.9, seed: 251 });
  const cup = [[cx + 72 * s, cy - 4 * s], [cx + 90 * s, cy - 4 * s], [cx + 87 * s, cy + 12 * s], [cx + 75 * s, cy + 12 * s]];
  gouacheShape(L_gou, cup, { col: PAL.creamWhite, alpha: 0.96, offsetX: 1, offsetY: 1, seed: 252 });
  charcoalLine(L_ch, [...cup, cup[0]], { col: PAL.charcoal, w: 2.0 * s, alpha: 0.92, seed: 253 });
  // Rising aromatic steam curls
  charcoalLine(L_ch, [[cx + 81 * s, cy - 8 * s], [cx + 77 * s, cy - 22 * s], [cx + 85 * s, cy - 36 * s]], {
    col: PAL.charcoal, w: 1.6 * s, alpha: 0.65, seed: 254
  });
}

// Draw the core New Yorker Visual Metaphor Illustration inside a target stage box (cx, cy, scale)
function drawMetaphorIllustration(cx, cy, s = 1.0) {
  // 1. Background Soft Gouache Sun/Clock Disc & Graphite Architect Construction Lines
  const sunPts = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    sunPts.push([cx - 45 * s + Math.cos(a) * 215 * s, cy - 65 * s + Math.sin(a) * 215 * s]);
  }
  gouacheShape(L_gouacheBg, sunPts, { col: PAL.ochre, alpha: 0.24, offsetX: 5, offsetY: 4, seed: 101, wob: 2.2 });

  // Faint graphite compass arcs & golden-ratio grid lines (起稿铅笔辅助弧线)
  drawGraphiteConstruction(L_charcoal, cx - 45 * s, cy - 65 * s, 245 * s, -Math.PI * 0.85, Math.PI * 0.35, 105);
  drawGraphiteConstruction(L_charcoal, cx - 45 * s, cy - 65 * s, 285 * s, -Math.PI * 0.65, Math.PI * 0.15, 106);
  charcoalLine(L_charcoal, [[cx - 380 * s, cy + 230 * s], [cx + 390 * s, cy + 230 * s]], {
    col: PAL.graphite, w: 1.5, alpha: 0.55, seed: 107, wob: 0.5
  });
  charcoalLine(L_charcoal, [[cx - 45 * s, cy - 330 * s], [cx - 45 * s, cy + 260 * s]], {
    col: PAL.graphite, w: 1.2, alpha: 0.42, seed: 108, wob: 0.4
  });

  // 2. Five Ascending Bar-Chart Pillars Forming a Monumental Staircase (攀登的效率柱状图阶梯)
  const bars = [
    { x: -325, w: 76, h: 115, col: PAL.sage,        label: "Q1" },
    { x: -232, w: 76, h: 195, col: PAL.ultramarine, label: "Q2" },
    { x: -139, w: 76, h: 280, col: PAL.ultramarine, label: "Q3" },
    { x: -46,  w: 76, h: 375, col: PAL.terracotta,  label: "Q4" },
    { x: 47,   w: 82, h: 468, col: PAL.ultramarine, label: "MAX" },
  ];
  const baseY = cy + 230 * s;

  bars.forEach((b, idx) => {
    const x0 = cx + b.x * s;
    const x1 = x0 + b.w * s;
    const y0 = baseY - b.h * s;
    const poly = [[x0, y0], [x1, y0], [x1, baseY], [x0, baseY]];

    // Opaque velvety gouache fill with intentional 4px New Yorker misregistration offset!
    gouacheShape(L_gouacheFg, poly, {
      col: b.col, alpha: 0.94, offsetX: 4 * s, offsetY: 3 * s, seed: 120 + idx * 7, wob: 1.5
    });

    // Side 3D depth flange in darker charcoal/gouache hatching
    const sideW = 18 * s;
    const sidePoly = [[x1, y0], [x1 + sideW, y0 + 12 * s], [x1 + sideW, baseY], [x1, baseY]];
    gouacheShape(L_gouacheFg, sidePoly, {
      col: PAL.charcoal, alpha: 0.18, offsetX: 2 * s, offsetY: 2 * s, seed: 140 + idx
    });
    charcoalHatchRect(L_charcoal, x0 + 6 * s, y0 + 14 * s, b.w * s - 12 * s, Math.min(85 * s, b.h * s * 0.35), {
      spacing: 8 * s, alpha: 0.32, seed: 160 + idx
    });

    // Loose expressive vine-charcoal outline
    charcoalLine(L_charcoal, [...poly, poly[0]], {
      col: PAL.charcoal, w: 3.1 * s, alpha: 0.92, seed: 180 + idx, wob: 1.3, doublePass: true
    });
    charcoalLine(L_charcoal, [sidePoly[0], sidePoly[1], sidePoly[2]], {
      col: PAL.charcoal, w: 2.2 * s, alpha: 0.78, seed: 190 + idx, wob: 1.0
    });
  });

  // 3. Giant Pocket-Watch / Efficiency Clock Poised Precariously at the Top of Pillar #5
  const clockCx = cx + 88 * s, clockCy = baseY - 518 * s, clockR = 46 * s;
  const clockPts = [];
  for (let i = 0; i <= 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    clockPts.push([clockCx + Math.cos(a) * clockR, clockCy + Math.sin(a) * clockR]);
  }
  gouacheShape(L_gouacheFg, clockPts, { col: PAL.ochre, alpha: 0.96, offsetX: 3 * s, offsetY: 3 * s, seed: 260 });
  gouacheShape(L_gouacheFg, clockPts.map(([x, y]) => [clockCx + (x - clockCx) * 0.76, clockCy + (y - clockCy) * 0.76]), {
    col: PAL.creamWhite, alpha: 0.96, offsetX: 1 * s, offsetY: 1 * s, seed: 261
  });
  charcoalLine(L_charcoal, clockPts, { col: PAL.charcoal, w: 3.0 * s, alpha: 0.94, seed: 262, doublePass: true });
  // Clock hands & top winding crown
  charcoalLine(L_charcoal, [[clockCx, clockCy - 24 * s], [clockCx, clockCy], [clockCx + 18 * s, clockCy + 10 * s]], {
    col: PAL.terracotta, w: 3.2 * s, alpha: 0.95, seed: 263
  });
  charcoalLine(L_charcoal, [[clockCx - 12 * s, clockCy - clockR - 10 * s], [clockCx + 12 * s, clockCy - clockR - 10 * s]], {
    col: PAL.charcoal, w: 3.0 * s, alpha: 0.92, seed: 264
  });

  // 4. Hurried Climber Figure Scaling Pillar #3 -> #4 (焦虑攀登效率阶梯的人)
  drawClimberFigure(L_gouacheFg, L_charcoal, cx - 85 * s, baseY - 312 * s, 1.05 * s);

  // 5. Calm Reader Sitting Peacefully at the Right Sanctuary Outside the Bar Chart (阶梯外安静阅读喝咖啡的人)
  drawCalmReader(L_gouacheBg, L_gouacheFg, L_charcoal, cx + 245 * s, baseY - 44 * s, 1.08 * s);

  // 6. Floating Paper Sheets / Calendar Pages Drifting Down from the Top Pillar like Autumn Leaves
  const leaves = [
    [cx + 165 * s, baseY - 420 * s, 0.35],
    [cx + 215 * s, baseY - 330 * s, -0.28],
    [cx + 158 * s, baseY - 245 * s, 0.42],
  ];
  leaves.forEach(([lx, ly, rot], i) => {
    const c = Math.cos(rot), sn = Math.sin(rot);
    const p = [[-16, -11], [16, -11], [14, 11], [-18, 11]].map(([dx, dy]) => [
      lx + (dx * c - dy * sn) * s,
      ly + (dx * sn + dy * c) * s,
    ]);
    gouacheShape(L_gouacheFg, p, { col: PAL.creamWhite, alpha: 0.94, offsetX: 2, offsetY: 2, seed: 280 + i });
    charcoalLine(L_charcoal, [...p, p[0]], { col: PAL.charcoal, w: 2.0 * s, alpha: 0.88, seed: 290 + i });
  });

  // 7. Ground Shadow & Artist Signature in Charcoal
  charcoalLine(L_charcoal, [[cx - 355 * s, baseY], [cx + 375 * s, baseY]], {
    col: PAL.charcoal, w: 3.6 * s, alpha: 0.92, seed: 295, doublePass: true
  });
}

// ——— MODE A: 1920×1080 (16:9 横屏《纽约客》特稿跨页 Editorial Spread) ———
function renderHorizontalSpread(comp) {
  ensureLayers(W, H);
  const gType = L_type.g;

  // 1. Classic Double-Ruled Magazine Masthead across Top (y = 48..126)
  charcoalLine(L_charcoal, [[68, 52], [1852, 52]], { col: PAL.inkBlack, w: 2.6, alpha: 0.92, seed: 1, wob: 0.25 });
  charcoalLine(L_charcoal, [[68, 59], [1852, 59]], { col: PAL.inkBlack, w: 1.1, alpha: 0.78, seed: 2, wob: 0.2 });
  charcoalLine(L_charcoal, [[68, 122], [1852, 122]], { col: PAL.inkBlack, w: 1.4, alpha: 0.85, seed: 3, wob: 0.25 });

  gType.save();
  gType.fillStyle = PAL.inkBlack;
  gType.font = '700 15px "Noto Serif SC", serif';
  gType.textAlign = 'left';
  gType.fillText("ISSUE NO. 48 · THE AUTUMN ESSAY", 72, 98);

  gType.font = '700 34px "Playfair Display", "Noto Serif SC", serif';
  gType.textAlign = 'center';
  gType.fillText("THE NEW YORKER & MONOCLE · 现代思想画报", 960, 102);

  gType.font = '700 15px "Noto Serif SC", serif';
  gType.textAlign = 'right';
  gType.fillStyle = PAL.terracotta;
  gType.fillText("CULTURE, WORK & COGNITION · 深度视点", 1848, 98);
  gType.restore();

  // 2. Left & Center Stage (x = 68..1195): Gouache & Charcoal Metaphor Illustration
  drawMetaphorIllustration(615, 555, 1.02);

  // Artist's pencil margin notes on the illustration canvas (左上方手写起稿批注)
  gType.save();
  gType.fillStyle = PAL.graphite;
  gType.font = '600 16px "Noto Serif SC", serif';
  gType.textAlign = 'left';
  gType.fillText("Fig. 1 — The Efficiency Escalator (效率阶梯悖论)", 96, 188);
  gType.fillStyle = PAL.terracotta;
  gType.fillText("↑ 省下的时间全部用来攀登下一格", 96, 216);
  gType.fillStyle = PAL.sage;
  gType.fillText("↘ 阶梯之外的阅读者（唯一拥有时间的人）", 795, 392);
  gType.restore();

  // Classic New Yorker Cartoon Single-Line Italic Caption underneath the illustration (y = 955..1015)
  gType.save();
  gType.textAlign = 'center';
  gType.font = '700 24px "Noto Serif SC", serif';
  gType.fillStyle = PAL.inkBlack;
  gType.fillText("“他用算法每天省下了四个小时，刚好够他用来焦虑第五个小时该干什么。”", 615, 968);
  gType.font = '600 15px "Playfair Display", "Noto Serif SC", serif';
  gType.fillStyle = PAL.graphite;
  gType.fillText("“He saved four hours a day with algorithms, which gave him just enough time to worry about the fifth.”", 615, 1002);
  gType.restore();

  // 3. Vertical Editorial Column Divider Rule (x = 1218)
  charcoalLine(L_charcoal, [[1218, 152], [1218, 1018]], {
    col: PAL.inkBlack, w: 1.5, alpha: 0.78, seed: 301, wob: 0.25
  });

  // 4. Right Intellectual Essay & Editorial Column (x = 1258..1848)
  const colX = 1262;
  // Terracotta Kicker Badge
  gouacheShape(L_gouacheFg, [[colX, 160], [colX + 236, 160], [colX + 236, 196], [colX, 196]], {
    col: PAL.terracotta, alpha: 0.94, offsetX: 2, offsetY: 2, seed: 310
  });
  gType.save();
  gType.textAlign = 'left';
  gType.fillStyle = PAL.creamWhite;
  gType.font = '700 15px "Noto Serif SC", serif';
  gType.fillText("BOOKS & ESSAYS · 文化评论", colX + 12, 185);

  // High-Contrast Editorial Serif Headline
  gType.fillStyle = PAL.inkBlack;
  gType.font = '700 38px "Noto Serif SC", serif';
  gType.fillText("为什么我们越讲效率，", colX, 262);
  gType.fillText("反而越没有时间？", colX, 316);

  // Sub-headline / Deck in Muted Charcoal
  gType.fillStyle = PAL.graphite;
  gType.font = '600 19px "Noto Serif SC", serif';
  gType.fillText("当工具把每一分钟都切割成可量化的柱状图，", colX, 368);
  gType.fillText("唯一真正的奢侈，是敢于从阶梯上走下来。", colX, 398);
  gType.restore();

  // Horizontal ornamental editorial rule with diamond
  charcoalLine(L_charcoal, [[colX, 426], [1845, 426]], { col: PAL.terracotta, w: 1.8, alpha: 0.85, seed: 315, wob: 0.2 });

  // Giant Drop-Cap ("当") in Burnt Terracotta + Essay Body Paragraph (首字下沉杂志排版)
  gouacheShape(L_gouacheFg, [[colX, 452], [colX + 86, 452], [colX + 86, 538], [colX, 538]], {
    col: PAL.ochre, alpha: 0.35, offsetX: 3, offsetY: 3, seed: 320
  });
  gType.save();
  gType.textAlign = 'left';
  gType.fillStyle = PAL.terracotta;
  gType.font = '700 72px "Noto Serif SC", serif';
  gType.fillText("当", colX + 6, 524);

  gType.fillStyle = PAL.inkBlack;
  gType.font = '600 21px "Noto Serif SC", serif';
  gType.fillText("现代人发明了无数节省时间的机器，却发现", colX + 102, 478);
  gType.fillText("自己比任何时代都更疲于奔命。社会学家韩", colX + 102, 514);
  gType.fillText("炳哲在《倦怠社会》中指出：外在的剥削已", colX + 102, 550);
  gType.fillText("经化作内在的自我驱使——我们把人生画成一张永无止境", colX, 586);
  gType.fillText("的增长柱状图，却忘了台阶本身并不是目的地。", colX, 622);
  gType.restore();

  // Velvety Gouache Pull-Quote Card (水粉高光金句框, y = 665..795)
  const quoteBox = [[colX, 665], [1845, 665], [1845, 795], [colX, 795]];
  gouacheShape(L_gouacheBg, quoteBox, { col: PAL.ultramarine, alpha: 0.94, offsetX: 4, offsetY: 4, seed: 330 });
  charcoalLine(L_charcoal, [...quoteBox, quoteBox[0]], { col: PAL.charcoal, w: 2.6, alpha: 0.92, seed: 331 });

  gType.save();
  gType.textAlign = 'left';
  gType.fillStyle = PAL.ochre;
  gType.font = '700 16px "Noto Serif SC", serif';
  gType.fillText("✦ EDITORIAL TAKEAWAY · 核心洞察", colX + 24, 702);
  gType.fillStyle = PAL.creamWhite;
  gType.font = '700 24px "Noto Serif SC", serif';
  gType.fillText("“能被算法省下的只是动作；", colX + 24, 742);
  gType.fillText("  敢于浪费的片刻，才叫生活。”", colX + 24, 776);
  gType.restore();

  // Four Gouache & Charcoal Palette Swatches at Bottom Right (y = 855..995)
  const swatches = [
    { x: colX + 42,  col: PAL.ultramarine, name: "法式群青", sub: "Ultramarine" },
    { x: colX + 185, col: PAL.terracotta,  name: "焦赭朱红", sub: "Terracotta" },
    { x: colX + 328, col: PAL.ochre,       name: "芥末暖黄", sub: "Mustard Ochre" },
    { x: colX + 471, col: PAL.sage,        name: "鼠尾草绿", sub: "Sage Olive" },
  ];
  swatches.forEach((sw, i) => {
    const cy = 892, r = 24;
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      pts.push([sw.x + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    gouacheShape(L_gouacheFg, pts, { col: sw.col, alpha: 0.95, offsetX: 3, offsetY: 2, seed: 350 + i });
    charcoalLine(L_charcoal, pts, { col: PAL.charcoal, w: 2.2, alpha: 0.90, seed: 360 + i });

    gType.save();
    gType.textAlign = 'center';
    gType.fillStyle = PAL.inkBlack;
    gType.font = '700 17px "Noto Serif SC", serif';
    gType.fillText(sw.name, sw.x, cy + 46);
    gType.fillStyle = PAL.graphite;
    gType.font = '600 12px "Noto Serif SC", serif';
    gType.fillText(sw.sub, sw.x, cy + 64);
    gType.restore();
  });

  // Composite all 5 passes
  comp.beginPaper([0.961, 0.941, 0.898]);
  comp.gouachePass(L_gouacheBg.c);
  comp.gouachePass(L_gouacheFg.c);
  comp.charcoalPass(L_charcoal.c);
  comp.typePass(L_type.c);
  comp.finish();
}

// ——— MODE B: 1080×1440 (3:4 竖屏《纽约客》杂志封面 / 深度专栏页 Vertical Cover & Column) ———
function renderVerticalColumn(comp) {
  const VW = 1080, VH = 1440;
  ensureLayers(VW, VH);
  const gType = L_type.g;

  // 1. Iconic New Yorker / Monocle Vertical Cover Masthead (y = 48..245)
  charcoalLine(L_charcoal, [[64, 52], [1016, 52]], { col: PAL.inkBlack, w: 2.8, alpha: 0.92, seed: 401, wob: 0.25 });
  charcoalLine(L_charcoal, [[64, 60], [1016, 60]], { col: PAL.inkBlack, w: 1.2, alpha: 0.78, seed: 402, wob: 0.2 });

  gType.save();
  gType.textAlign = 'center';
  gType.fillStyle = PAL.terracotta;
  gType.font = '700 16px "Noto Serif SC", serif';
  gType.fillText("THE INTELLECTUAL PICTORIAL · 现代知识分子插画报 · ISSUE 48", 540, 96);

  gType.fillStyle = PAL.inkBlack;
  gType.font = '700 44px "Noto Serif SC", serif';
  gType.fillText("为什么我们越讲效率，越没有时间？", 540, 156);

  gType.fillStyle = PAL.graphite;
  gType.font = '600 20px "Noto Serif SC", serif';
  gType.fillText("当工具把每一分钟都切割成柱状图，敢于走下阶梯才是真正的自由", 540, 198);
  gType.restore();

  charcoalLine(L_charcoal, [[64, 222], [1016, 222]], { col: PAL.inkBlack, w: 1.5, alpha: 0.85, seed: 403, wob: 0.2 });

  // 2. Center Metaphor Illustration (y = 240..940)
  drawMetaphorIllustration(515, 655, 1.02);

  // Margin callouts
  gType.save();
  gType.textAlign = 'left';
  gType.fillStyle = PAL.terracotta;
  gType.font = '700 18px "Noto Serif SC", serif';
  gType.fillText("↑ 效率焦虑循环：省下时间 → 塞满更多任务", 82, 276);
  gType.fillStyle = PAL.sage;
  gType.fillText("↘ 阶梯外的阅读者：留白与沉思", 685, 515);
  gType.restore();

  // 3. Bottom Editorial Essay Card & Drop-Cap (y = 955..1385)
  charcoalLine(L_charcoal, [[64, 952], [1016, 952]], { col: PAL.inkBlack, w: 1.8, alpha: 0.88, seed: 410, wob: 0.2 });

  // Italic New Yorker Caption
  gType.save();
  gType.textAlign = 'center';
  gType.fillStyle = PAL.inkBlack;
  gType.font = '700 23px "Noto Serif SC", serif';
  gType.fillText("“他用算法每天省下了四个小时，刚好够他焦虑第五个小时该干什么。”", 540, 996);
  gType.restore();

  // Drop-Cap Essay Column (left) + Ultramarine Gouache Pull-Quote Box (right)
  gouacheShape(L_gouacheFg, [[72, 1035], [154, 1035], [154, 1118], [72, 1118]], {
    col: PAL.ochre, alpha: 0.38, offsetX: 3, offsetY: 3, seed: 420
  });
  gType.save();
  gType.textAlign = 'left';
  gType.fillStyle = PAL.terracotta;
  gType.font = '700 66px "Noto Serif SC", serif';
  gType.fillText("当", 78, 1102);

  gType.fillStyle = PAL.inkBlack;
  gType.font = '600 21px "Noto Serif SC", serif';
  gType.fillText("外在的催促化作内在的自我驱使，", 168, 1062);
  gType.fillText("我们把人生画成永无止境的增长图，", 168, 1098);
  gType.fillText("却忘了台阶本身并不是目的地。真正的创造力，", 72, 1138);
  gType.fillText("永远诞生于柱状图之外那盏安静的阅读台灯下。", 72, 1174);
  gType.restore();

  // Right Gouache Pull-Quote Box
  const qBox = [[595, 1035], [1012, 1035], [1012, 1185], [595, 1185]];
  gouacheShape(L_gouacheBg, qBox, { col: PAL.ultramarine, alpha: 0.94, offsetX: 4, offsetY: 4, seed: 430 });
  charcoalLine(L_charcoal, [...qBox, qBox[0]], { col: PAL.charcoal, w: 2.5, alpha: 0.92, seed: 431 });
  gType.save();
  gType.textAlign = 'left';
  gType.fillStyle = PAL.ochre;
  gType.font = '700 15px "Noto Serif SC", serif';
  gType.fillText("✦ EDITORIAL NOTE · 刊首语", 618, 1072);
  gType.fillStyle = PAL.creamWhite;
  gType.font = '700 22px "Noto Serif SC", serif';
  gType.fillText("能被算法省下的只是动作；", 618, 1115);
  gType.fillText("敢于浪费的片刻，才叫生活。", 618, 1152);
  gType.restore();

  // Bottom Swatch Bar (y = 1235..1365)
  charcoalLine(L_charcoal, [[64, 1222], [1016, 1222]], { col: PAL.graphite, w: 1.2, alpha: 0.65, seed: 440 });
  const swatches = [
    { x: 185, col: PAL.ultramarine, name: "法式群青 Ultramarine" },
    { x: 422, col: PAL.terracotta,  name: "焦赭朱红 Terracotta" },
    { x: 658, col: PAL.ochre,       name: "芥末暖黄 Mustard Ochre" },
    { x: 895, col: PAL.sage,        name: "鼠尾草绿 Sage Olive" },
  ];
  swatches.forEach((sw, i) => {
    const cy = 1272, r = 20;
    const pts = [];
    for (let k = 0; k <= 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      pts.push([sw.x + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    gouacheShape(L_gouacheFg, pts, { col: sw.col, alpha: 0.95, offsetX: 3, offsetY: 2, seed: 450 + i });
    charcoalLine(L_charcoal, pts, { col: PAL.charcoal, w: 2.0, alpha: 0.90, seed: 460 + i });
    gType.save();
    gType.textAlign = 'center';
    gType.fillStyle = PAL.inkBlack;
    gType.font = '700 16px "Noto Serif SC", serif';
    gType.fillText(sw.name, sw.x, cy + 44);
    gType.restore();
  });

  comp.beginPaper([0.961, 0.941, 0.898]);
  comp.gouachePass(L_gouacheBg.c);
  comp.gouachePass(L_gouacheFg.c);
  comp.charcoalPass(L_charcoal.c);
  comp.typePass(L_type.c);
  comp.finish();
}

export function renderKeyframe(comp, t = 1.0, curW = W, curH = H) {
  if (curH > curW) {
    renderVerticalColumn(comp);
  } else {
    renderHorizontalSpread(comp);
  }
}
