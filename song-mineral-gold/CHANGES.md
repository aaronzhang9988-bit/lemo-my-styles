# Changes & Original Design — Song Silk & Mineral Gold (宋韵古绢 × 矿物岩彩描金)

Base reference: `ink-wash` / `ukiyoe` (elevated into an original Song-dynasty mineral rock-pigment & 24K mud-gold on woven silk engine)

## §1 Core concept & dual aspect-ratio framing
- **New original direction**: **Song Dynasty Blue-and-Green Mineral Painting & 24K Mud-Gold on Tea-Aged Woven Silk (`宋韵古绢 × 矿物岩彩描金`)**, inspired by Wang Ximeng's *A Thousand Li of Rivers and Mountains* (`《千里江山图》`), Emperor Huizong's *Auspicious Cranes* (`《瑞鹤图》`), and Palace Museum Song album leaves (`宋人册页`).
- **Dual-format native support**:
  1. **`1920×1080` (16:9 横屏宋人册页 / 手卷对开 `Horizontal Album Leaf`)**: Left/Center (~70%) mineral landscape & architectural/poetic stage + Right (~30%) `泥金乌丝栏` vertical calligraphy column, mineral specimen swatches, and horizontal subtitle bar.
  2. **`1080×1440` (3:4 竖屏宋画立轴 `Vertical Hanging Scroll`)**: Upper sky, moon & `泥金乌丝栏` vertical inscription panel (`y: 60..460`) + towering `高远法` layered mineral peaks, waterfall, ancient pine & waterside pavilion (`y: 290..1150`) + lower golden river, skiff, mineral swatches & subtitle bar (`y: 1150..1380`).

## §2 Materials, shaders & surface physics
- **Woven Tea-Aged Song Silk (`FS_SILK`)**: Procedural warp (`经线`) and weft (`纬线`) plain-weave heightfield with raw-silk slubs (`竹节丝结`), inter-thread pinholes (`绢眼`), tea/incense edge patina, and an outer **Song brocade mounting border (`宋锦深青绫边 + 2.5px 泥金镶界`)**.
- **Crushed Mineral Rock Pigments (`FS_MINERAL`)**: Multi-pass mineral shader simulating alum-glue water tide edges (`胶矾水晕边`), crushed stone crystal granulation (`矿石晶体砂砾感`), and subtle mica facet sparkle (`云母微闪`).
- **24K Specular Mud-Gold Relief (`FS_GOLD`)**: Dedicated normal-mapped metallic shader pass for `泥金` (mud-gold) ridge contours, pine needles, roof tile ribs, water ripples, and `乌丝栏` rules — shifting dynamically from antique bronze (`#946E2E`) to imperial gold (`#DEB55C`) and champagne specular glints (`#FFF5C8`) as the warm palace-lantern light (`uLight`) moves.
- **Soot Ink & Porous Cinnabar Seal Paste (`FS_INK`)**: Matte pine-soot ink (`松烟墨`) plus traditional carved Cinnabar seals (`朱文/白文印`) that leave realistic microscopic silk-pinhole gaps (`印泥透绢飞白`).
