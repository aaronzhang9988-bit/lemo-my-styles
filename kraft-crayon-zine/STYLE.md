# Kraft Crayon Zine · 牛皮纸蜡笔手账

Based on [Crayon Picture Book](crayon-book).
Default size: 1080×1440.

A 3:4 vertical (`1080×1440`) Kyoto-style tactile kraft sketchbook zine: warm wheat-brown unbleached kraft paper (`#D5BE9E`), torn-edge cream 5mm grid-paper note patches (`#F7F3E8`), translucent diagonal-striped washi tape, deep espresso wax crayon outlines (`#2B1E16`), luminous creamy white wax crayon highlights & resist (`#FFFDF7`), and live persimmon-red study annotations.


## 1 · Core concept

**A vertical study & storytelling zine handcrafted on toned kraft paper.** Every frame is a single 3:4 (`1080×1440`) vertical page of a heavy unbleached kraft-paper notebook (`#D5BE9E`), onto which the narrator has torn and taped cream 5mm squared note-paper patches (`#F7F3E8`) with Japanese washi tape, drawn warm wax-crayon illustrations with visible creamy-white wax highlights (`#FFFDF7`), circled key ideas in persimmon-red crayon (`#E05A3F`), and brushed an amber-tea watercolour wash that beads off the wax.

**Why toned kraft paper changes everything.** On white paper, white crayon is invisible until a dark wash passes over it. On `#D5BE9E` warm wheat-brown kraft stock, **creamy white wax crayon (`#FFFDF7`) is a first-class luminous drawing tool from frame one** — catching light on teacup rims, clouds, pages, eyeglasses, and character cheeks — while *still* acting as a hydrophobic wax-resist barrier when a warm amber-tea or twilight-indigo watercolour wash sweeps across the page.

**The act of note-taking and colouring is the plot.** Concepts are not faded in with digital opacity: a torn 5mm grid patch slaps down onto the kraft board, strips of抹茶绿 (matcha) or 赤陶红 (terracotta) washi tape pin its corners, an espresso-brown crayon sketches the scene live, coloured and creamy-white crayons hatch the forms, and a persimmon-red crayon circles the takeaway on the beat.

**2D/3D classification**: Pure 2D (`WebGL2` paper-tooth & wax-resist compositor + `Canvas 2D` crayon ribbon & hatching engine; zero 3D passes, runs at ~150 ms/frame on integrated graphics).


## 2 · Materials, strokes & paper

The image is built from four physical desk materials — **unbleached kraft paper**, **torn 5mm grid-paper patches**, **translucent washi tape**, and **oil-wax crayons + tea-tint watercolour wash** — composited through a real-time WebGL2 paper-tooth shader.

### Unbleached kraft paper base (`#D5BE9E`)
- **Base stock**: Warm wheat-brown kraft paper (`#D5BE9E`, shader RGB `[0.835, 0.745, 0.620]`), 300 gsm cold-press grain with subtle horizontal wood-pulp fibre streaks and low-frequency warm mottling (`±3.5%`).
- **Paper tooth heightfield**: Multi-octave value noise (`1.35 px`, `2.9 px`, `6.3 px` plus directional pulp fibres `x/10, y/1.9`), contrast-stretched with `smoothstep(0.16, 0.86)` and embossed at strength `0.55` in the final pass so every wax stroke and paper patch shares the physical relief of the board.
- **Anchored grain**: The paper tooth is anchored to paper coordinates (`paperCam`), never screen-space static, and never jittered frame-to-frame.

### Torn-edge 5mm grid-paper patches (`#F7F3E8`)
- **Stock**: Cream-white notebook paper (`#F7F3E8`) with a crisp `24 px` (≈5 mm) squared ruling grid in muted sage-grey (`rgba(109, 140, 115, 0.22)`).
- **Torn fibrous deckle edge**: At least one edge (typically the top edge of the bottom subtitle note card, or all four edges of a floating callout card) is hand-torn using a multi-frequency displacement profile (`±4–9 px`), exposing a `3–5 px` paler fibrous white paper core (`#FFFDF9`) before casting a soft contact shadow (`rgba(43, 30, 22, 0.16)`, offset `(2, 4) px`) onto the kraft board below.
- **Placement**: The primary grid patch occupies the lower ~26–28% of the `1080×1440` frame (`y ≈ 1030..1380`), serving as the dedicated study-note & subtitle stage. Smaller torn patches (`260×130 px`) can be slapped onto the upper kraft area for numbered key points or formulas.

