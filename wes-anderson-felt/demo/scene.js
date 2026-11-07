// "Wes Anderson Wool-Felt Diorama Theatre (韦斯·安德森毛毡光影剧场)"
// Dual-Aspect Symmetrical Dollhouse Cross-Section Scene Renderer:
//   - Horizontal (1920×1080, 16:9): Grand Symmetrical Hotel & Alpine Funicular Dollhouse Spread
//   - Vertical (1080×1440, 3:4): Collectors' Vertical Symmetrical Dollhouse & Chapter Plate
// Layers:
//   - L_diorama: Flat wool-felt appliqué shapes (transformed into 3D padded plush felt with fuzzy wool edge hairs by gl.js)
//   - L_stitch: Hand-sewn cotton embroidery running/blanket stitches, 4-hole buttons, brass hotel keys,
//     orthographic symmetry plumb-axis, and centered Futura/Playfair chapter typography.

import { clamp, lerp, hash, vnoise } from '/core/lib.js';
import { W, H } from './gl.js';

export const PAL = {
  mendlPink: '#F2BFC0',
  coralRoof: '#D6655F',
  lobbyCrimson: '#A43237',
  royalPlum: '#5B3461',
  mustardOchre: '#E3A33B',
  butterCream: '#F6EBD4',
  oatmealFelt: '#E4D6BC',
  powderBlue: '#98C1D1',
  sprucePine: '#2B5751',
  cypressMid: '#3C726B',
  brassGold: '#DCA64E',
  brassDark: '#8C6120',
  flossWhite: '#FAF5E8',
  inkPlum: '#291A2E',
};

const F_SANS = '"Trebuchet MS", "Arial Black", "Noto Serif SC", sans-serif';
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
    L_diorama: makeLayer(w, h),
    L_stitch: makeLayer(w, h),
  };
}

export function clearLayers(layers, w = W, h = H) {
  for (const k of Object.keys(layers)) {
    layers[k].ctx.clearRect(0, 0, w, h);
  }
}

// ============================================================================
// 1. HAND-CRAFTED EMBROIDERY STITCHES, 4-HOLE BUTTONS & FELT PUPPETS
// ============================================================================

// Draw a hand-sewn running stitch rectangle (手工平针虚线缝线框)
function drawRunningStitchRect(ctx, x, y, w, h, r = 0, color = PAL.flossWhite, dash = [7, 5], width = 2.0) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  if (r > 0) ctx.roundRect(x, y, w, h, r);
  else ctx.strokeRect(x, y, w, h);
  if (r > 0) ctx.stroke();
  ctx.restore();
}

// Draw a 4-Hole Sewn Mother-of-Pearl / Bakelite Button (四眼十字绣线纽扣)
function drawSewnButton(ctx, cx, cy, radius, rimCol = PAL.butterCream, wellCol = PAL.oatmealFelt, threadCol = PAL.lobbyCrimson) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer button disc
  ctx.fillStyle = rimCol;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Recessed inner well
  ctx.fillStyle = wellCol;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.68, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(60, 40, 30, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 4 buttonholes
  const hr = Math.max(1.4, radius * 0.14);
  const hd = radius * 0.28;
  ctx.fillStyle = '#2A1D1B';
  for (const [hx, hy] of [[-hd, -hd], [hd, -hd], [-hd, hd], [hd, hd]]) {
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Criss-cross embroidery thread holding the button
  ctx.strokeStyle = threadCol;
  ctx.lineWidth = Math.max(1.8, radius * 0.18);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-hd, -hd);
  ctx.lineTo(hd, hd);
  ctx.moveTo(hd, -hd);
  ctx.lineTo(-hd, hd);
  ctx.stroke();

  ctx.restore();
}

// Draw a Puffy Needle-Felted Cloud suspended on a thin brass wire
function drawFeltCloud(dCtx, sCtx, cx, cy, scale = 1.0) {
  dCtx.save();
  dCtx.translate(cx, cy);
  dCtx.scale(scale, scale);
  dCtx.fillStyle = PAL.butterCream;

  const puffs = [
    [-38, 6, 24],
    [-16, -8, 30],
    [14, -6, 28],
    [38, 8, 22],
    [0, 10, 26],
  ];
  dCtx.beginPath();
  for (const [px, py, pr] of puffs) {
    dCtx.moveTo(px + pr, py);
    dCtx.arc(px, py, pr, 0, Math.PI * 2);
  }
  dCtx.fill();
  dCtx.restore();

  // Brass suspension wire & stitched cloud contour on L_stitch
  sCtx.save();
  sCtx.strokeStyle = PAL.brassGold;
  sCtx.lineWidth = 1.2;
  sCtx.beginPath();
  sCtx.moveTo(cx, 54);
  sCtx.lineTo(cx, cy - 28 * scale);
  sCtx.stroke();

  sCtx.translate(cx, cy);
  sCtx.scale(scale, scale);
  sCtx.strokeStyle = PAL.coralRoof;
  sCtx.lineWidth = 1.6;
  sCtx.setLineDash([5, 4]);
  sCtx.beginPath();
  sCtx.arc(-16, -8, 24, Math.PI * 0.85, Math.PI * 1.95);
  sCtx.arc(14, -6, 22, Math.PI * 1.15, Math.PI * 0.15);
  sCtx.stroke();
  sCtx.restore();
}

