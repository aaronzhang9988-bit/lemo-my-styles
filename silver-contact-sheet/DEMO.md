# Silver Gelatin Contact Sheet — our demo & dual-aspect engine

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: style-frame engine for *银盐接触印相 × 红铅笔暗房手记* · source in [`demo/`](demo/)

## Dual aspect-ratio support (`1920×1080` & `1080×1440`)

Run from the library root (`$LIB`), with the absolute path to this folder:

1. **`1920×1080` (16:9, default)**:
   ```bash
   node core/render/still.mjs <my-styles>/silver-contact-sheet/demo 1.0 --out <out_dir>
   ```
2. **`1080×1440` (3:4, vertical)**:
   ```bash
   node core/render/still.mjs <my-styles>/silver-contact-sheet/demo 1.0 --size 1080x1440 --q mode=vertical --out <out_dir>
   ```

## Reusable engine architecture in `demo/`

```
silver-contact-sheet/demo/
  index.html  Entry page; @font-face for Noto Serif SC (600, 700) and Playfair Display (700) inline
  main.js     Picks 1920×1080 (horizontal) or 1080×1440 (?mode=vertical) and drives renderFrame()
  gl.js       makeSilverContactComp(): 4-pass WebGL2 compositor
                - FS_BARYTA
                - FS_SILVER
                - FS_WAX_LOUPE
                - FS_FINAL
  scene.js    createLayers() / clearLayers() / renderFrame() / renderHorizontalScene() / renderVerticalScene()
                - draw35mmFilmStrip: sprocketed strips, rebate code, frame numbers
                - drawSilverPhotoScene: the photographed frames
                - drawEnlargerWorkPrint: 8×10" work print with test strip
                - drawZoneStepWedge: Zone 0–X wedge
                - drawGreaseSelectBox, drawGreaseRejectX, drawDodgeBurnZone: China-marker annotations
                - drawLoupeBezel: loupe body
  fonts/      notoserifsc-600.woff2 + notoserifsc-700.woff2 + playfair-700.woff2
```

## Not kept yet
- No `build.sh`, `CREDITS`, `styleframe.jpg` or `test.mp4` in this folder: render a style frame with the commands above when you need one.
