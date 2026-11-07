// Crayon stroke & Kyoto zine collage engine (Canvas2D, 1080×1440 vertical)
import { clamp, lerp, hash, vnoise } from '/core/lib.js';
export const W = 1080, H = 1440;
export const CAM = { x: 540, y: 720, s: 1 };
export const BOIL = { step: 0, amp: 1 };
export const WMUL = { k: 1 };

// Warm Kyoto Zine Box Palette
export const PAL = {
  kraft: '#D5BE9E',
  gridPaper: '#F7F3E8',
  espresso: '#2B1E16',
  whiteWax: '#FFFDF7',
  persimmon: '#E05A3F',
  mustard: '#E8B84B',
  sage: '#6D8C73',
  dustyBlue: '#5B7C99',
  apricot: '#F2C9A0',
  terracotta: '#C86D51',
};

export function layer() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
  return { c, g };
}
export function clear(L) { L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.clearRect(0, 0, W, H); }

export const sx = x => (x - CAM.x) * CAM.s + W / 2;
export const sy = y => (y - CAM.y) * CAM.s + H / 2;
export const ws = w => w * Math.pow(CAM.s, 0.45) * WMUL.k;
const n1 = (seed, x) => vnoise(x + seed * 17.31) * 2 - 1;

function toScreen(pts) { return pts.map(p => [sx(p[0]), sy(p[1])]); }
function resample(sp, step = 3.2, closed = false) {
  const q = closed ? [...sp, sp[0]] : sp;
  const out = [q[0].slice()]; const L = [0]; let acc = 0, total = 0;
  for (let i = 1; i < q.length; i++) {
    const [ax, ay] = q[i - 1], [bx, by] = q[i];
    const d = Math.hypot(bx - ax, by - ay); if (d < 1e-6) continue;
    let pos = step - acc;
    while (pos <= d) {
      const u = pos / d; out.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
      total += step; L.push(total); pos += step;
    }
    acc = d - (pos - step);
  }
  const last = q[q.length - 1]; const lp = out[out.length - 1];
  const rem = Math.hypot(last[0] - lp[0], last[1] - lp[1]);
  if (rem > 0.3) { out.push(last.slice()); total += rem; L.push(total); }
  return { p: out, L, total };
}

