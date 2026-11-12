# Changes & Original Design — Nordic Papercut Lightbox Theatre (北欧童话多层剪纸光影剧场)

Base reference: none (original 3-pass WebGL2 shader; no library style as technique base). Every row below is new, so "base" is "—".

## §1 Core concept & dual aspect-ratio framing
- **New original direction**: H. C. Andersen's own paper cuts, Nordic winter-solstice shadow boxes and stop-motion stage design: depth comes from real stacked layers and the light behind them, not perspective.
- **Dual-format native support**: `1920×1080` (16:9, default `?mode=horizontal`) and `1080×1440` (3:4, `--q mode=vertical`), each with its own layout (`renderHorizontalScene()` / `renderVerticalScene()`), not a crop of the other.

## §2 Materials, shaders & surface physics
- **`FS_BACKLIGHT`**: Translucent vellum diffuser with a hidden 2700K candle source: `#FFF5D1` → `#F5A34A` → `#AD5961` → `#1C3357`.
- **`FS_PAPER_LAYER`**: Run once per card layer (`L1_skyPeaks` → `L2_fjordVillage` → `L3_forestBridge` → `L4_foregroundArch` → `L5_prosceniumFrame`), each mipmapped: multi-radius parallax `shadow` cast onto every deeper layer, `cansonTooth` honeycomb grain with `sss` amber edge glow near the light, and a 1.5 px 45° scalpel `bevel` highlight on lit cut edges.
- **`FS_FINAL`**: Final grade and shadow-box vignette (walnut frame `#221A15`, gold-foil plate `#DFB15B`).

## §3 Palette, topics & invariants
- Palette and best-fit topics are fixed in [`STYLE.md`](STYLE.md) §2–§3; those hex values are the style's invariants.
- Type: `Noto Serif SC` (600/700) + `Playfair Display` (700), bundled in `demo/fonts/`.

| Section | Base | Now | Why |
|---|---|---|---|
| Concept | — | 北欧童话多层剪纸光影剧场 | original direction |
| Engine | — | 3-pass WebGL2 (`makePapercutComp` in `demo/gl.js`) | material physics drawn in-shader |
| Framing | — | 16:9 + 3:4 native layouts | horizontal films and vertical social cuts |
