// "Nordic Papercut Lightbox Theatre (北欧童话多层剪纸光影剧场)"
// Dual-Aspect 5-Layer Depth-Stacked Paper Tunnel Scene Renderer:
//   - Horizontal (1920×1080, 16:9): Grand Hans Christian Andersen Proscenium Shadow-Box Theatre
//   - Vertical (1080×1440, 3:4): Collectors' Vertical Paper-Cut Tunnel Book Plate
// Depth Layers (each casts real mipmap AO + parallax drop shadows onto deeper planes in gl.js):
//   - L1_skyPeaks (depth 0.20): Deep indigo-teal sky card (#1E3557) with needle-pricked starlight holes,
//     cut-out Aurora Borealis ribbons (destination-out so rear 2700K light shines through!), and distant fjord peaks (#46688A)
//   - L2_fjordVillage (depth 0.45): Mid-back fjord island (#2E4D6E), Nordic Falu-red lighthouse (#C4493A)
//     & stepped-gable harbour cottages with glowing cut-out windows
//   - L3_forestBridge (depth 0.70): Layered Nordic spruce forest (#234242), arched stone bridge (#D9CEB8),
//     and the Hero Folk-Filigree Reindeer & Lantern Courier crossing the bridge
//   - L4_foregroundArch (depth 0.90): Cream-ivory Canson (#F4EDE0) birch & botanical proscenium arch,
//     suspended 8-pointed Nordic paper stars, and 3D folded paper ribbon banners
//   - L5_prosceniumFrame (depth 1.00): Outer walnut & gold-foil shadow-box frame + storyteller brass plaque

import { clamp, lerp, hash, vnoise } from '/core/lib.js';
import { W, H } from './gl.js';

export const PAL = {
  ivoryCard: '#F4EDE0',
  oatmealCard: '#E5DAC4',
  warmSand: '#D2C09E',
  nordicRed: '#C4493A',
  goldFoil: '#DFB15B',
  goldDeep: '#9E7128',
  spruceDark: '#1E3A3A',
  spruceMid: '#2D5452',
  fjordBlue: '#325274',
  peakSlate: '#4A6D91',
  skyIndigo: '#1B3152',
  frameWalnut: '#221A15',
};

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
    L1_skyPeaks: makeLayer(w, h),
    L2_fjordVillage: makeLayer(w, h),
    L3_forestBridge: makeLayer(w, h),
    L4_foregroundArch: makeLayer(w, h),
    L5_prosceniumFrame: makeLayer(w, h),
  };
}

export function clearLayers(layers, w = W, h = H) {
  for (const k of Object.keys(layers)) {
    layers[k].ctx.clearRect(0, 0, w, h);
  }
}

// ============================================================================
// 1. SCALPEL-CUT PAPER MOTIF HELPERS (Spruce Trees, Stars, Reindeer, Lighthouse)
// ============================================================================

