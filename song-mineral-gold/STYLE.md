# Song Silk & Mineral Gold · 宋韵古绢 × 矿物岩彩描金

Based on [Chinese Ink Wash](ink-wash) (original mineral-on-silk & specular mud-gold shader architecture).
Default size: 1920×1080 (also natively supports `1080×1440` 3:4 vertical hanging scroll).

A museum-grade Song-dynasty aesthetic made in 2D WebGL2 shaders: tea-aged woven silk (`#C8B490`) with warp/weft thread relief, three-tier crushed mineral rock pigments (Azurite `石青`, Malachite `石绿`, Cinnabar `朱砂`, Ochre `赭石`, Shell White `蛤粉`), 24K specular mud-gold contour lines (`泥金复勾`) that glint under roving candlelight, `泥金乌丝栏` vertical calligraphy columns, and porous Cinnabar seal stamps, framed by a dark indigo Song brocade mounting border (`宋锦装裱`).


## 1 · Core concept

**A living Song-dynasty silk album leaf and mineral treatise.** Instead of flat digital gradients or monochrome ink on white paper, every frame is painted onto **woven tea-aged Song silk (`古绢`)** using the authentic five-step imperial *Blue-and-Green (`青绿金碧`)* process:
1. **Ink bone (`墨骨`)**: Crisp pine-soot ink (`松烟墨`) defines the structural anatomy and `斧劈皴` (axe-cut rock facets).
2. **Ochre under-wash (`赭石打底`)**: Warm burnt mineral ochre gives earthly warmth beneath the cool greens and blues.
3. **Malachite & Azurite layering (`石绿叠染、石青罩顶`)**: Crushed malachite green clothes the mid-slopes while deep lapis/azurite blue crowns the sunlit ridges, veiled at the waist by opaque calcined clam-shell white (`蛤粉`) mist.
4. **24K Mud-Gold double contour (`泥金复勾与追光`)**: Fine lines of real gold powder (`泥金`) trace mountain ridges, pine needles, architectural eaves (`界画飞檐`), water ripples, and diagram callouts — catching a roving warm palace-lantern light so the gold shimmers even in a tranquil shot.
5. **Imperial Editorial Inscription (`泥金乌丝栏题跋与朱白文印`)**: Classical vertical calligraphy columns ruled in mud-gold (`乌丝栏`), paired with carved Cinnabar seals (`朱文/白文印章`) and diamond mineral swatches.

**2D/3D classification**: Pure 2D (`WebGL2` 5-pass physical material compositor + `Canvas 2D` tapered brush engine; ~250 ms/frame on integrated graphics).


## 2 · Materials, strokes & silk physics

### Tea-aged woven Song silk (`FS_SILK`)
- **Silk weave heightfield**: Horizontal weft (`纬线`, ~2.65 px period) and vertical warp (`经线`, ~2.35 px period) plain-weave modulation with organic raw-silk slubs (`竹节粗丝`) and tiny inter-thread pinholes (`绢眼`).
- **Patina & mounting**: Base tone `#C8B490` (`[0.784, 0.706, 0.565]`) with low-frequency tea/incense mottling and gentle edge darkening. Framed all around by a `28 px` dark slate-indigo **Song brocade border (`宋锦绫边`, `#252C36`)** and a `2.5 px` inner **antique mud-gold fillet (`泥金界线`)**.
- **Breathing silk rule (*计白当黑*)**: Always leave **35–50% of the aged silk unpainted** so the woven silk texture and warm patina carry the atmosphere.

### Crushed mineral rock pigments (`FS_MINERAL`)
- **Crystal granulation**: Multi-scale mineral noise adds `1–2 px` crushed stone facets and subtle `mica` crystal sparkles inside thick Azurite and Malachite washes.
- **Alum-glue tide edge (`胶矾水晕边`)**: Pigment pools slightly at brushstroke boundaries (`textureLod` mip diff), reproducing the characteristic mineral water-ring of Song silk paintings.

### 24K Specular Mud-Gold (`FS_GOLD`)
- **Normal-mapped metallic glint**: Strokes drawn onto `L_gold` compute screen-space bevel normals combined with the underlying silk thread normal and fine gold-powder grain, lit by a movable warm point light (`uLight`).
- **Line weight**: Keep mud-gold lines refined (`1.2–3.0 px`). Gold is an aristocrat's accent, never a heavy cartoon outline.