// ——— Crayon Line ———
export function line(L, pts, o = {}) {
  const g = L.g;
  const col = o.col || PAL.espresso, w = ws(o.w ?? 6.5), p = o.p ?? 0.85, seed = o.seed ?? 1, wob = o.wob ?? 1, boil = o.boil ?? 1;
  const draw = o.draw ?? 1; if (draw <= 0) return;
  const sp = toScreen(pts); const R = resample(sp, 3, o.closed);
  let n = R.p.length; if (n < 2) return;
  const lim = R.total * draw;
  const st = BOIL.step, ba = BOIL.amp * boil;
  const jx = (hash(seed * 3.1 + st * 7.7) - .5) * 1.5 * ba, jy = (hash(seed * 5.3 + st * 3.9) - .5) * 1.5 * ba;
  const P = [], Wd = [];
  const taper = o.taper ?? 0.22, tl = Math.min(R.total * taper, 26);
  for (let i = 0; i < n; i++) {
    const s = R.L[i]; if (s > lim) break;
    const a = R.p[Math.max(0, i - 1)], b = R.p[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tn = Math.hypot(tx, ty) || 1; tx /= tn; ty /= tn;
    const off = n1(seed, s / 82) * 1.65 * wob + n1(seed + st * 1.37 + 11, s / 38) * 0.85 * ba;
    P.push([R.p[i][0] - ty * off + jx, R.p[i][1] + tx * off + jy, -ty, tx]);
    const e0 = o.closed ? 1 : clamp(s / (tl + 1e-3)), e1 = o.closed ? 1 : clamp((Math.min(lim, R.total) - s) / (tl + 1e-3));
    Wd.push(w * (0.82 + 0.3 * n1(seed + 3, s / 55)) * (0.45 + 0.55 * Math.min(e0, e1)));
  }
  if (P.length < 2) return;
  g.fillStyle = col; g.strokeStyle = col;
  ribbon(g, P, Wd, 1); g.globalAlpha = p * 0.54; g.fill();
  ribbon(g, P, Wd, 0.52); g.globalAlpha = p * 0.36; g.fill();
  const ns = o.streak ?? 2;
  for (let k = 0; k < ns; k++) {
    const side = (hash(seed + k * 9.1) - .5) * 0.88;
    g.beginPath();
    for (let i = 0; i < P.length; i++) {
      const q = P[i]; const d = side * Wd[i];
      const x = q[0] + q[2] * d, y = q[1] + q[3] * d;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.lineWidth = Math.max(1, w * 0.24); g.globalAlpha = p * 0.32; g.stroke();
  }
  g.globalAlpha = 1;
}

function ribbon(g, P, Wd, k) {
  g.beginPath();
  for (let i = 0; i < P.length; i++) {
    const q = P[i], d = Wd[i] * 0.5 * k;
    i ? g.lineTo(q[0] + q[2] * d, q[1] + q[3] * d) : g.moveTo(q[0] + q[2] * d, q[1] + q[3] * d);
  }
  for (let i = P.length - 1; i >= 0; i--) {
    const q = P[i], d = Wd[i] * 0.5 * k;
    g.lineTo(q[0] - q[2] * d, q[1] - q[3] * d);
  }
  g.closePath();
}

// ——— Zigzag Crayon Hatching Fill ———
export function fill(L, poly, o = {}) {
  const g = L.g;
  const col = o.col || PAL.mustard, p = o.p ?? 0.68, seed = o.seed ?? 1, boil = o.boil ?? 1;
  const st = BOIL.step, ba = BOIL.amp * boil;
  const ang = (o.ang ?? -0.55) + (hash(seed + st * 1.9) - .5) * 0.032 * ba;
  const gap = ws(o.gap ?? 10.0), w = ws(o.w ?? 11.5), over = ws(o.over ?? 6.0);
  const draw = o.draw ?? 1; if (draw <= 0) return;
  const sp = toScreen(poly);
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const rp = sp.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
  let y0 = Infinity, y1 = -Infinity;
  for (const q of rp) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
  const rows = []; let y = y0 + gap * (0.35 + 0.3 * hash(seed + st * 0.7 * ba));
  let r = 0;
  while (y < y1) {
    const xs = [];
    for (let i = 0; i < rp.length; i++) {
      const a = rp[i], b = rp[(i + 1) % rp.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((a, b) => a - b);
    const spans = []; for (let i = 0; i + 1 < xs.length; i += 2) spans.push([xs[i], xs[i + 1]]);
    rows.push({ y, spans, r }); r++;
    y += gap * (0.8 + 0.4 * hash(seed * 1.3 + r * 3.7));
  }
  const strokes = []; let curS = null, prev = null;
  for (const row of rows) {
    if (row.spans.length !== 1) { curS = null; prev = null; for (const s of row.spans) strokes.push([[s, row.y, row.r]]); continue; }
    const s = row.spans[0];
    if (curS && prev && s[0] < prev[1] && s[1] > prev[0]) curS.push([s, row.y, row.r]);
    else { curS = [[s, row.y, row.r]]; strokes.push(curS); }
    prev = s;
  }
  const paths = strokes.map((S, si) => {
    const pts = [];
    S.forEach(([s, yy, rr], k) => {
      const oA = over * (hash(seed + rr * 5.1 + 0.3) * 1.1 - 0.15);
      const oB = over * (hash(seed + rr * 2.3 + 0.7) * 1.1 - 0.15);
      const yj = (hash(seed + rr * 1.7 + st * 0.31 * ba) - .5) * gap * 0.35 * Math.max(ba, .3);
      const a = [s[0] - oA, yy + yj], b = [s[1] + oB, yy + yj + (hash(seed + rr) - .5) * gap * 0.6];
      if ((k + si) % 2 === 0) pts.push(a, b); else pts.push(b, a);
    });
    return pts.map(([x, y]) => [x * ca - y * sa, x * sa + y * ca]);
  });
  let total = 0;
  const lens = paths.map(pp => {
    let l = 0; for (let i = 1; i < pp.length; i++) l += Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]);
    total += l; return l;
  });
  let budget = total * draw;
  g.strokeStyle = col; g.lineWidth = w;
  for (let k = 0; k < paths.length && budget > 0; k++) {
    const pp = paths[k];
    const cut = cutPath(pp, budget); budget -= lens[k];
    for (let i = 1; i < cut.length; i++) {
      const pr = p * (0.74 + 0.40 * hash(seed * 0.37 + k * 13.1 + i * 0.71));
      g.beginPath(); g.moveTo(cut[i - 1][0], cut[i - 1][1]); g.lineTo(cut[i][0], cut[i][1]);
      g.globalAlpha = pr * 0.65; g.lineWidth = w; g.stroke();
      g.globalAlpha = pr * 0.32; g.lineWidth = w * 0.44; g.stroke();
    }
  }
  g.globalAlpha = 1;
  if (o.cross) fill(L, poly, { ...o, cross: false, ang: (o.ang ?? -0.55) + (o.crossAng ?? 1.25), seed: seed + 101, p: p * (o.crossP ?? 0.72) });
}

function cutPath(pp, len) {
  const out = [pp[0]]; let acc = 0;
  for (let i = 1; i < pp.length; i++) {
    const d = Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1]);
    if (acc + d >= len) {
      const u = (len - acc) / d;
      out.push([lerp(pp[i - 1][0], pp[i][0], u), lerp(pp[i - 1][1], pp[i][1], u)]);
      return out;
    }
    acc += d; out.push(pp[i]);
  }
  return out;
}