// Draw an intricate scalpel-cut Nordic Spruce Tree with internal folk-art fern cutouts
function drawPaperSpruceTree(ctx, bx, by, height, width, color, cutOutWindows = true) {
  ctx.save();
  ctx.fillStyle = color;

  // Trunk
  ctx.fillRect(bx - width * 0.07, by - height * 0.16, width * 0.14, height * 0.18);

  // 6 tiered scalloped pine boughs
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const u = i / (tiers - 1);
    const ty = by - height * (0.12 + u * 0.72);
    const topY = ty - height * (0.28 - u * 0.025);
    const halfW = width * (0.52 - u * 0.34);

    ctx.beginPath();
    ctx.moveTo(bx, topY);
    ctx.quadraticCurveTo(bx + halfW * 0.55, ty - height * 0.04, bx + halfW, ty);
    ctx.quadraticCurveTo(bx + halfW * 0.45, ty + height * 0.03, bx, ty - height * 0.01);
    ctx.quadraticCurveTo(bx - halfW * 0.45, ty + height * 0.03, bx - halfW, ty);
    ctx.quadraticCurveTo(bx - halfW * 0.55, ty - height * 0.04, bx, topY);
    ctx.closePath();
    ctx.fill();
  }

  // Internal scalpel-cut folk-art teardrops (punched out so rear warm light glows through!)
  if (cutOutWindows) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    for (let i = 0; i < tiers - 1; i++) {
      const u = i / (tiers - 1);
      const ty = by - height * (0.20 + u * 0.64);
      const r = width * (0.045 - u * 0.02);
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(bx + sgn * width * (0.14 - u * 0.08), ty, r * 1.3, r * 0.65, sgn * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// Draw a hanging 8-pointed Nordic Paper-Cut Star (伯利恒八角镂空剪纸星)
function drawHangingPaperStar(ctx, cx, cy, threadTopY, outerR, color = PAL.ivoryCard) {
  ctx.save();
  // Suspension thread
  ctx.strokeStyle = PAL.goldFoil;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx, threadTopY);
  ctx.lineTo(cx, cy - outerR);
  ctx.stroke();

  // 8-pointed paper star body
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  const pts = 8;
  for (let i = 0; i < pts * 2; i++) {
    const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
    const isMajor = i % 4 === 0;
    const isDiag = i % 2 === 0 && !isMajor;
    const r = isMajor ? outerR : isDiag ? outerR * 0.72 : outerR * 0.26;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Punch out delicate diamond filigree inside the star so warm light shines through
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(0, 0, outerR * 0.14, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(outerR * 0.22, 0);
    ctx.lineTo(outerR * 0.42, -outerR * 0.06);
    ctx.lineTo(outerR * 0.56, 0);
    ctx.lineTo(outerR * 0.42, outerR * 0.06);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Draw the Nordic Wooden Lighthouse & Harbour Gables with Cut-Out Glowing Windows
function drawLighthouseAndVillage(ctx, lx, ly, scale = 1.0) {
  ctx.save();
  ctx.translate(lx, ly);
  ctx.scale(scale, scale);

  // 1) Falu-Red Lighthouse Tower
  ctx.fillStyle = PAL.nordicRed;
  ctx.beginPath();
  ctx.moveTo(-26, 0);
  ctx.lineTo(-16, -165);
  ctx.lineTo(16, -165);
  ctx.lineTo(26, 0);
  ctx.closePath();
  ctx.fill();

  // Cream horizontal band stripes on lighthouse
  ctx.fillStyle = PAL.ivoryCard;
  ctx.fillRect(-22, -68, 44, 22);
  ctx.fillRect(-19, -125, 38, 20);

  // Gallery deck & cupola dome
  ctx.fillStyle = PAL.skyIndigo;
  ctx.fillRect(-24, -172, 48, 8);
  ctx.fillRect(-15, -202, 30, 30);
  ctx.beginPath();
  ctx.arc(0, -202, 16, Math.PI, 0);
  ctx.fill();
  // Weathervane spire
  ctx.fillRect(-1.5, -226, 3, 24);

  // 2) Adjacent Nordic Stepped-Gable Harbour Cottages
  const houses = [
    [-85, 0, 48, 54, PAL.oatmealCard],
    [-136, 0, 44, 68, PAL.fjordBlue],
    [38, 0, 52, 58, PAL.oatmealCard],
    [96, 0, 46, 48, PAL.nordicRed],
  ];
  for (const [hx, hy, hw, hh, hcol] of houses) {
    ctx.fillStyle = hcol;
    ctx.fillRect(hx, hy - hh, hw, hh);
    // Steep pitched roof
    ctx.beginPath();
    ctx.moveTo(hx - 5, hy - hh);
    ctx.lineTo(hx + hw * 0.5, hy - hh - 34);
    ctx.lineTo(hx + hw + 5, hy - hh);
    ctx.closePath();
    ctx.fill();
  }

  // 3) Backlit Warm Vellum Tissue Windows (北欧剪纸剧场窗格背面衬贴的暖黄半透明硫酸纸 #FFF0B5!)
  ctx.save();
  // Warm vellum glow halo around lighthouse lantern & windows
  const lg = ctx.createRadialGradient(0, -186, 4, 0, -186, 68);
  lg.addColorStop(0.0, 'rgba(255, 244, 185, 0.95)');
  lg.addColorStop(0.45, 'rgba(248, 182, 78, 0.55)');
  lg.addColorStop(1.0, 'rgba(248, 182, 78, 0.0)');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.arc(0, -186, 68, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FFF2B8';
  // Lighthouse lantern room glass panes
  ctx.fillRect(-10, -197, 9, 21);
  ctx.fillRect(1, -197, 9, 21);
  // Tower slit windows
  ctx.fillRect(-4, -152, 8, 14);
  ctx.fillRect(-4, -95, 8, 14);
  ctx.fillRect(-4, -38, 8, 14);

  // Cottage mullioned windows glowing with warm candle-vellum light
  for (const [hx, hy, hw, hh] of houses) {
    const wy = hy - hh + 14;
    ctx.fillStyle = '#FFEFA6';
    ctx.fillRect(hx + 9, wy, 10, 14);
    ctx.fillRect(hx + hw - 19, wy, 10, 14);
    ctx.beginPath();
    ctx.arc(hx + hw * 0.5, hy - hh - 12, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();
}

// Draw the Hero Nordic Antlered Reindeer & Lantern Courier (北欧九角驯鹿与提灯信使镂空剪纸)
function drawReindeerAndCourier(ctx, cx, cy, scale = 1.0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.fillStyle = PAL.ivoryCard;
  ctx.strokeStyle = PAL.ivoryCard;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // --- 1. NOBLE NORDIC REINDEER (leading on the right) ---
  // Body & arched neck
  ctx.beginPath();
  ctx.moveTo(-18, -32);
  ctx.bezierCurveTo(-12, -52, 18, -54, 34, -42);
  ctx.lineTo(48, -78); // long graceful neck
  ctx.lineTo(66, -82); // head/snout
  ctx.lineTo(64, -70);
  ctx.lineTo(48, -64);
  ctx.lineTo(44, -24); // chest
  ctx.lineTo(-22, -20);
  ctx.closePath();
  ctx.fill();

  // Prancing slender legs
  ctx.lineWidth = 4.5;
  for (const [x0, y0, x1, y1, x2, y2] of [
    [-16, -24, -26, -8, -22, 12],
    [-6, -24, -4, -6, 2, 12],
    [32, -24, 36, -6, 30, 12],
    [40, -26, 54, -12, 62, 4], // raised front prancing leg!
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Bushy upturned tail
  ctx.beginPath();
  ctx.arc(-21, -34, 6, 0, Math.PI * 2);
  ctx.fill();

  // Magnificent branching Nordic antlers (九角鹿茸花枝)
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.moveTo(50, -80);
  ctx.bezierCurveTo(38, -108, 12, -120, -8, -112);
  ctx.moveTo(34, -98);
  ctx.lineTo(42, -118);
  ctx.moveTo(20, -108);
  ctx.lineTo(22, -128);
  ctx.moveTo(6, -112);
  ctx.lineTo(2, -130);
  ctx.stroke();

  // --- 2. NORDIC LANTERN COURIER IN CLOAK (walking behind reindeer) ---
  // Flowing winter cape & pointed hood
  ctx.beginPath();
  ctx.moveTo(-78, -82); // hood tip
  ctx.lineTo(-62, -68);
  ctx.lineTo(-52, -14);
  ctx.lineTo(-92, -10);
  ctx.quadraticCurveTo(-86, -46, -78, -82);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(-66, -72, 8.5, 0, Math.PI * 2);
  ctx.fill();

  // Boots striding
  ctx.lineWidth = 5.0;
  ctx.beginPath();
  ctx.moveTo(-64, -12);
  ctx.lineTo(-56, 12);
  ctx.moveTo(-78, -12);
  ctx.lineTo(-86, 12);
  ctx.stroke();

  // Extended arm holding a long shepherd's staff with a glowing hanging star-lantern!
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-60, -52);
  ctx.lineTo(-34, -64); // arm
  ctx.moveTo(-40, 12);
  ctx.lineTo(-32, -96); // staff
  ctx.lineTo(-18, -96); // lantern hook
  ctx.stroke();

  // Hanging lantern frame
  ctx.fillRect(-24, -92, 12, 16);

  // --- 3. PUNCH OUT FOLK-ART FILIGREE INSIDE REINDEER & CLOAK (destination-out) ---
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  // Reindeer heart/rosette cutout
  ctx.beginPath();
  ctx.arc(14, -34, 6.5, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(14 + Math.cos(a) * 11, -34 + Math.sin(a) * 7, 3.5, 2.0, a, 0, Math.PI * 2);
    ctx.fill();
  }
  //Cloak folk teardrops
  ctx.beginPath();
  ctx.ellipse(-72, -36, 4.5, 9, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Warm glowing vellum lantern glass & halo on the courier's staff!
  ctx.globalCompositeOperation = 'source-over';
  const lanG = ctx.createRadialGradient(-18, -84, 2, -18, -84, 34);
  lanG.addColorStop(0.0, 'rgba(255, 246, 195, 0.98)');
  lanG.addColorStop(0.45, 'rgba(246, 178, 72, 0.55)');
  lanG.addColorStop(1.0, 'rgba(246, 178, 72, 0.0)');
  ctx.fillStyle = lanG;
  ctx.beginPath();
  ctx.arc(-18, -84, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF4C2';
  ctx.fillRect(-21, -89, 6, 10);

  ctx.restore();
}

// Draw a 3D Folded Paper Ribbon Banner with Gold-Foil Border & Story Callout
function drawPaperRibbonBanner(ctx, cx, cy, w, h, tagEn, titleCn, subCn) {
  ctx.save();
  ctx.translate(cx, cy);

  // Back ribbon tails (slightly darker oatmeal paper for 3D fold depth)
  ctx.fillStyle = PAL.warmSand;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sgn * (w * 0.5 - 12), -h * 0.32);
    ctx.lineTo(sgn * (w * 0.5 + 26), -h * 0.32);
    ctx.lineTo(sgn * (w * 0.5 + 16), h * 0.08);
    ctx.lineTo(sgn * (w * 0.5 + 26), h * 0.48);
    ctx.lineTo(sgn * (w * 0.5 - 12), h * 0.48);
    ctx.closePath();
    ctx.fill();
  }

  // Main front cream paper banner (#F4EDE0)
  ctx.fillStyle = PAL.ivoryCard;
  ctx.fillRect(-w * 0.5, -h * 0.5, w, h);

  // Double gold-foil stamped rule inside the paper ribbon
  ctx.strokeStyle = PAL.goldDeep;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(-w * 0.5 + 5, -h * 0.5 + 5, w - 10, h - 10);

  // Typography
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PAL.nordicRed;
  ctx.font = `700 11px ${F_SERIF}`;
  ctx.fillText(tagEn, 0, -h * 0.5 + 17);

  ctx.fillStyle = PAL.skyIndigo;
  ctx.font = `700 17px ${F_CN}`;
  ctx.fillText(titleCn, 0, 2);

  ctx.fillStyle = PAL.spruceDark;
  ctx.font = `600 12px ${F_CN}`;
  ctx.fillText(subCn, 0, h * 0.5 - 16);

  ctx.restore();
}

// ============================================================================
// 2. MASTER DUAL-ASPECT SCENE COMPOSITIONS (1920×1080 & 1080×1440)
// ============================================================================

export function renderHorizontalScene(layers, t = 6.0) {
  const {
    L1_skyPeaks,
    L2_fjordVillage,
    L3_forestBridge,
    L4_foregroundArch,
    L5_prosceniumFrame,
  } = layers;

  // --- LAYER 1 (Depth 0.20): Deep Indigo Sky Curtain, Cut-Out Aurora & Fjord Peaks ---
  {
    const ctx = L1_skyPeaks.ctx;
    ctx.save();
    // Upper sky card covering top 62% with wavy arch opening at the center
    ctx.fillStyle = PAL.skyIndigo;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1920, 0);
    ctx.lineTo(1920, 560);
    ctx.bezierCurveTo(1480, 460, 1260, 260, 960, 250);
    ctx.bezierCurveTo(660, 260, 440, 460, 0, 560);
    ctx.closePath();
    ctx.fill();

    // Backlit Vellum Aurora Borealis waves & needle-pricked starlight holes in the sky card!
    ctx.lineCap = 'round';
    for (let band = 0; band < 3; band++) {
      ctx.strokeStyle = band === 0 ? 'rgba(255, 240, 178, 0.88)' : band === 1 ? 'rgba(245, 196, 108, 0.72)' : 'rgba(132, 212, 186, 0.62)';
      ctx.lineWidth = 10 - band * 2.5;
      ctx.beginPath();
      for (let x = 220; x <= 1700; x += 20) {
        const u = (x - 220) / 1480;
        const y = 175 + band * 26 + Math.sin(u * Math.PI * 3 + band * 0.8) * 28 - Math.sin(u * Math.PI) * 35;
        if (x === 220) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Crescent Moon & 52 Pin-Prick Starlight Perforations glowing with 2700K backlight
    ctx.fillStyle = '#FFF2BA';
    ctx.beginPath();
    ctx.arc(620, 310, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PAL.skyIndigo;
    ctx.beginPath();
    ctx.arc(634, 302, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF3C4';
    for (let s = 0; s < 52; s++) {
      const sx = 140 + hash(s * 17 + 3) * 1640;
      const sy = 95 + hash(s * 31 + 7) * 290;
      const sr = 2.0 + hash(s * 43) * 2.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant Fjord Snow Mountain Range at the horizon
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.peakSlate;
    ctx.beginPath();
    ctx.moveTo(0, 1080);
    ctx.lineTo(0, 560);
    const peaks = [
      [180, 445], [340, 535], [520, 410], [710, 565],
      [880, 485], [1040, 575], [1220, 420], [1410, 535],
      [1610, 430], [1780, 520], [1920, 490],
    ];
    for (const [px, py] of peaks) ctx.lineTo(px, py);
    ctx.lineTo(1920, 1080);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- LAYER 2 (Depth 0.45): Mid-Back Fjord Island, Lighthouse & Harbour Village ---
  {
    const ctx = L2_fjordVillage.ctx;
    ctx.save();
    // Left & Right Fjord Promontories leaving a central glowing water channel
    ctx.fillStyle = PAL.fjordBlue;
    ctx.beginPath();
    ctx.moveTo(0, 1080);
    ctx.lineTo(0, 645);
    ctx.quadraticCurveTo(380, 625, 760, 685);
    ctx.lineTo(1180, 685);
    ctx.quadraticCurveTo(1520, 610, 1920, 635);
    ctx.lineTo(1920, 1080);
    ctx.closePath();
    ctx.fill();

    // Nordic Lighthouse & Stepped-Gable Harbour on the right promontory
    drawLighthouseAndVillage(ctx, 1345, 650, 1.08);

    // Distant paper-cut spruce trees on the left promontory
    drawPaperSpruceTree(ctx, 310, 655, 195, 92, PAL.fjordBlue, true);
    drawPaperSpruceTree(ctx, 415, 665, 155, 76, PAL.fjordBlue, true);
    drawPaperSpruceTree(ctx, 510, 672, 130, 64, PAL.fjordBlue, true);
    ctx.restore();
  }

  // --- LAYER 3 (Depth 0.70): Hero Viaduct Bridge, Reindeer Courier & Spruce Forest ---
  {
    const ctx = L3_forestBridge.ctx;
    ctx.save();

    // 1) Multi-Arch Stone Viaduct Bridge spanning across the lower stage (warm oatmeal cardstock)
    const bridgeY = 760;
    ctx.fillStyle = PAL.oatmealCard;
    ctx.fillRect(120, bridgeY, 1680, 320);

    // Parapet зубцы / balustrade along top of bridge
    for (let x = 140; x < 1780; x += 28) {
      ctx.fillRect(x, bridgeY - 9, 18, 9);
    }

    // Punch out 5 graceful Romanesque bridge arches so the fjord & warm reflection glow through!
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    for (let i = 0; i < 5; i++) {
      const ax = 420 + i * 270;
      ctx.beginPath();
      ctx.arc(ax, bridgeY + 125, 92, Math.PI, 0);
      ctx.lineTo(ax + 92, 1080);
      ctx.lineTo(ax - 92, 1080);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // 2) Hero Nordic Antlered Reindeer & Lantern Courier crossing the center of the bridge!
    drawReindeerAndCourier(ctx, 945, bridgeY - 12, 1.38);

    // 3) Left & Right Foreground Spruce Forest wings
    drawPaperSpruceTree(ctx, 210, bridgeY + 18, 390, 185, PAL.spruceDark, true);
    drawPaperSpruceTree(ctx, 355, bridgeY + 14, 295, 142, PAL.spruceMid, true);
    drawPaperSpruceTree(ctx, 1695, bridgeY + 18, 380, 180, PAL.spruceDark, true);
    drawPaperSpruceTree(ctx, 1555, bridgeY + 14, 275, 134, PAL.spruceMid, true);

    ctx.restore();
  }

  // --- LAYER 4 (Depth 0.90): Cream Birch Proscenium Arch, Hanging Paper Stars & Story Ribbons ---
  {
    const ctx = L4_foregroundArch.ctx;
    ctx.save();

    // Outer cream Canson paper proscenium arch with scalloped theatre curtain cutout
    ctx.fillStyle = PAL.ivoryCard;
    ctx.fillRect(0, 0, 1920, 1080);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(118, 960);
    ctx.lineTo(118, 255);
    ctx.quadraticCurveTo(118, 108, 295, 108);
    ctx.lineTo(1625, 108);
    ctx.quadraticCurveTo(1802, 108, 1802, 255);
    ctx.lineTo(1802, 960);
    ctx.closePath();
    ctx.fill();

    // Restore source-over and add scalloped paper valance & hanging Nordic 8-pointed stars!
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.ivoryCard;
    for (let x = 140; x <= 1780; x += 82) {
      ctx.beginPath();
      ctx.arc(x, 108, 44, 0, Math.PI);
      ctx.fill();
    }

    // Hanging Paper-Cut Stars suspended from the top arch
    drawHangingPaperStar(ctx, 325, 245, 118, 44, PAL.ivoryCard);
    drawHangingPaperStar(ctx, 515, 198, 118, 32, PAL.oatmealCard);
    drawHangingPaperStar(ctx, 1415, 205, 118, 34, PAL.oatmealCard);
    drawHangingPaperStar(ctx, 1605, 252, 118, 46, PAL.ivoryCard);

    // 3D Folded Paper Story Callout Ribbons
    drawPaperRibbonBanner(
      ctx,
      465,
      485,
      310,
      78,
      'LAYER I–II · BACKLIGHT & AURORA',
      '第 1–2 层：极光镂空与针刺星孔',
      '2700K 暖光背透 · 300g 康颂纸次表面散射'
    );

    drawPaperRibbonBanner(
      ctx,
      1455,
      365,
      310,
      78,
      'LAYER III · FJORD LIGHTHOUSE',
      '第 3 层：峡湾红木灯塔与阶梯山墙',
      '手术刀 45° 斜切白边高光与逐层景深投影'
    );

    drawPaperRibbonBanner(
      ctx,
      960,
      905,
      420,
      82,
      'LAYER IV · THE SOLSTICE COURIER',
      '第 4 层：提灯信使与九角驯鹿民俗镂空',
      '安徒生剪纸剧场传统 · 五重景深纸雕光影隧道'
    );

    ctx.restore();
  }

  // --- LAYER 5 (Depth 1.00): Outer Walnut Shadow-Box Frame & Top/Bottom Brass Title Plaques ---
  {
    const ctx = L5_prosceniumFrame.ctx;
    ctx.save();

    // Outer Walnut Shadow-Box Moulding (56px border)
    ctx.fillStyle = PAL.frameWalnut;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(54, 52, 1920 - 108, 1080 - 104);
    ctx.globalCompositeOperation = 'source-over';

    // Gold-Foil Inner Fillet Rules
    ctx.strokeStyle = PAL.goldFoil;
    ctx.lineWidth = 2.2;
    ctx.strokeRect(54, 52, 1920 - 108, 1080 - 104);
    ctx.lineWidth = 1.0;
    ctx.strokeRect(62, 60, 1920 - 124, 1080 - 120);

    // Top Center Theatre Cartouche Plaque
    const pw = 760, ph = 84;
    const px = 960 - pw / 2, py = 38;
    ctx.fillStyle = PAL.frameWalnut;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = PAL.goldFoil;
    ctx.lineWidth = 2.0;
    ctx.strokeRect(px + 4, py + 4, pw - 8, ph - 8);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PAL.goldFoil;
    ctx.font = `700 11.5px ${F_SERIF}`;
    ctx.fillText('H. C. ANDERSEN PAPERCUT LIGHTBOX THEATRE · ODENSE WINTER SOLSTICE ARCHIVE', 960, py + 22);

    ctx.fillStyle = PAL.ivoryCard;
    ctx.font = `700 28px ${F_CN}`;
    ctx.fillText('北欧童话多层剪纸光影剧场：《追寻北极光的驯鹿信使》', 960, py + 56);

    // Bottom Brass Museum Footnote Bar
    ctx.fillStyle = PAL.goldFoil;
    ctx.font = `700 12px ${F_SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillText('TECHNIQUE: 5-LAYER CANSON MI-TEINTES 300GSM TUNNEL BOOK · 2700K WARM TUNGSTEN BACKLIGHT', 82, 1054);
    ctx.textAlign = 'right';
    ctx.fillText('DEPTH SHADOWS & SCALPEL BEVEL RIM SHADER · SCALE 1 : 1', 1838, 1054);

    ctx.restore();
  }
}

export function renderVerticalScene(layers, t = 6.0) {
  const {
    L1_skyPeaks,
    L2_fjordVillage,
    L3_forestBridge,
    L4_foregroundArch,
    L5_prosceniumFrame,
  } = layers;

  // --- LAYER 1 (Depth 0.20): 1080×1440 Vertical Sky & Fjord Peaks ---
  {
    const ctx = L1_skyPeaks.ctx;
    ctx.save();
    ctx.fillStyle = PAL.skyIndigo;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1080, 0);
    ctx.lineTo(1080, 740);
    ctx.bezierCurveTo(840, 620, 720, 360, 540, 350);
    ctx.bezierCurveTo(360, 360, 240, 620, 0, 740);
    ctx.closePath();
    ctx.fill();

    ctx.lineCap = 'round';
    for (let band = 0; band < 3; band++) {
      ctx.strokeStyle = band === 0 ? 'rgba(255, 240, 178, 0.88)' : band === 1 ? 'rgba(245, 196, 108, 0.72)' : 'rgba(132, 212, 186, 0.62)';
      ctx.lineWidth = 9 - band * 2;
      ctx.beginPath();
      for (let x = 140; x <= 940; x += 20) {
        const u = (x - 140) / 800;
        const y = 235 + band * 26 + Math.sin(u * Math.PI * 3 + band * 0.8) * 24 - Math.sin(u * Math.PI) * 30;
        if (x === 140) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#FFF3C4';
    for (let s = 0; s < 36; s++) {
      const sx = 110 + hash(s * 19 + 5) * 860;
      const sy = 140 + hash(s * 29 + 11) * 360;
      const sr = 2.0 + hash(s * 41) * 2.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.peakSlate;
    ctx.beginPath();
    ctx.moveTo(0, 1440);
    ctx.lineTo(0, 720);
    const peaks = [
      [160, 585], [310, 690], [460, 560], [610, 710],
      [780, 575], [920, 680], [1080, 610],
    ];
    for (const [px, py] of peaks) ctx.lineTo(px, py);
    ctx.lineTo(1080, 1440);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // --- LAYER 2 (Depth 0.45): Vertical Fjord Promontory & Lighthouse ---
  {
    const ctx = L2_fjordVillage.ctx;
    ctx.save();
    ctx.fillStyle = PAL.fjordBlue;
    ctx.beginPath();
    ctx.moveTo(0, 1440);
    ctx.lineTo(0, 825);
    ctx.quadraticCurveTo(260, 800, 420, 855);
    ctx.lineTo(660, 855);
    ctx.quadraticCurveTo(860, 795, 1080, 815);
    ctx.lineTo(1080, 1440);
    ctx.closePath();
    ctx.fill();

    drawLighthouseAndVillage(ctx, 765, 825, 0.98);
    drawPaperSpruceTree(ctx, 225, 835, 180, 84, PAL.fjordBlue, true);
    drawPaperSpruceTree(ctx, 315, 845, 140, 68, PAL.fjordBlue, true);
    ctx.restore();
  }

  // --- LAYER 3 (Depth 0.70): Vertical Viaduct Bridge, Reindeer & Spruce Wings ---
  {
    const ctx = L3_forestBridge.ctx;
    ctx.save();
    const bridgeY = 985;
    ctx.fillStyle = PAL.oatmealCard;
    ctx.fillRect(60, bridgeY, 960, 455);

    for (let x = 80; x < 1000; x += 28) {
      ctx.fillRect(x, bridgeY - 9, 18, 9);
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    for (let i = 0; i < 3; i++) {
      const ax = 270 + i * 270;
      ctx.beginPath();
      ctx.arc(ax, bridgeY + 130, 88, Math.PI, 0);
      ctx.lineTo(ax + 88, 1440);
      ctx.lineTo(ax - 88, 1440);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    drawReindeerAndCourier(ctx, 535, bridgeY - 10, 1.28);

    drawPaperSpruceTree(ctx, 135, bridgeY + 16, 360, 168, PAL.spruceDark, true);
    drawPaperSpruceTree(ctx, 250, bridgeY + 14, 260, 124, PAL.spruceMid, true);
    drawPaperSpruceTree(ctx, 945, bridgeY + 16, 350, 164, PAL.spruceDark, true);
    drawPaperSpruceTree(ctx, 835, bridgeY + 14, 250, 120, PAL.spruceMid, true);
    ctx.restore();
  }

  // --- LAYER 4 (Depth 0.90): Vertical Birch Proscenium Arch, Stars & Story Ribbons ---
  {
    const ctx = L4_foregroundArch.ctx;
    ctx.save();
    ctx.fillStyle = PAL.ivoryCard;
    ctx.fillRect(0, 0, 1080, 1440);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(88, 1315);
    ctx.lineTo(88, 280);
    ctx.quadraticCurveTo(88, 132, 235, 132);
    ctx.lineTo(845, 132);
    ctx.quadraticCurveTo(992, 132, 992, 280);
    ctx.lineTo(992, 1315);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = PAL.ivoryCard;
    for (let x = 115; x <= 965; x += 78) {
      ctx.beginPath();
      ctx.arc(x, 132, 42, 0, Math.PI);
      ctx.fill();
    }

    drawHangingPaperStar(ctx, 225, 268, 140, 42, PAL.ivoryCard);
    drawHangingPaperStar(ctx, 855, 268, 140, 42, PAL.ivoryCard);

    drawPaperRibbonBanner(
      ctx,
      325,
      525,
      310,
      76,
      'LAYER I–II · BACKLIGHT & AURORA',
      '极光镂空与针刺星孔透光',
      '2700K 暖光背透 · 300g 康颂纸散射'
    );

    drawPaperRibbonBanner(
      ctx,
      540,
      1185,
      420,
      82,
      'LAYER III–IV · THE SOLSTICE COURIER',
      '提灯信使与九角驯鹿民俗镂空剧场',
      '五重景深纸雕隧道 · 手术刀 45° 斜切白边高光'
    );

    ctx.restore();
  }

  // --- LAYER 5 (Depth 1.00): Outer Walnut Shadow-Box Frame & Top Title Plaque ---
  {
    const ctx = L5_prosceniumFrame.ctx;
    ctx.save();
    ctx.fillStyle = PAL.frameWalnut;
    ctx.fillRect(0, 0, 1080, 1440);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(46, 48, 1080 - 92, 1440 - 96);
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = PAL.goldFoil;
    ctx.lineWidth = 2.0;
    ctx.strokeRect(46, 48, 1080 - 92, 1440 - 96);
    ctx.lineWidth = 1.0;
    ctx.strokeRect(54, 56, 1080 - 108, 1440 - 112);

    const pw = 680, ph = 84;
    const px = 540 - pw / 2, py = 36;
    ctx.fillStyle = PAL.frameWalnut;
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = PAL.goldFoil;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(px + 4, py + 4, pw - 8, ph - 8);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PAL.goldFoil;
    ctx.font = `700 11px ${F_SERIF}`;
    ctx.fillText('H. C. ANDERSEN PAPERCUT LIGHTBOX THEATRE · ODENSE ARCHIVE', 540, py + 22);

    ctx.fillStyle = PAL.ivoryCard;
    ctx.font = `700 25px ${F_CN}`;
    ctx.fillText('北欧童话剪纸剧场：《追寻北极光的驯鹿信使》', 540, py + 56);

    ctx.fillStyle = PAL.goldFoil;
    ctx.font = `700 11px ${F_SERIF}`;
    ctx.fillText('5-LAYER CANSON 300GSM TUNNEL BOOK · 2700K WARM BACKLIGHT & BEVEL RIM SHADER', 540, 1414);
    ctx.restore();
  }
}

export function renderFrame(comp, layers, t = 6.0, mode = 'horizontal') {
  const w = mode === 'vertical' ? 1080 : 1920;
  const h = mode === 'vertical' ? 1440 : 1080;
  clearLayers(layers, w, h);

  const lightUV = mode === 'vertical' ? [0.50, 0.44] : [0.50, 0.48];
  if (mode === 'vertical') {
    renderVerticalScene(layers, t);
  } else {
    renderHorizontalScene(layers, t);
  }

  comp.beginBacklight(lightUV);
  comp.paperLayerPass(layers.L1_skyPeaks.c, 0.20, lightUV);
  comp.paperLayerPass(layers.L2_fjordVillage.c, 0.45, lightUV);
  comp.paperLayerPass(layers.L3_forestBridge.c, 0.70, lightUV);
  comp.paperLayerPass(layers.L4_foregroundArch.c, 0.90, lightUV);
  comp.paperLayerPass(layers.L5_prosceniumFrame.c, 1.00, lightUV);
  comp.finish();
}
