# Changes & Original Design — Silver Gelatin Contact Sheet (银盐接触印相 × 红铅笔暗房手记)

Base reference: none (original 4-pass WebGL2 shader; no library style as technique base). Every row below is new, so "base" is "—".

## §1 Core concept & dual aspect-ratio framing
- **New original direction**: Magnum's Paris darkroom, Cartier-Bresson's contact sheets and Ansel Adams' Zone System: choosing a frame is the story, so the marks of choosing are on screen.
- **Dual-format native support**: `1920×1080` (16:9, default `?mode=horizontal`) and `1080×1440` (3:4, `--q mode=vertical`), each with its own layout (`renderHorizontalScene()` / `renderVerticalScene()`), not a crop of the other.

## §2 Materials, shaders & surface physics
- **`FS_BARYTA`**: Dark wet bench with red-amber safelight (`#0E0D0F`) under a hand-torn 310gsm baryta fibre sheet (`#EFEAD9`) with pearl `barytaTooth` and hypo water-stain `ring`s.
- **`FS_SILVER`**: D-76 (1:1) / Rapid Selenium tone mapping: D-max `#0A0B0E`, selenium mid-tones `#2F3238` → `#8B8E8D`, Tri-X 400 `silverGrain` weighted `4·L·(1-L)`; keeps the amber rebate code (`#D89B48`), frame numbers, Zone 0–X wedge and the 6s/9s/12s/18s/24s f/8 test strip.
- **`FS_WAX_LOUPE`**: China-marker wax (`#E63B2E` crimson, `#F2B830` chrome yellow) with `waxSkip` drag breakup for SELECT/ALT boxes, ✕ rejects and BURN/DODGE dashed paths; Schneider 8× loupe computed in-shader: 1.36× barrel magnification, red/blue fringe, coated cyan rim highlight, knurled barrel shadow.
- **`FS_FINAL`**: Final paper emboss and darkroom vignette.

## §3 Palette, topics & invariants
- Palette and best-fit topics are fixed in [`STYLE.md`](STYLE.md) §2–§3; those hex values are the style's invariants.
- Type: `Noto Serif SC` (600/700) + `Playfair Display` (700), bundled in `demo/fonts/`.

| Section | Base | Now | Why |
|---|---|---|---|
| Concept | — | 银盐接触印相 × 红铅笔暗房手记 | original direction |
| Engine | — | 4-pass WebGL2 (`makeSilverContactComp` in `demo/gl.js`) | material physics drawn in-shader |
| Framing | — | 16:9 + 3:4 native layouts | horizontal films and vertical social cuts |
