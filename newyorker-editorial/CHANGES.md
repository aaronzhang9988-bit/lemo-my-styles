# Changes & Original Design — New Yorker Gouache Editorial (《纽约客》炭笔水粉插画报)

Base reference: `urban-sketch` / `risograph` (elevated into an original 5-pass cotton-rag + matte gouache + vine charcoal + letterpress serif editorial engine)

## §1 Core concept & dual aspect-ratio framing
- **New original direction**: **Intellectual Magazine Gouache & Charcoal Editorial (`《纽约客》炭笔水粉插画报 / New Yorker Gouache Editorial`)**, inspired by *The New Yorker* covers & cartoons (Saul Steinberg, Sempé, Christoph Niemann) and *Monocle* editorial spreads.
- **Dual-format native support**:
  1. **`1920×1080` (16:9 横屏杂志特稿跨页 `Editorial Spread`)**: Double-ruled masthead across the top (`y: 52..122`) + Left/Center (~62% width) visual-metaphor gouache & charcoal illustration with single-line italic cartoon caption underneath + Right (~35% width) serif headline, giant terracotta Drop-Cap (`首字下沉`) essay paragraph, French Ultramarine gouache pull-quote box, and palette swatches.
  2. **`1080×1440` (3:4 竖屏杂志封面 / 深度专栏页 `Vertical Magazine Column`)**: Centered cover masthead & headline (`y: 52..222`) + Center visual-metaphor illustration (`y: 240..940`) + Bottom cartoon caption, left Drop-Cap essay column, right Ultramarine pull-quote card, and bottom swatch bar (`y: 952..1365`).

## §2 Materials, shaders & surface physics
- **300gsm Warm Cotton Rag Paper (`FS_PAPER`)**: Isotropic felt weave + random cotton linter fibres (`#F5EFE4`) with micro-relief emboss in the final pass.
- **Velvety Matte Opaque Gouache (`FS_GOUACHE`)**: Simulates chalky, non-glossy opaque gouache pigment with dry-brush bristle breakup at stroke edges (`tooth > 1.0 - alpha * 1.32`) and an intentional `3–4 px` plate offset from the charcoal outlines.
- **Dry Vine Charcoal & Graphite Construction Marks (`FS_CHARCOAL`)**: Powdery charcoal strokes (`#1C1A18`) that cling to the raised peaks of the cotton paper tooth, paired with faint graphite (`#7D766C`) compass arcs and artist margin notes.
- **Crisp Letterpress Editorial Serif (`FS_TYPE`)**: Razor-sharp `Noto Serif SC` & `Playfair Display` headlines, drop-caps, and captions that contrast against the loose hand-drawn illustration.
