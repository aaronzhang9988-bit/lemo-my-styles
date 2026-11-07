# Song Silk & Mineral Gold — our demo & dual-aspect engine

Demo: *A Thousand Li of Autumn Clarity (《千里江山 · 岩彩描金考》)* · source in [`demo/`](demo/)

## Dual aspect-ratio support (`1920×1080` & `1080×1440`)

The engine in [`demo/`](demo/) natively supports **both** widescreen album-leaf (`1920×1080`) and 3:4 vertical hanging-scroll (`1080×1440`) compositions:

1. **Render `1920×1080` (16:9 横屏宋人册页 — Default)**:
   ```bash
   node core/render/still.mjs C:/Users/W/lemo-my-styles/song-mineral-gold/demo 1.0 --out <out_dir>
   ```
2. **Render `1080×1440` (3:4 竖屏宋画立轴 — Vertical Mode)**:
   ```bash
   node core/render/still.mjs C:/Users/W/lemo-my-styles/song-mineral-gold/demo 1.0 --size 1080x1440 --q mode=vertical --out <out_dir>
   ```

## Reusable engine architecture in `demo/`

```
song-mineral-gold/demo/
  index.html  Entry page loading subsetted Noto Serif SC (600 & 700)
  main.js     Auto-detects 1920×1080 (horizontal album leaf) vs 1080×1440 (?mode=vertical hanging scroll)
  gl.js       5-pass WebGL2 physical shader compositor:
                - FS_SILK: warp/weft woven Song silk + tea patina + Song brocade mounting frame
                - FS_MINERAL: crushed stone crystal granulation + alum-glue water tide edge + mica sparkle
                - FS_INK: matte pine-soot ink + porous Cinnabar seal paste (印泥漏丝)
                - FS_GOLD: normal-mapped 24K mud-gold specular lighting driven by uLight
                - FS_FINAL: silk relief emboss + brocade border + warm palace-lantern glow
  scene.js    Complete Song painting brush toolkit:
                - drawMineralMountain(): 3-tier Ochre → Malachite → Azurite peaks + Mud-Gold contours & axe-cut strokes
                - drawShellMist(): Calcined clam-shell white valley mist bands
                - drawPineFan(): Malachite cushion + soot-ink & mud-gold radiating pine needles
                - drawSongPavilion(): Upturned Song eaves, Cinnabar columns, warm lantern window & golden tile ribs
                - drawSongCrane(): Emperor Huizong style white crane with Cinnabar crown & mud-gold feather filaments
                - drawSongBoat(): Scholar skiff on golden fish-scale water ripples
                - drawCinnabarSeal() & drawVerticalText(): Carved yin/yang seals & vertical 乌丝栏 calligraphy
  fonts/      notoserifsc-600.woff2 + notoserifsc-700.woff2 + fonts.css
```
