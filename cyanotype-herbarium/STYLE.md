# Botanical Cyanotype Herbarium · 19 世纪普鲁士蓝晒标本志

- **Slug**: `cyanotype-herbarium`
- **Base**: original 4-pass WebGL2 cyanotype photogram & copper-gall compositor (`demo/gl.js`, `demo/scene.js`)
- **Aspect Ratios**:
  - `1920×1080` (`16:9` 横屏英国皇家学会 / 安娜·阿特金斯植物蓝晒标本跨页，默认 `?mode=horizontal`)
  - `1080×1440` (`3:4` 竖屏博物馆珍藏植物与斐波那契叶序图谱，通过 `--q mode=vertical` 切换)

## 1. Visual Soul & Material Physics (视觉灵魂与物理材质)

灵感源自 1843 年英国植物学家 **安娜·阿特金斯 (Anna Atkins)** 世界上第一部摄影插图集《英国藻类摄影标本志 (*Photographs of British Algae: Cyanotype Impressions*)》与伦敦邱园 (Kew Herbarium) 19 世纪铁盐接触印相档案：

1. **羊毫排笔手刷铁盐涂层 (`FS_EMULSION`)**：
   - 基底为 `300g` 粗纹冷压纯棉水彩纸（`#F4EFE2`），带有真实的棉浆纤维起伏（`cottonTooth`）与轻微岁月氧化暗斑。
   - 距四周画幅边缘 `48–52px` 处保留未经涂布的原色棉纸留白，交界处通过高频排笔刷毛噪声（`bristleH` / `bristleV`）与毛细积水边缘（`edgePool`）还原手工羊毫排笔刷涂 **柠檬酸铁铵 + 铁氰化钾** 感光液的飞白毛刺与深浅普鲁士蓝云纹（`#091E39` → `#143E68` → `#23598B`）。
2. **植物 X 光半透明紫外阻光印相与接触暗环 (`FS_PHOTOGRAM`)**：
   - 标本画布（`L_photogram`）的 Alpha 通道代表**物理阻挡紫外线的密度**：
     - **低阻光区（`α = 0.25..0.55`，半透明银杏叶肉、蕨类小羽片、向日葵外圈苞片）**：紫外线部分穿透，铁盐部分还原，显影为清澈发光的**冰青色 / 粉青色（`#3877AA` → `#AAD2EA`）**；
     - **高阻光区（`α = 0.85..1.00`，银杏二分叉叶脉、木质茎干、植物须根、蒴果心皮隔膜、向日葵果仁）**：完全阻挡紫外线，水洗后露出未曝光的**原色暖白纯棉纸（`#F4EFE2`）**；
     - **紫外接触衍射暗环（`halo`）**：通过 WebGL2 Mipmap 多级高斯差分（`textureLod(uSpec, uv, 3.5).a - sp.a`），在植物标本外轮廓一圈自动生成深邃浓郁的**普鲁士靛蓝接触暗晕**。
3. **19 世纪铜金铁胆蘸水笔与亚麻标本胶条 (`FS_COPPER`)**：
   - 在已水洗晾干的蓝晒图纸上，叠加**手工亚麻标本固定纸胶条（`#EFE9D8` 带投影与铜线针脚）**，以及带着微弱金属光泽的**铜金蘸水笔（`#D88A52` → `#F2C18D`）**几何圆规星盘、137.5° 黄金发散角标尺、引线标注与博物馆火漆/签条（Collector's Cartouche）。
4. **冷压棉纸凹凸压痕终混 (`FS_FINAL`)**：
   - 对全画幅施加法线梯度纸纹浮雕（`cottonTooth` 方向导数）与博物馆展柜玻璃暗角。

## 2. Color Palette (色彩规范)

| Role | Hex | Usage |
|---|---|---|
| Raw Cotton Rag Paper | `#F4EFE2` | 四周排笔留白、完全阻光的粗叶脉/主茎/种仁、右下角博物馆标本签条底色 |
| Prussian Blue Deep | `#091E39` | 充足紫外曝光的深普鲁士蓝底色与植物轮廓接触暗环 |
| Prussian Blue Wash | `#143E68` – `#23598B` | 铁盐化学云纹与笔触过渡区 |
| Photogram Ice Cyan | `#3877AA` – `#AAD2EA` | 半透明叶肉、苞片、种皮的 X 光透射显影阶调 |
| Metallic Copper-Gall | `#D88A52` (`#A65D2E`–`#F2C18D`) | 圆规几何星盘、360° 刻度环、137.5° 黄金螺线、双线画框与图版编号 |
| Herbarium Linen Tape | `#EFE9D8` | 固定植物主茎与侧枝的亚麻纸胶条 |

## 3. Best-Fit Topics (最适合的题材)

- 自然科普、植物学、海洋生物学、昆虫与化石解剖、数学与自然几何（斐波那契数列、分形几何、黄金比例）
- 摄影史、化学史、天文学星图、航海日志、古籍档案与博物馆展览导览
- 静谧治愈系散文短片、诗歌视觉化、草本茶饮/东方植物香氛品牌美学短片