export function dab(L, x, y, r, o = {}) {
  fill(L, handCircle(x, y, r, o.seed ?? 1, 0, 20).map(([px, py]) => [px, y + (py - y) * (o.sq ?? 1)]), {
    col: o.col || PAL.persimmon, p: o.p ?? 0.72, gap: o.gap ?? 4.5, w: o.w ?? 6.5, over: o.over ?? 1.5, seed: o.seed ?? 1, ang: o.ang ?? 0.5, boil: o.boil ?? 1, draw: o.draw ?? 1
  });
}

// ——— Shape Tools ———
export function ellipse(cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2, rot = 0) {
  const out = []; const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}

export function handCircle(cx, cy, r, seed = 1, over = 0.16, n = 56, rxScale = 1, ryScale = 1) {
  const out = []; const a0 = hash(seed) * 6.28;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = a0 + u * Math.PI * 2 * (1 + over);
    const rr = r * (1 + 0.04 * Math.sin(a * 2 + seed) + (u > 1 - over ? 0.06 * (u - (1 - over)) / (over + 1e-3) : 0));
    out.push([cx + Math.cos(a) * rr * rxScale, cy + Math.sin(a) * rr * ryScale]);
  }
  return out;
}

export function bez(c, n = 16) {
  const out = [c[0]];
  for (let i = 0; i + 3 < c.length; i += 3) {
    const [a, b, d, e] = [c[i], c[i + 1], c[i + 2], c[i + 3]];
    for (let k = 1; k <= n; k++) {
      const t = k / n, u = 1 - t;
      out.push([
        u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * d[0] + t * t * t * e[0],
        u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * d[1] + t * t * t * e[1]
      ]);
    }
  }
  return out;
}

// Hand-drawn curved crayon arrow (with arrowhead)
export function arrow(L, p0, p1, ctrl, o = {}) {
  const draw = o.draw ?? 1; if (draw <= 0) return;
  const curve = bez([p0, ctrl, ctrl, p1], 20);
  line(L, curve, { ...o, draw: clamp(draw / 0.78) });
  if (draw > 0.72) {
    const hd = clamp((draw - 0.72) / 0.28);
    const dx = p1[0] - ctrl[0], dy = p1[1] - ctrl[1];
    const ang = Math.atan2(dy, dx);
    const len = o.headLen ?? 22;
    const w1 = [p1[0] - Math.cos(ang - 0.48) * len, p1[1] - Math.sin(ang - 0.48) * len];
    const w2 = [p1[0] - Math.cos(ang + 0.48) * len, p1[1] - Math.sin(ang + 0.48) * len];
    line(L, [w1, p1, w2], { ...o, taper: 0.1, draw: hd, seed: (o.seed ?? 1) + 19 });
  }
}

