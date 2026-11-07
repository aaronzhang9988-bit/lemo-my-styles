# Lab Press Grid · 工程套印网格 — Style Prompt

Based on Swiss Motion Graphics (`swiss-motion`) from Lemo-Opuscar; borrows halftone overprint, redaction bars and spec stamps from Halftone Dossier (`halftone-dossier`).

> International Typographic Style printed on warm engineering archive stock: a modular 12-column grid, deep iron-navy and cyan-blue overprinted inks with 45° halftone dot fields, one international safety-orange signal colour, hydraulic spec stamps, and movement as exact as a Bell Labs printing press.
> References (grammar only): 1950s–70s Zurich grid systems (Müller-Brockmann, Gerstner) fused with 1970s Bell Labs / NASA technical manuals and offset print proofs. Never copy a specific historical poster's composition, never use Helvetica or Akzidenz font files, never name a real institution on a poster unless the user's topic is about it.

## 1. Essence, and what it is not

- **2D engineering graphic design animated on a modular grid**: warm mottled archive paper, deep iron-navy ink, cyan-blue 45° halftone dot layers (`multiply` overprint), and **one** international safety-orange signal colour.
- **Every element snaps to the grid, every move lands on a beat, nothing bounces.** Even borrowed print moves (redaction bars and verification stamps) obey strict `cubic-bezier(.7,0,.2,1)` hydraulic precision without cartoon overshoot.
- **Rigor with one exception**: the whole frame obeys a technical specification system, so the one element that breaks off-grid (or triggers a redaction reveal) becomes the protagonist.
- **Extreme scale contrast**: a giant misregistered numeral (with `+4px/+4px` cyan overprint shadow) next to tiny monospace calibration notes and four-corner blueprint HUD markers.

