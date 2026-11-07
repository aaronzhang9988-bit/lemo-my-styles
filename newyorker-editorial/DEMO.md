# New Yorker Gouache Editorial — our demo & dual-aspect engine

Demo: *The Attention Paradox (《为什么我们越讲效率，反而越没有时间？》)* · source in [`demo/`](demo/)

## Dual aspect-ratio support (`1920×1080` & `1080×1440`)

The engine in [`demo/`](demo/) natively supports **both** 16:9 widescreen magazine spreads (`1920×1080`) and 3:4 vertical magazine columns (`1080×1440`):

1. **Render `1920×1080` (16:9 横屏《纽约客》特稿跨页 — Default)**:
   ```bash
   node core/render/still.mjs C:/Users/W/lemo-my-styles/newyorker-editorial/demo 1.0 --out <out_dir>
   ```
2. **Render `1080×1440` (3:4 竖屏杂志封面 / 深度专栏页 — Vertical Mode)**:
   ```bash
   node core/render/still.mjs C:/Users/W/lemo-my-styles/newyorker-editorial/demo 1.0 --size 1080x1440 --q mode=vertical --out <out_dir>
   ```

## Reusable engine architecture in `demo/`

```
newyorker-editorial/demo/
  index.html  Entry page loading subsetted Noto Serif SC (600 & 700) and Playfair Display (700)
  main.js     Auto-detects 1920×1080 (horizontal spread) vs 1080×1440 (?mode=vertical magazine column)
  gl.js       5-pass WebGL2 physical shader compositor:
                - FS_PAPER: 300gsm warm cotton rag stock (#F5EFE4) with isotropic felt tooth & linter fibres
                - FS_GOUACHE: velvety matte opaque gouache with dry-brush bristle edge breakup & overlap darkening
                - FS_CHARCOAL: powdery vine-charcoal adherence on raised paper tooth + graphite construction lines
                - FS_TYPE: crisp letterpress editorial serif ink pass
                - FS_FINAL: cotton paper micro-relief emboss & subtle warm reading-room vignette
  scene.js    Complete New Yorker illustration & layout toolkit:
                - charcoalLine(): expressive vine-charcoal stroke with variable pressure & double-pass sketch option
                - gouacheShape(): velvety matte gouache polygon with intentional 3–4px print offset & dry-brush rim
                - charcoalHatchRect(): loose parallel charcoal shading lines
                - drawGraphiteConstruction(): faint studio compass arcs & axes
                - drawClimberFigure() & drawCalmReader(): Sempé/Steinberg style characters
                - renderHorizontalSpread() & renderVerticalColumn(): full 16:9 and 3:4 magazine layouts
  fonts/      notoserifsc-600.woff2 + notoserifsc-700.woff2 + playfair-700.woff2 + fonts.css
```
