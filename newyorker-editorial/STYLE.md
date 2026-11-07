# New Yorker Gouache Editorial · 《纽约客》炭笔水粉插画报

Based on [Urban Sketch](urban-sketch) & [Risograph Print](risograph) (original cotton-rag + matte gouache + vine charcoal + editorial serif shader architecture).
Default size: 1920×1080 (also natively supports `1080×1440` 3:4 vertical magazine column).

An intellectual magazine illustration and essay aesthetic inspired by *The New Yorker*, *Monocle*, Saul Steinberg, and Sempé: 300gsm warm cotton rag paper (`#F5EFE4`), velvety matte opaque gouache colour blocks with dry-brush bristle edges and `3–4 px` misregistration offset, loose vine-charcoal sketching with faint graphite construction arcs, visual-metaphor storytelling, giant Drop-Cap (`首字下沉`) serif columns, and witty single-line cartoon captions.


## 1 · Core concept

**A living intellectual magazine spread where visual metaphor meets editorial typography.** Instead of literal diagrams or generic icons, every concept is expressed through a **witty architectural/human visual pun** (e.g., an efficiency bar-chart that becomes a steep escalator climbed by a hurried professional, while a calm reader sits under a warm reading lamp outside the chart).

**The tension between razor-sharp type and loose hand-drawn art.** What makes *The New Yorker* look unmistakably cultured is the contrast between **impeccable letterpress serif typography** (double-ruled masthead, high-contrast headlines, giant Drop-Cap, italic caption) and **spontaneous, tactile studio media** (crumbly vine charcoal, faint pencil compass arcs left un-erased, and chalky matte gouache brushed slightly outside the lines).

**2D/3D classification**: Pure 2D (`WebGL2` 5-pass physical paper/gouache/charcoal/type compositor + `Canvas 2D` brush engine; ~140–180 ms/frame on integrated graphics).


## 2 · Materials, strokes & paper physics

### 300gsm warm cotton rag stock (`FS_PAPER`)
- **Base stock**: Warm ivory cotton rag paper (`#F5EFE4`, shader RGB `[0.961, 0.941, 0.898]`) with isotropic cold-press felt tooth and short directional cotton linter fibres.
- **Generous breathing paper**: Always leave **45–55% of the `#F5EFE4` cotton paper exposed** around the central visual metaphor and inside the editorial margins.

### Velvety matte opaque gouache (`FS_GOUACHE`)
- **Chalky velvet opacity**: Unlike transparent watercolour, gouache (`不透明水粉`) covers the paper with a flat, chalky, matte finish (`chalk` micro-scatter) and **dry-brush bristle feathering** where the stroke lifts at the edges.
- **Intentional `3–4 px` plate offset**: Every gouache fill (`gouacheShape`) is shifted by `(+3, +3) px` relative to its charcoal outline so a sliver of bare `#F5EFE4` paper breathes along one edge and the colour overlaps the charcoal on the opposite edge.

### Dry vine charcoal & graphite construction (`FS_CHARCOAL`)
- **Vine charcoal outlines (`#1C1A18`)**: Loose, expressive double-pass outlines (`w = 2.4–3.4 px`) with natural hand wobble (`wob = 1.3–1.6`) and parallel diagonal hatching (`charcoalHatchRect`) for shadow planes.
- **Un-erased graphite construction lines (`#7D766C`)**: Faint `1.2–1.5 px` compass arcs (`drawGraphiteConstruction`), horizon axes, and `Fig. 1` margin notes remain visible behind the main illustration like an artist's studio original.


## 3 · Colour logic

| Role | Editorial Name | Hex | RGB / Shader | Usage rule |
| :--- | :--- | :--- | :--- | :--- |
| **Cotton Stock** | Warm Cotton Rag (纯棉版画纸) | `#F5EFE4` | `[0.961, 0.941, 0.898]` | Full magazine page ground (keep 45–55% exposed) |
| **Primary Gouache** | French Ultramarine (法式群青) | `#1D3C6B` | `[0.114, 0.235, 0.420]` | Major structural volumes, columns, pull-quote cards |
| **Focal Gouache** | Burnt Terracotta (焦赭朱红) | `#D14832` | `[0.820, 0.282, 0.196]` | Focal accent bar, fluttering scarf, book cover, kicker badge, Drop-Cap |
| **Warm Illumination** | Mustard Ochre (芥末暖黄) | `#E2A93B` | `[0.886, 0.663, 0.231]` | Background sun/clock halo, reading lamp cone, Drop-Cap backing |
| **Calm Counterweight** | Sage Olive (鼠尾草灰绿) | `#587764` | `[0.345, 0.467, 0.392]` | Armchairs, foliage, calm secondary blocks, margin annotations |
| **Highlight Gouache** | Titanium Cream White (钛白水粉) | `#FAF7F0` | `[0.980, 0.969, 0.941]` | Trench coats, shirts, clock faces, coffee cups, falling pages |
| **Sketch Line** | Vine Charcoal (柳木干炭笔) | `#1C1A18` | `[0.110, 0.102, 0.094]` | All illustration outlines and diagonal hatching |
| **Construction Line** | Studio Graphite (铅笔起稿线) | `#7D766C` | `[0.490, 0.463, 0.424]` | Compass arcs, axes, sub-captions, deck copy |
| **Editorial Type** | Letterpress Ink (报刊铅字黑) | `#151311` | `[0.082, 0.075, 0.067]` | Masthead, serif headlines, body copy, cartoon caption |


## 4 · Type & magazine layout system

