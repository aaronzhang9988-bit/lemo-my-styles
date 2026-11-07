// Kraft Crayon Zine (牛皮纸蜡笔手账) — 1080×1440 (3:4 Vertical) Demo & Styleframe
// Act 1 (0–8.5s, fully assembled at t=4.0s for the Hero Style Frame): "The Art of Margin (留白哲学 · 读书拆解手账)"
// Act 2 (8.5–16.5s): "100% Overstuffed vs 70% Breathing Room (满溢 vs 留白视觉对照)"
// Act 3 (16.5–24.0s): "Three Zine Action Rules & Handmade Stamp (三条每日留白手账清单)"

import { clamp, lerp, hash } from '/core/lib.js';
import { W, H, CAM, BOIL, PAL, layer, clear, line, fill, dab, ellipse, handCircle, bez, arrow, text, drawTornGridPatch, drawWashiTape } from './crayon.js';
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);

export const DUR = 24.0;

export const SUBS = [
  { t0: 0.4, t1: 4.4, text: "为什么越把日程塞满，大脑反而越焦虑？" },
  { t0: 4.5, t1: 8.3, text: "《茶之书》里藏着一个反直觉的法则：真正的高手，永远给自己留出 30% 的留白。" },
  { t0: 8.6, t1: 12.6, text: "你看，一只装满 100% 的杯子，连一滴新灵感都容不下，稍微一晃就会溢出。" },
  { t0: 12.7, t1: 16.3, text: "而只盛七分茶的粗陶碗，剩下的三分空隙，恰恰是茶香和创造力流动的地方。" },
  { t0: 16.6, t1: 20.6, text: "在你的手账本上撕下一张方格纸：砍掉杂事、留出空白、只圈出今天最重要的一件事。" },
  { t0: 20.7, t1: 23.8, text: "给生活留一点牛皮纸的呼吸感，灵感自然会显影。" }
];

export const EV = [
  { t: 0.15, type: 'paper_slap', detail: 'bottom_grid_card' },
  { t: 0.35, type: 'tape_rip', detail: 'matcha_left' },
  { t: 0.52, type: 'tape_rip', detail: 'terracotta_right' },
  { t: 0.70, type: 'paper_slap', detail: 'top_tag_card' },
  { t: 0.88, type: 'tape_rip', detail: 'top_tag_tape' },
  { t: 1.00, type: 'crayon_draw', dur: 1.8 },
  { t: 2.35, type: 'wash_sweep', dur: 1.3 },
  { t: 2.60, type: 'glint', pitch: 76 },
  { t: 2.85, type: 'glint', pitch: 79 },
  { t: 3.10, type: 'glint', pitch: 83 },
  { t: 3.25, type: 'crayon_draw', dur: 0.7, detail: 'persimmon_circle' },
  { t: 8.65, type: 'paper_slap', detail: 'act2_cards' },
  { t: 8.90, type: 'tape_rip', detail: 'act2_tape' },
  { t: 9.20, type: 'crayon_draw', dur: 2.2 },
  { t: 13.0, type: 'wash_sweep', dur: 1.2 },
  { t: 13.4, type: 'glint', pitch: 84 },
  { t: 14.1, type: 'crayon_draw', dur: 0.8, detail: 'act2_circle' },
  { t: 16.7, type: 'paper_slap', detail: 'check_1' },
  { t: 17.0, type: 'tape_rip', detail: 'tape_1' },
  { t: 18.0, type: 'paper_slap', detail: 'check_2' },
  { t: 18.3, type: 'tape_rip', detail: 'tape_2' },
  { t: 19.3, type: 'paper_slap', detail: 'check_3' },
  { t: 19.6, type: 'tape_rip', detail: 'tape_3' },
  { t: 20.5, type: 'crayon_draw', dur: 1.2, detail: 'checkmarks' },
];

// Layers for WebGL2 composition
const L_preFill = layer();   // Crayon fills & white-wax resist BEFORE watercolour wash
const L_preLine = layer();   // Crayon outlines BEFORE watercolour wash
const L_wash = layer();      // Amber-tea watercolour wash mask
const L_collage = layer();   // Torn 5mm grid-paper patches & translucent washi tape
const L_postFill = layer();  // Crayon fills on/above grid patches
const L_postLine = layer();  // Crayon outlines, handwritten study notes & persimmon-red circles

// Helper: 4-point sparkle in creamy white wax (#FFFDF7)
function drawWaxSparkle(L, cx, cy, r, seed, draw = 1) {
  if (draw <= 0) return;
  const pts1 = [[cx - r, cy], [cx + r, cy]];
  const pts2 = [[cx, cy - r * 1.15], [cx, cy + r * 1.15]];
  line(L, pts1, { col: PAL.whiteWax, w: 5.5, p: 0.95, seed, draw });
  line(L, pts2, { col: PAL.whiteWax, w: 5.5, p: 0.95, seed: seed + 3, draw });
  dab(L, cx, cy, r * 0.35, { col: PAL.whiteWax, p: 0.95, seed: seed + 7, draw });
}