Not a keynote (no soft gradients, no glassmorphism, no 3D device renders), not kinetic typography for a lyric video (words don't fly, spin or bounce), not a comic-book pop-art collage (halftone dots serve strictly as modular tonal fields and secondary data mass, never speech bubbles or cartoon outlines), not a Bauhaus pastiche of primary shapes.

## 2. Materials & rendering

- **Frame grid**: 1920×1080, 12 columns, ~96 px side margins, 24 px gutters, 24 px baseline. The frame acts as an **engineering spread**: a left page (the specification programme: giant numeral, rule/clause text, redaction blocks, calibration notes) and a right page (the technical artifact / schematic).
- **Artifact grid** derived from the content (Gerstner): what the columns and rows *mean* is a design decision. **Choose module sizes that give the elements mass**; too many thin columns make a layout look like a generic spreadsheet.
- **Archive paper layer**: built once on an offscreen canvas and composited over the frame (`multiply`), featuring low-frequency warm mottling, fine per-pixel paper fibre noise, a subtle warm vignette (`rgba(110,95,75,0.22)` at corners), a faint vertical spine crease at `x = 960` (or the spread gutter), and sparse static/2-frame paper specks.
- **Halftone dot fields**: rotated 45° grids of circles (`step` 16–22 px, radius driven by a linear or radial density field, `maxK` ~0.64) drawn in cyan-blue overprint ink (`#2A6F97`) with `globalCompositeOperation = 'multiply'`. Used inside secondary data bars, behind giant chapter numerals, or inside schematic zones to give tactile print depth without adding extra colours.
- **Bars and blocks** are flat rects; consecutive cells of one unit merge into one bar, overdrawn 1 px at seams (antialiasing shows hairlines, especially when rotated or scaled).
- **A secondary voice** is carried by cyan-blue halftone dot blocks or muted warm-grey (`#C8C2B6`) ruled modules under the primary iron-navy bars.
- **A 2D camera matrix** (centre, scale, rotation) for all moves.

## 3. Colour logic

- **Warm archive paper, two structural engineering inks (iron-navy + cyan overprint), and one safety-orange signal colour.**
  - **Outer desk / page ground**: `#EDE8DF` (warm grey-beige archive stock)
  - **Inner artifact sheet**: `#F6F3EC` (warm ivory specification paper)
  - **Primary ink**: `#0F1B29` (deep iron-navy, used for body type, primary data bars, redaction bars, and rule lines)
  - **Overprint / secondary ink**: `#2A6F97` (cyan-blue, always drawn with `multiply` blend mode for `+4px/+4px` headline misregistration shadows, 45° halftone dot fields, and coordinate crosshairs)
  - **Signal colour (protagonist)**: `#FF4F00` (international safety orange — reserved strictly for the rule-breaking element, active playhead/measurement hits, hydraulic verification stamps, and key-term highlight blocks)
  - **Grid & calibration lines**: `#D5CFC4` on page, `#DED9CE` on sheet, `#6E737B` for muted technical annotations.
- Overprint (`multiply`) is core to the look: `#0F1B29` navy type over `#FF4F00` safety orange, and `#2A6F97` cyan offset shadows under `#0F1B29` headlines.
- Never add another signal colour; cyan-blue is strictly a structural overprint/halftone ink, leaving `#FF4F00` as the sole focal protagonist.

## 4. Type & subtitles

- **Tri-font technical hierarchy** (all OFL, self-hosted and loaded via `document.fonts.load` before frame 0):
  1. **CJK & Display Headlines**: `Noto Sans SC` (weights 500, 700, 900) paired with `Archivo` (weights 400–800) for Latin titles and giant numerals. Letter-spacing ~−2 % at ≥ 90 px.
  2. **Technical HUD, Rulers & Data Readouts**: `JetBrains Mono` (weights 500, 700, 800) for `DOC-ID` tags, grid coordinates (`COL 05.00 · ROW 00.00`), timestamps, and module dimensions.
- **Misregistration shadow on headlines & giant numerals**: every primary title (≥ 64 px) and giant chapter numeral (500–700 px) is drawn twice — first at `(x + 4, y + 4)` in `#2A6F97` with `globalCompositeOperation = 'multiply'`, then at `(x, y)` in `#0F1B29`. Never apply misregistration to small body text (< 36 px) or HUD readouts, keeping small text razor-sharp.
- **Four-corner Engineering HUD**:
  - Top-left: Document ID & classification chip (`DOC-SPEC // LPG-01` + chapter/rule index) with a 1 px `#0F1B29` ruled box.
  - Top-right: Scale ratio, tempo/grid lock status (`GRID LOCK: ON · 120 BPM · SCALE 1:1`), and a tiny safety-orange status square.
  - Bottom-left: Technical module specs (`MOD 12×16 · HALFTONE 45° · OVERPRINT +4PX`).
  - Bottom-right: Live bar/beat counter (`BAR 04.2`) and frame coordinate readout.
- **Flush left, ragged right**; everything sits on a grid line; big archive-paper space is part of the layout. Giant numerals are **optically** flush left.
- **Subtitles are part of the layout**, not a floating bottom overlay: each line sits flush-left at a column start in the current composition (a small monospace lead-in + a bold statement), clip-revealed on the beat or whisper timestamp. **Key terms sit over a solid `#FF4F00` safety-orange rectangular block** with `#F6F3EC` or `#0F1B29` text. Hold ≥ max(1.8 s, speech + 0.6 s); assert it in code.

## 5. Motion quality

- **Two curves only**: a precise ease `cubic-bezier(.7,0,.2,1)` for all snaps, redaction slices, and hydraulic stamps; `linear` for ruling lines being drawn, playheads, and the off-grid exception. No overshoot, no spring, no cartoon bounce.
- **Durations are note values** at the film's tempo (120 BPM: 1/4 = 0.5 s, 1/8 = 0.25 s, 1/16 = 0.125 s). A snap starts one note value early and **lands on the beat**.
- **Entrances are wipes or clip-reveals, never fades**: words rise out of a clip rect from below the baseline and leave upward; lines grow along their length; paper sheets appear by a crisp vertical or horizontal wipe; big numerals climb in eased modular steps ("one module at a time").
- **Deletions are knife cuts**: a 2 px `#FF4F00` or `#0F1B29` line crosses the element in 1/16 note, then the element collapses vertically to its midline in 1/8 note.
- **Redaction reveals**: key clauses or numbers start covered by a solid `#0F1B29` censor bar (with a tiny monospace `[REDACTED // 待解密]` tag); on the beat, a `#FF4F00` cut line slices across and the black bar wipes away horizontally with `cubic-bezier(.7,0,.2,1)` to reveal the underlying text or halftone module.
- **Hydraulic spec stamp**: a double-bordered rectangular engineering stamp (`[VERIFIED · 核准]` or `[SPEC LOCKED]`) in `#FF4F00` with a `+3px/+3px` `#2A6F97` overprint shadow snaps from `1.35×` to `1.0×` in `0.125 s` (1/16 note) using `cubic-bezier(.7,0,.2,1)`, tilted strictly at `0°` or `-4°`, locking dead-still on impact with zero bounce.
- **The exception moves differently**: linear, unsnapped, pausing mid-flight; its coordinate readout switches from `ON GRID` (`#0F1B29`) to `OFF GRID // ANOMALY` (`#FF4F00`).
- Smooth 24 fps, no stepping: mechanical precision printed on tactile stock.

## 6. Camera grammar

A vocabulary, not a route. The 2D camera moves only with the precise ease `cubic-bezier(.7,0,.2,1)` and only on beats. Opening and ending come from the topic.

| Move | What it expresses | Can serve |
|---|---|---|
| Locked engineering spread | specification (left) → schematic/artifact (right) | a rule applied; a before/after; theoretical vs measured |
| Hard pan by one page or column | the next step in a pipeline | a sequence; a system architecture; a timeline |
| Rotate 90° and stop | the same structure read another way | a layout read as a time-series score; a table turned into a waveform |
| Pull out to a wall of spec sheets | one programme, many outputs | a product matrix; batch verification; a historical archive |
| Snap push into a halftone module | microscopic scrutiny of one data unit | a bottleneck; an outlier metric; a hidden clause |
| Grid extends past the sheet | the system exceeds the document | scale; paradigm shift; breaking a constraint |
| Split frame into equal cells | parallel test cases | A/B benchmarks; competing architectures |
| Vertical scroll through a spec column | auditing a dossier | a bill of materials; a protocol log; a checklist |

Framing: everything locked to the grid; only the `#FF4F00` exception element may sit off-grid. Transitions are wipes, knife cuts, camera snaps and re-flows; never dissolves.

## 7. Sound palette

- **Music with a grid of its own (120 BPM)**: a steady mechanical pulse whose subdivisions match visual snap durations. Motorik kit and tight synth bass, paired with grid-mapped marimba/vibraphone or metallic glockenspiel notes where column = pitch and row = onset.
- **Picture and music can share one data file** (`score.json`), so the schematic on the right page literally plays as the musical score.
- **Dynamic arrangement moves**: drop the drums for the one bar when the exception breaks the grid; insert a **half-beat total silence right before the hydraulic spec stamp lands** so the stamp impact owns the frame.
- **Industrial press foley**, dry and close, no wet reverb:
  - Heavy letterpress metal clack on headline snaps;
  - Ruling pen / caliper metallic slide (`tss-click`) on grid line extensions;
  - Guillotine blade snick on knife-cut deletions;
  - Redaction tape rip / sharp shutter slide when censor bars retract;
  - **Hydraulic stamp thud** (low 55 Hz press thump + crisp metallic latch click + paper crunch) on stamp lock.
- **The exception sings**: a clean analog sine/triangle glide following its off-grid trajectory.
- **Mix**: voice compressed and ≥ 6 dB above music, music ducked ~10 dB under voice, mastered to −14 LUFS.

## 8. Native moves

A menu: use the ones your story needs.

- **The grid means something.** Columns and rows become a real quantity (layers, milliseconds, years, frequency bands). *Fits content like:* chip architecture; business unit margins; protocol stack latency.
- **Snap = beat.** Every arrival is a mechanical press hit. *Fits content like:* a benchmark breakdown; a 5-step algorithm; a teardown checklist.
- **Redaction reveal (borrowed & adapted).** Key parameters or conclusions enter blacked-out under `#0F1B29` censor bars and slice open on the beat. *Fits content like:* exposing a hidden cost; declassifying a core metric; debunking a myth.
- **Hydraulic spec stamp (borrowed & adapted).** A rectangular double-rule engineering stamp slams with zero bounce after a brief silence drop. *Fits content like:* passing a stress test; locking a conclusion; certifying a winner.
- **Extreme scale contrast with misregistration.** A 600 px numeral with `+4px` cyan overprint shadow beside 18 px monospace calibration notes. *Fits content like:* a 10× speedup; a critical year; a rule number.
- **The exception.** One `#FF4F00` element breaks off the grid linearly while its HUD tag flips to `OFF GRID`. *Fits content like:* a disruptive technology; an anomaly in the dataset; a paradigm shift.
- **Knife cut & re-flow.** Obsolete items are sliced through their midline and collapse, and remaining modules snap into the freed space nearest-first. *Fits content like:* cutting legacy bloat; optimizing a workflow; pruning model parameters.

## 9. Pitfalls of the medium

- Too many thin columns look like a generic spreadsheet → use fewer, wider modules with strong mass.
- Halftone dots too small (< 14 px step at 1080p) cause moiré aliasing in H.264 video → keep dot step between 16 px and 24 px, and never animate dot positions inside a static bar.
- Misregistration shadow on small text (< 36 px) makes it blurry and unreadable → apply the `+4px/+4px` `#2A6F97` offset strictly to headlines (≥ 64 px), giant numerals, and stamps; keep small notes and HUD text single-layer `#0F1B29`.
- Paper texture drawn with `source-over` washes out dark inks → composite the paper mottling layer with `multiply` (or bake the warm `#EDE8DF` / `#F6F3EC` base first and overlay subtle dark/light grain specks at low alpha) so `#0F1B29` stays deep and crisp.
- Rotating and labelling at once reads as visual noise → rotate (1.5 beats), hold on the beat, then wipe in labels.
- Merged bars show hairline seams after rotation → overdraw 1 px where adjacent cells join.
- Elements that share the camera matrix leak into adjacent shots → draw off-page artifacts only during the pull-out shot.
- Canvas `letterSpacing` affects `measureText` → always measure after setting the font and `letterSpacing`.
- Onsets that fall between frames flicker → place visual hits on exact frame boundaries.

## 10. Engine

In `demo/`: `ease.js` (`cubic-bezier(.7,0,.2,1)`, `snap()`, ` lin()`, `steps()`, `track()`), `film.js` (warm archive paper generator, 45° cyan halftone dot renderer, misregistered headline drawer, four-corner engineering HUD, redaction bar slice-reveal, hydraulic spec stamp, knife cuts, 90° schematic rotation and multi-sheet wall pull-out), `main.js`, `score.json`, `mix.py` (120 BPM motorik pulse + industrial press & hydraulic stamp foley), and `build.sh`. Base reference engine: `$LIB/styles/swiss-motion/DEMO.md` and `$LIB/styles/halftone-dossier/DEMO.md`.

## 11. Variation space

You decide the system, what the grid columns and rows mean, which metrics start redacted, what triggers the off-grid exception, and when the hydraulic stamp certifies the result:

- Structures: **an engineering audit** (three legacy assumptions sliced away by knife cuts, one redacted bottleneck revealed, one off-grid breakthrough certified by a stamp); **a benchmark matrix** (columns = architectures, rows = load stages, rotated 90° into a throughput waveform); **a protocol sequence** (a 12-step pipeline assembling on the right sheet while rules print on the left).
- Openings: **a redacted specification sheet** where the first orange knife line slices open the title; **a giant misregistered numeral `01`** locking into place with a cyan halftone block behind it; **a single safety-orange calibration crosshair** expanding into the 12-column grid.
- Endings: **the hydraulic spec stamp `[VERIFIED // 核准]`** locking onto the completed schematic after a half-beat silence; **a pull-out to a wall of certified blueprint sheets**; **the empty archive grid** after all temporary scaffolding is cut away, leaving only the verified law.

---

How our demo was made: [DEMO.md](DEMO.md). Base style reference: `$LIB/styles/swiss-motion/DEMO.md`.
