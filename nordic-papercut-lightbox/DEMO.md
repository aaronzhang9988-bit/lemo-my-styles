# Nordic Papercut Lightbox Theatre — our demo & dual-aspect engine

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: style-frame engine for *北欧童话多层剪纸光影剧场* · source in [`demo/`](demo/)

## Dual aspect-ratio support (`1920×1080` & `1080×1440`)

Run from the library root (`$LIB`), with the absolute path to this folder:

1. **`1920×1080` (16:9, default)**:
   ```bash
   node core/render/still.mjs <my-styles>/nordic-papercut-lightbox/demo 1.0 --out <out_dir>
   ```
2. **`1080×1440` (3:4, vertical)**:
   ```bash
   node core/render/still.mjs <my-styles>/nordic-papercut-lightbox/demo 1.0 --size 1080x1440 --q mode=vertical --out <out_dir>
   ```

## Reusable engine architecture in `demo/`

```
nordic-papercut-lightbox/demo/
  index.html  Entry page; @font-face for Noto Serif SC (600, 700) and Playfair Display (700) inline
  main.js     Picks 1920×1080 (horizontal) or 1080×1440 (?mode=vertical) and drives renderFrame()
  gl.js       makePapercutComp(): 3-pass WebGL2 compositor
                - FS_BACKLIGHT
                - FS_PAPER_LAYER
                - FS_FINAL
  scene.js    createLayers() / clearLayers() / renderFrame() / renderHorizontalScene() / renderVerticalScene()
                - drawLighthouseAndVillage: Falu-red lighthouse, stepped-gable houses, vellum windows (`#FFF2B8`)
                - drawPaperSpruceTree: layered cut spruce forest
                - drawReindeerAndCourier: nine-point folk reindeer and lantern courier
                - drawHangingPaperStar: eight-point Bethlehem stars
                - drawPaperRibbonBanner: chapter scroll banner
  fonts/      notoserifsc-600.woff2 + notoserifsc-700.woff2 + playfair-700.woff2
```

## Not kept yet
- No `build.sh`, `CREDITS`, `styleframe.jpg` or `test.mp4` in this folder: render a style frame with the commands above when you need one.