// Helper: Ginkgo leaf silhouette in creamy white wax (#FFFDF7) + mustard/sage accent
function drawWaxGinkgo(L_f, L_l, cx, cy, scale, rot, seed, draw = 1) {
  if (draw <= 0) return;
  const fan = [];
  const n = 18;
  fan.push([cx, cy + 18 * scale]);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const ang = -Math.PI * 0.82 + u * Math.PI * 0.64 + rot;
    // Characteristic notch in middle of ginkgo fan
    const notch = 1 - 0.28 * Math.exp(-Math.pow((u - 0.5) * 7, 2));
    const rad = 34 * scale * notch;
    fan.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
  }
  fill(L_f, fan, { col: PAL.whiteWax, p: 0.94, gap: 6.5, w: 8.5, over: 2.5, seed, draw });
  line(L_l, fan, { col: PAL.whiteWax, w: 4.5, p: 0.95, closed: true, seed: seed + 1, draw });
  // Stem
  line(L_l, [[cx, cy + 16 * scale], [cx - Math.sin(rot) * 26 * scale, cy + 38 * scale]], {
    col: PAL.whiteWax, w: 4.2, p: 0.92, seed: seed + 5, draw
  });
}

// Helper: Brush band into watercolour wash canvas
function paintWashSweep(L, x0, y0, x1, y1, progress, seed = 1) {
  if (progress <= 0) return;
  const g = L.g;
  const curX = lerp(x0, x1, easeOut(clamp(progress)));
  g.save();
  // Soft multi-pass bristle bands
  const bands = 5;
  const hBand = (y1 - y0) / bands;
  for (let b = 0; b < bands; b++) {
    const by0 = y0 + b * hBand - 18;
    const by1 = by0 + hBand + 36;
    const bProg = clamp((progress - b * 0.06) / 0.82);
    if (bProg <= 0) continue;
    const bxEnd = lerp(x0, x1, easeOut(bProg));
    const grad = g.createLinearGradient(x0, 0, bxEnd, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0.88)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0.82)');
    grad.addColorStop(1, 'rgba(255,255,255,0.0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(x0, by0 + Math.sin(b + seed) * 12);
    for (let xx = x0; xx <= bxEnd; xx += 28) {
      const wave = Math.sin(xx * 0.018 + b * 1.7 + seed) * 11;
      g.lineTo(xx, by0 + wave);
    }
    for (let xx = bxEnd; xx >= x0; xx -= 28) {
      const wave = Math.cos(xx * 0.016 + b * 2.1 + seed) * 11;
      g.lineTo(xx, by1 + wave);
    }
    g.closePath();
    g.fill();
  }
  g.restore();
}