### Translucent diagonal-striped washi tape
- **Look**: `90–130 px × 28–34 px` strips of semi-translucent Japanese paper tape (`alpha ≈ 0.78`), tilted at `±12°–28°` across the top corners or centre top edge of a grid patch.
- **Variants**:
  - **Matcha Stripe**: Sage green base (`#6D8C73`) with diagonal cream stripes (`#F7F3E8`).
  - **Terracotta Stripe**: Persimmon/terracotta base (`#E05A3F`) with diagonal warm-gold stripes (`#F7F3E8`).
- **Torn ends**: Both short ends of every tape strip have a 5-tooth zigzag serrated tear (as if ripped from a tape dispenser).

### Wax crayon strokes & hatching
- **Adhesion threshold**: Wax sticks only where crayon pressure `p` exceeds the paper-tooth pit depth: `tooth > 1.0 - 1.22 * p` (soft edge `±0.07`). Heavy pressure (`p ≈ 0.85–0.95`) fills almost the whole tooth; light shading (`p ≈ 0.45–0.65`) skips across the raised ridges, letting the `#D5BE9E` kraft paper or `#F7F3E8` grid paper breathe through.
- **Outlines**: Deep espresso-roast brown crayon (`#2B1E16`), `6–8 px` screen width, hand wobble `±1.7 px`, tapered ends, with `2` internal wax-streak ridges.
- **Zigzag hatching fills**: Back-and-forth diagonal crayon strokes (`gap ≈ 10–11 px`, `width ≈ 11 px`, `overshoot ≈ 5–7 px` past the outline), with per-stroke pressure variation (`0.72–1.14×`) so individual back-and-forth hand strokes remain visible.
- **Line boil**: Held drawings are re-traced at **12 fps** (`BOIL.step = Math.floor(t * 12)`), shifting stroke jitter by `±0.8–1.2 px` so the page feels alive even when the camera is locked.


## 3 · Colour logic

### The "Warm Kyoto Zine Box" palette (8 sticks + 1 wash)

| Role | Name | Hex | Shader / RGB | Usage rule |
| :--- | :--- | :--- | :--- | :--- |
| **Base Board** | Unbleached Kraft (暖麦棕牛皮纸) | `#D5BE9E` | `[0.835, 0.745, 0.620]` | Full-frame vertical sketchbook background |
| **Note Patch** | Cream Grid Paper (奶油白方格纸) | `#F7F3E8` | `[0.969, 0.953, 0.910]` | Torn-edge 5mm squared note cards & subtitle stage |
| **Outline & Ink** | Espresso Brown (深浓咖蜡笔) | `#2B1E16` | `[0.169, 0.118, 0.086]` | All structural outlines, arrows, and main handwritten text |
| **Highlight & Resist** | Creamy White Wax (奶油白高光蜡笔) | `#FFFDF7` | `[1.000, 0.992, 0.969]` | **Visible highlights on kraft paper** (steam, rims, pages, stars, shirts) + hydrophobic wax-resist barrier |
| **Primary Accent** | Persimmon Red (柿子红蜡笔) | `#E05A3F` | `[0.878, 0.353, 0.247]` | Live study circles, underlines, key arrows, warm focal props, terracotta washi tape |
| **Warm Illumination** | Mustard Ochre (芥末黄蜡笔) | `#E8B84B` | `[0.910, 0.722, 0.294]` | Desk lamps, ideas/lightbulbs, gold badges, warm wood, autumn leaves |
| **Calm Botanical** | Sage Matcha (鼠尾草绿蜡笔) | `#6D8C73` | `[0.427, 0.549, 0.451]` | Foliage, books, calm clothing, matcha washi tape, secondary tags |
| **Cool Counterweight** | Dusty Ceramic Blue (雾霾蓝蜡笔) | `#5B7C99` | `[0.357, 0.486, 0.600]` | Ceramic cups, sky patches, shadows, calm analytical elements |
| **Skin / Warmth** | Soft Apricot (暖杏肉色蜡笔) | `#F2C9A0` | `[0.949, 0.788, 0.627]` | Character faces, hands, warm bread/paper |
| **Watercolour Wash** | Amber Oolong / Twilight Tea (琥珀茶汤水彩) | — | Transmission `[0.52, 0.36, 0.22]` or `[0.22, 0.28, 0.40]` | Sweeps over the kraft page at the emotional/insight peak; beads off white & coloured wax (`resist = 0.93`) |