// Draw a Symmetrical Potted Felt Cypress Tree (对称修剪圆锥毛毡松树)
function drawFeltCypressTree(dCtx, sCtx, cx, baseY, scale = 1.0) {
  dCtx.save();
  dCtx.translate(cx, baseY);
  dCtx.scale(scale, scale);

  // Terracotta felt flower pot
  dCtx.fillStyle = PAL.coralRoof;
  dCtx.beginPath();
  dCtx.moveTo(-22, 0);
  dCtx.lineTo(-26, -34);
  dCtx.lineTo(26, -34);
  dCtx.lineTo(22, 0);
  dCtx.closePath();
  dCtx.fill();
  dCtx.fillStyle = PAL.lobbyCrimson;
  dCtx.fillRect(-29, -42, 58, 9);

  // Trunk
  dCtx.fillStyle = '#6E4736';
  dCtx.fillRect(-6, -62, 12, 20);

  // 3-tier manicured topiary felt cones
  const cones = [
    [-54, -145, 44, PAL.sprucePine],
    [-105, -192, 36, PAL.cypressMid],
    [-152, -232, 26, PAL.sprucePine],
  ];
  for (const [yBot, yTop, halfW, col] of cones) {
    dCtx.fillStyle = col;
    dCtx.beginPath();
    dCtx.moveTo(0, yTop);
    dCtx.lineTo(halfW, yBot);
    dCtx.lineTo(-halfW, yBot);
    dCtx.closePath();
    dCtx.fill();
  }
  dCtx.restore();

  // Embroidery stitches on pot & tree tiers
  sCtx.save();
  sCtx.translate(cx, baseY);
  sCtx.scale(scale, scale);
  sCtx.strokeStyle = PAL.flossWhite;
  sCtx.lineWidth = 1.6;
  sCtx.setLineDash([5, 4]);
  sCtx.strokeRect(-22, -31, 44, 27);

  for (const [yBot, yTop, halfW] of [
    [-58, -140, 38],
    [-109, -187, 30],
  ]) {
    sCtx.beginPath();
    sCtx.moveTo(0, yTop);
    sCtx.lineTo(halfW, yBot);
    sCtx.lineTo(-halfW, yBot);
    sCtx.closePath();
    sCtx.stroke();
  }
  sCtx.restore();
}

// Draw a Miniature Mendl's Pink Pastry Box tied with Baker's Twine (孟德尔粉色甜点盒)
function drawMendlsBox(dCtx, sCtx, cx, by, w = 44, h = 28) {
  dCtx.save();
  dCtx.fillStyle = PAL.mendlPink;
  dCtx.fillRect(cx - w / 2, by - h, w, h);
  dCtx.fillStyle = PAL.coralRoof;
  dCtx.fillRect(cx - w / 2 - 2, by - h - 6, w + 4, 7);
  dCtx.restore();

  // Blue & white baker's ribbon cross + bow on L_stitch
  sCtx.save();
  sCtx.setLineDash([]);
  sCtx.strokeStyle = PAL.powderBlue;
  sCtx.lineWidth = 2.4;
  sCtx.beginPath();
  sCtx.moveTo(cx, by - h - 6);
  sCtx.lineTo(cx, by);
  sCtx.moveTo(cx - w / 2, by - h * 0.5);
  sCtx.lineTo(cx + w / 2, by - h * 0.5);
  // Bow loops on top
  sCtx.moveTo(cx, by - h - 6);
  sCtx.quadraticCurveTo(cx - 10, by - h - 16, cx - 3, by - h - 6);
  sCtx.moveTo(cx, by - h - 6);
  sCtx.quadraticCurveTo(cx + 10, by - h - 16, cx + 3, by - h - 6);
  sCtx.stroke();
  sCtx.restore();
}

// ============================================================================
// 2. THE GRAND ZUBROWKA HOTEL & OBSERVATORY DOLLHOUSE CROSS-SECTION
// ============================================================================