### Font stack (self-hosted `.woff2` subsets)
- **Chinese editorial serif**: `Noto Serif SC` (`600` SemiBold & `700` Bold) — authoritative literary & philosophical magazine tone.
- **English masthead & captions**: `Playfair Display` (`700` Bold) — classic high-contrast Anglo-French magazine serif.

### Five signature editorial furniture elements
1. **Double-Ruled Masthead (双线报头)**: Top `2.6 px` heavy rule + `1.1 px` hairline rule + Issue/Category metadata + centered serif publication title.
2. **Terracotta Kicker & High-Contrast Headline (朱红栏目签与衬线大标题)**: White-on-terracotta small-caps kicker (`BOOKS & ESSAYS · 文化评论`) above a two-line Bold serif headline (`38–44 px`).
3. **Giant Drop-Cap Paragraph (首字下沉正文)**: `66–72 px` Burnt Terracotta initial character sitting on a soft Mustard Ochre gouache square, indenting the first three lines of the essay column.
4. **French Ultramarine Pull-Quote Box (群青水粉金句框)**: Hand-brushed `#1D3C6B` gouache card framed by a loose charcoal border, holding the core takeaway in `#FAF7F0` cream-white serif.
5. **Single-Line Cartoon Caption (《纽约客》式底部幽默图注)**: Centered underneath the illustration in quotation marks, delivering a dry, philosophical punchline.


## 5 · Composition & dual framing (`1920×1080` & `1080×1440`)

### Mode A · `1920×1080` (16:9 横屏特稿跨页 — Default)
- **Top Masthead (`y: 52..122`)**: Full-width magazine header (`x: 68..1852`).
- **Left & Center Illustration Stage (`x: 68..1200, y: 150..930`)**: Central visual metaphor (`cx ≈ 615, cy ≈ 555`) with graphite compass arcs, margin pencil notes, and the centered Cartoon Caption (`y: 968..1002`).
- **Vertical Divider Rule (`x = 1218, y: 152..1018`)**: Separates the illustration page from the essay column.
- **Right Essay Column (`x: 1262..1848, y: 160..970`)**: Kicker badge → Headline & Deck → Drop-Cap Essay Paragraph → Ultramarine Pull-Quote Box → 4 Gouache Swatch Circles.

### Mode B · `1080×1440` (3:4 竖屏封面 / 深度专栏页 — Vertical Mode)
- Triggered automatically when `--size 1080x1440` (or `?mode=vertical`) is passed.
- **Top Header (`y: 52..222`)**: Double rule + Kicker + Centered `44 px` Serif Headline & Deck.
- **Center Illustration Stage (`y: 240..940`)**: Full-width visual metaphor (`cx = 515, cy = 655`) with margin callouts.
- **Bottom Editorial Deck (`y: 952..1365`)**: Horizontal rule → Centered Cartoon Caption (`y = 996`) → Left Drop-Cap Essay Column (`x: 72..560`) + Right Ultramarine Pull-Quote Box (`x: 595..1012`) → Bottom 4 Gouache Swatches (`y = 1272`).


## 6 · Motion & camera

- **Pencil-to-Charcoal-to-Gouache Live Build**:
  1. Faint graphite compass arcs (`drawGraphiteConstruction`) spin in first (`0.0–0.5 s`);
  2. Loose vine-charcoal outlines (`charcoalLine`) sketch the architecture and characters (`0.3–1.2 s`);
  3. Velvety matte gouache blocks (`gouacheShape`) brush in with their signature `3–4 px` offset (`0.9–1.8 s`);
  4. The bottom Cartoon Caption and Pull-Quote snap into place on the beat (`1.8–2.4 s`).
- **12 fps Subtle Line Boil & Scarf Flutter**: The climber's terracotta scarf, rising coffee steam, and drifting calendar pages animate on 2s (`12 fps`) so the magazine page feels alive.


## 7 · Sound

- **Score**: Cool **chamber jazz / woody upright bass walking line + brushed snare + muted acoustic piano / vibraphone + clarinet** (think Woody Allen / *The French Dispatch* / intellectual podcast theme at `88–104 BPM`).
- **Foley**: Dry charcoal stick scratching cotton paper (`charcoal_sketch`), flat sable brush laying down gouache (`gouache_wash`), crisp magazine page turn (`page_turn`), and a mechanical typewriter / letterpress key strike on the caption reveal.


## 8 · Native moves (what this style does best)

1. **The Visual Metaphor Reveal (高级视觉双关显影)**: A dry statistical element (bar chart, pie chart, timeline, funnel) is drawn first, and then a human character in charcoal + terracotta gouache interacts with it physically (climbing it, sitting under it, opening it like a door).
2. **Off-Register Gouache Block Slap (水粉错版平涂)**: Bold French Ultramarine, Burnt Terracotta, and Mustard Ochre gouache shapes brush in with a `3–4 px` offset from the charcoal outlines.
3. **Graphite Compass & Margin Proof (铅笔圆规起稿线与旁注)**: Geometric construction arcs and `Fig. 1` pencil notes frame the central paradox before the colour arrives.
4. **The New Yorker Caption Punchline (《纽约客》式单行冷幽默图注)**: The scene concludes by printing a razor-sharp quoted one-liner beneath the illustration while the jazz piano lands a dry unresolved seventh chord.

**Fits content like**:
- Business commentary, economics, workplace culture & societal essays (商业评论、职场与社会现象观察、经济学悖论)
- Psychology, philosophy, cognitive science & book reviews (心理学深度洞察、《倦怠社会》式人文书评、播客高光切片)
- Media, technology ethics & AI impact reflections (科技人文反思、注意力经济、创作者访谈)
- Lifestyle, urban culture, coffee/wine/publishing stories (城市文化、阅读与生活方式、高审美个人 IP 观点)
