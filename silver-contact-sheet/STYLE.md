# Silver Gelatin Contact Sheet & China-Marker Proof · 银盐接触印相 × 红铅笔暗房手记

- **Slug**: `silver-contact-sheet`
- **Base**: original 4-pass WebGL2 silver-gelatin emulsion, China-marker wax & optical loupe compositor (`demo/gl.js`, `demo/scene.js`)
- **Aspect Ratios**:
  - `1920×1080` (`16:9` 横屏玛格南暗房接触印相样张与 `8×10"` 遮挡加光工作放印片跨页，默认 `?mode=horizontal`)
  - `1080×1440` (`3:4` 竖屏徕卡 35mm 接触印相底片条与放大试印档案板，通过 `--q mode=vertical` 切换)

## 1. Visual Soul & Material Physics (视觉灵魂与物理材质)

致敬 1950 年代 **玛格南图片社 (Magnum Photos)** 巴黎暗房传统、亨利·卡蒂埃-布列松《决定性瞬间》选片底片小样与安塞尔·亚当斯 (Ansel Adams) 区域曝光法（Zone System）：

1. **Ilford Multigrade FB 310g 暖调重磅钡地纤维银盐相纸 (`FS_BARYTA`)**：
   - 外圈为暗房湿操作台木纹与微弱红琥珀安全灯反射（`#0E0D0F`），中央铺展带有自然手工裁切毛边的 `310g` 硫酸钡涂层纤维相纸（`#EFEAD9`），表面具微珍珠光泽肌理（`barytaTooth`）与定影液海波水渍环（`ring`）。
2. **H&D 特性曲线与 Tri-X 400 卤化银颗粒团簇显影 (`FS_SILVER`)**：
   - 模拟传统黑房 D-76（1:1）显影与柯达快速硒调色液（Rapid Selenium Toner）分阶：
     - **D-max 碳黑银（`#0A0B0E`）**：高浓度金属银沉积的深邃冷黑；
     - **铂金-硒调冷暖分阶中间调（`#2F3238` → `#8B8E8D`）**：叠加中间调权重最高（`4·L·(1-L)`）的 **Tri-X 400 立方卤化银颗粒团簇（`silverGrain`）**；
     - **35mm 齿孔与金琥珀潜影边码**：保留 `KODAK TRI-X PAN FILM 5063` 药膜边字、帧号（`▶ 21`、`21A`）、10 级安塞尔·亚当斯区域曝光阶梯尺（`Zone 0–X`）及 `8×10"` 工作放印片右侧的 `f/8` 五档阶梯曝光试条（`6s / 9s / 12s / 18s / 24s`）。
3. **暗房油性红/黄选片蜡笔与施耐德 8× 光学放大镜折射 (`FS_WAX_LOUPE`)**：
   - **油性选片蜡笔（China Marker / Grease Pencil，`#E63B2E` 胭脂红 & `#F2B830` 铬黄）**：模拟油性蜡笔在光滑钡地相纸上的粗粝断续拉丝与纸纹飞白（`waxSkip`），用于勾画选片方框（`SELECT #21A ★ MASTER`）、废片红叉（`✕`）以及局部加光/遮挡（`BURN +1.5 EV` / `DODGE -2/3 EV`）虚线轨迹；
   - **施耐德 8× 非球面暗房看片放大镜（`SCHNEIDER 8× LUPE`）**：在着色器内实时计算 `1.36×` 桶形畸变光学放大、边缘红蓝光学色差（Chromatic Aberration）、双层镀膜冷青高光弧与滚花黑铝镜筒阴影。

## 2. Color Palette (色彩规范)

| Role | Hex | Usage |
|---|---|---|
| Baryta Fiber Base | `#EFEAD9` | 310g 暖白重磅硫酸钡纤维相纸基底、齿孔留白与高光 |
| D-Max Silver Black | `#0A0B0E` | 底片片基、暗部纯黑金属银沉积与暗房记录卡底色 |
| Selenium Midtone | `#5E636B` – `#9D9E98` | 硒调银盐冷暖分阶灰阶 |
| Film Rebate Amber | `#D89B48` | `KODAK TRI-X PAN FILM 5063` 边码与暗房配方表头 |
| Crimson China Marker | `#E63B2E` | 主选片框 (`SELECT #21A`)、废片打叉与局部压暗 (`BURN`) 批注 |
| Yellow China Marker | `#F2B830` | 备选片框 (`ALT #12A`) 与局部遮挡提亮 (`DODGE`) 批注 |

## 3. Best-Fit Topics (最适合的题材)

- 摄影史、电影史、新闻纪实、历史档案揭秘、人物传记、街头人文故事
- 侦探调查、案件推理、幕后制作花絮、工业设计与产品迭代手记
- 光学物理、化学显影科普、审片/复盘/对比分析类深度专栏
