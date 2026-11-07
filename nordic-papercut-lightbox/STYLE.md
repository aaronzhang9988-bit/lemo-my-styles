# Nordic Papercut Lightbox Theatre · 北欧童话多层剪纸光影剧场

- **Slug**: `nordic-papercut-lightbox`
- **Base**: original 5-layer depth-stacked paper tunnel, mipmap cast-shadow & 2700K subsurface backlight compositor (`demo/gl.js`, `demo/scene.js`)
- **Aspect Ratios**:
  - `1920×1080` (`16:9` 横屏安徒生木框舞台剪纸光影剧场，默认 `?mode=horizontal`)
  - `1080×1440` (`3:4` 竖屏五重景深纸雕光影隧道绘本，通过 `--q mode=vertical` 切换)

## 1. Visual Soul & Material Physics (视觉灵魂与物理材质)

灵感源自丹麦欧登塞 **汉斯·克里斯蒂安·安徒生 (H. C. Andersen)** 手工剪纸传统、北欧极夜冬至纸雕灯箱（Paper-Cut Tunnel Book / Shadow-Box）与定格动画舞台美学：

1. **2700K 暖钨丝背光漫射屏 (`FS_BACKLIGHT`)**：
   - 灯箱最底层为半透明硫酸纸背光屏，中央隐藏一盏 `2700K` 暖金烛光光源（`#FFF5D1` → `#F5A34A` → `#AD5961` → `#1C3357`），柔和照亮前方层层叠叠的卡纸。
2. **五重 300g 康颂卡纸景深堆叠与物理光影着色器 (`FS_PAPER_LAYER`)**：
   - 每一层剪纸画布（`L1_skyPeaks` → `L2_fjordVillage` → `L3_forestBridge` → `L4_foregroundArch` → `L5_prosceniumFrame`）在 WebGL2 中独立生成 Mipmap 并依次合成，具备三大真实物理特性：
     - **多半径视差投射阴影与环境光遮蔽（`shadow`）**：前一层剪纸根据背光方向自动在后方所有深层卡纸上投下温暖柔和的多级景深阴影；
     - **300g 康颂纸蜂巢肌理与次表面散射（`cansonTooth` + `sss`）**：靠近光源的卡纸边缘呈现温暖的琥珀色半透明透光感；
     - **45° 手术刀斜切白金刃口高光（`bevel`）**：沿着每一片剪纸轮廓的迎光切面，精准生成一道 `1.5px` 的手术刀斜切白边高光。
3. **半透明暖黄硫酸纸窗格与北欧民俗镂空 (`scene.js`)**：
   - 峡湾红木灯塔（`#C4493A`）、阶梯山墙木屋、提灯信使的风灯与夜空北极光彩带背面衬贴暖黄硫酸纸（`#FFF2B8`），在深蓝夜空与冷杉林中散发温暖治愈的北欧冬夜微光。

## 2. Color Palette (色彩规范)

| Role | Hex | Usage |
|---|---|---|
| Canson Ivory Card | `#F4EDE0` | 前景拱门画框、悬吊八角伯利恒剪纸星、提灯信使与九角驯鹿 |
| Oatmeal Viaduct Card | `#E5DAC4` | 中景罗马式五拱石桥与木屋墙体卡纸 |
| Backlit Vellum Glow | `#FFF5D1` – `#F5A34A` | 2700K 背光核心、灯塔风灯与硫酸纸透光窗格 |
| Nordic Falu Red | `#C4493A` | 峡湾红白木质灯塔、木屋山墙与卷轴章节小标 |
| Nordic Spruce Pine | `#1E3A3A` – `#2D5452` | 前中景多层镂空冷杉林剪纸 |
| Fjord & Twilight Sky | `#1B3152` – `#4A6D91` | 极夜星空底卡、远景峡湾雪峰与中景岛屿 |
| Walnut & Gold Foil | `#221A15` / `#DFB15B` | 外框胡桃木阴影盒与烫金双线铭牌 |

## 3. Best-Fit Topics (最适合的题材)

- 童话故事、寓言绘本、神话传说、文学名著导读、节日与二十四节气文化短片
- 心理治愈、睡眠冥想、情绪科普、温暖品牌故事（独立书店、香薰、烘焙、礼品）
- 建筑空间美学、戏剧舞台史、手工艺与非遗纸艺科普
