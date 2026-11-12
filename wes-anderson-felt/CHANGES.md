# Changes & Original Design — Wes Anderson Wool-Felt Diorama (韦斯·安德森毛毡光影剧场)

Base reference: none (original 4-pass WebGL2 shader; no library style as technique base). Every row below is new, so "base" is "—".

## §1 Core concept & dual aspect-ratio framing
- **New original direction**: Wes Anderson's planimetric symmetry, pastel clashes and hand-made stop-motion props: everything sits dead centre and every edge shows it was cut and sewn by hand.
- **Dual-format native support**: `1920×1080` (16:9, default `?mode=horizontal`) and `1080×1440` (3:4, `--q mode=vertical`), each with its own layout (`renderHorizontalScene()` / `renderVerticalScene()`), not a crop of the other.

## §2 Materials, shaders & surface physics
- **`FS_STAGE_FELT`**: Procedural Merino `woolFeltField` with melange flecks over a glacier-mint striped felt wall (`#84B1AE`), lit by a 2900K studio top light.
- **`FS_DIORAMA_PLUSH`**: `fuzzShift` high-frequency sample offsets grow 1.5–2.5 px stray fibres and a backlit `fuzzRim` on every patch; `plushShade` + `dome` from mipmapped colour/alpha gradients give quilted puff highlights, dark undersides and a soft stop-motion drop shadow.
- **`FS_STITCH_BRASS`**: Cotton running stitch and four-hole sewn buttons pressed 1.5 px into the felt, twisted-thread sheen and brushed-brass key-tag glints.
- **`FS_FINAL`**: Final grade and stage vignette.

## §3 Palette, topics & invariants
- Palette and best-fit topics are fixed in [`STYLE.md`](STYLE.md) §2–§3; those hex values are the style's invariants.
- Type: `Noto Serif SC` (600/700) + `Playfair Display` (700), bundled in `demo/fonts/`.

| Section | Base | Now | Why |
|---|---|---|---|
| Concept | — | 韦斯·安德森毛毡光影剧场 | original direction |
| Engine | — | 4-pass WebGL2 (`makeWesFeltComp` in `demo/gl.js`) | material physics drawn in-shader |
| Framing | — | 16:9 + 3:4 native layouts | horizontal films and vertical social cuts |
