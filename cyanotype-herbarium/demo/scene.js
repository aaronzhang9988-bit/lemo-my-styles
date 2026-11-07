// 19th-Century Botanical Cyanotype Herbarium ("19 世纪普鲁士蓝晒标本志")
// Dual-Aspect Scene Renderer:
//   - Horizontal (1920×1080, 16:9): Royal Society / Anna Atkins Herbarium Folio Spread
//   - Vertical (1080×1440, 3:4): Collectors' Vertical Botanical & Phyllotaxis Plate
// Layers:
//   - L_photogram: UV-blocking translucent botanical specimens & white photogram labels
//     (alpha 0.25..0.58 -> glowing ice-cyan #3877AA..#AAD2EA lamina;
//      alpha 0.85..1.00 -> crisp unexposed #F4EFE2 cotton paper veins, stems, seeds)
//   - L_copper: Metallic Copper-Gall Dip-Pen (#D88A52) geometric compass circles,
//     137.5° Fibonacci golden spiral, callout leaders, cream linen mounting strips, and museum typography.

import { clamp, lerp, hash, vnoise } from '/core/lib.js';
import { W, H } from './gl.js';

export const PAL = {
  paperRGB: [0.957, 0.937, 0.886], // #F4EFE2 300gsm Cold-Press Cotton Rag
  paperHex: '#F4EFE2',
  iceCyan: '#A8D0E8',
  copper: '#D88A52',
  copperBright: '#F2C18D',
  copperDeep: '#A65D2E',
  prussianInk: '#0B2340',
  tapeCream: '#EFE9D8',
};

const F_SERIF = '"Playfair Display", "Noto Serif SC", Georgia, serif';
const F_CN = '"Noto Serif SC", "Source Han Serif SC", serif';

function easeOut(x) {
  const t = clamp(x, 0, 1);
  return 1 - Math.pow(1 - t, 3);
}

function makeLayer(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext('2d') };
}

export function createLayers(w = W, h = H) {
  return {
    L_photogram: makeLayer(w, h),
    L_copper: makeLayer(w, h),
  };
}

export function clearLayers(layers, w = W, h = H) {
  for (const k of Object.keys(layers)) {
    layers[k].ctx.clearRect(0, 0, w, h);
  }
}

// ============================================================================
// 1. TRANSLUCENT X-RAY BOTANICAL SPECIMEN GENERATORS (Drawn onto L_photogram)
// ============================================================================

// Draw an organic stem with fibrous vascular bundles (high UV block -> crisp cream-white core with cyan sheath)
function drawBotanicalStem(ctx, pts, baseWidth, tipWidth, seed = 1) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer translucent epidermis sheath (alpha ~0.42 -> ice cyan halo)
  for (let i = 0; i < pts.length - 1; i++) {
    const u = i / (pts.length - 1);
    const w = lerp(baseWidth, tipWidth, u);
    ctx.strokeStyle = 'rgba(255,255,255,0.40)';
    ctx.lineWidth = w * 1.55;
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    ctx.stroke();
  }

  // Inner dense vascular core (alpha ~0.94 -> unexposed cream cotton paper)
  for (let i = 0; i < pts.length - 1; i++) {
    const u = i / (pts.length - 1);
    const w = lerp(baseWidth, tipWidth, u);
    ctx.strokeStyle = 'rgba(255,255,255,0.94)';
    ctx.lineWidth = w * 0.88;
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    ctx.stroke();
  }
  ctx.restore();
}