// ——— ACT 1 (0.0 – 8.5s, Hero Style Frame at t = 4.0s) ———
function renderAct1(t) {
  // 1. Top Header Banner on Kraft Paper (Zone A: y = 64..185)
  const pHeader = clamp((t - 0.1) / 0.6);
  // Persimmon-red chapter badge
  const badgePoly = ellipse(146, 108, 66, 28, 28);
  fill(L_postFill, badgePoly, { col: PAL.persimmon, p: 0.82, gap: 6, w: 9, over: 2, seed: 10, draw: pHeader });
  line(L_postLine, badgePoly, { col: PAL.espresso, w: 4.5, p: 0.88, closed: true, seed: 11, draw: pHeader });
  text(L_postLine, "读书手账 #01", 146, 117, { col: PAL.whiteWax, size: 25, reveal: pHeader, seed: 12, stroke: 0.8 });

  text(L_postLine, "《茶之书》：为什么「留白」反而装得下更多？", 232, 118, {
    col: PAL.espresso, size: 37, align: 'left', reveal: clamp((t - 0.25) / 0.8), seed: 15
  });
  // Hand-drawn wavy mustard & espresso underline under header
  line(L_postLine, [[84, 146], [380, 148], [690, 144], [992, 147]], {
    col: PAL.espresso, w: 4.2, p: 0.78, seed: 18, draw: clamp((t - 0.4) / 0.6)
  });
  line(L_postLine, [[230, 155], [560, 157], [985, 154]], {
    col: PAL.persimmon, w: 5.0, p: 0.82, seed: 19, draw: clamp((t - 0.55) / 0.6)
  });

  // 2. Hidden & Luminous White-Wax Motifs in Upper Kraft Zone (y = 185..540)
  // Drawn BEFORE the Amber-Tea watercolour wash so they both gleam on the #D5BE9E kraft paper AND resist the tea wash!
  const pWaxMotifs = clamp((t - 1.5) / 1.0);
  const sparkles = [
    [135, 255, 18, 31], [285, 215, 15, 32], [440, 240, 21, 33],
    [605, 218, 16, 34], [895, 425, 19, 35], [160, 420, 16, 36],
    [350, 325, 14, 37], [655, 310, 18, 38]
  ];
  sparkles.forEach(([sx, sy, sr, sd], idx) => {
    drawWaxSparkle(L_preLine, sx, sy, sr, sd, clamp(pWaxMotifs * 1.3 - idx * 0.05));
  });

  // White-wax Ginkgo leaves floating in the tea-wash aroma zone (positioned cleanly around the rising steam)
  drawWaxGinkgo(L_preFill, L_preLine, 210, 320, 1.15, -0.35, 41, pWaxMotifs);
  drawWaxGinkgo(L_preFill, L_preLine, 605, 310, 1.05, 0.28, 45, pWaxMotifs);
  drawWaxGinkgo(L_preFill, L_preLine, 835, 420, 0.95, -0.22, 49, pWaxMotifs);

  // Rising fragrant White-Wax Steam Ribbons (#FFFDF7) from the ceramic tea bowl
  const pSteam = clamp((t - 1.7) / 1.1);
  const steam1 = bez([[435, 575], [385, 490], [485, 405], [415, 305], [375, 250], [435, 215], [420, 195]], 22);
  const steam2 = bez([[505, 560], [565, 475], [465, 385], [530, 290], [565, 240], [510, 205], [525, 190]], 22);
  const steam3 = bez([[365, 585], [315, 510], [375, 430], [325, 355]], 18);
  line(L_preLine, steam1, { col: PAL.whiteWax, w: 11.5, p: 0.96, seed: 51, draw: pSteam });
  line(L_preLine, steam2, { col: PAL.whiteWax, w: 10.5, p: 0.95, seed: 52, draw: pSteam });
  line(L_preLine, steam3, { col: PAL.whiteWax, w: 8.5, p: 0.92, seed: 53, draw: pSteam });

  // White-wax Handwritten Insight Tag in top-left of tea-wash zone (revealed by wax resist, clear of steam!)
  text(L_preLine, "✦ 30% MARGIN = 100% FLOW", 108, 224, {
    col: PAL.whiteWax, size: 24, align: 'left', reveal: pWaxMotifs, seed: 58, stroke: 1.3
  });

  // 3. Amber Oolong Tea Watercolour Wash sweeping across Upper/Middle Kraft Stage (y = 180..620)
  const pWash = clamp((t - 2.3) / 1.35);
  paintWashSweep(L_wash, 72, 185, 1005, 610, pWash, 77);

  // 4. Main Kraft Illustration Stage (Zone B: y = 480..985)
  const pSketch = clamp((t - 0.8) / 1.1);
  const pColor = clamp((t - 1.3) / 1.2);
  const pWhiteHi = clamp((t - 1.8) / 1.0);

  // 4a. Warm Wooden Desk Horizon & Woven Sage-Green Bamboo Coaster (#6D8C73)
  line(L_preLine, [[78, 845], [390, 840], [740, 844], [1002, 842]], {
    col: PAL.espresso, w: 5.5, p: 0.82, seed: 61, draw: pSketch
  });
  const coasterPoly = ellipse(465, 815, 215, 46, 40);
  fill(L_preFill, coasterPoly, { col: PAL.sage, p: 0.78, gap: 9, w: 11, over: 5, ang: 0.35, cross: true, seed: 62, draw: pColor });
  line(L_preLine, coasterPoly, { col: PAL.espresso, w: 6.5, p: 0.88, closed: true, seed: 63, draw: pSketch });

  // 4b. Vintage Mustard-Yellow Brass Desk Lamp on the Left (x = 110..290, y = 410..840)
  const lampBase = ellipse(168, 832, 64, 20, 28);
  fill(L_preFill, lampBase, { col: PAL.mustard, p: 0.82, gap: 8, w: 10, seed: 70, draw: pColor });
  line(L_preLine, lampBase, { col: PAL.espresso, w: 6, p: 0.9, closed: true, seed: 71, draw: pSketch });
  // Curved brass arm
  const lampArm = bez([[168, 815], [135, 660], [148, 510], [235, 465]], 18);
  line(L_preLine, lampArm, { col: PAL.espresso, w: 8.5, p: 0.9, seed: 72, draw: pSketch });
  line(L_preLine, lampArm, { col: PAL.mustard, w: 5.0, p: 0.85, seed: 73, draw: pColor });
  // Conical Mustard Lamp Shade
  const lampShade = [[185, 485], [242, 438], [322, 478], [272, 532]];
  fill(L_preFill, lampShade, { col: PAL.mustard, p: 0.86, gap: 8.5, w: 11, over: 4, seed: 74, draw: pColor });
  // Glowing White-Wax Bulb & Warm Halo Cone (#FFFDF7)
  const bulbGlow = ellipse(282, 515, 34, 24, 24, 0, Math.PI * 2, 0.4);
  fill(L_preFill, bulbGlow, { col: PAL.whiteWax, p: 0.96, gap: 6, w: 9, over: 3, seed: 75, draw: pWhiteHi });
  line(L_preLine, lampShade, { col: PAL.espresso, w: 6.5, p: 0.9, closed: true, seed: 76, draw: pSketch });
  // White-wax rim highlight on lamp shade
  line(L_preLine, [[196, 482], [242, 446]], { col: PAL.whiteWax, w: 6.0, p: 0.95, seed: 77, draw: pWhiteHi });

  // 4c. Central Kyoto Ceramic Tea Bowl in Dusty Blue (#5B7C99) with 30% Breathing Room!
  // Bowl body polygon (x = 295..635, y = 585..805)
  const bowlBody = bez([
    [300, 600], [302, 725], [365, 795], [465, 798],
    [565, 795], [628, 725], [630, 600]
  ], 18);
  const bowlRim = ellipse(465, 600, 165, 42, 44);
  const bowlFoot = [[398, 792], [406, 820], [524, 820], [532, 792]];

  // Fill ceramic bowl in Dusty Blue (#5B7C99) with cross-hatching
  fill(L_preFill, [...bowlBody, [300, 600]], {
    col: PAL.dustyBlue, p: 0.82, gap: 9.5, w: 11.5, over: 5, ang: -0.48, cross: true, seed: 80, draw: pColor
  });
  fill(L_preFill, bowlFoot, { col: PAL.espresso, p: 0.78, gap: 7, w: 9, seed: 81, draw: pColor });

  // Inside of the bowl: Creamy White Wax ceramic glaze (#FFFDF7) in the upper 30% "breathing room" rim!
  fill(L_preFill, bowlRim, {
    col: PAL.whiteWax, p: 0.95, gap: 7.5, w: 10.5, over: 3, ang: 0.15, seed: 82, draw: pWhiteHi
  });
  // Warm Amber/Mustard tea surface sitting at the 70% level inside the bowl
  const teaSurface = ellipse(465, 614, 132, 26, 36);
  fill(L_preFill, teaSurface, {
    col: PAL.mustard, p: 0.84, gap: 7.5, w: 10, over: 2, ang: 0.08, seed: 83, draw: pColor
  });
  // Creamy White Wax specular reflection ripple on the tea surface & ceramic belly highlight!
  line(L_preLine, [[385, 612], [445, 606], [515, 612]], {
    col: PAL.whiteWax, w: 6.5, p: 0.96, seed: 84, draw: pWhiteHi
  });
  const bellyHi = bez([[332, 645], [340, 715], [385, 758], [415, 768]], 14);
  line(L_preLine, bellyHi, { col: PAL.whiteWax, w: 9.5, p: 0.96, seed: 85, draw: pWhiteHi });

  // Wabi-sabi decorative wave pattern around bowl exterior in Persimmon Red & Espresso
  const wavePts = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const wx = lerp(318, 612, u);
    const wy = 682 + Math.sin(u * Math.PI) * 18 + Math.sin(u * Math.PI * 6) * 7;
    wavePts.push([wx, wy]);
  }
  line(L_preLine, wavePts, { col: PAL.persimmon, w: 5.8, p: 0.88, seed: 86, draw: pColor });

  // Espresso-brown structural outlines for the bowl
  line(L_preLine, bowlBody, { col: PAL.espresso, w: 7.5, p: 0.92, seed: 87, draw: pSketch });
  line(L_preLine, bowlRim, { col: PAL.espresso, w: 7.0, p: 0.92, closed: true, seed: 88, draw: pSketch });
  line(L_preLine, bowlFoot, { col: PAL.espresso, w: 6.5, p: 0.90, closed: true, seed: 89, draw: pSketch });

  // 4d. Open Hardcover Book on the Right ("《茶之书》") with Creamy White Wax Pages (#FFFDF7)
  const bookCover = [[645, 785], [805, 755], [965, 795], [805, 832]];
  const bookLeftPage = [[655, 774], [802, 746], [805, 812], [662, 782]];
  const bookRightPage = [[805, 746], [952, 782], [945, 818], [805, 812]];
  fill(L_preFill, bookCover, { col: PAL.persimmon, p: 0.82, gap: 8, w: 10, seed: 91, draw: pColor });
  fill(L_preFill, bookLeftPage, { col: PAL.whiteWax, p: 0.95, gap: 6.5, w: 9.5, seed: 92, draw: pWhiteHi });
  fill(L_preFill, bookRightPage, { col: PAL.whiteWax, p: 0.95, gap: 6.5, w: 9.5, seed: 93, draw: pWhiteHi });
  line(L_preLine, bookLeftPage, { col: PAL.espresso, w: 5.5, p: 0.9, closed: true, seed: 94, draw: pSketch });
  line(L_preLine, bookRightPage, { col: PAL.espresso, w: 5.5, p: 0.9, closed: true, seed: 95, draw: pSketch });
  // Squiggly crayon lines of text & bookmark ribbon on the open book
  line(L_preLine, [[690, 768], [775, 754]], { col: PAL.espresso, w: 3.5, p: 0.75, seed: 96, draw: pColor });
  line(L_preLine, [[695, 780], [780, 766]], { col: PAL.espresso, w: 3.5, p: 0.75, seed: 97, draw: pColor });
  line(L_preLine, [[830, 766], [918, 786]], { col: PAL.persimmon, w: 4.2, p: 0.85, seed: 98, draw: pColor });
  line(L_preLine, [[805, 812], [790, 868], [818, 862]], { col: PAL.persimmon, w: 6.5, p: 0.9, seed: 99, draw: pColor });

  // 5. Collage Layer: Floating Upper-Right Torn 5mm Grid Patch + Bottom Torn 5mm Grid Note Card + Washi Tapes
  // 5a. Upper-right floating torn grid patch (x = 695..1005, y = 205..365)
  const pTopCard = clamp((t - 0.65) / 0.35);
  const pTopTape = clamp((t - 0.85) / 0.30);
  drawTornGridPatch(L_collage, 695, 205, 305, 156, {
    seed: 105, enter: pTopCard, rot: 0.035, tearAmp: 6.0, grid: 22
  });
  drawWashiTape(L_collage, 848, 205, 118, 30, {
    col: PAL.persimmon, stripeCol: '#F7F3E8', angle: 0.14, enter: pTopTape
  });
  if (pTopCard > 0.5) {
    const pTagTxt = clamp((t - 0.95) / 0.65);
    text(L_postLine, "✦ 核心洞察", 722, 256, {
      col: PAL.persimmon, size: 30, align: 'left', reveal: pTagTxt, seed: 108
    });
    text(L_postLine, "碗口留出 30% 空隙", 722, 298, {
      col: PAL.espresso, size: 31, align: 'left', reveal: pTagTxt, seed: 109
    });
    text(L_postLine, "茶香才不会溢散", 722, 336, {
      col: PAL.sage, size: 29, align: 'left', reveal: pTagTxt, seed: 110
    });
  }

  // 5b. In-scene Persimmon-Red Crayon Callout Bracket & Arrow pointing to the 30% Margin at the Bowl Rim
  const pCallout = clamp((t - 2.8) / 0.85);
  // Curved red crayon arrow from the floating grid patch down to the glowing white-wax rim of the bowl
  arrow(L_postLine, [735, 368], [585, 562], [685, 495], {
    col: PAL.persimmon, w: 6.8, p: 0.92, headLen: 24, seed: 115, draw: pCallout
  });
  // Direct kraft-paper marginalia label on the left of the bowl
  const pLeftNote = clamp((t - 2.1) / 0.75);
  text(L_postLine, "← 30% 留白区", 92, 588, {
    col: PAL.espresso, size: 31, align: 'left', reveal: pLeftNote, seed: 118
  });
  text(L_postLine, "（白蜡高光层）", 92, 626, {
    col: PAL.whiteWax, size: 26, align: 'left', reveal: pLeftNote, seed: 119, stroke: 1.2
  });
  arrow(L_postLine, [268, 595], [322, 595], [295, 582], {
    col: PAL.espresso, w: 5.2, p: 0.88, headLen: 16, seed: 120, draw: pLeftNote
  });

  // Summary ribbon banner on the lower kraft paper above the torn grid patch (y = 918)
  const pRibbon = clamp((t - 2.0) / 0.8);
  const tagBox = [[172, 888], [908, 886], [914, 954], [166, 956]];
  fill(L_postFill, tagBox, { col: PAL.whiteWax, p: 0.92, gap: 7, w: 10, seed: 122, draw: pRibbon });
  line(L_postLine, tagBox, { col: PAL.espresso, w: 5.2, p: 0.88, closed: true, seed: 123, draw: pRibbon });
  text(L_postLine, "器物有留白，方能纳万物；手账有留白，思绪才清晰", 540, 932, {
    col: PAL.espresso, size: 28, align: 'center', reveal: pRibbon, seed: 124
  });

  // 6. Zone C: Bottom Torn-Edge 5mm Grid-Paper Subtitle & Study Note Patch (y = 1005..1372)
  const pBotCard = clamp((t - 0.12) / 0.38);
  const pTapeL = clamp((t - 0.35) / 0.30);
  const pTapeR = clamp((t - 0.50) / 0.30);

  drawTornGridPatch(L_collage, 74, 1008, 932, 356, {
    seed: 201, enter: pBotCard, rot: -0.006, tearAmp: 8.5, tearTopOnly: false, grid: 24, headerRule: true, headerOffset: 58
  });
  // Left corner: Matcha green diagonal-striped washi tape (#6D8C73)
  drawWashiTape(L_collage, 152, 1012, 138, 34, {
    col: PAL.sage, stripeCol: '#F7F3E8', angle: -0.32, enter: pTapeL
  });
  // Right corner: Terracotta red diagonal-striped washi tape (#E05A3F)
  drawWashiTape(L_collage, 926, 1014, 138, 34, {
    col: PAL.persimmon, stripeCol: '#F7F3E8', angle: 0.29, enter: pTapeR
  });

  // Handwritten Study Notes inside the Bottom Torn 5mm Grid Patch
  const pNote1 = clamp((t - 0.85) / 0.85);
  const pNote2 = clamp((t - 1.65) / 0.95);
  const pNote3 = clamp((t - 2.45) / 0.85);

  text(L_postLine, "NOTE · 为什么「塞满」等于低效？", 118, 1052, {
    col: PAL.sage, size: 28, align: 'left', reveal: pNote1, seed: 210
  });
  text(L_postLine, "P.42 读书批注", 962, 1052, {
    col: PAL.persimmon, size: 26, align: 'right', reveal: pNote1, seed: 211
  });

  text(L_postLine, "① 100% 排满的日程表，一遇突发事件就会彻底崩盘；", 118, 1122, {
    col: PAL.espresso, size: 34, align: 'left', reveal: pNote1, seed: 212
  });
  text(L_postLine, "② 真正的高手，永远给大脑留出", 118, 1196, {
    col: PAL.espresso, size: 38, align: 'left', reveal: pNote2, seed: 213
  });
  text(L_postLine, "30% 的呼吸感", 672, 1196, {
    col: PAL.persimmon, size: 42, align: 'left', reveal: pNote2, seed: 214, stroke: 1.8
  });

  // Mustard-yellow highlighter crayon bar + Persimmon-Red Live Double Circle around "30% 的呼吸感"!
  const pCircle = clamp((t - 3.15) / 0.65);
  const circlePts = handCircle(802, 1183, 148, 225, 0.24, 60, 1.0, 0.34);
  line(L_postLine, circlePts, {
    col: PAL.persimmon, w: 7.5, p: 0.94, seed: 226, draw: pCircle
  });

  // Bottom takeaway rule & star stamp on the grid card
  const hiBar = [[118, 1265], [955, 1265], [955, 1318], [118, 1318]];
  fill(L_postFill, hiBar, { col: PAL.mustard, p: 0.45, gap: 8, w: 12, over: 2, ang: 0.05, seed: 230, draw: pNote3 });
  text(L_postLine, "★ 留白定律：空出来的 30%，才是创造力真正生长的地方。", 132, 1303, {
    col: PAL.espresso, size: 32, align: 'left', reveal: pNote3, seed: 231
  });
}

