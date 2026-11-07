# Wes Anderson Wool-Felt Diorama Theatre · 韦斯·安德森毛毡光影剧场

- **Slug**: `wes-anderson-felt`
- **Base**: original 4-pass WebGL2 Merino wool-felt appliqué, fuzzy edge-hair & hand-sewn embroidery compositor (`demo/gl.js`, `demo/scene.js`)
- **Aspect Ratios**:
  - `1920×1080` (`16:9` 横屏布达佩斯式三层毛毡玩偶屋与登山缆车对称剧场，默认 `?mode=horizontal`)
  - `1080×1440` (`3:4` 竖屏绝对中轴对称玩偶屋横切面与章节字幕图谱，通过 `--q mode=vertical` 切换)

## 1. Visual Soul & Material Physics (视觉灵魂与物理材质)

致敬 **韦斯·安德森 (Wes Anderson)**《布达佩斯大饭店》《了不起的狐狸爸爸》的绝对正交平面构图（Planimetric Symmetry）、高饱和粉彩撞色与定格动画手作微缩道具美学：

1. **美利奴羊毛毡纠缠纤维场与 2900K 顶光舞台 (`FS_STAGE_FELT`)**：
   - 程序化生成多角度卷曲纠缠的美利奴羊毛纤维场（`woolFeltField`），带有杂色羊毛绒点（Melange flecks）与冰川薄荷青条纹壁纸基底（`#84B1AE`），配合定格摄影棚 `2900K` 暖色聚光灯顶光漫射。
2. **立体填充羊毛毡贴布与边缘飞丝 (`FS_DIORAMA_PLUSH`)**：
   - **边缘绒毛飞丝置换（`fuzzShift`）**：对每一块毛毡色块的采样坐标施加高频卷曲纤维微扰，使剪裁边缘自然伸出 `1.5–2.5px` 蓬松的羊毛飞丝与逆光绒毛光晕（`fuzzRim`）；
   - **立体绗缝鼓包浮雕（`plushShade` + `dome`）**：通过 WebGL2 Mipmap 色彩与透明度梯度，在每一块异色毛毡拼缝处自动生成圆润的立体填充鼓包高光与底边暗部，并向背景投下柔和的定格摄影棚投影。
3. **手工平针绣线、四眼纽扣与拉丝黄铜铭牌 (`FS_STITCH_BRASS`)**：
   - 每一道棉质刺绣平针虚线（Running Stitch）与四眼十字缝线电木/贝母纽扣（Sewn Button）均在毛毡表面投下 `1.5px` 凹陷压痕阴影，并带有拧股棉线光泽与拉丝黄铜钥匙牌反光。

## 2. Color Palette (色彩规范)

| Role | Hex | Usage |
|---|---|---|
| Mendl's Rose Pink | `#F2BFC0` | 酒店主立面羊毛毡、孟德尔甜点盒主色 |
| Zubrowka Butter Cream | `#F6EBD4` | 舞台外框、拱门包边、天文台塔楼与章节字幕卡底色 |
| Mustard Ochre | `#E3A33B` | 4 号登山齿轮缆车车身、礼宾总台与山墙三角楣 |
| Lobby Cranberry Red | `#A43237` | 礼宾大厅内壁、舞台地毯、天鹅绒窗帘与法则标签 |
| Concierge Royal Plum | `#5B3461` | 礼宾官古斯塔夫燕尾服、十字钥匙铭牌与对偶标签 |
| Belafonte Glacier Mint | `#84B1AE` | 舞台条纹毛毡背景墙 |
| Powder Sky Blue | `#98C1D1` | 217/218 客房内景、缆车车窗与甜点盒丝带 |

## 3. Best-Fit Topics (最适合的题材)

- 电影美学分析、导演视觉语言拆解、色彩心理学、建筑对称与透视科普
- 精品酒店、甜点烘焙、文创手作、玩具与童装品牌故事短片
- 轻松冷面幽默（Deadpan）风格的商业史、人物传记、旅行地理与百科解说