function drawGrandHotelDiorama(dCtx, sCtx, cx, baseY, scale = 1.0) {
  dCtx.save();
  sCtx.save();
  dCtx.translate(cx, baseY);
  sCtx.translate(cx, baseY);
  dCtx.scale(scale, scale);
  sCtx.scale(scale, scale);

  // --- A. DISTANT SYMMETRICAL ALPINE FELT SNOW PEAKS ---
  for (const sgn of [-1, 1]) {
    dCtx.fillStyle = '#6A949A';
    dCtx.beginPath();
    dCtx.moveTo(sgn * 180, 0);
    dCtx.lineTo(sgn * 345, -490);
    dCtx.lineTo(sgn * 510, 0);
    dCtx.closePath();
    dCtx.fill();

    // Cream felt snow cap with scalloped edge
    dCtx.fillStyle = PAL.butterCream;
    dCtx.beginPath();
    dCtx.moveTo(sgn * 345, -490);
    dCtx.lineTo(sgn * 395, -340);
    dCtx.lineTo(sgn * 345, -358);
    dCtx.lineTo(sgn * 295, -340);
    dCtx.closePath();
    dCtx.fill();
  }

  // --- B. GROUND VIADUCT ARCHES (Oatmeal & Butter-Cream Felt Base, Y: 0 .. -135) ---
  const vW = 680, vH = 135;
  dCtx.fillStyle = PAL.oatmealFelt;
  dCtx.fillRect(-vW / 2, -vH, vW, vH);

  // 5 Symmetrical Viaduct Arches revealing deep spruce-teal shadow inside
  for (let i = -2; i <= 2; i++) {
    const ax = i * 124;
    dCtx.fillStyle = PAL.sprucePine;
    dCtx.beginPath();
    dCtx.arc(ax, -52, 42, Math.PI, 0);
    dCtx.lineTo(ax + 42, 0);
    dCtx.lineTo(ax - 42, 0);
    dCtx.closePath();
    dCtx.fill();

    // Stitched arch trim
    sCtx.strokeStyle = PAL.flossWhite;
    sCtx.lineWidth = 1.8;
    sCtx.setLineDash([6, 4]);
    sCtx.beginPath();
    sCtx.arc(ax, -52, 46, Math.PI, 0);
    sCtx.stroke();
  }

  // Viaduct cornice band
  dCtx.fillStyle = PAL.butterCream;
  dCtx.fillRect(-vW / 2 - 12, -vH - 14, vW + 24, 16);
  drawRunningStitchRect(sCtx, -vW / 2 - 8, -vH - 11, vW + 16, 10, 0, PAL.lobbyCrimson, [6, 4], 1.6);

  // --- C. MAIN HOTEL FACADE & CONCIERGE CROSS-SECTION (Y: -149 .. -415) ---
  const hW = 580, hBot = -149, hTop = -415, hH = hBot - hTop;
  // Mendl's Rose-Pink Felt main facade wall
  dCtx.fillStyle = PAL.mendlPink;
  dCtx.fillRect(-hW / 2, hTop, hW, hH);
  drawRunningStitchRect(sCtx, -hW / 2 + 8, hTop + 8, hW - 16, hH - 16, 0, PAL.flossWhite, [8, 5], 2.0);

  // Left & Right Symmetrical Wing Alcoves (Guest Rooms 217 & 218)
  for (const sgn of [-1, 1]) {
    const rx = sgn * 195;
    const rw = 136, rh = 196, ry = hBot - 16;

    // Cream felt window frame
    dCtx.fillStyle = PAL.butterCream;
    dCtx.beginPath();
    dCtx.roundRect(rx - rw / 2 - 8, ry - rh - 8, rw + 16, rh + 16, [68, 68, 4, 4]);
    dCtx.fill();

    // Powder-blue room interior wall
    dCtx.fillStyle = PAL.powderBlue;
    dCtx.beginPath();
    dCtx.roundRect(rx - rw / 2, ry - rh, rw, rh, [60, 60, 2, 2]);
    dCtx.fill();

    // Crimson velvet curtains draped on both sides of the room
    dCtx.fillStyle = PAL.lobbyCrimson;
    dCtx.fillRect(rx - rw / 2, ry - rh + 40, 22, rh - 40);
    dCtx.fillRect(rx + rw / 2 - 22, ry - rh + 40, 22, rh - 40);

    // Miniature Mendl's Pastry Boxes stacked on a brass table inside each room!
    dCtx.fillStyle = PAL.mustardOchre;
    dCtx.fillRect(rx - 34, ry - 32, 68, 8);
    dCtx.fillRect(rx - 24, ry - 24, 8, 24);
    dCtx.fillRect(rx + 16, ry - 24, 8, 24);
    drawMendlsBox(dCtx, sCtx, rx, ry - 32, 46, 26);
    drawMendlsBox(dCtx, sCtx, rx, ry - 64, 34, 20);

    // Brass Room Key Tag above each alcove ("ROOM 217" / "ROOM 218")
    sCtx.setLineDash([]);
    sCtx.fillStyle = PAL.brassGold;
    sCtx.fillRect(rx - 44, ry - rh + 14, 88, 20);
    sCtx.strokeStyle = PAL.inkPlum;
    sCtx.lineWidth = 1.2;
    sCtx.strokeRect(rx - 44, ry - rh + 14, 88, 20);
    sCtx.fillStyle = PAL.inkPlum;
    sCtx.font = `700 10px ${F_SANS}`;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(sgn < 0 ? 'ROOM 217' : 'ROOM 218', rx, ry - rh + 24);
  }

  // --- D. DEAD-CENTER HERO ALCOVE: THE CONCIERGE DESK & MONSIEUR GUSTAVE ---
  {
    const cw = 186, ch = 222, cy = hBot - 16;
    // Butter-cream grand arch surround
    dCtx.fillStyle = PAL.butterCream;
    dCtx.beginPath();
    dCtx.roundRect(-cw / 2 - 10, cy - ch - 10, cw + 20, ch + 18, [92, 92, 4, 4]);
    dCtx.fill();

    // Cranberry-Red Grand Budapest Lobby interior felt
    dCtx.fillStyle = PAL.lobbyCrimson;
    dCtx.beginPath();
    dCtx.roundRect(-cw / 2, cy - ch, cw, ch, [84, 84, 2, 2]);
    dCtx.fill();

    // Twin Brass Key Racks on left & right of the Concierge alcove
    for (const sgn of [-1, 1]) {
      const kx = sgn * 56;
      dCtx.fillStyle = PAL.oatmealFelt;
      dCtx.fillRect(kx - 22, cy - 155, 44, 68);
      sCtx.setLineDash([]);
      sCtx.strokeStyle = PAL.brassGold;
      sCtx.lineWidth = 1.5;
      sCtx.strokeRect(kx - 22, cy - 155, 44, 68);
      // Tiny hanging brass keys
      for (let r = 0; r < 3; r++) {
        for (let c = -1; c <= 1; c++) {
          sCtx.fillStyle = PAL.brassGold;
          sCtx.fillRect(kx + c * 11 - 2, cy - 145 + r * 20, 4, 11);
        }
      }
    }

    // Dead-Center Felt Puppet: Monsieur Gustave (in Royal Plum Concierge Tailcoat & Bowtie)
    // Torso
    dCtx.fillStyle = PAL.royalPlum;
    dCtx.beginPath();
    dCtx.roundRect(-24, cy - 122, 48, 62, 10);
    dCtx.fill();
    // White shirt & golden-mustard lapels
    dCtx.fillStyle = PAL.butterCream;
    dCtx.beginPath();
    dCtx.moveTo(-10, cy - 122);
    dCtx.lineTo(10, cy - 122);
    dCtx.lineTo(0, cy - 92);
    dCtx.closePath();
    dCtx.fill();
    // Head (warm peach felt)
    dCtx.fillStyle = '#F5CFB8';
    dCtx.beginPath();
    dCtx.arc(0, cy - 142, 18, 0, Math.PI * 2);
    dCtx.fill();
    // Swept-back golden-brown felt hair & neat mustache
    dCtx.fillStyle = '#8B5A36';
    dCtx.beginPath();
    dCtx.arc(0, cy - 146, 18, Math.PI, 0);
    dCtx.fill();

    // Stitched button eyes & mustache on L_stitch
    sCtx.setLineDash([]);
    sCtx.fillStyle = PAL.inkPlum;
    sCtx.beginPath();
    sCtx.arc(-6, cy - 142, 2.4, 0, Math.PI * 2);
    sCtx.arc(6, cy - 142, 2.4, 0, Math.PI * 2);
    sCtx.fill();
    sCtx.strokeStyle = '#6E4226';
    sCtx.lineWidth = 2.4;
    sCtx.beginPath();
    sCtx.moveTo(-9, cy - 134);
    sCtx.quadraticCurveTo(0, cy - 137, 9, cy - 134);
    sCtx.stroke();

    // Mustard-Ochre Concierge Front Desk Counter with "CONCIERGE" brass plate
    dCtx.fillStyle = PAL.mustardOchre;
    dCtx.fillRect(-78, cy - 64, 156, 64);
    dCtx.fillStyle = PAL.butterCream;
    dCtx.fillRect(-84, cy - 70, 168, 8);
    drawRunningStitchRect(sCtx, -72, cy - 58, 144, 52, 0, PAL.flossWhite, [6, 4], 1.8);

    // Crossed Keys Society Emblem ("LES CLÉS CROISÉES") on front of Concierge Desk
    sCtx.fillStyle = PAL.royalPlum;
    sCtx.fillRect(-56, cy - 44, 112, 24);
    sCtx.strokeStyle = PAL.brassGold;
    sCtx.lineWidth = 1.5;
    sCtx.strokeRect(-56, cy - 44, 112, 24);
    sCtx.fillStyle = PAL.brassGold;
    sCtx.font = `700 10.5px ${F_SANS}`;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('⚜ CONCIERGE ⚜', 0, cy - 32);
  }

  // --- E. MANSARD ROOF, TWIN PORTHOLE DORMERS & CENTRAL OBSERVATORY CUPOLA (Y: -415 .. -675) ---
  {
    // Cream cornice separating facade & roof
    dCtx.fillStyle = PAL.butterCream;
    dCtx.fillRect(-hW / 2 - 16, hTop - 14, hW + 32, 16);

    // Terracotta-Coral Mansard Trapezoid Roof
    dCtx.fillStyle = PAL.coralRoof;
    dCtx.beginPath();
    dCtx.moveTo(-hW / 2 - 8, hTop - 14);
    dCtx.lineTo(-215, -545);
    dCtx.lineTo(215, -545);
    dCtx.lineTo(hW / 2 + 8, hTop - 14);
    dCtx.closePath();
    dCtx.fill();

    // Scalloped felt roof shingles on L_stitch
    sCtx.strokeStyle = PAL.flossWhite;
    sCtx.lineWidth = 1.5;
    sCtx.setLineDash([6, 4]);
    for (let row = 0; row < 3; row++) {
      const ry = hTop - 38 - row * 34;
      const span = 250 - row * 22;
      sCtx.beginPath();
      sCtx.moveTo(-span, ry);
      sCtx.lineTo(span, ry);
      sCtx.stroke();
    }

    // Twin Symmetrical Round Button-Framed Dormer Windows on the Mansard Roof
    for (const sgn of [-1, 1]) {
      drawSewnButton(dCtx, sgn * 168, -480, 28, PAL.butterCream, PAL.powderBlue, PAL.lobbyCrimson);
      drawSewnButton(sCtx, sgn * 168, -480, 28, PAL.butterCream, PAL.powderBlue, PAL.lobbyCrimson);
    }

    // Central Grand Pediment & Cupola Observatory Tower
    dCtx.fillStyle = PAL.butterCream;
    dCtx.fillRect(-78, -595, 156, 180);
    // Pediment triangle
    dCtx.fillStyle = PAL.mustardOchre;
    dCtx.beginPath();
    dCtx.moveTo(-92, -595);
    dCtx.lineTo(0, -648);
    dCtx.lineTo(92, -595);
    dCtx.closePath();
    dCtx.fill();

    // Cranberry Cupola Dome & Brass Flagpole at the summit
    dCtx.fillStyle = PAL.lobbyCrimson;
    dCtx.beginPath();
    dCtx.arc(0, -638, 42, Math.PI, 0);
    dCtx.fill();

    // Central Sewn Button Clock in the tower
    drawSewnButton(dCtx, 0, -525, 34, PAL.mustardOchre, PAL.butterCream, PAL.royalPlum);
    drawSewnButton(sCtx, 0, -525, 34, PAL.mustardOchre, PAL.butterCream, PAL.royalPlum);

    // Grand Hotel Name Banner across the upper facade
    sCtx.setLineDash([]);
    sCtx.fillStyle = PAL.butterCream;
    sCtx.fillRect(-165, -452, 330, 28);
    sCtx.strokeStyle = PAL.lobbyCrimson;
    sCtx.lineWidth = 1.8;
    sCtx.strokeRect(-165, -452, 330, 28);
    sCtx.fillStyle = PAL.lobbyCrimson;
    sCtx.font = `700 13px ${F_SERIF}`;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('GRAND HOTEL ZUBROWKA', 0, -438);
  }

  // --- F. FOREGROUND MUSTARD-OCHRE ALPINE FUNICULAR TRAM ("ZUBROWKA EXPRESS NO. 4") ---
  {
    const tx = 0, ty = -24, tw = 236, th = 84;
    // Tram body (Mustard Ochre felt)
    dCtx.fillStyle = PAL.mustardOchre;
    dCtx.beginPath();
    dCtx.roundRect(tx - tw / 2, ty - th, tw, th, 12);
    dCtx.fill();

    // Cranberry lower skirt & cream roof
    dCtx.fillStyle = PAL.lobbyCrimson;
    dCtx.fillRect(tx - tw / 2, ty - 24, tw, 24);
    dCtx.fillStyle = PAL.butterCream;
    dCtx.fillRect(tx - tw / 2 - 6, ty - th - 8, tw + 12, 10);

    // 3 Symmetrical Powder-Blue Tram Windows
    for (let w = -1; w <= 1; w++) {
      dCtx.fillStyle = PAL.powderBlue;
      dCtx.beginPath();
      dCtx.roundRect(tx + w * 68 - 24, ty - th + 14, 48, 36, 5);
      dCtx.fill();
      drawRunningStitchRect(sCtx, tx + w * 68 - 24, ty - th + 14, 48, 36, 5, PAL.flossWhite, [4, 3], 1.5);
    }

    // Running stitch around tram perimeter & "NO. 4 FUNICULAR" plate
    drawRunningStitchRect(sCtx, tx - tw / 2 + 5, ty - th + 5, tw - 10, th - 10, 8, PAL.flossWhite, [6, 4], 1.8);

    sCtx.setLineDash([]);
    sCtx.fillStyle = PAL.butterCream;
    sCtx.font = `700 9.5px ${F_SANS}`;
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('NO. 4  ·  ZUBROWKA ALPINE FUNICULAR', tx, ty - 15.5);

    // 4 Sewn Bakelite Button Wheels along the track!
    for (const wx of [-82, -34, 34, 82]) {
      drawSewnButton(dCtx, wx, ty + 4, 15, PAL.lobbyCrimson, PAL.butterCream, PAL.mustardOchre);
      drawSewnButton(sCtx, wx, ty + 4, 15, PAL.lobbyCrimson, PAL.butterCream, PAL.mustardOchre);
    }
  }

  dCtx.restore();
  sCtx.restore();
}