### Colour rules
- **Always use Creamy White (`#FFFDF7`) on the kraft board**: Every illustration on the `#D5BE9E` kraft paper must include at least 15–25% `#FFFDF7` white crayon hatching or rim highlights so the tonal range spans from `#2B1E16` (deep espresso) past `#D5BE9E` (mid-tone kraft) all the way up to `#FFFDF7` (luminous white wax).
- **Never fill the kraft background with edge-to-edge crayon**: Leave at least **35–45% of the `#D5BE9E` kraft paper and `#F7F3E8` grid paper exposed** so the handmade collage aesthetic breathes.


## 4 · Type & annotation system

### Font stack (self-hosted `.woff2` subsets)
- **Chinese display & study notes**: `ZCOOL KuaiLe` (站酷快乐体) — playful, rounded, hand-lettered strokes that pair naturally with chunky wax crayon outlines.
- **Latin, numbers & English tags**: `Patrick Hand` — warm, legible marker/crayon handwriting.

### Three-tier zine annotation hierarchy
1. **Top Corner Header Tag (手账页眉角标, `y ≈ 60..140`)**:
   - Small numbered badge (`#01`, `NOTE · 读书手账`) in `#E05A3F` persimmon red or `#6D8C73` sage green, paired with a compact topic title (`52–64 px`) and a hand-drawn wavy crayon underline on the upper kraft margin.
2. **In-Scene Marginalia & Callouts (画面旁注与引线, `y ≈ 180..980`)**:
   - Short 2–5 word insight labels (`36–44 px`) written directly on the kraft paper or on small `240×95 px` torn grid tags, connected to the illustration by a curved `#2B1E16` or `#E05A3F` crayon arrow.
3. **Bottom Torn-Grid Subtitle & Takeaway Card (底部撕边方格纸笔记区, `y ≈ 1030..1370`)**:
   - The main spoken narration subtitle (`46–52 px` in `#2B1E16` espresso brown) and key summary bullet sit inside the bottom `#F7F3E8` torn 5mm grid patch, pinned by diagonal-striped washi tape.
   - Key terms inside the subtitle card are circled or underlined live in `#E05A3F` persimmon-red crayon (`p = 0.85`).


## 5 · Composition & framing (`1080×1440` 3:4 Vertical)

### Vertical zine zoning
- **Canvas**: `1080×1440` (3:4 portrait aspect ratio).
- **Safe margins**: `64 px` left/right (`x: 64..1016`), `64 px` top/bottom (`y: 64..1376`).
- **Three vertical zones**:
  - **Zone A — Header & Chapter Strip (`y: 64..190`)**: Notebook corner stamp, chapter badge, and title banner.
  - **Zone B — Main Kraft Illustration & Callout Stage (`y: 190..1010`, height `820 px`)**: Central crayon illustration on `#D5BE9E` kraft stock, flanked by white-wax highlights, marginalia arrows, and optional watercolour wash bands.
  - **Zone C — Torn 5mm Grid Note Card (`y: 1010..1365`, height `355 px`)**: Cream `#F7F3E8` torn-edge grid paper patch pinned with washi tape at the top corners (`x ≈ 150` and `x ≈ 910`), holding the primary handwritten narration, numbered takeaway, and red-crayon emphasis circle.
- **No book-gutter crease**: Because this is a vertical single-sheet study pad / zine page, never draw a horizontal or vertical centre book spine.


## 6 · Motion & camera