## 3 · Colour logic

| Role | Traditional Name | Hex | RGB / Shader | Usage rule |
| :--- | :--- | :--- | :--- | :--- |
| **Base Silk** | Tea-Aged Song Silk (茶褐古绢) | `#C8B490` | `[0.784, 0.706, 0.565]` | Full album-leaf ground (keep 35–50% exposed) |
| **Brocade Mount** | Indigo Song Brocade (宋锦深青绫边) | `#252C36` | `[0.145, 0.172, 0.212]` | `28 px` outer frame + `2.5 px` gold inner fillet |
| **Peak Crest** | Deep Azurite / Lapis (头青 · 青金石) | `#153258` | `[0.082, 0.196, 0.345]` | Upper 40–50% of mountain peaks, lower pavilion eaves |
| **Mid Slope** | Deep & Mid Malachite (头绿/二绿 · 孔雀石) | `#1E564A` / `#327A66` | `[0.196, 0.478, 0.400]` | Middle mountain slopes, pine needle cushions, upper eaves |
| **Facet Highlight** | Third Malachite (三绿) | `#5EA088` | `[0.369, 0.627, 0.533]` | Sunlit angular rock facets |
| **Warm Under-wash** | Burnt Mineral Ochre (赭石) | `#8F5636` | `[0.561, 0.337, 0.212]` | Mountain base under-wash, tree trunks, boats, sub-labels |
| **Opaque White** | Calcined Clam-Shell White (蛤粉) | `#F3EFE4` | `[0.953, 0.937, 0.894]` | Full moon, waist mist bands, crane wings, waterfalls, scholar robes |
| **Vermilion Accent** | Natural Cinnabar (朱砂 / 八宝印泥) | `#B63628` / `#AD281D` | `[0.714, 0.212, 0.157]` | Pavilion columns, crane crown dot, carved seal stamps |
| **Structural Ink** | Pine-Soot Ink (松烟墨) | `#1F1B17` | `[0.122, 0.106, 0.090]` | Rock bone lines, axe-cut strokes, vertical calligraphy |
| **Specular Gold** | 24K Mud-Gold (泥金) | `#D9B25F` → `#FFF5C8` | Dynamic normal-lit | Ridge double-contours, pine needles, water ripples, `乌丝栏` rules |


## 4 · Type, seals & annotation system

### Font stack (self-hosted `.woff2` subsets)
- **Classical Chinese calligraphy & subtitles**: `Noto Serif SC` (思源宋体 SemiBold `600` & Bold `700`) — crisp Song woodblock & imperial catalogue stroke terminals.
- **Three-tier Song editorial hierarchy**:
  1. **`泥金乌丝栏` Vertical Inscription Panel (竖排题跋界格)**: Double-ruled mud-gold rectangular frame divided into `4–5` vertical columns (`width ≈ 75–80 px` per column), reading right-to-left: rightmost column holds the main title (`28–32 px` Bold), middle columns hold poetic/analytical verses (`22–24 px`), leftmost column holds the colophon (`落款`) and two square Cinnabar seals (`朱文` & `白文`).
  2. **Mud-Gold Leader Callouts (泥金引线精微批注)**: `4.5 px` mud-gold dot on a key visual feature + `45°` elbow leader line (`1.6 px` mud-gold) leading to a bracketed Chinese term (`【头青·青金石】...`) and small ochre English/technical subtitle.
  3. **Bottom Subtitle & Diamond Mineral Swatches (菱形矿物色标与字幕)**: Four mud-gold-rimmed diamond swatches (`◆ 石青`, `◆ 石绿`, `◆ 朱砂`, `◆ 蛤粉`) paired with the spoken narration subtitle (`26–29 px`).


## 5 · Composition & dual framing (`1920×1080` & `1080×1440`)

This style natively supports **both** widescreen and vertical short-video platforms:

### Mode A · `1920×1080` (16:9 横屏宋人册页 / 手卷对开 — Default)
- **Left & Center (`x: 32..1380`, ~70% width)**: Panoramic *Three-Distances (`三远法`)* mineral landscape — full moon (`x ≈ 285, y ≈ 195`), ancient pine on left foreground promontory, soaring white cranes, cascading waterfall, Song waterside pavilion (`x ≈ 815, y ≈ 682`), and scholar skiff on golden rippled water.
- **Middle-Right Open Silk (`x: 980..1380`)**: Clean breathing silk space for mud-gold callout leader labels.
- **Right Column (`x: 1410..1840`, ~25% width)**: `泥金乌丝栏` vertical inscription panel (`y: 88..685`), four diamond mineral swatches (`y: 745..830`), and bottom narrative subtitle (`y: 946..1018`).