// Draw a Ginkgo biloba fan leaf with translucent bilobed lamina + dichotomous parallel veins
function drawGinkgoLeaf(ctx, x, y, angle, radius, lobeSplit = 0.28, seed = 11) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const fanSpan = 0.68; // half-angle in radians (~39 deg each side)
  const steps = 48;

  // Build fan perimeter with central notch (biloba cleft) and subtle organic crenulations
  const outline = [[0, 0]];
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * 2 - 1; // -1 .. +1
    const a = u * fanSpan;
    // Central notch dip at u ~ 0
    const cleft = Math.exp(-Math.pow(u / 0.16, 2)) * lobeSplit;
    const ripple = (vnoise(u * 9 + seed, seed * 0.37) - 0.5) * 0.055;
    const r = radius * (0.96 - cleft + ripple) * (0.85 + 0.15 * Math.cos(u * 0.9));
    outline.push([Math.sin(a) * r, -Math.cos(a) * r]);
  }

  // 1) Translucent mesophyll lamina (multiple overlapping washes for X-ray graded density)
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 1; i < outline.length; i++) ctx.lineTo(outline[i][0], outline[i][1]);
  ctx.closePath();

  const grad = ctx.createRadialGradient(0, -radius * 0.15, radius * 0.05, 0, -radius * 0.45, radius * 0.98);
  grad.addColorStop(0.0, 'rgba(255,255,255,0.68)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.40)');
  grad.addColorStop(0.85, 'rgba(255,255,255,0.28)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0.46)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Crisp outer margin cuticle ring
  ctx.strokeStyle = 'rgba(255,255,255,0.78)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // 2) Dichotomous radiating veins (银杏二分叉平行叶脉 — opaque UV block -> paper white)
  const veinCount = 34;
  ctx.lineCap = 'round';
  for (let v = 0; v < veinCount; v++) {
    const u = (v / (veinCount - 1)) * 1.92 - 0.96;
    if (Math.abs(u) < 0.04) continue; // skip center cleft
    const a = u * fanSpan;
    const cleft = Math.exp(-Math.pow(u / 0.16, 2)) * lobeSplit;
    const maxR = radius * (0.94 - cleft) * (0.85 + 0.15 * Math.cos(u * 0.9));

    // Primary vein from petiole to 45% radius
    const rFork = maxR * (0.36 + 0.18 * hash(v * 13 + seed));
    const x1 = Math.sin(a) * rFork;
    const y1 = -Math.cos(a) * rFork;

    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(x1 * 0.5, y1 * 0.55, x1, y1);
    ctx.stroke();

    // Dichotomous fork into 2 fine secondary veins reaching the margin
    for (const sgn of [-1, 1]) {
      const a2 = a + sgn * 0.018;
      const x2 = Math.sin(a2) * maxR * 0.97;
      const y2 = -Math.cos(a2) * maxR * 0.97;
      ctx.strokeStyle = 'rgba(255,255,255,0.76)';
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  // Petiole attachment collar
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Draw a delicate pressed Fern Pinna (羽状复叶小羽片) with translucent blade and opaque midrib + sori
function drawFernPinna(ctx, x, y, angle, length, width, seed = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Translucent leaflet lamina
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(length * 0.28, -width * 0.95, length * 0.76, -width * 0.65, length, 0);
  ctx.bezierCurveTo(length * 0.76, width * 0.65, length * 0.28, width * 0.95, 0, 0);
  ctx.closePath();

  const g = ctx.createLinearGradient(0, 0, length, 0);
  g.addColorStop(0.0, 'rgba(255,255,255,0.52)');
  g.addColorStop(0.65, 'rgba(255,255,255,0.34)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.48)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.68)';
  ctx.lineWidth = 1.0;
  ctx.stroke();

  // Central costule (midrib)
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 1.35;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length * 0.94, 0);
  ctx.stroke();

  // Lateral veinlets & spore sori dots (孢子囊群)
  const pairs = 6;
  for (let i = 1; i <= pairs; i++) {
    const u = i / (pairs + 0.6);
    const vx = length * u;
    const vw = width * Math.sin(u * Math.PI) * 0.62;
    for (const dir of [-1, 1]) {
      ctx.strokeStyle = 'rgba(255,255,255,0.74)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(vx, 0);
      ctx.quadraticCurveTo(vx + length * 0.05, dir * vw * 0.5, vx + length * 0.09, dir * vw * 0.88);
      ctx.stroke();

      // Tiny opaque spore sorus dot near margin
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(vx + length * 0.07, dir * vw * 0.68, 1.45, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// Draw a complete arching Fern Frond (铁线蕨/鳞毛蕨羽状标本) + Fiddlehead Spiral (幼叶拳卷螺旋)
function drawFernFrond(ctx, baseX, baseY, tipX, tipY, curveCtrlX, curveCtrlY, pairs = 15, maxPinnaLen = 58) {
  const spine = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const mt = 1 - t;
    const x = mt * mt * baseX + 2 * mt * t * curveCtrlX + t * t * tipX;
    const y = mt * mt * baseY + 2 * mt * t * curveCtrlY + t * t * tipY;
    spine.push([x, y]);
  }
  drawBotanicalStem(ctx, spine, 4.2, 1.3, 31);

  for (let i = 2; i < pairs + 2; i++) {
    const u = i / (pairs + 2.5);
    const idx = Math.min(N - 1, Math.floor(u * N));
    const [px, py] = spine[idx];
    const [nx, ny] = spine[idx + 1];
    const tang = Math.atan2(ny - py, nx - px);
    const env = Math.sin(Math.pow(u, 0.75) * Math.PI);
    const pLen = maxPinnaLen * (0.28 + 0.72 * env);
    const pWid = pLen * 0.28;

    drawFernPinna(ctx, px, py, tang - 1.08, pLen, pWid, i * 7);
    drawFernPinna(ctx, px, py, tang + 1.08, pLen * 0.95, pWid * 0.95, i * 7 + 3);
  }
}

// Draw a coiled Fiddlehead Young Frond (斐波那契拳卷幼芽)
function drawFiddleheadSpiral(ctx, x0, y0, coilCx, coilCy, coilR, turns = 2.6, dir = 1) {
  const pts = [];
  // Stem leading into the coil
  const stemSteps = 16;
  for (let i = 0; i < stemSteps; i++) {
    const u = i / stemSteps;
    pts.push([
      lerp(x0, coilCx + dir * coilR, u),
      lerp(y0, coilCy, easeOut(u)),
    ]);
  }
  // Logarithmic golden coil
  const coilSteps = 55;
  for (let i = 0; i <= coilSteps; i++) {
    const u = i / coilSteps;
    const a = u * turns * Math.PI * 2 * dir;
    const r = coilR * Math.pow(1 - u * 0.86, 1.35);
    pts.push([coilCx + Math.cos(a) * r * dir, coilCy - Math.sin(a) * r]);
  }
  drawBotanicalStem(ctx, pts, 3.6, 1.2, 77);

  // Tiny translucent pinnae hairs along outer coil
  ctx.save();
  for (let i = 12; i < pts.length - 6; i += 3) {
    const [px, py] = pts[i];
    const [nx, ny] = pts[i + 1];
    const tang = Math.atan2(ny - py, nx - px);
    const u = (i - 12) / (pts.length - 18);
    const len = lerp(15, 5, u);
    ctx.strokeStyle = 'rgba(255,255,255,0.62)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(tang - dir * 0.9) * len, py + Math.sin(tang - dir * 0.9) * len);
    ctx.stroke();
  }
  ctx.restore();
}

// Draw a Pressed Fibrous Root System (连根植物须根标本) at stem base
function drawFibrousRoots(ctx, rx, ry, baseAngle, spread = 52) {
  ctx.save();
  ctx.translate(rx, ry);
  ctx.rotate(baseAngle);
  ctx.lineCap = 'round';

  const rootCount = 14;
  for (let r = 0; r < rootCount; r++) {
    const u = (r / (rootCount - 1)) * 2 - 1;
    const len = (28 + 34 * hash(r * 19 + 5)) * (1 - 0.35 * u * u);
    const ang = u * 0.85 + (hash(r * 31) - 0.5) * 0.2;
    const mx = Math.sin(ang) * len * 0.55;
    const my = Math.cos(ang) * len * 0.55;
    const ex = Math.sin(ang * 1.15) * len;
    const ey = Math.cos(ang * 1.15) * len;

    // Translucent root hair halo
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();

    // Opaque root core
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

// Draw the Hero Ginkgo + Fern Herbarium Bouquet (左侧主植物标本簇)
function drawHeroHerbariumSpecimen(ctx, baseX, baseY, scale = 1.0) {
  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(scale, scale);

  // 1) Pressed Fibrous Root Crown at bottom-left
  drawFibrousRoots(ctx, 0, 0, 0.22, 58);

  // 2) Arching Fern Frond on the left-lower side
  drawFernFrond(ctx, -4, -18, -165, -420, -110, -210, 14, 52);

  // 3) Young Fibonacci Fiddlehead Spiral emerging on the right
  drawFiddleheadSpiral(ctx, 4, -24, 96, -245, 36, 2.4, 1);

  // 4) Main woody Ginkgo branch ascending through the plate
  const mainBranch = [
    [0, 0],
    [-8, -85],
    [-12, -185],
    [-4, -295],
    [14, -405],
    [38, -515],
    [68, -610],
  ];
  drawBotanicalStem(ctx, mainBranch, 7.2, 2.6, 101);

  // Secondary lateral spurs with petioles and Ginkgo fan leaves
  const leaves = [
    // [attachX, attachY, petioleEndX, petioleEndY, leafAngle, radius, cleft, seed]
    [-10, -155, 68, -198, 0.72, 92, 0.26, 11],
    [-8, -245, -92, -310, -0.58, 104, 0.30, 23],
    [4, -340, 96, -395, 0.56, 112, 0.28, 37],
    [22, -445, -62, -525, -0.44, 106, 0.25, 53],
    [48, -540, 128, -595, 0.48, 96, 0.27, 71],
    [68, -610, 74, -672, 0.08, 108, 0.32, 89],
  ];

  for (const [ax, ay, px, py, ang, rad, cleft, sd] of leaves) {
    // Petiole (leaf stalk)
    drawBotanicalStem(
      ctx,
      [
        [ax, ay],
        [lerp(ax, px, 0.5), lerp(ay, py, 0.5) + 8],
        [px, py],
      ],
      3.0,
      1.8,
      sd
    );
    drawGinkgoLeaf(ctx, px, py, ang, rad, cleft, sd);
  }

  ctx.restore();
}

// ============================================================================
// 2. FIBONACCI PHYLLOTAXIS ROSETTE & SEED-POD CROSS-SECTION (Drawn onto L_photogram)
// ============================================================================

// Draw the X-ray Fibonacci Phyllotaxis Seed Head (137.5° 黄金发散角螺旋果实圆盘)
function drawPhyllotaxisPhotogram(ctx, cx, cy, maxR, seedCount = 144) {
  ctx.save();
  ctx.translate(cx, cy);

  // 1) Translucent involucral bracts (外圈半透明苞片花萼, 13 petals)
  const bractCount = 21; // Fibonacci number!
  for (let i = 0; i < bractCount; i++) {
    const a = (i / bractCount) * Math.PI * 2 + 0.12;
    const bLen = maxR * (1.28 + 0.08 * Math.sin(i * 2.39996));
    const bWid = maxR * 0.21;
    ctx.save();
    ctx.rotate(a);

    ctx.beginPath();
    ctx.moveTo(maxR * 0.72, 0);
    ctx.bezierCurveTo(maxR * 0.92, -bWid, maxR * 1.15, -bWid * 0.65, bLen, 0);
    ctx.bezierCurveTo(maxR * 1.15, bWid * 0.65, maxR * 0.92, bWid, maxR * 0.72, 0);
    ctx.closePath();

    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.74)';
    ctx.lineWidth = 1.15;
    ctx.stroke();

    // Central bract vein
    ctx.strokeStyle = 'rgba(255,255,255,0.86)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(maxR * 0.74, 0);
    ctx.lineTo(bLen * 0.95, 0);
    ctx.stroke();

    ctx.restore();
  }

  // 2) Receptacle disc translucent cushion
  const discGrad = ctx.createRadialGradient(0, 0, maxR * 0.08, 0, 0, maxR * 0.98);
  discGrad.addColorStop(0.0, 'rgba(255,255,255,0.48)');
  discGrad.addColorStop(0.75, 'rgba(255,255,255,0.32)');
  discGrad.addColorStop(1.0, 'rgba(255,255,255,0.52)');
  ctx.fillStyle = discGrad;
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.94, 0, Math.PI * 2);
  ctx.fill();

  // 3) Parastichy spiral vascular filaments (55 clockwise & 89 counter-clockwise subtle X-ray arcs)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 2.3999632297 rad = 137.50776°
  const pts = [];
  for (let n = 0; n < seedCount; n++) {
    const r = maxR * 0.88 * Math.sqrt((n + 0.6) / seedCount);
    const theta = n * goldenAngle;
    pts.push([Math.cos(theta) * r, Math.sin(theta) * r, r / maxR, theta]);
  }

  // Connect n -> n+13 and n -> n+21 parastichy families with fine translucent X-ray threads
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.lineWidth = 0.9;
  for (const step of [13, 21]) {
    for (let n = 0; n < seedCount - step; n++) {
      ctx.beginPath();
      ctx.moveTo(pts[n][0], pts[n][1]);
      ctx.lineTo(pts[n + step][0], pts[n + step][1]);
      ctx.stroke();
    }
  }

  // 4) Individual botanical achenes / florets (high UV block -> crisp paper-white seed core with cyan pericarp)
  for (let n = 0; n < seedCount; n++) {
    const [sx, sy, u, theta] = pts[n];
    const seedLen = lerp(3.2, 8.2, u);
    const seedWid = seedLen * 0.56;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(theta);

    // Outer translucent seed coat
    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.beginPath();
    ctx.ellipse(0, 0, seedLen * 1.15, seedWid * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner opaque embryo kernel
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.ellipse(0, 0, seedLen * 0.72, seedWid * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  ctx.restore();
}

// Draw a Poppy / Lotus Capsule Cross-Section (蒴果放射心皮横切标本, 13 carpels)
function drawCapsuleCrossSection(ctx, cx, cy, radius, carpels = 13) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer pericarp wall
  const g = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius);
  g.addColorStop(0.0, 'rgba(255,255,255,0.58)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.28)');
  g.addColorStop(0.88, 'rgba(255,255,255,0.44)');
  g.addColorStop(1.0, 'rgba(255,255,255,0.88)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 2.0;
  ctx.stroke();

  // Radiating septa (13 Fibonacci carpel partitions)
  for (let i = 0; i < carpels; i++) {
    const a = (i / carpels) * Math.PI * 2;
    const aMid = ((i + 0.5) / carpels) * Math.PI * 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.90)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 0.18, Math.sin(a) * radius * 0.18);
    ctx.lineTo(Math.cos(a) * radius * 0.96, Math.sin(a) * radius * 0.96);
    ctx.stroke();

    // Ovule seeds inside each locule chamber
    for (const rFrac of [0.44, 0.64, 0.80]) {
      for (const dA of [-0.07, 0.07]) {
        const sx = Math.cos(aMid + dA) * radius * rFrac;
        const sy = Math.sin(aMid + dA) * radius * rFrac;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Central columella ring
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// ============================================================================
// 3. COPPER-GALL DIP-PEN ASTROLABE, LINEN TAPES & VICTORIANS LABELS (L_copper)
// ============================================================================

// Draw a Cream Herbarium Linen Mounting Strip (植物标本手工亚麻固定胶条)
function drawHerbariumTape(ctx, cx, cy, angle, w = 52, h = 15) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Subtle contact shadow on the Prussian blue paper
  ctx.fillStyle = 'rgba(6, 20, 38, 0.42)';
  ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w, h);

  // Cream linen paper strip (#F4EFE2)
  ctx.fillStyle = PAL.tapeCream;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // Fine copper-gall border & cross-stitch ticks at ends
  ctx.strokeStyle = PAL.copper;
  ctx.lineWidth = 1.1;
  ctx.strokeRect(-w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3);

  for (const sx of [-w / 2 + 6, w / 2 - 6]) {
    ctx.beginPath();
    ctx.moveTo(sx, -h / 2 + 3);
    ctx.lineTo(sx, h / 2 - 3);
    ctx.stroke();
  }
  ctx.restore();
}

// Draw the Metallic Copper-Gall Dip-Pen Astrolabe & Golden Angle Compass (铜金蘸水笔几何星盘)
function drawCopperAstrolabe(ctx, cx, cy, maxR) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = PAL.copper;
  ctx.fillStyle = PAL.copper;

  const rInner = maxR * 1.02;
  const rMid = maxR * 1.34;
  const rOuter = maxR * 1.46;

  // Outer graduated degree rings
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, rOuter, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, 0, rMid, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(0, 0, rInner, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 360° degree ticks around the astrolabe ring
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg - 90) * (Math.PI / 180);
    const isMajor = deg % 30 === 0;
    const isMid = deg % 15 === 0;
    const r0 = isMajor ? rMid - 6 : isMid ? rMid : rMid + 4;
    const r1 = rOuter;

    ctx.lineWidth = isMajor ? 1.5 : 0.85;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * r0, Math.sin(rad) * r0);
    ctx.lineTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
    ctx.stroke();

    if (deg % 45 === 0) {
      const tx = Math.cos(rad) * (rOuter + 14);
      const ty = Math.sin(rad) * (rOuter + 14);
      ctx.font = `600 11px ${F_SERIF}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${deg}°`, tx, ty);
    }
  }

  // Highlight the 137.5° Golden Divergence Angle Sector (黄金发散角扇区)
  const a0 = -Math.PI / 2; // 0° top
  const aGold = a0 + 137.50776 * (Math.PI / 180);

  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(a0) * (rOuter + 8), Math.sin(a0) * (rOuter + 8));
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(aGold) * (rOuter + 8), Math.sin(aGold) * (rOuter + 8));
  ctx.stroke();

  // Golden angle measurement arc with arrowheads
  const rArc = maxR * 1.18;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, rArc, a0, aGold);
  ctx.stroke();

  // Highlighted Golden Spiral curve over the phyllotaxis disc
  ctx.lineWidth = 1.75;
  ctx.beginPath();
  for (let i = 0; i <= 90; i++) {
    const u = i / 90;
    const a = a0 + u * Math.PI * 3.8;
    const r = maxR * 0.92 * Math.pow(u, 0.68);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Golden Angle pill badge on the right of the arc
  const aMid = (a0 + aGold) * 0.5;
  const bx = Math.cos(aMid) * (rOuter + 44);
  const by = Math.sin(aMid) * (rOuter + 44);
  ctx.fillStyle = PAL.paperHex;
  ctx.font = `700 14px ${F_SERIF}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('φ = 137.508°', bx - 12, by - 9);
  ctx.fillStyle = PAL.copper;
  ctx.font = `600 12px ${F_CN}`;
  ctx.fillText('黄金发散角 · 89 / 55 螺旋', bx - 12, by + 10);

  ctx.restore();
}

// Draw Victorian Double-Ruled Herbarium Border Frame (铜金双线博物馆标本框)
function drawMuseumBorder(ctx, w, h, inset = 74) {
  ctx.save();
  ctx.strokeStyle = PAL.copper;

  // Outer copper rule
  ctx.lineWidth = 1.6;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  // Inner fine rule
  const in2 = inset + 7;
  ctx.lineWidth = 0.85;
  ctx.strokeRect(in2, in2, w - in2 * 2, h - in2 * 2);

  // Corner botanical registration rosettes
  const corners = [
    [inset, inset],
    [w - inset, inset],
    [inset, h - inset],
    [w - inset, h - inset],
  ];
  for (const [cx, cy] of corners) {
    ctx.fillStyle = PAL.copper;
    ctx.beginPath();
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PAL.paperHex;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = PAL.copper;
  }
  ctx.restore();
}

// Draw a Copper-Gall Scientific Callout Leader with Specimen Annotation
function drawCallout(ctx, sx, sy, ex, ey, align, figTag, cnTitle, subNote) {
  ctx.save();
  ctx.strokeStyle = PAL.copper;
  ctx.fillStyle = PAL.copper;
  ctx.lineWidth = 1.25;

  // Target ring on specimen
  ctx.beginPath();
  ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PAL.paperHex;
  ctx.beginPath();
  ctx.arc(sx, sy, 2.0, 0, Math.PI * 2);
  ctx.fill();

  // Elbow leader line
  const dir = align === 'left' ? 1 : -1;
  const shelfLen = 185;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(ex, ey);
  ctx.lineTo(ex + dir * shelfLen, ey);
  ctx.stroke();

  const tx = ex + dir * 8;
  ctx.textAlign = align;
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = PAL.copper;
  ctx.font = `700 13px ${F_SERIF}`;
  ctx.fillText(figTag, tx, ey - 25);

  ctx.fillStyle = PAL.paperHex;
  ctx.font = `700 16px ${F_CN}`;
  ctx.fillText(cnTitle, tx, ey - 5);

  ctx.fillStyle = PAL.iceCyan;
  ctx.font = `600 12px ${F_CN}`;
  ctx.textBaseline = 'top';
  ctx.fillText(subNote, tx, ey + 6);

  ctx.restore();
}

// Draw the Cream Cotton Herbarium Collector's Cartouche Stamp (右下角博物馆标本室白底铜线签条)
function drawCollectorCartouche(ctx, x, y, w, h) {
  ctx.save();
  // Drop shadow on cyanotype
  ctx.fillStyle = 'rgba(5, 16, 32, 0.45)';
  ctx.fillRect(x + 4, y + 4, w, h);

  // Unexposed cotton paper label (#F4EFE2)
  ctx.fillStyle = PAL.paperHex;
  ctx.fillRect(x, y, w, h);

  // Double copper-gall border
  ctx.strokeStyle = PAL.copperDeep;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x + 9, y + 9, w - 18, h - 18);

  // Horizontal divider rules
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 36);
  ctx.lineTo(x + w - 18, y + 36);
  ctx.moveTo(x + 18, y + h - 32);
  ctx.lineTo(x + w - 18, y + h - 32);
  ctx.stroke();

  // Header
  ctx.fillStyle = PAL.copperDeep;
  ctx.font = `700 11px ${F_SERIF}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MUSÉUM D’HISTOIRE NATURELLE · KEW HERBARIUM', x + 20, y + 22);
  ctx.textAlign = 'right';
  ctx.fillText('PLATE № XLII', x + w - 20, y + 22);

  // Main specimen classification
  ctx.textAlign = 'left';
  ctx.fillStyle = PAL.prussianInk;
  ctx.font = `700 17px ${F_CN}`;
  ctx.fillText('标本名：银杏二分脉与向日葵黄金叶序', x + 20, y + 56);

  ctx.font = `600 13px ${F_SERIF}`;
  ctx.fillStyle = '#254B73';
  ctx.fillText('Taxon: Ginkgo biloba L. & Helianthus annuus (Phyllotaxis)', x + 20, y + 80);

  // Formula table row
  ctx.font = `600 12px ${F_CN}`;
  ctx.fillStyle = PAL.prussianInk;
  ctx.fillText('显影配方：柠檬酸铁铵 20% + 铁氰化钾 8% · 紫外日光接触印相', x + 20, y + 104);

  // Footer
  ctx.fillStyle = PAL.copperDeep;
  ctx.font = `700 11px ${F_SERIF}`;
  ctx.fillText('COLLECTED: ANNO 1853 · ANNA ATKINS ARCHIVE', x + 20, y + h - 18);
  ctx.textAlign = 'right';
  ctx.fillText('SCALE 1 : 1', x + w - 20, y + h - 18);

  ctx.restore();
}

// ============================================================================
// 4. MASTER DUAL-ASPECT SCENE COMPOSITIONS (1920×1080 & 1080×1440)
// ============================================================================

export function renderHorizontalScene(layers, t = 6.0) {
  const { L_photogram, L_copper } = layers;
  const pCtx = L_photogram.ctx;
  const cCtx = L_copper.ctx;

  // --- LAYER 1: UV PHOTOGRAM SPECIMENS (L_photogram) ---
  // Left Hero Specimen: Ginkgo biloba + Fern Frond + Fiddlehead Spiral
  drawHeroHerbariumSpecimen(pCtx, 425, 935, 0.96);

  // Right Upper Specimen: Helianthus Fibonacci Phyllotaxis Rosette (144 florets)
  drawPhyllotaxisPhotogram(pCtx, 1375, 450, 148, 144);

  // Center-Bottom Specimen: Papaver 13-Carpel Capsule Cross-Section
  drawCapsuleCrossSection(pCtx, 955, 815, 76, 13);

  // --- LAYER 2: COPPER-GALL DIP-PEN & LINEN TAPES (L_copper) ---
  drawMuseumBorder(cCtx, 1920, 1080, 72);

  // Cream Linen Herbarium Mounting Tapes holding the stems
  drawHerbariumTape(cCtx, 418, 845, -0.06, 52, 14);
  drawHerbariumTape(cCtx, 422, 625, 0.14, 50, 14);
  drawHerbariumTape(cCtx, 315, 705, -0.68, 46, 13);
  drawHerbariumTape(cCtx, 505, 708, 0.55, 44, 13);

  // Copper-Gall Astrolabe & 137.5° Golden Angle Protractor around Phyllotaxis Rosette
  drawCopperAstrolabe(cCtx, 1375, 450, 148);

  // Top Header Banner (inside museum border)
  cCtx.save();
  cCtx.textBaseline = 'middle';
  cCtx.fillStyle = PAL.copper;
  cCtx.font = `700 13px ${F_SERIF}`;
  cCtx.textAlign = 'left';
  cCtx.fillText('HERBARIUM BRITANNICUM · CYANOTYPE PHOTOGENIC DRAWING (1843–1853)', 104, 106);

  cCtx.textAlign = 'right';
  cCtx.fillText('FE³⁺ + [FE(CN)₆]³⁻ + HV → PRUSSIAN BLUE FE₄[FE(CN)₆]₃', 1816, 106);

  // Subtle top header rule
  cCtx.strokeStyle = PAL.copper;
  cCtx.lineWidth = 0.9;
  cCtx.beginPath();
  cCtx.moveTo(104, 124);
  cCtx.lineTo(1816, 124);
  cCtx.stroke();

  // Center-Top Editorial Title Block
  cCtx.textAlign = 'left';
  cCtx.fillStyle = PAL.paperHex;
  cCtx.font = `700 38px ${F_CN}`;
  cCtx.fillText('自然界的几何密码：为什么植物懂斐波那契数列？', 650, 174);

  cCtx.fillStyle = PAL.copper;
  cCtx.font = `700 15px ${F_SERIF}`;
  cCtx.fillText('NATURA GEOMETRICA · PHYLLOTAXIS, DICHOTOMOUS VENATION & THE 137.5° GOLDEN ANGLE', 652, 212);

  //Fibonacci Sequence Strip (1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144)
  const fibNums = ['1', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '144'];
  let fx = 652;
  const fy = 248;
  for (let i = 0; i < fibNums.length; i++) {
    const isHighlight = i >= 6;
    cCtx.strokeStyle = PAL.copper;
    cCtx.lineWidth = isHighlight ? 1.4 : 0.9;
    cCtx.strokeRect(fx, fy - 14, 38, 26);
    if (isHighlight) {
      cCtx.fillStyle = 'rgba(216, 138, 82, 0.18)';
      cCtx.fillRect(fx, fy - 14, 38, 26);
    }
    cCtx.fillStyle = isHighlight ? PAL.paperHex : PAL.copper;
    cCtx.font = `700 13px ${F_SERIF}`;
    cCtx.textAlign = 'center';
    cCtx.fillText(fibNums[i], fx + 19, fy);
    fx += 44;
  }
  cCtx.restore();

  // Scientific Callout Leaders
  drawCallout(
    cCtx,
    512,
    275,
    655,
    330,
    'left',
    'FIG. I · GINKGO BILOBA L.',
    '银杏扇叶 · 二分叉平行叶脉',
    '紫外透射呈冰青色，叶脉阻光留白 (2ⁿ 分支)'
  );

  drawCallout(
    cCtx,
    522,
    690,
    655,
    615,
    'left',
    'FIG. II · CIRCINATE VERNATION',
    '铁线蕨幼芽 · 等角螺线拳卷',
    '生长端遵循对数螺旋 r = a·e^(bθ) 舒展'
  );

  drawCallout(
    cCtx,
    305,
    665,
    104,
    775,
    'left',
    'FIG. III · ADIANTUM PINNAE',
    '羽状复叶与边缘孢子囊群',
    '半透明叶肉紫外感光 · 接触暗环晕染'
  );

  drawCallout(
    cCtx,
    1022,
    785,
    1070,
    720,
    'left',
    'FIG. IV · PAPAVER CAPSULE (13 CARPELS)',
    '罂粟蒴果横切 · 13 室放射心皮',
    '心皮隔膜与胚珠皆契合斐波那契数 F₇ = 13'
  );

  // Bottom-Right Collector's Herbarium Cartouche Stamp
  drawCollectorCartouche(cCtx, 1315, 785, 495, 154);

  // Bottom-Left Scale Bar
  cCtx.save();
  const sbX = 108, sbY = 955;
  cCtx.strokeStyle = PAL.copper;
  cCtx.fillStyle = PAL.copper;
  cCtx.lineWidth = 1.4;
  cCtx.beginPath();
  cCtx.moveTo(sbX, sbY);
  cCtx.lineTo(sbX + 160, sbY);
  for (let i = 0; i <= 4; i++) {
    const x = sbX + i * 40;
    cCtx.moveTo(x, sbY - 5);
    cCtx.lineTo(x, sbY + 5);
  }
  cCtx.stroke();
  cCtx.font = `700 11px ${F_SERIF}`;
  cCtx.textAlign = 'left';
  cCtx.fillText('0        1        2        3        4 CM  ·  NATURAL SCALE', sbX, sbY - 12);
  cCtx.restore();
}

export function renderVerticalScene(layers, t = 6.0) {
  const { L_photogram, L_copper } = layers;
  const pCtx = L_photogram.ctx;
  const cCtx = L_copper.ctx;

  // --- LAYER 1: UV PHOTOGRAM SPECIMENS (1080×1440 Vertical Plate) ---
  // Top Center-Right: Fibonacci Phyllotaxis Rosette
  drawPhyllotaxisPhotogram(pCtx, 650, 455, 132, 144);

  // Bottom-Left Hero Specimen: Ginkgo biloba + Fern Frond ascending
  drawHeroHerbariumSpecimen(pCtx, 315, 1215, 0.94);

  // Right-Middle Specimen: 13-Carpel Capsule Cross-Section
  drawCapsuleCrossSection(pCtx, 790, 915, 68, 13);

  // --- LAYER 2: COPPER-GALL DIP-PEN & LINEN TAPES (L_copper) ---
  drawMuseumBorder(cCtx, 1080, 1440, 62);

  // Cream Linen Herbarium Tapes
  drawHerbariumTape(cCtx, 308, 1125, -0.05, 50, 14);
  drawHerbariumTape(cCtx, 312, 905, 0.12, 48, 14);
  drawHerbariumTape(cCtx, 205, 985, -0.65, 44, 13);

  // Copper Astrolabe around Top Phyllotaxis Rosette
  drawCopperAstrolabe(cCtx, 650, 455, 132);

  // Top Header & Vertical Plate Title
  cCtx.save();
  cCtx.textBaseline = 'middle';
  cCtx.fillStyle = PAL.copper;
  cCtx.font = `700 12px ${F_SERIF}`;
  cCtx.textAlign = 'left';
  cCtx.fillText('HERBARIUM BRITANNICUM · CYANOTYPE PLATE № XLII', 92, 96);
  cCtx.textAlign = 'right';
  cCtx.fillText('ANNO 1853 · KEW ARCHIVE', 988, 96);

  cCtx.strokeStyle = PAL.copper;
  cCtx.lineWidth = 0.9;
  cCtx.beginPath();
  cCtx.moveTo(92, 114);
  cCtx.lineTo(988, 114);
  cCtx.stroke();

  cCtx.textAlign = 'left';
  cCtx.fillStyle = PAL.paperHex;
  cCtx.font = `700 34px ${F_CN}`;
  cCtx.fillText('自然界的几何密码：植物斐波那契标本志', 92, 160);

  cCtx.fillStyle = PAL.copper;
  cCtx.font = `700 13px ${F_SERIF}`;
  cCtx.fillText('BOTANICAL CYANOTYPE · 137.5° GOLDEN ANGLE & X-RAY VENATION', 92, 194);
  cCtx.restore();

  // Callout Leaders for Vertical Plate
  drawCallout(
    cCtx,
    460,
    380,
    94,
    310,
    'left',
    'FIG. I · HELIANTHUS ROSETTE',
    '向日葵花盘 · 55/89 黄金螺旋',
    '发散角 137.508° 实现种子最密堆积'
  );

  drawCallout(
    cCtx,
    432,
    665,
    540,
    740,
    'left',
    'FIG. II · GINKGO BILOBA L.',
    '银杏扇叶 · 二分叉透光叶脉',
    '柠檬酸铁铵蓝晒 · 叶肉冰青半透明显影'
  );

  drawCallout(
    cCtx,
    720,
    915,
    540,
    995,
    'left',
    'FIG. III · PAPAVER CAPSULE',
    '蒴果横切 · 13 室放射心皮',
    '心皮隔膜契合斐波那契数 F₇ = 13'
  );

  // Bottom-Right Collector Cartouche Stamp
  drawCollectorCartouche(cCtx, 515, 1155, 472, 154);
}

export function renderFrame(comp, layers, t = 6.0, mode = 'horizontal') {
  const w = mode === 'vertical' ? 1080 : 1920;
  const h = mode === 'vertical' ? 1440 : 1080;
  clearLayers(layers, w, h);

  if (mode === 'vertical') {
    renderVerticalScene(layers, t);
  } else {
    renderHorizontalScene(layers, t);
  }

  comp.beginEmulsion(PAL.paperRGB);
  comp.photogramPass(layers.L_photogram.c, PAL.paperRGB);
  comp.copperPass(layers.L_copper.c);
  comp.finish();
}
