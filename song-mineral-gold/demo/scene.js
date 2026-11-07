// Song Silk & Mineral Gold (宋韵古绢 × 矿物岩彩描金) — Keyframe Scene & Brush Engine (1920×1080)
import { clamp, lerp, hash, vnoise } from '/core/lib.js';
import { W, H } from './gl.js';

export const PAL = {
  // Crushed Mineral Rock Pigments (天然矿物岩彩)
  azuriteDeep: '#153258',   // 头青 (Deep Azurite / Lapis Lazuli)
  azuriteMid:  '#234E7A',   // 二青 (Medium Azurite)
  azuritePale: '#43739E',   // 三青 (Pale Azurite)
  malachiteDeep: '#1E564A', // 头绿 (Deep Malachite)
  malachiteMid:  '#327A66', // 二绿 (Medium Malachite)
  malachiteLight:'#5EA088', // 三绿 (Light Malachite)
  ochre:       '#8F5636',   // 赭石 (Burnt Mineral Ochre base under-wash)
  ochreLight:  '#B88258',   // 浅赭 (Warm Sandstone Ochre)
  cinnabar:    '#B63628',   // 朱砂 (Natural Cinnabar)
  cinnabarSeal:'#AD281D',   // 印泥八宝朱砂 (Seal Paste Red)
  shellWhite:  '#F3EFE4',   // 蛤粉 (Calcined Clam-Shell White)
  sootInk:     '#1F1B17',   // 松烟墨 (Pine-Soot Ink)
  goldMask:    '#D9B25F',   // 泥金通道 (24K Mud-Gold shader mask)
};

function makeLayer() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  return { c, g };
}

const L_mineralBg = makeLayer();   // Distant sky, moon, mist & deep mineral washes
const L_mineralMid = makeLayer();  // Layered Blue-and-Green mountain mineral shading
const L_mineralFg = makeLayer();   // Foreground rocks, pine foliage, cranes, pavilion & swatches
const L_ink = makeLayer();         // Pine-soot ink brushwork, calligraphy & cinnabar seals
const L_gold = makeLayer();        // 24K Mud-Gold (泥金) ridge contours, pine needles, water ripples & ruled grid

