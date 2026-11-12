# Wes Anderson Wool-Felt Diorama — our demo & dual-aspect engine

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: style-frame engine for *韦斯·安德森毛毡光影剧场* · source in [`demo/`](demo/)

## Dual aspect-ratio support (`1920×1080` & `1080×1440`)

Run from the library root (`$LIB`), with the absolute path to this folder:

1. **`1920×1080` (16:9, default)**:
   ```bash
   node core/render/still.mjs <my-styles>/wes-anderson-felt/demo 1.0 --out <out_dir>
   ```
2. **`1080×1440` (3:4, vertical)**:
   ```bash
   node core/render/still.mjs <my-styles>/wes-anderson-felt/demo 1.0 --size 1080x1440 --q mode=vertical --out <out_dir>
   ```

## Reusable engine architecture in `demo/`

```
wes-anderson-felt/demo/
  index.html  Entry page; @font-face for Noto Serif SC (600, 700) and Playfair Display (700) inline
  main.js     Picks 1920×1080 (horizontal) or 1080×1440 (?mode=vertical) and drives renderFrame()
  gl.js       makeWesFeltComp(): 4-pass WebGL2 compositor
                - FS_STAGE_FELT
                - FS_DIORAMA_PLUSH
                - FS_STITCH_BRASS
                - FS_FINAL
  scene.js    createLayers() / clearLayers() / renderFrame() / renderHorizontalScene() / renderVerticalScene()
                - drawGrandHotelDiorama: three-storey pink hotel, lobby, rooms 217/218, funicular No. 4
                - drawMendlsBox: Mendl's pastry box with ribbon
                - drawFeltCypressTree, drawFeltCloud: scenery
                - drawFeltNoteCard: chapter title cards
                - drawRunningStitchRect, drawSewnButton: stitch and button details
  fonts/      notoserifsc-600.woff2 + notoserifsc-700.woff2 + playfair-700.woff2
```

## Not kept yet
- No `build.sh`, `CREDITS`, `styleframe.jpg` or `test.mp4` in this folder: render a style frame with the commands above when you need one.