// ============================================================================
// 3. STITCHED FELT FIELD-NOTE CARDS & ORTHOGRAPHIC SYMMETRY AXIS
// ============================================================================

function drawFeltNoteCard(dCtx, sCtx, cx, cy, w, h, tagEn, titleCn, subCn, accentCol = PAL.lobbyCrimson) {
  // 1) Butter-cream felt card patch on L_diorama
  dCtx.save();
  dCtx.fillStyle = PAL.butterCream;
  dCtx.beginPath();
  dCtx.roundRect(cx - w / 2, cy - h / 2, w, h, 8);
  dCtx.fill();

  // Top accent felt tab
  dCtx.fillStyle = accentCol;
  dCtx.beginPath();
  dCtx.roundRect(cx - w / 2 + 16, cy - h / 2 - 11, w - 32, 22, 4);
  dCtx.fill();
  dCtx.restore();

  // 2) Running stitches, 2 corner mini-buttons & crisp Wes Anderson typography on L_stitch
  sCtx.save();
  drawRunningStitchRect(sCtx, cx - w / 2 + 6, cy - h / 2 + 6, w - 12, h - 12, 5, accentCol, [6, 4], 1.7);

  // Corner mini sewn buttons
  drawSewnButton(sCtx, cx - w / 2 + 16, cy + h / 2 - 16, 7.5, PAL.mustardOchre, PAL.butterCream, accentCol);
  drawSewnButton(sCtx, cx + w / 2 - 16, cy + h / 2 - 16, 7.5, PAL.mustardOchre, PAL.butterCream, accentCol);

  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.fillStyle = PAL.flossWhite;
  sCtx.font = `700 10.5px ${F_SANS}`;
  sCtx.fillText(tagEn, cx, cy - h / 2);

  sCtx.fillStyle = PAL.inkPlum;
  sCtx.font = `700 17px ${F_CN}`;
  sCtx.fillText(titleCn, cx, cy - 4);

  sCtx.fillStyle = PAL.sprucePine;
  sCtx.font = `600 12px ${F_CN}`;
  sCtx.fillText(subCn, cx, cy + 20);
  sCtx.restore();
}