// ——— ACT 2 (8.5 – 16.5s): Visual Comparison on Kraft Page (100% Overstuffed vs 70% Calm Bowl) ———
function renderAct2(t) {
  const lt = t - 8.5;
  const pHead = clamp(lt / 0.6);

  // Header
  const badgePoly = ellipse(155, 108, 72, 28, 28);
  fill(L_postFill, badgePoly, { col: PAL.sage, p: 0.85, gap: 6, w: 9, seed: 301, draw: pHead });
  line(L_postLine, badgePoly, { col: PAL.espresso, w: 4.5, p: 0.88, closed: true, seed: 302, draw: pHead });
  text(L_postLine, "视觉对照 #02", 155, 117, { col: PAL.whiteWax, size: 25, reveal: pHead, seed: 303 });
  text(L_postLine, "塞满 100% 的焦虑杯 vs 留白 30% 的灵感碗", 248, 118, {
    col: PAL.espresso, size: 37, align: 'left', reveal: pHead, seed: 304
  });
  line(L_postLine, [[84, 148], [992, 148]], { col: PAL.espresso, w: 4.5, p: 0.8, seed: 305, draw: pHead });

  // Upper Card (Wrong way: 100% Overstuffed Cup) vs Lower-Middle Stage (Right way: 70% Bowl + 30% White Wax)
  const pLeft = clamp((lt - 0.3) / 1.0);
  const pRight = clamp((lt - 1.8) / 1.2);
  const pWash2 = clamp((lt - 3.8) / 1.3);

  // White-wax sparkles & resist zone around the right-hand calm bowl
  for (let i = 0; i < 6; i++) {
    drawWaxSparkle(L_preLine, 610 + (i % 3) * 145, 240 + Math.floor(i / 3) * 110, 17, 320 + i, pRight);
  }
  drawWaxGinkgo(L_preFill, L_preLine, 750, 290, 1.15, 0.25, 330, pRight);
  paintWashSweep(L_wash, 530, 195, 1000, 880, pWash2, 340);

  // Left side: Cramped, overflowing Persimmon/Mustard Cup (x = 95..485, y = 260..840)
  drawTornGridPatch(L_collage, 85, 205, 410, 115, { seed: 350, enter: pLeft, rot: -0.02, tearAmp: 5.5 });
  drawWashiTape(L_collage, 290, 205, 115, 28, { col: PAL.persimmon, angle: -0.15, enter: pLeft });
  text(L_postLine, "❌ 100% 塞满模式", 290, 258, { col: PAL.persimmon, size: 34, align: 'center', reveal: pLeft, seed: 351 });
  text(L_postLine, "毫无缓冲 · 一碰就溢", 290, 298, { col: PAL.espresso, size: 27, align: 'center', reveal: pLeft, seed: 352 });

  const badCup = [[165, 480], [185, 780], [395, 780], [415, 480]];
  fill(L_preFill, badCup, { col: PAL.persimmon, p: 0.78, gap: 9, w: 11, seed: 355, draw: pLeft });
  line(L_preLine, badCup, { col: PAL.espresso, w: 7, p: 0.9, closed: true, seed: 356, draw: pLeft });
  // Overflowing chaotic scribbles & spilling drops at top of cup
  const scribble = handCircle(290, 445, 95, 360, 0.85, 64, 1.2, 0.65);
  line(L_preLine, scribble, { col: PAL.espresso, w: 6, p: 0.88, seed: 361, draw: pLeft });
  line(L_postLine, [[190, 560], [390, 720]], { col: PAL.persimmon, w: 9, p: 0.92, seed: 362, draw: clamp((lt - 1.1) / 0.5) });
  line(L_postLine, [[390, 560], [190, 720]], { col: PAL.persimmon, w: 9, p: 0.92, seed: 363, draw: clamp((lt - 1.3) / 0.5) });

  // Right side: Calm 70% Dusty-Blue Bowl + 30% Luminous White-Wax Margin (x = 555..985, y = 205..840)
  drawTornGridPatch(L_collage, 565, 205, 420, 115, { seed: 370, enter: pRight, rot: 0.02, tearAmp: 5.5 });
  drawWashiTape(L_collage, 775, 205, 115, 28, { col: PAL.sage, angle: 0.18, enter: pRight });
  text(L_postLine, "✓ 70% 专注 + 30% 留白", 775, 258, { col: PAL.sage, size: 33, align: 'center', reveal: pRight, seed: 371 });
  text(L_postLine, "茶香流动 · 游刃有余", 775, 298, { col: PAL.espresso, size: 27, align: 'center', reveal: pRight, seed: 372 });

  const goodBowl = bez([[590, 540], [595, 710], [665, 780], [775, 780], [885, 780], [955, 710], [960, 540]], 18);
  const goodRim = ellipse(775, 540, 185, 42, 40);
  fill(L_preFill, [...goodBowl, [590, 540]], { col: PAL.dustyBlue, p: 0.84, gap: 9, w: 11, cross: true, seed: 375, draw: pRight });
  fill(L_preFill, goodRim, { col: PAL.whiteWax, p: 0.96, gap: 7, w: 10, seed: 376, draw: pRight });
  line(L_preLine, goodBowl, { col: PAL.espresso, w: 7.5, p: 0.92, seed: 377, draw: pRight });
  line(L_preLine, goodRim, { col: PAL.espresso, w: 7.0, p: 0.92, closed: true, seed: 378, draw: pRight });
  // White-wax rising steam
  line(L_preLine, bez([[745, 515], [705, 435], [815, 385], [765, 330]], 18), { col: PAL.whiteWax, w: 10, p: 0.96, seed: 379, draw: pRight });

  // Bottom Torn 5mm Grid Note Card
  drawTornGridPatch(L_collage, 74, 985, 932, 375, { seed: 380, enter: 1, grid: 24, headerRule: true });
  drawWashiTape(L_collage, 155, 988, 135, 32, { col: PAL.sage, angle: -0.28, enter: 1 });
  drawWashiTape(L_collage, 925, 990, 135, 32, { col: PAL.persimmon, angle: 0.26, enter: 1 });

  text(L_postLine, "NOTE · 认知心理学中的「工作记忆留白」", 118, 1032, { col: PAL.sage, size: 28, align: 'left', reveal: pHead, seed: 381 });
  text(L_postLine, "当大脑处于 100% 负荷时，前额叶只会机械应付眼前的催促；", 118, 1110, { col: PAL.espresso, size: 33, align: 'left', reveal: pLeft, seed: 382 });
  text(L_postLine, "唯有留出 30% 的无目的空白，默认模式网络（DMN）才会启动，", 118, 1178, { col: PAL.espresso, size: 33, align: 'left', reveal: pRight, seed: 383 });
  text(L_postLine, "把零散的碎片连接成真正的顿悟。", 118, 1246, { col: PAL.persimmon, size: 37, align: 'left', reveal: pRight, seed: 384 });

  const pCir2 = clamp((lt - 5.2) / 0.7);
  line(L_postLine, handCircle(495, 1235, 135, 390, 0.22, 56, 1.1, 0.32), { col: PAL.persimmon, w: 7.5, p: 0.92, seed: 391, draw: pCir2 });
}