// ——— Crayon Lettering (Chinese + Latin) ———
export function text(L, str, x, y, o = {}) {
  const g = L.g, st = BOIL.step, seed = o.seed ?? 7, ba = BOIL.amp * (o.boil ?? 0.65);
  const size = ws(o.size ?? 44);
  const font = o.font ?? 'ZCOOL KuaiLe, Patrick Hand, sans-serif';
  g.save();
  g.font = `${o.weight ?? 400} ${size}px ${font}`;
  g.textBaseline = 'alphabetic';
  const chars = [...str];
  const widths = chars.map(c => g.measureText(c).width);
  const track = o.track ?? 1;
  const tw = widths.reduce((a, b) => a + b, 0) + track * Math.max(0, chars.length - 1);
  const sx0 = sx(x), sy0 = sy(y);
  let cx = o.align === 'left' ? sx0 : o.align === 'right' ? sx0 - tw : sx0 - tw / 2;
  const reveal = o.reveal ?? 1;
  const nShow = reveal * chars.length;
  const col = o.col || PAL.espresso;
  g.fillStyle = col;
  chars.forEach((ch, i) => {
    const vis = clamp(nShow - i);
    if (vis <= 0) { cx += widths[i] + track; return; }
    const jx = (hash(seed + i * 3.3 + st * 1.1) - .5) * 1.1 * ba;
    const jy = (hash(seed + i * 7.1 + st * 2.3) - .5) * 1.1 * ba;
    const rot = (hash(seed + i * 1.9) - .5) * 0.045 + (hash(seed + i + st * .7) - .5) * 0.015 * ba;
    const by = (hash(seed + i * 5.5) - .5) * size * 0.04;
    g.save();
    g.translate(cx + widths[i] / 2 + jx, sy0 + by + jy);
    g.rotate(rot);
    g.globalAlpha = (o.p ?? 0.92) * vis;
    g.fillText(ch, -widths[i] / 2, 0);
    if (o.stroke !== 0) {
      g.lineWidth = o.stroke ?? 1.4;
      g.strokeStyle = col;
      g.globalAlpha = (o.p ?? 0.92) * vis * 0.55;
      g.strokeText(ch, -widths[i] / 2, 0);
    }
    g.restore();
    cx += widths[i] + track;
  });
  g.restore();
  return tw;
}

// ——— Kyoto Zine Collage Primitives: Torn 5mm Grid Paper Patch & Translucent Washi Tape ———

function buildTornRectPath(x, y, w, h, seed = 1, tearAmp = 6.5, tearTopOnly = false) {
  const pts = [];
  const step = 10;
  const noiseAt = (s, u) => (vnoise(u * 0.14 + s * 13.7) - 0.5) * 2 * tearAmp + (hash(Math.floor(u) + s * 31.1) - 0.5) * tearAmp * 0.55;
  // Top edge (left to right)
  for (let dx = 0; dx <= w; dx += step) {
    pts.push([sx(x + dx), sy(y + noiseAt(seed + 1, dx))]);
  }
  // Right edge
  for (let dy = step; dy <= h; dy += step) {
    const n = tearTopOnly ? noiseAt(seed + 2, dy) * 0.35 : noiseAt(seed + 2, dy);
    pts.push([sx(x + w + n), sy(y + dy)]);
  }
  // Bottom edge
  for (let dx = w - step; dx >= 0; dx -= step) {
    const n = tearTopOnly ? noiseAt(seed + 3, dx) * 0.35 : noiseAt(seed + 3, dx);
    pts.push([sx(x + dx), sy(y + h + n)]);
  }
  // Left edge
  for (let dy = h - step; dy >= step; dy -= step) {
    const n = tearTopOnly ? noiseAt(seed + 4, dy) * 0.35 : noiseAt(seed + 4, dy);
    pts.push([sx(x + n), sy(y + dy)]);
  }
  return pts;
}

export function drawTornGridPatch(L, x, y, w, h, o = {}) {
  const g = L.g;
  const enter = o.enter ?? 1; if (enter <= 0) return;
  const seed = o.seed ?? 11;
  const rot = o.rot ?? 0;
  const gridStep = ws(o.grid ?? 24); // ~5mm grid
  const pts = buildTornRectPath(x, y, w, h, seed, o.tearAmp ?? 7.0, o.tearTopOnly ?? false);

  g.save();
  const cx = sx(x + w / 2), cy = sy(y + h / 2);
  // Slap-down scale animation if enter < 1
  const sc = enter < 1 ? lerp(1.08, 1.0, clamp(enter * 1.2)) : 1;
  g.translate(cx, cy);
  g.rotate(rot);
  g.scale(sc, sc);
  g.translate(-cx, -cy);

  const tracePoly = (offsetX = 0, offsetY = 0) => {
    g.beginPath();
    pts.forEach(([px, py], i) => {
      i === 0 ? g.moveTo(px + offsetX, py + offsetY) : g.lineTo(px + offsetX, py + offsetY);
    });
    g.closePath();
  };

  // 1. Soft contact shadow on the kraft paper
  tracePoly(ws(3), ws(6));
  g.fillStyle = 'rgba(43, 30, 22, 0.16)';
  g.fill();

  // 2. Fibrous white deckle core along the torn perimeter (slightly expanded)
  tracePoly(0, ws(-2.5));
  g.fillStyle = '#FFFDF9';
  g.fill();
  g.lineWidth = ws(3.5);
  g.strokeStyle = 'rgba(255, 253, 249, 0.92)';
  g.stroke();

  // 3. Cream grid-paper body (#F7F3E8)
  tracePoly(0, 0);
  g.fillStyle = o.paperCol || PAL.gridPaper;
  g.fill();

  // 4. Clip to the torn patch and draw the 5mm squared ruling grid
  g.save();
  tracePoly(0, 0);
  g.clip();

  const x0 = sx(x - 20), x1 = sx(x + w + 20);
  const y0 = sy(y - 20), y1 = sy(y + h + 20);
  g.strokeStyle = o.gridCol || 'rgba(109, 140, 115, 0.24)';
  g.lineWidth = 1.15;
  g.beginPath();
  for (let gx = x0; gx <= x1; gx += gridStep) {
    g.moveTo(gx, y0); g.lineTo(gx, y1);
  }
  for (let gy = y0; gy <= y1; gy += gridStep) {
    g.moveTo(x0, gy); g.lineTo(x1, gy);
  }
  g.stroke();

  // Optional subtle red margin rule at top of note card
  if (o.headerRule) {
    const ry = sy(y + (o.headerOffset ?? 52));
    g.strokeStyle = 'rgba(224, 90, 63, 0.35)';
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(x0, ry); g.lineTo(x1, ry);
    g.stroke();
  }
  g.restore();

  // 5. Subtle warm edge definition
  tracePoly(0, 0);
  g.strokeStyle = 'rgba(145, 122, 95, 0.28)';
  g.lineWidth = 1.2;
  g.stroke();

  g.restore();
}