// Tapered traditional hair-brush / mud-gold line with natural hand modulation
function brushLine(L, pts, { col = PAL.sootInk, w = 3.0, alpha = 0.9, seed = 1, taper = 0.22, wob = 1.2 } = {}) {
  if (pts.length < 2) return;
  const g = L.g;
  // Resample polyline
  const sp = [pts[0].slice()];
  const dists = [0];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    const d = Math.hypot(bx - ax, by - ay);
    const steps = Math.max(1, Math.ceil(d / 4));
    for (let k = 1; k <= steps; k++) {
      const u = k / steps;
      sp.push([ax + (bx - ax) * u, ay + (by - ay) * u]);
      total += d / steps;
      dists.push(total);
    }
  }
  if (sp.length < 2 || total < 1) return;

  const left = [], right = [];
  const tl = Math.max(8, total * taper);
  for (let i = 0; i < sp.length; i++) {
    const s = dists[i];
    const a = sp[Math.max(0, i - 1)], b = sp[Math.min(sp.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const tn = Math.hypot(tx, ty) || 1;
    tx /= tn; ty /= tn;
    const nx = -ty, ny = tx;

    const nOff = (vnoise(s / 55 + seed * 13.7) - 0.5) * 2.0 * wob;
    const px = sp[i][0] + nx * nOff, py = sp[i][1] + ny * nOff;

    const e0 = clamp(s / tl, 0.15, 1.0);
    const e1 = clamp((total - s) / tl, 0.12, 1.0);
    const pr = 0.78 + 0.35 * (vnoise(s / 38 + seed * 7.3) - 0.5);
    const hw = w * 0.5 * Math.min(e0, e1) * pr;

    left.push([px + nx * hw, py + ny * hw]);
    right.push([px - nx * hw, py - ny * hw]);
  }

  g.save();
  g.beginPath();
  left.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  for (let i = right.length - 1; i >= 0; i--) g.lineTo(right[i][0], right[i][1]);
  g.closePath();
  g.fillStyle = col;
  g.globalAlpha = alpha;
  g.fill();
  g.restore();
}

// Multi-tier Song Dynasty Blue-and-Green Mountain Peak (青绿山水三叠设色 + 泥金勾勒 + 斧劈皴)
// Authentic Song technique: 1. Ochre warm base (赭石打底) -> 2. Malachite mid-slope (石绿叠染) -> 3. Azurite crest (石青罩顶) -> 4. Soot-ink & Mud-gold ridge contours (墨骨金碧勾皴)
function drawMineralMountain(L_min, L_inkLayer, L_goldLayer, ridgePts, baseY, {
  seed = 1,
  ochreCol = PAL.ochre,
  malachiteCol = PAL.malachiteMid,
  azuriteCol = PAL.azuriteDeep,
  malachiteRatio = 0.72,
  azuriteRatio = 0.45,
  goldWeight = 2.6,
  subRidges = [],
} = {}) {
  const g = L_min.g;
  let minY = Infinity;
  for (const [, y] of ridgePts) if (y < minY) minY = y;
  const hSpan = Math.max(60, baseY - minY);

  const tracePoly = () => {
    g.beginPath();
    g.moveTo(ridgePts[0][0], baseY);
    ridgePts.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(ridgePts[ridgePts.length - 1][0], baseY);
    g.closePath();
  };

  g.save();
  tracePoly();
  g.clip();

  // 1. Warm Ochre mineral under-wash (赭石打底)
  const gOchre = g.createLinearGradient(0, minY, 0, baseY);
  gOchre.addColorStop(0.0, ochreCol);
  gOchre.addColorStop(0.65, ochreCol);
  gOchre.addColorStop(1.0, 'rgba(143, 86, 54, 0.08)');
  g.globalAlpha = 0.62;
  g.fillStyle = gOchre;
  g.fillRect(0, minY - 20, W, hSpan + 40);

  // 2. Malachite green mineral wash on upper/middle slopes (石绿中层分染)
  const gMal = g.createLinearGradient(0, minY, 0, minY + hSpan * malachiteRatio);
  gMal.addColorStop(0.0, malachiteCol);
  gMal.addColorStop(0.58, malachiteCol);
  gMal.addColorStop(1.0, 'rgba(50, 122, 102, 0.0)');
  g.globalAlpha = 0.88;
  g.fillStyle = gMal;
  g.fillRect(0, minY - 20, W, hSpan + 40);

  // 3. Crystalline Azurite / Lapis blue mineral wash on the high peak crests (石青罩染峰顶)
  const gAzu = g.createLinearGradient(0, minY, 0, minY + hSpan * azuriteRatio);
  gAzu.addColorStop(0.0, azuriteCol);
  gAzu.addColorStop(0.52, azuriteCol);
  gAzu.addColorStop(1.0, 'rgba(21, 50, 88, 0.0)');
  g.globalAlpha = 0.92;
  g.fillStyle = gAzu;
  g.fillRect(0, minY - 20, W, hSpan + 40);

  // 4. Internal faceted mineral planes along sub-ridges (山石受光面三绿/二青分面)
  for (let i = 0; i < subRidges.length; i++) {
    const sr = subRidges[i];
    if (sr.length < 2) continue;
    g.beginPath();
    sr.forEach(([x, y], idx) => (idx === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
    const last = sr[sr.length - 1], first = sr[0];
    g.lineTo(last[0] + 55, last[1] + 90);
    g.lineTo(first[0] + 35, first[1] + 110);
    g.closePath();
    g.fillStyle = i % 2 === 0 ? PAL.malachiteLight : PAL.azuriteMid;
    g.globalAlpha = 0.42;
    g.fill();
  }
  g.restore();

  // 5. Pine-soot ink structural outline (墨骨勾山)
  brushLine(L_inkLayer, ridgePts, { col: PAL.sootInk, w: goldWeight + 1.4, alpha: 0.75, seed: seed + 3 });

  // 6. Gleaming 24K Mud-Gold ridge contour (泥金复勾山脊 — 金碧山水核心技艺)
  brushLine(L_goldLayer, ridgePts.map(([x, y]) => [x, y - 1.5]), {
    col: PAL.goldMask, w: goldWeight, alpha: 0.96, seed: seed + 7, taper: 0.14
  });

  // 7. Internal vertical/diagonal axe-cut rock facets (斧劈皴 / 直擦皴 in ink + mud-gold)
  subRidges.forEach((sr, idx) => {
    brushLine(L_inkLayer, sr, { col: PAL.sootInk, w: 2.4, alpha: 0.68, seed: seed + 20 + idx });
    brushLine(L_goldLayer, sr.map(([x, y]) => [x + 1.5, y - 1]), {
      col: PAL.goldMask, w: 2.1, alpha: 0.92, seed: seed + 40 + idx, taper: 0.25
    });
    // Short parallel axe-cut texture strokes descending from the sub-ridge
    for (let k = 0; k < sr.length - 1; k++) {
      const [rx, ry] = sr[k];
      const len = 32 + 28 * hash(seed + idx * 13 + k * 7);
      const ang = 1.18 + (hash(seed + k * 5) - 0.5) * 0.28;
      const pEnd = [rx + Math.cos(ang) * len, ry + Math.sin(ang) * len];
      brushLine(L_inkLayer, [[rx, ry], pEnd], { col: PAL.sootInk, w: 1.8, alpha: 0.48, seed: seed + k * 11 });
      if (k % 2 === 0) {
        brushLine(L_goldLayer, [[rx + 2, ry], [pEnd[0] + 2, pEnd[1]]], {
          col: PAL.goldMask, w: 1.6, alpha: 0.82, seed: seed + k * 17
        });
      }
    }
  });
}

// Drifting Shell-White (蛤粉) valley mist band
function drawShellMist(L_min, x0, x1, yCenter, thickness, alpha = 0.58, seed = 1) {
  const g = L_min.g;
  g.save();
  for (let pass = 0; pass < 3; pass++) {
    const yc = yCenter + (pass - 1) * thickness * 0.28;
    const th = thickness * (0.85 - pass * 0.15);
    const grad = g.createLinearGradient(0, yc - th, 0, yc + th);
    grad.addColorStop(0.0, 'rgba(243, 239, 228, 0.0)');
    grad.addColorStop(0.45, `rgba(243, 239, 228, ${alpha * (0.65 - pass * 0.12)})`);
    grad.addColorStop(0.55, `rgba(243, 239, 228, ${alpha * (0.65 - pass * 0.12)})`);
    grad.addColorStop(1.0, 'rgba(243, 239, 228, 0.0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x0, yc + th);
    for (let x = x0; x <= x1; x += 24) {
      const wave = Math.sin(x * 0.008 + seed + pass * 1.9) * th * 0.35;
      g.lineTo(x, yc - th * 0.7 + wave);
    }
    for (let x = x1; x >= x0; x -= 24) {
      const wave = Math.cos(x * 0.007 + seed * 1.3 + pass) * th * 0.35;
      g.lineTo(x, yc + th * 0.7 + wave);
    }
    g.closePath();
    g.fill();
  }
  g.restore();
}

// Song Dynasty Pine Needle Fan Cluster (马远/夏圭式攒针松叶：石绿打底 + 墨叶 + 泥金松针)
function drawPineFan(L_min, L_inkLayer, L_goldLayer, cx, cy, rad, baseAngle = -Math.PI * 0.5, seed = 1) {
  const g = L_min.g;
  // Soft Malachite green mineral cushion behind needle fan
  g.save();
  const grad = g.createRadialGradient(cx, cy, 2, cx, cy - rad * 0.35, rad * 1.05);
  grad.addColorStop(0.0, 'rgba(30, 86, 74, 0.72)');
  grad.addColorStop(0.65, 'rgba(50, 122, 102, 0.45)');
  grad.addColorStop(1.0, 'rgba(50, 122, 102, 0.0)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, rad * 1.05, baseAngle - 1.15, baseAngle + 1.15);
  g.lineTo(cx, cy);
  g.closePath();
  g.fill();
  g.restore();

  // Radiating pine needles in Soot Ink & 24K Mud-Gold
  const count = 22;
  for (let i = 0; i <= count; i++) {
    const u = i / count;
    const ang = baseAngle - 1.02 + u * 2.04 + (hash(seed + i * 3.1) - 0.5) * 0.05;
    const r = rad * (0.82 + 0.24 * Math.sin(u * Math.PI) + (hash(seed + i * 7.7) - 0.5) * 0.12);
    const tip = [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r];
    if (i % 3 === 0) {
      brushLine(L_goldLayer, [[cx, cy], tip], { col: PAL.goldMask, w: 1.7, alpha: 0.94, seed: seed + i, taper: 0.18, wob: 0.4 });
    } else {
      brushLine(L_inkLayer, [[cx, cy], tip], { col: PAL.sootInk, w: 1.6, alpha: 0.78, seed: seed + i, taper: 0.18, wob: 0.4 });
    }
  }
}

// Emperor Huizong Style Auspicious White Crane (宋徽宗《瑞鹤图》风格丹顶白鹤：蛤粉双勾羽翼 + 朱砂鹤顶 + 泥金羽丝)
function drawSongCrane(L_min, L_inkLayer, L_goldLayer, cx, cy, scale = 1.0, tilt = -0.12, seed = 1) {
  const gMin = L_min.g;
  const gInk = L_inkLayer.g;
  const gGold = L_goldLayer.g;

  const xf = (x, y) => {
    const sx = x * scale, sy = y * scale;
    const c = Math.cos(tilt), s = Math.sin(tilt);
    return [cx + sx * c - sy * s, cy + sx * s + sy * c];
  };

  // 1. Upper & Lower Outstretched Wings in Opaque Shell White (蛤粉厚涂鹤羽)
  const wingUpper = [xf(-8, -4), xf(-28, -42), xf(-68, -62), xf(-92, -48), xf(-62, -16), xf(-18, -2)];
  const wingLower = [xf(4, 2), xf(24, -36), xf(68, -52), xf(94, -36), xf(58, -8), xf(14, 6)];
  const bodyPoly  = [xf(-42, 4), xf(-16, -8), xf(22, -6), xf(48, 2), xf(18, 14), xf(-20, 12)];

  gMin.save();
  gMin.fillStyle = PAL.shellWhite;
  gMin.globalAlpha = 0.96;
  for (const poly of [wingUpper, wingLower, bodyPoly]) {
    gMin.beginPath();
    poly.forEach(([x, y], i) => (i === 0 ? gMin.moveTo(x, y) : gMin.lineTo(x, y)));
    gMin.closePath();
    gMin.fill();
  }
  gMin.restore();

  // 2. Soot-Black Tail & Neck Accent (玄黑尾羽与颈羽)
  const tailPoly = [xf(-32, 4), xf(-58, 12), xf(-52, 22), xf(-24, 12)];
  gInk.save();
  gInk.fillStyle = PAL.sootInk;
  gInk.globalAlpha = 0.90;
  gInk.beginPath();
  tailPoly.forEach(([x, y], i) => (i === 0 ? gInk.moveTo(x, y) : gInk.lineTo(x, y)));
  gInk.closePath();
  gInk.fill();
  gInk.restore();

  // Slender curving neck, head & trailing legs
  const neckPts = [xf(22, -2), xf(48, -14), xf(68, -18), xf(82, -14)];
  const beakPts = [xf(82, -14), xf(104, -12)];
  const leg1 = [xf(-28, 10), xf(-78, 24), xf(-106, 30)];
  const leg2 = [xf(-24, 13), xf(-74, 29), xf(-102, 36)];

  brushLine(L_inkLayer, neckPts, { col: PAL.sootInk, w: 3.2 * scale, alpha: 0.88, seed: seed + 1, wob: 0.4 });
  brushLine(L_min, neckPts.map(([x, y]) => [x, y + 2 * scale]), { col: PAL.shellWhite, w: 4.5 * scale, alpha: 0.95, seed: seed + 2, wob: 0.3 });
  brushLine(L_goldLayer, beakPts, { col: PAL.goldMask, w: 2.2 * scale, alpha: 0.96, seed: seed + 3, wob: 0.2 });
  brushLine(L_inkLayer, leg1, { col: PAL.sootInk, w: 1.8 * scale, alpha: 0.82, seed: seed + 4, wob: 0.3 });
  brushLine(L_inkLayer, leg2, { col: PAL.sootInk, w: 1.8 * scale, alpha: 0.82, seed: seed + 5, wob: 0.3 });

  // 3. Cinnabar Crown Dot (丹顶朱砂)
  const [hx, hy] = xf(79, -17);
  gMin.save();
  gMin.fillStyle = PAL.cinnabar;
  gMin.globalAlpha = 0.96;
  gMin.beginPath();
  gMin.arc(hx, hy, 4.5 * scale, 0, Math.PI * 2);
  gMin.fill();
  gMin.restore();

  // 4. Delicate 24K Mud-Gold Feather Filaments (泥金勾勒羽翼层次)
  brushLine(L_goldLayer, wingUpper, { col: PAL.goldMask, w: 1.8 * scale, alpha: 0.92, seed: seed + 10, wob: 0.4 });
  brushLine(L_goldLayer, wingLower, { col: PAL.goldMask, w: 1.8 * scale, alpha: 0.92, seed: seed + 11, wob: 0.4 });
  for (let k = 1; k <= 4; k++) {
    const u = k / 5;
    brushLine(L_goldLayer, [
      xf(lerp(-18, -58, u), lerp(-8, -32, u)),
      xf(lerp(-35, -84, u), lerp(-38, -52, u))
    ], { col: PAL.goldMask, w: 1.4 * scale, alpha: 0.85, seed: seed + 20 + k, wob: 0.3 });
    brushLine(L_goldLayer, [
      xf(lerp(14, 52, u), lerp(-4, -26, u)),
      xf(lerp(32, 82, u), lerp(-30, -40, u))
    ], { col: PAL.goldMask, w: 1.4 * scale, alpha: 0.85, seed: seed + 30 + k, wob: 0.3 });
  }
}

// Song Dynasty Waterside Pavilion (宋式界画飞檐水榭：朱砂廊柱 + 青绿琉璃瓦 + 泥金脊饰 + 暖烛宫灯)
function drawSongPavilion(L_min, L_inkLayer, L_goldLayer, cx, cy, scale = 1.0) {
  const gMin = L_min.g;
  const s = scale;

  // 1. Stone Terrace Base (青石须弥台基)
  const platform = [
    [cx - 118 * s, cy + 42 * s],
    [cx + 118 * s, cy + 42 * s],
    [cx + 128 * s, cy + 66 * s],
    [cx - 128 * s, cy + 66 * s]
  ];
  gMin.save();
  gMin.fillStyle = PAL.ochreLight;
  gMin.globalAlpha = 0.82;
  gMin.beginPath();
  platform.forEach(([x, y], i) => (i === 0 ? gMin.moveTo(x, y) : gMin.lineTo(x, y)));
  gMin.closePath();
  gMin.fill();
  gMin.restore();
  brushLine(L_inkLayer, platform, { col: PAL.sootInk, w: 2.4 * s, alpha: 0.85, seed: 301 });
  brushLine(L_goldLayer, [platform[0], platform[1]], { col: PAL.goldMask, w: 2.2 * s, alpha: 0.94, seed: 302 });

  // 2. Warm Glowing Paper Lantern Window Inside Pavilion (水榭内暖烛窗光)
  gMin.save();
  const glow = gMin.createRadialGradient(cx, cy + 8 * s, 4 * s, cx, cy + 8 * s, 58 * s);
  glow.addColorStop(0.0, 'rgba(255, 242, 198, 0.95)');
  glow.addColorStop(0.45, 'rgba(232, 184, 96, 0.65)');
  glow.addColorStop(1.0, 'rgba(232, 184, 96, 0.0)');
  gMin.fillStyle = glow;
  gMin.beginPath();
  gMin.arc(cx, cy + 8 * s, 58 * s, 0, Math.PI * 2);
  gMin.fill();
  gMin.restore();

  // 3. Cinnabar Columns &美人靠 Balustrade (朱砂立柱与钩阑)
  const colXs = [-82, -38, 38, 82].map(dx => cx + dx * s);
  colXs.forEach((xCol, idx) => {
    brushLine(L_min, [[xCol, cy - 26 * s], [xCol, cy + 42 * s]], {
      col: PAL.cinnabar, w: 5.5 * s, alpha: 0.92, seed: 310 + idx, taper: 0.06, wob: 0.3
    });
    brushLine(L_goldLayer, [[xCol - 1.5 * s, cy - 26 * s], [xCol - 1.5 * s, cy + 42 * s]], {
      col: PAL.goldMask, w: 1.5 * s, alpha: 0.85, seed: 320 + idx, taper: 0.1, wob: 0.2
    });
  });
  // Cinnabar railing
  brushLine(L_min, [[cx - 98 * s, cy + 24 * s], [cx + 98 * s, cy + 24 * s]], {
    col: PAL.cinnabar, w: 4.5 * s, alpha: 0.92, seed: 325, wob: 0.3
  });
  brushLine(L_goldLayer, [[cx - 98 * s, cy + 22 * s], [cx + 98 * s, cy + 22 * s]], {
    col: PAL.goldMask, w: 1.8 * s, alpha: 0.92, seed: 326, wob: 0.2
  });

  // 4. Sweeping Double-Tiered Upturned Song Roof Eaves (重檐歇山飞檐：石青/石绿琉璃瓦 + 泥金吻兽瓦垄)
  const lowerEave = [
    [cx - 152 * s, cy - 18 * s],
    [cx - 105 * s, cy - 34 * s],
    [cx, cy - 42 * s],
    [cx + 105 * s, cy - 34 * s],
    [cx + 152 * s, cy - 18 * s],
    [cx + 118 * s, cy - 48 * s],
    [cx, cy - 58 * s],
    [cx - 118 * s, cy - 48 * s],
  ];
  const upperEave = [
    [cx - 116 * s, cy - 56 * s],
    [cx - 72 * s, cy - 72 * s],
    [cx, cy - 78 * s],
    [cx + 72 * s, cy - 72 * s],
    [cx + 116 * s, cy - 56 * s],
    [cx + 76 * s, cy - 88 * s],
    [cx, cy - 106 * s],
    [cx - 76 * s, cy - 88 * s],
  ];

  gMin.save();
  for (const [poly, col] of [[lowerEave, PAL.azuriteDeep], [upperEave, PAL.malachiteDeep]]) {
    gMin.fillStyle = col;
    gMin.globalAlpha = 0.92;
    gMin.beginPath();
    poly.forEach(([x, y], i) => (i === 0 ? gMin.moveTo(x, y) : gMin.lineTo(x, y)));
    gMin.closePath();
    gMin.fill();
  }
  gMin.restore();

  // Soot-ink & 24K Mud-Gold roof ridge and eave outlines (界画泥金屋脊与瓦垄)
  const lowerBottomCurve = [lowerEave[0], lowerEave[1], lowerEave[2], lowerEave[3], lowerEave[4]];
  const upperBottomCurve = [upperEave[0], upperEave[1], upperEave[2], upperEave[3], upperEave[4]];
  const topRidge = [[cx - 68 * s, cy - 92 * s], [cx, cy - 106 * s], [cx + 68 * s, cy - 92 * s]];

  brushLine(L_inkLayer, lowerBottomCurve, { col: PAL.sootInk, w: 3.2 * s, alpha: 0.90, seed: 330, wob: 0.4 });
  brushLine(L_goldLayer, lowerBottomCurve.map(([x, y]) => [x, y - 2 * s]), { col: PAL.goldMask, w: 2.6 * s, alpha: 0.96, seed: 331, wob: 0.3 });
  brushLine(L_inkLayer, upperBottomCurve, { col: PAL.sootInk, w: 3.0 * s, alpha: 0.90, seed: 332, wob: 0.4 });
  brushLine(L_goldLayer, upperBottomCurve.map(([x, y]) => [x, y - 2 * s]), { col: PAL.goldMask, w: 2.6 * s, alpha: 0.96, seed: 333, wob: 0.3 });
  brushLine(L_goldLayer, topRidge, { col: PAL.goldMask, w: 3.2 * s, alpha: 0.98, seed: 334, wob: 0.3 });

  // Vertical golden tile ribs (泥金瓦垄线)
  for (let i = -5; i <= 5; i++) {
    const u = i / 5;
    brushLine(L_goldLayer, [
      [cx + u * 64 * s, cy - 86 * s + Math.abs(u) * 14 * s],
      [cx + u * 96 * s, cy - 62 * s + Math.abs(u) * 8 * s]
    ], { col: PAL.goldMask, w: 1.4 * s, alpha: 0.80, seed: 340 + i, wob: 0.2 });
    brushLine(L_goldLayer, [
      [cx + u * 88 * s, cy - 50 * s + Math.abs(u) * 8 * s],
      [cx + u * 124 * s, cy - 26 * s + Math.abs(u) * 8 * s]
    ], { col: PAL.goldMask, w: 1.4 * s, alpha: 0.80, seed: 355 + i, wob: 0.2 });
  }
}

// Song Scholar Skiff (一叶扁舟与高士独钓/赏月)
function drawSongBoat(L_min, L_inkLayer, L_goldLayer, cx, cy, scale = 1.0) {
  const s = scale;
  const hull = [
    [cx - 68 * s, cy - 6 * s],
    [cx - 36 * s, cy + 9 * s],
    [cx + 38 * s, cy + 9 * s],
    [cx + 74 * s, cy - 9 * s],
    [cx + 32 * s, cy - 1 * s],
    [cx - 32 * s, cy - 1 * s]
  ];
  const gMin = L_min.g;
  gMin.save();
  gMin.fillStyle = PAL.ochre;
  gMin.globalAlpha = 0.88;
  gMin.beginPath();
  hull.forEach(([x, y], i) => (i === 0 ? gMin.moveTo(x, y) : gMin.lineTo(x, y)));
  gMin.closePath();
  gMin.fill();

  // Scholar figure in Shell-White robe (蛤粉白衣高士)
  gMin.fillStyle = PAL.shellWhite;
  gMin.globalAlpha = 0.96;
  gMin.beginPath();
  gMin.moveTo(cx - 12 * s, cy + 1 * s);
  gMin. quadraticCurveTo(cx - 16 * s, cy - 26 * s, cx - 4 * s, cy - 28 * s);
  gMin.quadraticCurveTo(cx + 8 * s, cy - 24 * s, cx + 6 * s, cy + 1 * s);
  gMin.closePath();
  gMin.fill();
  gMin.restore();

  // Head & topknot
  const gInk = L_inkLayer.g;
  gInk.save();
  gInk.fillStyle = PAL.sootInk;
  gInk.beginPath();
  gInk.arc(cx - 4 * s, cy - 33 * s, 4.5 * s, 0, Math.PI * 2);
  gInk.fill();
  gInk.restore();

  brushLine(L_inkLayer, [hull[0], hull[1], hull[2], hull[3]], { col: PAL.sootInk, w: 2.8 * s, alpha: 0.88, seed: 401, wob: 0.4 });
  brushLine(L_goldLayer, [[cx - 66 * s, cy - 7 * s], [cx - 32 * s, cy + 4 * s], [cx + 36 * s, cy + 4 * s], [cx + 72 * s, cy - 10 * s]], {
    col: PAL.goldMask, w: 2.1 * s, alpha: 0.95, seed: 402, wob: 0.3
  });
}

// Traditional Carved Cinnabar Seal Stamp (朱文/白文印章，带崩边与印泥古意)
function drawCinnabarSeal(L_inkLayer, cx, cy, w, h, chars, { type = 'yang', seed = 1 } = {}) {
  const g = L_inkLayer.g;
  const x0 = cx - w / 2, y0 = cy - h / 2;
  g.save();
  g.fillStyle = PAL.cinnabarSeal;
  g.strokeStyle = PAL.cinnabarSeal;

  if (type === 'yin') {
    // 白文印 (Solid cinnabar block with carved-out silk-coloured characters)
    g.globalAlpha = 0.92;
    g.beginPath();
    g.roundRect(x0, y0, w, h, 3);
    g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    g.font = `700 ${Math.floor(w * 0.44)}px "Noto Serif SC", serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (chars.length === 2) {
      g.fillText(chars[0], cx, cy - h * 0.23);
      g.fillText(chars[1], cx, cy + h * 0.25);
    } else if (chars.length === 4) {
      g.font = `700 ${Math.floor(w * 0.36)}px "Noto Serif SC", serif`;
      g.fillText(chars[0], cx + w * 0.22, cy - h * 0.22);
      g.fillText(chars[1], cx + w * 0.22, cy + h * 0.24);
      g.fillText(chars[2], cx - w * 0.22, cy - h * 0.22);
      g.fillText(chars[3], cx - w * 0.22, cy + h * 0.24);
    }
    g.globalCompositeOperation = 'source-over';
  } else {
    // 朱文印 (Carved red border + red characters)
    g.globalAlpha = 0.92;
    g.lineWidth = 3.2;
    g.beginPath();
    g.roundRect(x0, y0, w, h, 4);
    g.stroke();
    g.font = `700 ${Math.floor(w * 0.42)}px "Noto Serif SC", serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (chars.length === 2) {
      g.fillText(chars[0], cx, cy - h * 0.23);
      g.fillText(chars[1], cx, cy + h * 0.25);
    } else {
      g.font = `700 ${Math.floor(w * 0.35)}px "Noto Serif SC", serif`;
      g.fillText(chars[0], cx + w * 0.22, cy - h * 0.22);
      g.fillText(chars[1], cx + w * 0.22, cy + h * 0.24);
      g.fillText(chars[2], cx - w * 0.22, cy - h * 0.22);
      g.fillText(chars[3], cx - w * 0.22, cy + h * 0.24);
    }
  }
  g.restore();
}

// Vertical Classical Chinese Column Text (竖排宋刻体/题跋排版)
function drawVerticalText(L, str, x, yTop, {
  font = '"Noto Serif SC", serif',
  size = 26,
  weight = 600,
  col = PAL.sootInk,
  stepY = 33,
  alpha = 0.90,
} = {}) {
  const g = L.g;
  g.save();
  g.font = `${weight} ${size}px ${font}`;
  g.fillStyle = col;
  g.globalAlpha = alpha;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const chars = [...str];
  chars.forEach((ch, i) => {
    const cy = yTop + i * stepY;
    if (ch === '·' || ch === '、' || ch === '，' || ch === '。') {
      g.fillText(ch, x + size * 0.18, cy - size * 0.12);
    } else {
      g.fillText(ch, x, cy);
    }
  });
  g.restore();
}

function ensureLayers(w, h) {
  for (const L of [L_mineralBg, L_mineralMid, L_mineralFg, L_ink, L_gold]) {
    if (L.c.width !== w || L.c.height !== h) {
      L.c.width = w;
      L.c.height = h;
      L.g.lineCap = 'round';
      L.g.lineJoin = 'round';
    } else {
      L.g.clearRect(0, 0, w, h);
    }
  }
}

// 3:4 Vertical Hanging Scroll Composition (1080×1440 宋画立轴构图)
function renderVerticalScroll(comp, t = 1.0) {
  const VW = 1080, VH = 1440;
  ensureLayers(VW, VH);

  const gBg = L_mineralBg.g;
  gBg.save();
  const skyGrad = gBg.createLinearGradient(0, 30, 0, 520);
  skyGrad.addColorStop(0.0, 'rgba(28, 62, 102, 0.44)');
  skyGrad.addColorStop(0.60, 'rgba(46, 92, 128, 0.16)');
  skyGrad.addColorStop(1.0, 'rgba(46, 92, 128, 0.0)');
  gBg.fillStyle = skyGrad;
  gBg.fillRect(30, 30, VW - 60, 500);

  // Full Autumn Moon in Upper-Left Sky (x=235, y=215, r=66)
  const moonGlow = gBg.createRadialGradient(235, 215, 12, 235, 215, 130);
  moonGlow.addColorStop(0.0, 'rgba(246, 242, 230, 0.96)');
  moonGlow.addColorStop(0.48, 'rgba(243, 239, 228, 0.88)');
  moonGlow.addColorStop(0.52, 'rgba(225, 205, 165, 0.28)');
  moonGlow.addColorStop(1.0, 'rgba(225, 205, 165, 0.0)');
  gBg.fillStyle = moonGlow;
  gBg.beginPath();
  gBg.arc(235, 215, 130, 0, Math.PI * 2);
  gBg.fill();
  gBg.restore();

  // Mud-gold cloud scrolls around moon
  [
    [[105, 236], [165, 224], [225, 232], [285, 225], [340, 233]],
    [[280, 175], [345, 165], [410, 172], [465, 166]],
  ].forEach((cr, i) => brushLine(L_gold, cr, { col: PAL.goldMask, w: 2.0, alpha: 0.88, seed: 70 + i, wob: 0.5 }));

  // Upper-Right Song Imperial Inscription Panel (立轴天头右侧泥金乌丝栏题跋, x=620..1012, y=76..455)
  const px0 = 620, px1 = 1012, py0 = 76, py1 = 455;
  brushLine(L_gold, [[px0, py0], [px1, py0], [px1, py1], [px0, py1], [px0, py0]], {
    col: PAL.goldMask, w: 2.2, alpha: 0.92, seed: 701, taper: 0.02, wob: 0.2
  });
  brushLine(L_gold, [[px0 + 6, py0 + 6], [px1 - 6, py0 + 6], [px1 - 6, py1 - 6], [px0 + 6, py1 - 6], [px0 + 6, py0 + 6]], {
    col: PAL.goldMask, w: 1.2, alpha: 0.76, seed: 702, taper: 0.02, wob: 0.2
  });
  [698, 776, 854, 932].forEach((cx, i) => {
    brushLine(L_gold, [[cx, py0 + 6], [cx, py1 - 6]], { col: PAL.goldMask, w: 1.1, alpha: 0.58, seed: 710 + i, taper: 0.02, wob: 0.2 });
  });

  drawVerticalText(L_ink, "千里江山·立轴", 972, 114, { size: 28, weight: 700, col: PAL.sootInk, stepY: 36, alpha: 0.94 });
  drawVerticalText(L_ink, "取青金石为巅", 893, 118, { size: 22, weight: 600, col: PAL.sootInk, stepY: 34, alpha: 0.88 });
  drawVerticalText(L_ink, "捣孔雀石作岚", 815, 118, { size: 22, weight: 600, col: PAL.sootInk, stepY: 34, alpha: 0.88 });
  drawVerticalText(L_ink, "泥金迎烛流转", 737, 118, { size: 22, weight: 600, col: PAL.sootInk, stepY: 34, alpha: 0.88 });
  drawVerticalText(L_ink, "宋韵岩彩考", 659, 118, { size: 19, weight: 600, col: PAL.ochre, stepY: 30, alpha: 0.88 });
  drawCinnabarSeal(L_ink, 659, 325, 44, 44, "宋韵", { type: 'yin', seed: 720 });
  drawCinnabarSeal(L_ink, 659, 382, 44, 44, "金碧", { type: 'yang', seed: 721 });
  drawCinnabarSeal(L_ink, 972, 405, 46, 58, "博物雅集", { type: 'yang', seed: 725 });

  // Towering Distant Blue-and-Green Main Peak (立轴高远主峰, y=285..820)
  drawMineralMountain(
    L_mineralBg, L_ink, L_gold,
    [
      [35, 810], [115, 665], [195, 585], [275, 465],
      [355, 295], [428, 395], [505, 345], [585, 495],
      [675, 555], [785, 645], [910, 735], [1045, 820]
    ],
    840,
    {
      seed: 730,
      ochreCol: PAL.ochre,
      malachiteCol: PAL.malachiteMid,
      azuriteCol: PAL.azuriteDeep,
      malachiteRatio: 0.78,
      azuriteRatio: 0.48,
      goldWeight: 2.8,
      subRidges: [
        [[355, 295], [322, 435], [278, 595]],
        [[355, 295], [398, 445], [445, 610]],
        [[505, 345], [538, 485], [585, 645]],
      ],
    }
  );
  drawShellMist(L_mineralBg, 35, 1045, 665, 76, 0.72, 71);

  // Midground Cliffs & Waterfall (中景奇峰与飞泉, y=520..990)
  drawMineralMountain(
    L_mineralMid, L_ink, L_gold,
    [
      [35, 960], [135, 785], [235, 715], [345, 615],
      [445, 535], [525, 610], [615, 555], [725, 675],
      [835, 755], [955, 865], [1045, 955]
    ],
    995,
    {
      seed: 740,
      ochreCol: PAL.ochre,
      malachiteCol: PAL.malachiteDeep,
      azuriteCol: PAL.azuriteMid,
      malachiteRatio: 0.82,
      azuriteRatio: 0.44,
      goldWeight: 2.6,
      subRidges: [
        [[445, 535], [412, 685], [375, 835]],
        [[615, 555], [655, 695], [695, 845]],
      ],
    }
  );
  for (let i = 0; i < 5; i++) {
    const wx = 516 + i * 6;
    const pts = [[wx, 608], [wx - 3, 695], [wx + 3, 795], [wx - 2, 895]];
    brushLine(L_mineralMid, pts, { col: PAL.shellWhite, w: 5.2, alpha: 0.88, seed: 750 + i, wob: 0.5 });
    if (i % 2 === 0) brushLine(L_gold, pts, { col: PAL.goldMask, w: 1.6, alpha: 0.88, seed: 760 + i, wob: 0.4 });
  }
  drawShellMist(L_mineralMid, 35, 1045, 915, 68, 0.68, 79);

  // Foreground Promontory, Waterside Pavilion & Ancient Pine (近景水榭与苍松, y=820..1165)
  drawMineralMountain(
    L_mineralFg, L_ink, L_gold,
    [[380, 1045], [485, 945], [595, 915], [735, 915], [845, 965], [965, 1045]],
    1060,
    { seed: 770, goldWeight: 2.5, subRidges: [[[595, 915], [565, 995]], [[735, 915], [775, 995]]] }
  );
  drawSongPavilion(L_mineralFg, L_ink, L_gold, 665, 875, 0.90);

  drawMineralMountain(
    L_mineralFg, L_ink, L_gold,
    [[32, 920], [125, 845], [235, 835], [335, 895], [435, 995], [515, 1095]],
    1140,
    { seed: 780, goldWeight: 2.9, subRidges: [[[235, 835], [195, 965]], [[235, 835], [285, 975]]] }
  );

  const trunk = [[185, 855], [202, 765], [192, 685], [232, 625], [308, 592], [385, 608]];
  brushLine(L_mineralFg, trunk, { col: PAL.ochre, w: 16, alpha: 0.88, seed: 785, taper: 0.28 });
  brushLine(L_ink, trunk, { col: PAL.sootInk, w: 12, alpha: 0.86, seed: 786, taper: 0.28 });
  brushLine(L_gold, trunk.map(([x, y]) => [x + 2.5, y - 1.5]), { col: PAL.goldMask, w: 2.8, alpha: 0.94, seed: 787, taper: 0.22 });
  [[192, 622, 38], [245, 595, 42], [312, 576, 44], [375, 592, 40], [422, 612, 36]].forEach(([px, py, pr], idx) => {
    drawPineFan(L_mineralFg, L_ink, L_gold, px, py, pr, -Math.PI * 0.5, 790 + idx * 5);
  });

  // Two Auspicious Cranes & Scholar Skiff + Golden Water Ripples
  drawSongCrane(L_mineralFg, L_ink, L_gold, 415, 235, 0.82, -0.15, 801);
  drawSongCrane(L_mineralFg, L_ink, L_gold, 535, 292, 0.68, -0.08, 805);
  drawSongBoat(L_mineralFg, L_ink, L_gold, 815, 1118, 1.05);

  for (let row = 0; row < 7; row++) {
    const ry = 1065 + row * 22;
    for (let rx = 85; rx < 995; rx += 92) {
      const jitX = (hash(row * 17 + rx) - 0.5) * 24;
      brushLine(L_gold, [[rx + jitX - 32, ry + 2], [rx + jitX, ry - 2], [rx + jitX + 32, ry + 2]], {
        col: PAL.goldMask, w: 1.5, alpha: 0.78, seed: 820 + row * 50 + rx, wob: 0.3
      });
    }
  }

  // Bottom Mineral Swatches & Vertical-Mode Subtitle Card (y=1235..1385)
  brushLine(L_gold, [[75, 1235], [1005, 1235]], { col: PAL.goldMask, w: 1.6, alpha: 0.82, seed: 860, taper: 0.04, wob: 0.2 });
  const swatches = [
    { x: 145, col: PAL.azuriteDeep, name: "石青" },
    { x: 235, col: PAL.malachiteMid, name: "石绿" },
    { x: 325, col: PAL.cinnabar, name: "朱砂" },
    { x: 415, col: PAL.shellWhite, name: "蛤粉" },
  ];
  swatches.forEach((sw, i) => {
    const cy = 1282, r = 18;
    const dia = [[sw.x, cy - r], [sw.x + r, cy], [sw.x, cy + r], [sw.x - r, cy]];
    L_mineralFg.g.save();
    L_mineralFg.g.fillStyle = sw.col;
    L_mineralFg.g.globalAlpha = 0.95;
    L_mineralFg.g.beginPath();
    dia.forEach(([x, y], k) => (k === 0 ? L_mineralFg.g.moveTo(x, y) : L_mineralFg.g.lineTo(x, y)));
    L_mineralFg.g.closePath();
    L_mineralFg.g.fill();
    L_mineralFg.g.restore();
    brushLine(L_gold, [...dia, dia[0]], { col: PAL.goldMask, w: 1.8, alpha: 0.94, seed: 870 + i });
    L_ink.g.save();
    L_ink.g.textAlign = 'center';
    L_ink.g.font = '700 17px "Noto Serif SC", serif';
    L_ink.g.fillStyle = PAL.sootInk;
    L_ink.g.fillText(sw.name, sw.x, cy + 38);
    L_ink.g.restore();
  });

  const gInk = L_ink.g;
  gInk.save();
  gInk.textAlign = 'right';
  gInk.font = '700 26px "Noto Serif SC", serif';
  gInk.fillStyle = PAL.sootInk;
  gInk.fillText("唯有碾碎的矿石与一缕真金，", 1005, 1282);
  gInk.fillText("能在古绢上定格千年。", 1005, 1322);
  gInk.font = '600 13px "Noto Serif SC", serif';
  gInk.fillStyle = PAL.ochre;
  gInk.fillText("SONG SILK & MINERAL GOLD · 3:4 VERTICAL SCROLL", 1005, 1354);
  gInk.restore();

  const lightUV = [0.52, 0.48];
  comp.beginSilk([0.784, 0.706, 0.565]);
  comp.mineralPass(L_mineralBg.c, 1.05);
  comp.mineralPass(L_mineralMid.c, 1.15);
  comp.mineralPass(L_mineralFg.c, 1.20);
  comp.inkPass(L_ink.c);
  comp.goldPass(L_gold.c, lightUV);
  comp.finish(lightUV);
}

export function renderKeyframe(comp, t = 1.0, curW = W, curH = H) {
  if (curH > curW) {
    renderVerticalScroll(comp, t);
    return;
  }
  ensureLayers(W, H);

  // ——— 1. UPPER SKY WASH, SHELL-WHITE FULL MOON & MUD-GOLD CLOUD SCROLLS ———
  const gBg = L_mineralBg.g;
  gBg.save();
  // Subtle mineral indigo/azurite top sky wash fading into raw tea-aged silk (天头微染三青)
  const skyGrad = gBg.createLinearGradient(0, 30, 0, 390);
  skyGrad.addColorStop(0.0, 'rgba(28, 62, 102, 0.42)');
  skyGrad.addColorStop(0.55, 'rgba(46, 92, 128, 0.16)');
  skyGrad.addColorStop(1.0, 'rgba(46, 92, 128, 0.0)');
  gBg.fillStyle = skyGrad;
  gBg.fillRect(30, 30, W - 60, 380);

  // Full Autumn Moon in Calcined Clam-Shell White (蛤粉圆月, x=285, y=195, r=68)
  const moonGlow = gBg.createRadialGradient(285, 195, 12, 285, 195, 135);
  moonGlow.addColorStop(0.0, 'rgba(246, 242, 230, 0.96)');
  moonGlow.addColorStop(0.48, 'rgba(243, 239, 228, 0.88)');
  moonGlow.addColorStop(0.52, 'rgba(225, 205, 165, 0.28)');
  moonGlow.addColorStop(1.0, 'rgba(225, 205, 165, 0.0)');
  gBg.fillStyle = moonGlow;
  gBg.beginPath();
  gBg.arc(285, 195, 135, 0, Math.PI * 2);
  gBg.fill();
  gBg.restore();

  // Delicate 24K Mud-Gold auspicious cloud ribbons around the moon & peaks (泥金流云纹)
  const cloudRibbons = [
    [[145, 218], [198, 206], [248, 214], [308, 208], [362, 216]],
    [[175, 230], [235, 222], [295, 228], [345, 222]],
    [[335, 162], [395, 152], [458, 160], [515, 154]],
    [[790, 178], [865, 168], [945, 176], [1025, 168], [1095, 175]],
    [[830, 190], [915, 182], [995, 188], [1065, 182]],
  ];
  cloudRibbons.forEach((cr, i) => {
    brushLine(L_gold, cr, { col: PAL.goldMask, w: 2.0, alpha: 0.88, seed: 50 + i, wob: 0.6 });
  });

  // ——— 2. DISTANT BLUE-AND-GREEN MINERAL PEAKS (远景主峰与群山：《千里江山图》青绿设色) ———
  drawMineralMountain(
    L_mineralBg, L_ink, L_gold,
    [
      [45, 620], [135, 520], [215, 455], [295, 495], [385, 385],
      [465, 295], [535, 168], [598, 245], [662, 212], [735, 315],
      [815, 255], [892, 142], [958, 228], [1025, 195], [1110, 310],
      [1195, 365], [1285, 445], [1375, 560]
    ],
    660,
    {
      seed: 101,
      ochreCol: PAL.ochre,
      malachiteCol: PAL.malachiteMid,
      azuriteCol: PAL.azuriteDeep,
      malachiteRatio: 0.78,
      azuriteRatio: 0.48,
      goldWeight: 2.8,
      subRidges: [
        [[535, 168], [512, 285], [472, 395], [420, 510]],
        [[535, 168], [568, 295], [612, 420]],
        [[662, 212], [642, 335], [608, 455]],
        [[892, 142], [856, 275], [812, 410], [765, 535]],
        [[892, 142], [928, 285], [975, 425]],
        [[1025, 195], [1052, 325], [1095, 465]],
      ],
    }
  );

  // Waist Mist #1 in Calcined Clam-Shell White (远山腰间蛤粉云岚，使群峰浮于云海)
  drawShellMist(L_mineralBg, 40, 1380, 485, 78, 0.72, 12);

  // ——— 3. MIDGROUND EMERALD-MALACHITE & AZURITE CLIFFS + WATERFALL (中景叠嶂与飞瀑) ———
  drawMineralMountain(
    L_mineralMid, L_ink, L_gold,
    [
      [35, 760], [118, 610], [195, 535], [278, 565], [362, 465],
      [445, 515], [538, 425], [618, 362], [685, 435], [758, 385],
      [842, 455], [935, 512], [1035, 575], [1145, 650], [1255, 745]
    ],
    800,
    {
      seed: 202,
      ochreCol: PAL.ochre,
      malachiteCol: PAL.malachiteDeep,
      azuriteCol: PAL.azuriteMid,
      malachiteRatio: 0.82,
      azuriteRatio: 0.42,
      goldWeight: 2.6,
      subRidges: [
        [[362, 465], [335, 575], [295, 685]],
        [[618, 362], [585, 485], [542, 625]],
        [[618, 362], [652, 475], [678, 610]],
        [[758, 385], [792, 505], [835, 645]],
      ],
    }
  );

  // Cascading Waterfall in Shell White & 24K Mud-Gold (中景断崖飞泉：蛤粉水练 + 泥金水线)
  for (let i = 0; i < 5; i++) {
    const wx = 676 + i * 6;
    const pts = [[wx, 432], [wx - 4, 515], [wx + 3, 605], [wx - 2, 705]];
    brushLine(L_mineralMid, pts, { col: PAL.shellWhite, w: 5.5, alpha: 0.88, seed: 250 + i, wob: 0.5 });
    if (i % 2 === 0) {
      brushLine(L_gold, pts, { col: PAL.goldMask, w: 1.6, alpha: 0.88, seed: 260 + i, wob: 0.4 });
    }
  }

  // Waist Mist #2 around the waterfall base & pavilion terrace
  drawShellMist(L_mineralMid, 40, 1340, 725, 68, 0.68, 29);

  // ——— 4. FOREGROUND ROCKY PROMONTORY, SONG PAVILION & ANCIENT PINE (近景奇松、飞檐水榭与金碧坡石) ———
  // Right-center promontory supporting the Song Waterside Pavilion (x=540..1080, y=680..860)
  drawMineralMountain(
    L_mineralFg, L_ink, L_gold,
    [
      [510, 845], [585, 765], [675, 728], [780, 718],
      [895, 725], [975, 768], [1055, 815], [1120, 848]
    ],
    865,
    {
      seed: 305,
      ochreCol: PAL.ochre,
      malachiteCol: PAL.malachiteMid,
      azuriteCol: PAL.azuriteDeep,
      malachiteRatio: 0.75,
      azuriteRatio: 0.38,
      goldWeight: 2.5,
      subRidges: [
        [[675, 728], [645, 795], [615, 845]],
        [[895, 725], [925, 790], [965, 845]],
      ],
    }
  );

  // Song Waterside Pavilion on the promontory (cx=815, cy=682)
  drawSongPavilion(L_mineralFg, L_ink, L_gold, 815, 682, 0.92);

  // Left Foreground Craggy Promontory (近景左侧青绿巨石坡岸, x=32..590, y=640..995)
  drawMineralMountain(
    L_mineralFg, L_ink, L_gold,
    [
      [32, 710], [115, 652], [218, 635], [312, 668],
      [398, 725], [478, 795], [555, 868], [618, 935]
    ],
    985,
    {
      seed: 350,
      ochreCol: PAL.ochre,
      malachiteCol: PAL.malachiteDeep,
      azuriteCol: PAL.azuriteDeep,
      malachiteRatio: 0.80,
      azuriteRatio: 0.50,
      goldWeight: 3.0,
      subRidges: [
        [[218, 635], [185, 745], [142, 875]],
        [[218, 635], [265, 755], [315, 885]],
        [[398, 725], [365, 835], [335, 945]],
      ],
    }
  );

  // Gnarled Song Dynasty Ancient Pine Tree rising from Left Promontory (苍松迎月，泥金鳞皴)
  const trunkMain = [[195, 655], [215, 575], [202, 495], [238, 435], [315, 398], [395, 412], [462, 438]];
  const branchUpper = [[238, 435], [185, 378], [128, 355]];
  const branchMid = [[315, 398], [362, 348], [428, 332]];
  const branchLow = [[212, 535], [295, 512], [375, 528]];

  // Ochre & Soot-Ink trunk + Mud-Gold bark scales
  brushLine(L_mineralFg, trunkMain, { col: PAL.ochre, w: 18, alpha: 0.88, seed: 370, taper: 0.28 });
  brushLine(L_ink, trunkMain, { col: PAL.sootInk, w: 14, alpha: 0.86, seed: 371, taper: 0.28 });
  brushLine(L_gold, trunkMain.map(([x, y]) => [x + 3, y - 2]), { col: PAL.goldMask, w: 3.2, alpha: 0.94, seed: 372, taper: 0.22 });

  for (const [bPts, w] of [[branchUpper, 9], [branchMid, 9.5], [branchLow, 8.5]]) {
    brushLine(L_ink, bPts, { col: PAL.sootInk, w, alpha: 0.86, seed: 375, taper: 0.35 });
    brushLine(L_gold, bPts.map(([x, y]) => [x + 2, y - 1.5]), { col: PAL.goldMask, w: 2.4, alpha: 0.92, seed: 376, taper: 0.3 });
  }

  // Pine needle fan clusters (石绿衬底 + 泥金攒针松叶)
  const pineFans = [
    [125, 352, 38], [168, 362, 36], [225, 392, 40],
    [355, 340, 42], [412, 326, 44], [458, 342, 38],
    [385, 402, 42], [448, 428, 44], [492, 445, 36],
    [315, 505, 38], [372, 520, 40],
  ];
  pineFans.forEach(([px, py, pr], idx) => {
    drawPineFan(L_mineralFg, L_ink, L_gold, px, py, pr, -Math.PI * 0.5, 380 + idx * 7);
  });

  // ——— 5. GOLDEN FISH-SCALE WATER RIPPLES, SCHOLAR SKIFF & TWO AUSPICIOUS CRANES ———
  // Delicate 24K Mud-Gold water ripples across the river (泥金网巾水纹, y=825..1015)
  for (let row = 0; row < 9; row++) {
    const ry = 835 + row * 20;
    const xStart = 540 - row * 35;
    const xEnd = 1360 + row * 15;
    for (let rx = xStart; rx < xEnd; rx += 88) {
      const jitX = (hash(row * 19 + rx) - 0.5) * 28;
      const jitY = (hash(row * 31 + rx) - 0.5) * 5;
      const wLen = 36 + (hash(row * 7 + rx) - 0.5) * 18;
      const pts = [
        [rx + jitX - wLen, ry + jitY + 2],
        [rx + jitX, ry + jitY - 2.5],
        [rx + jitX + wLen, ry + jitY + 2]
      ];
      brushLine(L_gold, pts, { col: PAL.goldMask, w: 1.55, alpha: 0.78, seed: row * 100 + rx, wob: 0.3 });
    }
  }

  // Lone Scholar Skiff on the golden river (x=1085, y=888)
  drawSongBoat(L_mineralFg, L_ink, L_gold, 1085, 888, 1.08);

  // Two Auspicious White Cranes soaring toward the moonlit peaks (双鹤翔云)
  drawSongCrane(L_mineralFg, L_ink, L_gold, 495, 228, 0.86, -0.16, 501);
  drawSongCrane(L_mineralFg, L_ink, L_gold, 645, 278, 0.72, -0.08, 520);

  // ——— 6. SONG EDITORIAL INSCRIPTION PANEL & MINERAL SPECIMEN DIAGRAM (右侧宋刻泥金乌丝栏题跋与矿物图谱) ———
  // Drawn in the open right-hand silk space (x=1395..1845, y=88..865)
  const panelX0 = 1410, panelX1 = 1838, panelY0 = 88, panelY1 = 685;

  // Outer double Mud-Gold frame of the Song Imperial Catalogue Panel (泥金双栏界格)
  brushLine(L_gold, [[panelX0, panelY0], [panelX1, panelY0], [panelX1, panelY1], [panelX0, panelY1], [panelX0, panelY0]], {
    col: PAL.goldMask, w: 2.4, alpha: 0.92, seed: 601, taper: 0.02, wob: 0.25
  });
  brushLine(L_gold, [[panelX0 + 7, panelY0 + 7], [panelX1 - 7, panelY0 + 7], [panelX1 - 7, panelY1 - 7], [panelX0 + 7, panelY1 - 7], [panelX0 + 7, panelY0 + 7]], {
    col: PAL.goldMask, w: 1.3, alpha: 0.78, seed: 602, taper: 0.02, wob: 0.2
  });

  // Vertical Mud-Gold Ruled Columns (泥金乌丝栏竖格)
  const colPositions = [1495, 1575, 1655, 1735];
  colPositions.forEach((cx, i) => {
    brushLine(L_gold, [[cx, panelY0 + 7], [cx, panelY1 - 7]], {
      col: PAL.goldMask, w: 1.2, alpha: 0.62, seed: 610 + i, taper: 0.02, wob: 0.2
    });
  });

  // Column 1 (Rightmost, x=1786): Main Classical Title (主标题竖排)
  drawVerticalText(L_ink, "千里江山·岩彩描金考", 1786, 138, {
    size: 32, weight: 700, col: PAL.sootInk, stepY: 42, alpha: 0.94
  });

  // Column 2 (x=1695): Poetic Line 1
  drawVerticalText(L_ink, "取青金石为巅，捣孔雀石作岚", 1695, 138, {
    size: 23, weight: 600, col: PAL.sootInk, stepY: 34, alpha: 0.88
  });

  // Column 3 (x=1615): Poetic Line 2
  drawVerticalText(L_ink, "古绢经纬纳千年茶色包浆", 1615, 138, {
    size: 23, weight: 600, col: PAL.sootInk, stepY: 34, alpha: 0.88
  });

  // Column 4 (x=1535): Poetic Line 3
  drawVerticalText(L_ink, "泥金一线，迎宫灯微光流转", 1535, 138, {
    size: 23, weight: 600, col: PAL.sootInk, stepY: 34, alpha: 0.88
  });

  // Column 5 (Leftmost, x=1452): Signature & Date + Two Carved Cinnabar Seals (落款与朱白文双印)
  drawVerticalText(L_ink, "宋韵矿物图谱·卷一", 1452, 138, {
    size: 20, weight: 600, col: PAL.ochre, stepY: 30, alpha: 0.88
  });
  drawCinnabarSeal(L_ink, 1452, 468, 48, 48, "宋韵", { type: 'yin', seed: 620 });
  drawCinnabarSeal(L_ink, 1452, 534, 48, 48, "金碧", { type: 'yang', seed: 621 });

  // Top-right oval Imperial Collector Seal (右上引首闲章)
  drawCinnabarSeal(L_ink, 1786, 618, 52, 68, "博物雅集", { type: 'yang', seed: 625 });

  // ——— 7. IN-SCENE MUD-GOLD CALLOUT LINES (画面精微工艺引线批注) ———
  const gInk = L_ink.g;
  const callouts = [
    { p0: [892, 142], p1: [985, 118], label: "【头青·青金石】罩染主峰受光脊", sub: "LAPIS LAZULI · CREST WASH" },
    { p0: [618, 362], p1: [985, 292], label: "【泥金复勾】24K金粉随烛光追光", sub: "24K MUD-GOLD · SPECULAR CONTOUR" },
    { p0: [815, 578], p1: [985, 535], label: "【界画水榭】朱砂廊柱与蛤粉云气", sub: "CINNABAR & SHELL-WHITE MIST" },
  ];
  callouts.forEach((c, idx) => {
    // Mud-gold dot at target + thin mud-gold leader line
    L_gold.g.save();
    L_gold.g.fillStyle = PAL.goldMask;
    L_gold.g.beginPath();
    L_gold.g.arc(c.p0[0], c.p0[1], 4.5, 0, Math.PI * 2);
    L_gold.g.fill();
    L_gold.g.restore();

    brushLine(L_gold, [c.p0, [c.p0[0] + 45, c.p1[1]], c.p1], {
      col: PAL.goldMask, w: 1.6, alpha: 0.90, seed: 640 + idx, taper: 0.08, wob: 0.2
    });

    gInk.save();
    gInk.font = '700 20px "Noto Serif SC", serif';
    gInk.fillStyle = PAL.sootInk;
    gInk.globalAlpha = 0.90;
    gInk.textAlign = 'left';
    gInk.fillText(c.label, c.p1[0] + 10, c.p1[1] - 4);
    gInk.font = '600 13px "Noto Serif SC", serif';
    gInk.fillStyle = PAL.ochre;
    gInk.fillText(c.sub, c.p1[0] + 14, c.p1[1] + 16);
    gInk.restore();
  });

  // ——— 8. MINERAL PIGMENT SWATCH PALETTE & CINEMATIC SUBTITLE BAR (底部矿物色标与电影级叙事字幕) ———
  // Four Diamond Mineral Swatches on the right below the inscription panel (x=1410..1838, y=735..835)
  const swatches = [
    { x: 1455, col: PAL.azuriteDeep, name: "石青", sub: "Azurite" },
    { x: 1562, col: PAL.malachiteMid, name: "石绿", sub: "Malachite" },
    { x: 1669, col: PAL.cinnabar, name: "朱砂", sub: "Cinnabar" },
    { x: 1776, col: PAL.shellWhite, name: "蛤粉", sub: "Shell White" },
  ];
  swatches.forEach((sw, i) => {
    const cy = 768, r = 22;
    const dia = [[sw.x, cy - r], [sw.x + r, cy], [sw.x, cy + r], [sw.x - r, cy]];
    L_mineralFg.g.save();
    L_mineralFg.g.fillStyle = sw.col;
    L_mineralFg.g.globalAlpha = 0.95;
    L_mineralFg.g.beginPath();
    dia.forEach(([x, y], k) => (k === 0 ? L_mineralFg.g.moveTo(x, y) : L_mineralFg.g.lineTo(x, y)));
    L_mineralFg.g.closePath();
    L_mineralFg.g.fill();
    L_mineralFg.g.restore();

    brushLine(L_gold, [...dia, dia[0]], { col: PAL.goldMask, w: 2.0, alpha: 0.94, seed: 660 + i, taper: 0.05, wob: 0.2 });

    gInk.save();
    gInk.textAlign = 'center';
    gInk.font = '700 18px "Noto Serif SC", serif';
    gInk.fillStyle = PAL.sootInk;
    gInk.fillText(sw.name, sw.x, cy + 44);
    gInk.font = '600 12px "Noto Serif SC", serif';
    gInk.fillStyle = PAL.ochre;
    gInk.fillText(sw.sub, sw.x, cy + 62);
    gInk.restore();
  });

  // Bottom Cinematic Subtitle Banner (x=480..1838, y=948..1015)
  brushLine(L_gold, [[520, 946], [1838, 946]], { col: PAL.goldMask, w: 1.5, alpha: 0.78, seed: 680, taper: 0.05, wob: 0.2 });
  gInk.save();
  gInk.textAlign = 'right';
  gInk.font = '700 29px "Noto Serif SC", serif';
  gInk.fillStyle = PAL.sootInk;
  gInk.globalAlpha = 0.94;
  gInk.fillText("“草木会随岁月枯荣，唯有碾碎的矿石与一缕真金，能在古绢上定格千年。”", 1838, 988);
  gInk.font = '600 15px "Noto Serif SC", serif';
  gInk.fillStyle = PAL.ochre;
  gInk.fillText("SONG DYNASTY MINERAL ROCK PIGMENT & 24K MUD-GOLD ON WOVEN SILK · 宋韵古绢岩彩描金", 1838, 1016);
  gInk.restore();

  // ——— 9. COMPOSITE THROUGH WEBGL2 SILK & MINERAL & SPECULAR GOLD SHADERS ———
  // Roving warm palace-lantern light position (centred over the golden peaks & pavilion)
  const lightUV = [0.43 + 0.08 * Math.sin(t * 0.9), 0.56];

  comp.beginSilk([0.784, 0.706, 0.565]);
  comp.mineralPass(L_mineralBg.c, 1.05);
  comp.mineralPass(L_mineralMid.c, 1.15);
  comp.mineralPass(L_mineralFg.c, 1.20);
  comp.inkPass(L_ink.c);
  comp.goldPass(L_gold.c, lightUV);
  comp.finish(lightUV);
}
