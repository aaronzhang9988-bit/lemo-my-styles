# Changes & Original Design — Botanical Cyanotype Herbarium (19 世纪普鲁士蓝晒标本志)

Base reference: none (original 4-pass WebGL2 shader; no library style as technique base). Every row below is new, so "base" is "—".

## §1 Core concept & dual aspect-ratio framing
- **New original direction**: Anna Atkins' *Photographs of British Algae* (1843) and Kew archive cyanotypes: the plant itself is the negative, so translucency becomes the drawing.
- **Dual-format native support**: `1920×1080` (16:9, default `?mode=horizontal`) and `1080×1440` (3:4, `--q mode=vertical`), each with its own layout (`renderHorizontalScene()` / `renderVerticalScene()`), not a crop of the other.

## §2 Materials, shaders & surface physics
- **`FS_EMULSION`**: Hand-brushed iron-salt emulsion on 300gsm cold-press cotton rag (`#F4EFE2`): `cottonTooth` fibre relief, a 48–52 px uncoated margin with `bristleH`/`bristleV` dry-brush breakup and `edgePool` capillary pooling, Prussian-blue cloud mottling `#091E39` → `#143E68` → `#23598B`.
- **`FS_PHOTOGRAM`**: Specimen layer alpha = UV-blocking density: α 0.25–0.55 (leaf blade, fern pinnae, bracts) develops to ice cyan `#3877AA`–`#AAD2EA`; α 0.85–1.00 (veins, stems, roots, seeds) stays raw paper; a mipmap difference (`textureLod(uSpec, uv, 3.5).a - sp.a`) draws the deep contact halo around every outline.
- **`FS_COPPER`**: Post-wash overlay: linen herbarium tape (`#EFE9D8`) with shadow and copper stitch, metallic copper-gall ink (`#D88A52` → `#F2C18D`) for compass astrolabes, 360° tick rings, 137.5° golden-angle rules, leader-line callouts and the collector's cartouche.
- **`FS_FINAL`**: Normal-gradient cotton-tooth emboss over the full frame plus a museum display-case vignette.

## §3 Palette, topics & invariants
- Palette and best-fit topics are fixed in [`STYLE.md`](STYLE.md) §2–§3; those hex values are the style's invariants.
- Type: `Noto Serif SC` (600/700) + `Playfair Display` (700), bundled in `demo/fonts/`.

| Section | Base | Now | Why |
|---|---|---|---|
| Concept | — | 19 世纪普鲁士蓝晒标本志 | original direction |
| Engine | — | 4-pass WebGL2 (`makeCyanotypeComp` in `demo/gl.js`) | material physics drawn in-shader |
| Framing | — | 16:9 + 3:4 native layouts | horizontal films and vertical social cuts |