// ============================================================================
// 4. MASTER DUAL-ASPECT SCENE COMPOSITIONS (1920×1080 & 1080×1440)
// ============================================================================

export function renderHorizontalScene(layers, t = 6.0) {
  const { L_diorama, L_stitch } = layers;
  const dCtx = L_diorama.ctx;
  const sCtx = L_stitch.ctx;

  // --- 1. OUTER PROSCENIUM FELT ARCH & STAGE FLOOR (L_diorama) ---
  dCtx.save();
  // Stage ground base (Cranberry & Mustard layered felt stage floor)
  dCtx.fillStyle = PAL.lobbyCrimson;
  dCtx.fillRect(0, 915, 1920, 165);
  dCtx.fillStyle = PAL.mustardOchre;
  dCtx.fillRect(0, 902, 1920, 15);

  // Outer butter-cream felt proscenium border (42px)
  dCtx.fillStyle = PAL.butterCream;
  dCtx.fillRect(0, 0, 1920, 46);
  dCtx.fillRect(0, 1034, 1920, 46);
  dCtx.fillRect(0, 0, 46, 1080);
  dCtx.fillRect(1920 - 46, 0, 46, 1080);
  dCtx.restore();

  drawRunningStitchRect(sCtx, 24, 24, 1920 - 48, 1080 - 48, 0, PAL.lobbyCrimson, [9, 6], 2.2);

  // --- 2. DEAD-CENTER GRAND HOTEL & FUNICULAR DIORAMA ---
  drawGrandHotelDiorama(dCtx, sCtx, 960, 902, 1.04);

  // Symmetrical Twin Cypress Trees flanking the hotel
  drawFeltCypressTree(dCtx, sCtx, 535, 902, 1.05);
  drawFeltCypressTree(dCtx, sCtx, 1385, 902, 1.05);

  // Symmetrical Hanging Needle-Felted Clouds
  drawFeltCloud(dCtx, sCtx, 555, 255, 1.05);
  drawFeltCloud(dCtx, sCtx, 1365, 255, 1.05);

  // --- 3. TOP CENTERED WES ANDERSON CHAPTER PLACARD ---
  {
    const cw = 760, ch = 108, cx = 960, cy = 114;
    dCtx.save();
    dCtx.fillStyle = PAL.butterCream;
    dCtx.beginPath();
    dCtx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 10);
    dCtx.fill();
    dCtx.fillStyle = PAL.mustardOchre;
    dCtx.fillRect(cx - cw / 2 + 12, cy - ch / 2 + 8, cw - 24, 22);
    dCtx.restore();

    drawRunningStitchRect(sCtx, cx - cw / 2 + 6, cy - ch / 2 + 6, cw - 12, ch - 12, 6, PAL.lobbyCrimson, [7, 5], 1.8);
    sCtx.save();
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillStyle = PAL.inkPlum;
    sCtx.font = `700 11.5px ${F_SANS}`;
    sCtx.fillText('CHAPTER III  ·  THE GRAND ZUBROWKA WOOL-FELT DIORAMA  ·  ORTHOGRAPHIC 90.0°', cx, cy - ch / 2 + 19);

    sCtx.fillStyle = PAL.lobbyCrimson;
    sCtx.font = `700 30px ${F_CN}`;
    sCtx.fillText('对称强迫症与糖果色温：韦斯·安德森毛毡光影剧场', cx, cy + 6);

    sCtx.fillStyle = PAL.sprucePine;
    sCtx.font = `700 12px ${F_SERIF}`;
    sCtx.fillText('PLANIMETRIC BILATERAL SYMMETRY  ·  MENDL’S PASTEL PALETTE  ·  HAND-STITCHED STOP-MOTION CRAFT', cx, cy + 36);
    sCtx.restore();
  }

  // --- 4. FOUR SYMMETRICAL FELT FIELD-NOTE CARDS ON LEFT & RIGHT WINGS ---
  drawFeltNoteCard(
    dCtx,
    sCtx,
    255,
    435,
    330,
    96,
    'LAW I · PLANIMETRIC SYMMETRY',
    '绝对中轴对称与正交镜头',
    'X = 960.0 px 垂直中分 · 消除透视畸变',
    PAL.lobbyCrimson
  );

  drawFeltNoteCard(
    dCtx,
    sCtx,
    255,
    645,
    330,
    96,
    'LAW II · MENDL’S PASTEL PALETTE',
    '孟德尔粉 × 芥末黄高饱和撞色',
    '暖粉 #F2BFC0 · 礼宾紫 #5B3461 · 冰川青',
    PAL.royalPlum
  );

  drawFeltNoteCard(
    dCtx,
    sCtx,
    1665,
    435,
    330,
    96,
    'LAW III · TACTILE FELT & BUTTONS',
    '美利奴羊毛毡与四眼纽扣手作',
    '立体填充边缘飞丝 · 手工平针虚线锁边',
    PAL.lobbyCrimson
  );

  drawFeltNoteCard(
    dCtx,
    sCtx,
    1665,
    645,
    330,
    96,
    'LAW IV · DOLLHOUSE CROSS-SECTION',
    '三层玩偶屋横切面定格叙事',
    '天文台圆顶 → 礼宾总台 → 4 号齿轮缆车',
    PAL.royalPlum
  );

  // --- 5. CENTRAL SYMMETRY PLUMB-LINE & BOTTOM STAGE CALLOUT BAR ---
  sCtx.save();
  // Vertical dashed gold-thread symmetry axis above cupola & below tram (keeping puppet face clear!)
  sCtx.strokeStyle = PAL.brassGold;
  sCtx.lineWidth = 1.8;
  sCtx.setLineDash([5, 5]);
  sCtx.beginPath();
  sCtx.moveTo(960, 168);
  sCtx.lineTo(960, 212);
  sCtx.moveTo(960, 902);
  sCtx.lineTo(960, 952);
  sCtx.stroke();
  sCtx.setLineDash([]);

  // Bottom stage symmetry ruler & badge
  sCtx.fillStyle = PAL.butterCream;
  sCtx.fillRect(670, 952, 580, 48);
  drawRunningStitchRect(sCtx, 675, 956, 570, 40, 0, PAL.lobbyCrimson, [6, 4], 1.6);

  sCtx.fillStyle = PAL.lobbyCrimson;
  sCtx.font = `700 13px ${F_CN}`;
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.fillText('▲ 绝对中轴线 (CENTER AXIS X = 960.0 PX)  ·  左右镜像误差 0.00%  ·  定格毛毡微缩模型 ▲', 960, 976);
  sCtx.restore();
}