// Translucent diagonal-striped Japanese Washi Tape with serrated torn ends
export function drawWashiTape(L, cxWorld, cyWorld, wWorld = 126, hWorld = 32, o = {}) {
  const g = L.g;
  const enter = o.enter ?? 1; if (enter <= 0) return;
  const angle = o.angle ?? -0.28;
  const baseCol = o.col || PAL.sage;         // Matcha '#6D8C73' or Terracotta '#E05A3F'
  const stripeCol = o.stripeCol || '#F7F3E8';
  const alpha = (o.alpha ?? 0.80) * clamp(enter * 1.4);

  const cx = sx(cxWorld), cy = sy(cyWorld);
  const w = ws(wWorld) * clamp(enter * 1.15), h = ws(hWorld);
  const hw = w / 2, hh = h / 2;

  g.save();
  g.translate(cx, cy);
  g.rotate(angle);

  // Build serrated zigzag torn tape outline
  const teeth = 5;
  const jag = ws(4.2);
  const traceTape = (ox = 0, oy = 0) => {
    g.beginPath();
    g.moveTo(-hw + ox, -hh + oy);
    g.lineTo(hw + ox, -hh + oy);
    for (let i = 1; i <= teeth * 2; i++) {
      const ty = -hh + (h * i) / (teeth * 2);
      const tx = hw + (i % 2 === 1 ? -jag : jag * 0.4);
      g.lineTo(tx + ox, ty + oy);
    }
    g.lineTo(-hw + ox, hh + oy);
    for (let i = teeth * 2 - 1; i >= 0; i--) {
      const ty = -hh + (h * i) / (teeth * 2);
      const tx = -hw + (i % 2 === 1 ? jag : -jag * 0.4);
      g.lineTo(tx + ox, ty + oy);
    }
    g.closePath();
  };

  // Subtle shadow under tape
  traceTape(1.5, 2.5);
  g.fillStyle = 'rgba(43, 30, 22, 0.12)';
  g.fill();

  // Translucent tape body
  g.save();
  traceTape(0, 0);
  g.clip();
  g.globalAlpha = alpha;
  g.fillStyle = baseCol;
  g.fillRect(-hw - 10, -hh - 10, w + 20, h + 20);

  // Diagonal cream stripes
  g.strokeStyle = stripeCol;
  g.lineWidth = ws(5.2);
  g.globalAlpha = alpha * 0.65;
  const step = ws(14);
  g.beginPath();
  for (let sxOff = -hw - h; sxOff <= hw + h; sxOff += step) {
    g.moveTo(sxOff, -hh - 6);
    g.lineTo(sxOff + h * 0.85, hh + 6);
  }
  g.stroke();

  // Subtle cross-fibre texture lines on tape
  g.strokeStyle = 'rgba(255,255,255,0.22)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-hw, -hh + 3); g.lineTo(hw, -hh + 3);
  g.moveTo(-hw, hh - 3); g.lineTo(hw, hh - 3);
  g.stroke();
  g.restore();

  g.restore();
}