// ——— ACT 3 (16.5 – 24.0s): Three Torn-Grid Action Checklist Cards & Zine Stamp ———
function renderAct3(t) {
  const lt = t - 16.5;
  const pHead = clamp(lt / 0.5);

  // Warm tea wash background halo at top
  paintWashSweep(L_wash, 85, 180, 995, 420, clamp(lt / 1.2), 401);
  drawWaxSparkle(L_preLine, 175, 260, 20, 402, pHead);
  drawWaxSparkle(L_preLine, 905, 260, 20, 403, pHead);
  drawWaxGinkgo(L_preFill, L_preLine, 540, 255, 1.25, 0.08, 404, pHead);

  text(L_postLine, "今日手账行动清单 · 3 步找回呼吸感", 540, 118, {
    col: PAL.espresso, size: 42, align: 'center', reveal: pHead, seed: 405
  });
  line(L_postLine, [[140, 148], [940, 148]], { col: PAL.persimmon, w: 5.5, p: 0.88, seed: 406, draw: pHead });

  const items = [
    { y: 390, t0: 0.2, tapeCol: PAL.sage, num: "①", title: "每天划掉 1 件「可做可不做」的杂事", sub: "用浓咖蜡笔大胆划掉，把精力还给核心目标" },
    { y: 635, t0: 1.4, tapeCol: PAL.persimmon, num: "②", title: "傍晚留出 15 分钟「无屏幕发呆时间」", sub: "泡一杯热茶，看热气在牛皮纸上慢慢升起" },
    { y: 880, t0: 2.6, tapeCol: PAL.sage, num: "③", title: "在撕边方格纸上，只圈出今日唯一重点", sub: "少即是多：被柿子红蜡笔圈住的事，才算数" }
  ];

  items.forEach((it, idx) => {
    const pCard = clamp((lt - it.t0) / 0.4);
    const pTp = clamp((lt - it.t0 - 0.2) / 0.3);
    const pTxt = clamp((lt - it.t0 - 0.35) / 0.7);
    const pChk = clamp((lt - 3.8 - idx * 0.35) / 0.45);

    drawTornGridPatch(L_collage, 92, it.y, 896, 195, {
      seed: 420 + idx * 11, enter: pCard, rot: (idx % 2 === 0 ? -0.008 : 0.008), tearAmp: 7.0, grid: 24
    });
    drawWashiTape(L_collage, 165, it.y + 4, 125, 30, { col: it.tapeCol, angle: -0.25, enter: pTp });
    drawWashiTape(L_collage, 915, it.y + 4, 125, 30, { col: idx % 2 === 0 ? PAL.persimmon : PAL.sage, angle: 0.25, enter: pTp });

    text(L_postLine, `${it.num} ${it.title}`, 135, it.y + 88, {
      col: PAL.espresso, size: 36, align: 'left', reveal: pTxt, seed: 450 + idx
    });
    text(L_postLine, it.sub, 185, it.y + 145, {
      col: PAL.sage, size: 28, align: 'left', reveal: pTxt, seed: 460 + idx
    });

    // Live Persimmon-Red Crayon Checkmark Box on the right of each card
    const chkBox = [[865, it.y + 62], [935, it.y + 62], [935, it.y + 132], [865, it.y + 132]];
    line(L_postLine, chkBox, { col: PAL.espresso, w: 4.5, p: 0.85, closed: true, seed: 470 + idx, draw: pTxt });
    line(L_postLine, [[878, it.y + 98], [898, it.y + 120], [948, it.y + 52]], {
      col: PAL.persimmon, w: 8.5, p: 0.95, seed: 480 + idx, draw: pChk
    });
  });

  // Bottom Handmade Stamp Card on the Kraft Board (y = 1140..1360)
  const pEnd = clamp((lt - 4.2) / 0.8);
  const stampPoly = ellipse(540, 1255, 370, 78, 48);
  fill(L_postFill, stampPoly, { col: PAL.whiteWax, p: 0.94, gap: 7, w: 10, seed: 490, draw: pEnd });
  line(L_postLine, stampPoly, { col: PAL.persimmon, w: 6.5, p: 0.92, closed: true, seed: 491, draw: pEnd });
  text(L_postLine, "牛皮纸蜡笔手账 · KRAFT CRAYON ZINE", 540, 1246, {
    col: PAL.espresso, size: 33, align: 'center', reveal: pEnd, seed: 492
  });
  text(L_postLine, "留出 30% 空白，让好故事自己发光", 540, 1294, {
    col: PAL.persimmon, size: 28, align: 'center', reveal: pEnd, seed: 493
  });
}