- **2D camera over the vertical kraft page**: Most beats play on a locked or gently drifting vertical page (`CAM.s = 1.0`), optionally pushing in (`CAM.s = 1.15–1.35`) onto the central illustration during a detail breakdown, and pulling back to the full `1080×1440` page when a new torn grid patch or red-crayon circle lands.
- **Substitution animation & 12 fps boil**: Characters and props animate on **2s or 3s (12 fps / 8 fps)** with pose substitution rather than robotic 60 fps tweening.
- **Draw-on progression (`draw: 0 → 1`)**: Outlines sketch themselves in `0.35–0.70 s` first; zigzag crayon hatching fills in `0.40–0.80 s` immediately after; white-wax highlights (`#FFFDF7`) go down last as the finishing touch.


## 7 · Sound

### Acoustic zine desk score
- **Lead & harmony**: Fingerpicked **nylon-string guitar / ukulele** (`karoryfer` / acoustic plucked strings) + **kalimba / celesta / music box** (`salamander` / `vsco2ce`), supported by warm upright bass pizzicato.
- **Forbidden instruments**: Heavy synth bass, distorted electric guitars, orchestral brass fanfares, or industrial metallic slams.
- **Tempo & feel**: Relaxed coffee-shop / study-desk groove (`76–92 BPM` in 4/4 or 3/4), warm and intimate.

### Essential tactile foley (synced to `events.mjs`)
- `tape_rip` — crisp, fibrous tearing sound when a strip of washi tape is ripped and slapped onto a grid patch corner (`0.12–0.18 s`).
- `paper_slap` — soft, crisp slap of a torn 5mm grid-paper patch landing on the kraft board (`0.10–0.16 s`).
- `crayon_draw` — dry stick-slip wax crayon rubbing across coarse paper tooth during live outlines, hatching, and red-crayon circles.
- `wash_sweep` — wet bristle brush sweeping amber-tea watercolour across the page, accompanied by gentle kalimba/celesta glints (`glint`) as hidden white-wax motifs appear.


## 8 · Native moves (what this style does best)

Every film in `kraft-crayon-zine` should showcase at least **three** of these four signature moves:

1. **White-Wax Highlight & Tea-Wash Resist on Kraft Paper (牛皮纸白蜡高光与茶汤显影)**:
   - Draw key highlights (rising steam, lightbulb glow, white shirt/pages) and hidden background symbols in `#FFFDF7` creamy white wax crayon directly on the `#D5BE9E` kraft paper. When the warm amber-tea or indigo-tea watercolour wash sweeps across the stage (`wash()`), the unpainted kraft paper deepens richly while the `#FFFDF7` white wax repels the liquid (`resist = 0.93`) and shines out with dramatic contrast.
2. **Torn Grid Patch & Washi Tape Slap (撕边方格纸与和纸胶带拍贴)**:
   - Introduce the core takeaway or chapter card by slapping a torn-edge `#F7F3E8` 5mm grid-paper patch onto the page (`paper_slap`), followed `0.12 s` later by two diagonal-striped washi tape strips (`#6D8C73` matcha & `#E05A3F` terracotta) snapping across its corners (`tape_rip`).
3. **Live Persimmon-Red Crayon Circle & Arrow Callout (柿子红蜡笔实时画圈与箭头批注)**:
   - When the narrator lands the punchline or key insight, a thick `#E05A3F` persimmon-red crayon (`w = 8–10 px`, `p = 0.90`) draws a lively double-looped hand circle (`handCircle` with `over = 0.22`) or curved arrow around the crucial word or visual detail.
4. **Live Sketch-to-Hatch Build (浓咖勾线→彩蜡排线→白蜡提亮三步手绘)**:
   - Reveal the central subject through the authentic hand-drawing sequence on kraft stock: `#2B1E16` espresso outline draws on (`draw: 0 → 1`), `#E8B84B` / `#6D8C73` / `#5B7C99` zigzag crayon hatching fills the volume, and `#FFFDF7` white crayon strokes add the crisp rim highlight last.

**Fits content like**:
- Book breakdowns & reading notes (读书拆解、经典名著/商业畅销书精华手账)
- Biographies, creator stories & historical anecdotes (人物传记、大师故事、品牌的诞生)
- Psychology, cognitive science & life philosophy explainers (心理学效应、思维模型、治愈系生活哲学)
- Warm product/craft stories & cultural heritage micro-docs (器物故事、手工艺科普、饮食文化图鉴)