export function renderVerticalScene(layers, t = 6.0) {
  const { L_diorama, L_stitch } = layers;
  const dCtx = L_diorama.ctx;
  const sCtx = L_stitch.ctx;

  // --- 1. VERTICAL STAGE FLOOR & PROSCENIUM BORDER (1080×1440) ---
  dCtx.save();
  dCtx.fillStyle = PAL.lobbyCrimson;
  dCtx.fillRect(0, 1110, 1080, 330);
  dCtx.fillStyle = PAL.mustardOchre;
  dCtx.fillRect(0, 1096, 1080, 15);

  dCtx.fillStyle = PAL.butterCream;
  dCtx.fillRect(0, 0, 1080, 42);
  dCtx.fillRect(0, 1398, 1080, 42);
  dCtx.fillRect(0, 0, 42, 1440);
  dCtx.fillRect(1080 - 42, 0, 42, 1440);
  dCtx.restore();

  drawRunningStitchRect(sCtx, 22, 22, 1080 - 44, 1440 - 44, 0, PAL.lobbyCrimson, [9, 6], 2.0);

  // --- 2. TOP CHAPTER PLACARD ---
  {
    const cw = 840, ch = 112, cx = 540, cy = 118;
    dCtx.save();
    dCtx.fillStyle = PAL.butterCream;
    dCtx.beginPath();
    dCtx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 10);
    dCtx.fill();
    dCtx.fillStyle = PAL.mustardOchre;
    dCtx.fillRect(cx - cw / 2 + 12, cy - ch / 2 + 8, cw - 24, 22);
    dCtx.restore();

    drawRunningStitchRect(sCtx, cx - cw / 2 + 6, cy - ch / 2 + 6, cw - 12, ch - 12, 6, PAL.lobbyCrimson, [7, 5], 1.8);
    sCtx.save();
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillStyle = PAL.inkPlum;
    sCtx.font = `700 11px ${F_SANS}`;
    sCtx.fillText('CHAPTER III  ·  THE GRAND ZUBROWKA WOOL-FELT DIORAMA  ·  ORTHOGRAPHIC 90.0°', cx, cy - ch / 2 + 19);

    sCtx.fillStyle = PAL.lobbyCrimson;
    sCtx.font = `700 28px ${F_CN}`;
    sCtx.fillText('对称强迫症与糖果色温：韦斯·安德森毛毡剧场', cx, cy + 6);

    sCtx.fillStyle = PAL.sprucePine;
    sCtx.font = `700 11.5px ${F_SERIF}`;
    sCtx.fillText('PLANIMETRIC SYMMETRY  ·  MENDL’S PASTEL PALETTE  ·  STITCHED FELT & BUTTON CRAFT', cx, cy + 36);
    sCtx.restore();
  }

  // --- 3. GRAND HOTEL & FUNICULAR DIORAMA ---
  drawGrandHotelDiorama(dCtx, sCtx, 540, 1096, 1.05);
  drawFeltCypressTree(dCtx, sCtx, 130, 1096, 0.98);
  drawFeltCypressTree(dCtx, sCtx, 950, 1096, 0.98);
  drawFeltCloud(dCtx, sCtx, 185, 310, 1.0);
  drawFeltCloud(dCtx, sCtx, 895, 310, 1.0);

  // --- 4. BOTTOM SYMMETRICAL FELT FIELD-NOTE CARDS ---
  drawFeltNoteCard(
    dCtx,
    sCtx,
    295,
    1245,
    410,
    98,
    'LAW I–II · SYMMETRY & MENDL’S PALETTE',
    '绝对中轴对称 × 孟德尔粉撞色',
    '正交平视无畸变 · 高明度糖果粉与芥末黄',
    PAL.lobbyCrimson
  );

  drawFeltNoteCard(
    dCtx,
    sCtx,
    785,
    1245,
    410,
    98,
    'LAW III–IV · FELT, BUTTONS & STITCHES',
    '羊毛毡飞丝 × 四眼纽扣与平针锁边',
    '三层玩偶屋横切面 · 礼宾官与 4 号登山缆车',
    PAL.royalPlum
  );

  // Central Symmetry Plumb Axis (top & bottom segments, keeping hotel facade clear)
  sCtx.save();
  sCtx.strokeStyle = PAL.brassGold;
  sCtx.lineWidth = 1.8;
  sCtx.setLineDash([5, 5]);
  sCtx.beginPath();
  sCtx.moveTo(540, 176);
  sCtx.lineTo(540, 385);
  sCtx.moveTo(540, 1110);
  sCtx.lineTo(540, 1365);
  sCtx.stroke();
  sCtx.restore();
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

  comp.beginStageFelt();
  comp.dioramaPlushPass(layers.L_diorama.c);
  comp.stitchBrassPass(layers.L_stitch.c);
  comp.finish();
}