export function frame(comp, t) {
  clear(L_preFill);
  clear(L_preLine);
  clear(L_wash);
  clear(L_collage);
  clear(L_postFill);
  clear(L_postLine);

  CAM.x = W / 2;
  CAM.y = H / 2;
  CAM.s = 1.0;
  comp.paperCam(W / 2, H / 2, 1.0);

  if (t < 8.5) {
    renderAct1(t);
  } else if (t < 16.5) {
    renderAct2(t);
  } else {
    renderAct3(t);
  }

  // 1. Base Unbleached Kraft Paper (#D5BE9E = [0.835, 0.745, 0.620])
  comp.begin([0.835, 0.745, 0.620], [0, 0]);
  // 2. Pre-wash Crayon Fills & White-Wax Highlights/Resist (#FFFDF7)
  comp.crayon(L_preFill.c, { gain: 1.04, soft: 0.07 });
  comp.crayon(L_preLine.c, { gain: 1.08, soft: 0.06 });
  // 3. Warm Amber Oolong Tea Watercolour Wash (darkens kraft into roasted amber, beads off white & coloured wax!)
  comp.wash(L_wash.c, { color: [0.58, 0.40, 0.25], resist: 0.95, edge: 1.35, gran: 0.52 });
  // 4. Torn 5mm Grid-Paper Patches (#F7F3E8) & Translucent Diagonal-Striped Washi Tape
  comp.collage(L_collage.c);
  // 5. Post-collage Crayon Annotations, Study Notes & Live Persimmon-Red Circles/Arrows
  comp.crayon(L_postFill.c, { gain: 1.02, soft: 0.07 });
  comp.crayon(L_postLine.c, { gain: 1.08, soft: 0.06 });
  // 6. Final Paper-Tooth Emboss & Warm Study-Desk Lamp Glow
  comp.finish({ vig: 0.25, emb: 0.56, lift: 1.15, lamp: [0.28, 0.36, 0.95, 0.16] });
}
