# Kraft Crayon Zine — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *The Art of Margin (《茶之书》：为什么「留白」反而装得下更多？)* (24 s, `1080×1440` 3:4 vertical) · source in [`demo/`](demo/)

## Story & structure

A 3:4 vertical (`1080×1440`) book-breakdown & life-philosophy zine spread across three acts on warm `#D5BE9E` unbleached kraft paper:
- **Act 1 (`0.0–8.5 s`, hero styleframe at `t = 4.0 s`)**: *The Kyoto Study Desk & The Art of Margin*. A bottom torn-edge 5mm grid-paper note card (`#F7F3E8`) and an upper-right floating grid tag slap down onto the kraft board (`paper_slap`) and are pinned by diagonal-striped Matcha (`#6D8C73`) and Terracotta (`#E05A3F`) washi tape strips (`tape_rip`). An espresso-brown crayon (`#2B1E16`) sketches a dusty-blue ceramic tea bowl (`#5B7C99`) on a sage bamboo coaster, a mustard brass desk lamp (`#E8B84B`), and an open book (`《茶之书》`) with creamy white wax pages (`#FFFDF7`). Creamy white wax draws rising steam, sparkles, and ginkgo leaves on the kraft stock; a warm Amber Oolong Tea watercolour wash (`wash()`) sweeps across the upper stage, darkening the kraft paper while beading off the white wax (`resist = 0.95`). Finally, a live persimmon-red crayon (`#E05A3F`) double-circles `30% 的呼吸感` on the bottom grid card and draws a curved callout arrow up to the bowl's 30% breathing rim.
- **Act 2 (`8.5–16.5 s`)**: *100% Overstuffed Cup vs. 70% Calm Tea Bowl*. Side-by-side visual contrast on the vertical kraft page showing why an overfilled cup spills at the slightest bump while a 70% bowl leaves room for aroma and insight (DMN cognitive margin).
- **Act 3 (`16.5–24.0 s`)**: *Three Daily Margin Rules & Handmade Stamp*. Three torn 5mm grid strips (`①`, `②`, `③`) slap down with alternating washi tapes and live persimmon-red crayon checkmarks (`✓`), closing on the oval white-wax & persimmon stamp (`牛皮纸蜡笔手账 · KRAFT CRAYON ZINE`).

## Reusable engine in `demo/`

```
kraft-crayon-zine/demo/
  index.html  1080×1440 vertical canvas entry point
  main.js     WebGL2 compositor init, font preloader, 12 fps BOIL stepper
  gl.js       WebGL2 compositor: #D5BE9E kraft paper + pulp flecks → pre-wash wax crayon → amber-tea watercolour wash (wax resist) → torn grid & washi collage pass → post-wash crayon annotations → final paper-tooth emboss & desk lamp glow
  crayon.js   Canvas2D stroke & collage engine: PAL (Warm Kyoto Zine Box palette), line(), fill(), dab(), handCircle(), arrow(), text(), drawTornGridPatch(), drawWashiTape()
  film.js     3-act vertical timeline, EV foley cues, SUBS subtitles
  fonts/      patrickhand.woff2 + zcoolkuaile-subset.woff2 + fonts.css
```

## Rendering commands

- **Render a single vertical frame (`1080×1440`)**:
  ```bash
  node core/render/still.mjs <work> 4.0 --size 1080x1440 --out <out_dir>
  ```
- **Render full video (`1080×1440`, 24 fps)**:
  ```bash
  node core/render/video.mjs <work> --size 1080x1440 --fps 24 --workers 3
  ```