### Mode B · `1080×1440` (3:4 竖屏宋画立轴 — Vertical Mode)
- Triggered automatically when `--size 1080x1440` (or `?mode=vertical`) is used.
- **Upper Zone (`y: 60..460`)**: Left full moon & clouds (`x ≈ 235, y ≈ 215`) + Right `泥金乌丝栏` vertical inscription panel (`x: 620..1012, y: 76..455`).
- **Center Towering Landscape (`y: 290..1150`)**: Classic Northern Song *High-Distance (`高远法`)* vertical composition — towering Azurite main peak (`x ≈ 355, y ≈ 295`), soaring cranes, mid-ground waterfall (`x ≈ 525`), waterside pavilion (`x ≈ 665, y ≈ 875`), and foreground pine (`x ≈ 185..420`).
- **Bottom Zone (`y: 1065..1380`)**: Golden water ripples & scholar skiff (`y: 1065..1180`), separated by a horizontal mud-gold rule (`y = 1235`) from the four diamond mineral swatches (left) and two-line poetic subtitle (right).


## 6 · Motion & camera

- **Roving Palace-Lantern Light (`uLight` sweep)**: Even when the camera is locked or drifting slowly (`pan speed ≤ 25 px/s`), the warm candle/lantern light source (`uLight`) glides gently across the silk (`x: 0.25 → 0.72`), causing a wave of 24K gold specular highlights to travel along the mountain ridges, pine needles, and water ripples.
- **Four-Step Mineral Painting Reveal**: New scenes build in the authentic Song order:
  1. `松烟墨` ink outlines & axe-cut strokes draw on (`0.0–0.8 s`);
  2. `赭石 → 石绿 → 石青` mineral washes bloom into the silk valleys (`0.5–1.5 s`);
  3. `蛤粉` mist drifts across the mountain waists (`1.2–2.2 s`);
  4. `泥金` gold contours trace over the ridges with a travelling light glint (`1.6–2.6 s`), followed by the crisp `印泥` Cinnabar seal stamp (`2.8 s`).


## 7 · Sound

- **Instruments**: Solo **Guqin (`古琴`泛音与散音)** or plucked **Nylon/Silk strings**, **Xiao (`洞箫`)** long breathy notes, and delicate **bronze chime / singing bowl (`编钟/颂钵`)** harmonics synced to the 24K mud-gold light glints.
- **Foley**: Soft mineral powder grinding (`研钵碾石声`), hair-brush sweeping across taut silk (`刷绢声`), and the soft, heavy thud of a carved stone seal pressing into cinnabar paste (`盖印声`).


## 8 · Native moves (what this style does best)

1. **24K Mud-Gold Candlelight Chase (泥金迎烛追光)**: A warm light sweeps across the aged silk, igniting the fine mud-gold mountain ridges, roof eaves, and `乌丝栏` rules with real metallic specular glints.
2. **Three-Tier Mineral Stratification (青绿三叠设色显影)**: Mountains and objects materialize in three distinct mineral layers (`赭石` warm earth → `石绿` malachite → `石青` azurite crest) with visible crushed-stone granulation.
3. **Shell-White Mist Separation (蛤粉云岚断山)**: Opaque calcined shell-white mist (`#F3EFE4`) sweeps horizontally across the waist of peaks or pavilions, separating foreground from infinity and opening clean silk space for callouts.
4. **Mud-Gold Ruled Colophon & Cinnabar Seal Stamp (乌丝栏题跋与朱印落款)**: Every chapter or conclusion is anchored by a mud-gold `乌丝栏` vertical inscription and sealed with a porous Cinnabar stamp (`朱文/白文印`).

**Fits content like**:
- Chinese history, classical poetry, art history & museum explainers (历史人文、宋词美学、文物与古画拆解)
- Architecture, tea ceremony, incense, porcelain & craft stories (古建园林、宋代点茶/香道/汝窑器物志)
- Biographies of scholars, artists & eastern philosophy (苏轼/王希孟等人物传记、东方哲学沉思)
- High-end cultural brands & luxury storytelling (高端中式美学品牌叙事、节气风物志)
