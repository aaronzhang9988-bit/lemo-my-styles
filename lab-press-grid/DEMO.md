# Lab Press Grid · 工程套印网格 — our demo

One example among many. Don't reuse its story, arc, shots, props or timings.

Demo: *DeepSeek Architecture: Cutting Inference Cost by 90%* (28 s) · `test.mp4` · source in [`demo/`](demo/)

A 28-second engineering explainer: three specification clauses dissect how DeepSeek cuts LLM inference cost by 90% (MLA low-rank KV compression, MoE fine-grained expert routing with 37B/671B active parameters, and FP8 cost breakdown), certified by a hydraulic specification stamp.

## Story & structure

2D engineering graphic design printed on warm archive stock (`#EDE8DF` page, `#F6F3EC` specification sheet), using deep iron-navy ink (`#0F1B29`), cyan-blue 45° halftone dot fields (`#2A6F97`, multiplied), and international safety orange (`#FF4F00`). Every element snaps to the 12-column grid on the beat (`cubic-bezier(.7,0,.2,1)`), while borrowed print moves from `halftone-dossier` (redaction censor bars and verification stamps) are adapted into strict mechanical precision.

| Native power | Story use in this demo |
|---|---|
| **Warm archive paper & 45° halftone fields** | The entire spread is composited with procedural low-frequency mottling, a central spine fold and 45° cyan halftone dot fields behind the giant numerals and inside secondary parameter modules. |
| **Misregistered headlines & 4-corner HUD** | Giant numerals (`01`, `02`, `03`) and Chinese headlines carry a `+4px/+4px` cyan overprint shadow; the four corners lock the frame with `DOC // DS-ARCH-90`, live `GRID LOCK` / `OFF-GRID` status, halftone calibration specs, and a bar/beat counter. |
| **Knife cut (`6.0–7.0 s`)** | Three bloated legacy MHA KV-Cache bars (`128 GB`, `96 GB`, `112 GB`) enter on the right sheet and are sliced through their midlines by safety-orange blade lines and collapsed away. |
| **Redaction reveal (`7.5 s`, `15.5 s`, `21.0 s`)** | Three hatched `#0F1B29` censor bars (`[REDACTED]`) on the left page are wiped open horizontally by a vertical safety-orange laser cutter to expose the key metrics (`-93.3% KV RAM`, `5.5% ACTIVE`, `-90.2% COST`). |
| **The exception (`12.5–14.2 s`)** | The safety-orange `MoE // 37B 稀疏路由破局` block twitches at `12.5 s`, then detaches from the dense grid and flies linearly (`13.0–14.2 s`, pausing at `13.5–13.7 s`) to 2.4× scale while drums drop out and an analog sine glide sings. |
| **90° rotation reveal (`18.0–21.25 s`)** | The right specification sheet rotates 90° CCW in 1.5 beats, holds, and wipes in horizontal cost labels (`$20.0 → $0.55`) as an orange playhead sweeps across. |
| **Hydraulic spec stamp (`22.0 s`)** | After a half-bar total silence (`21.5–22.0 s`), a rectangular double-bordered stamp (`[成本砍掉 90% // SPEC VERIFIED]`) snaps down with zero bounce. |

## Shots & camera moves

1. **Opening push-out (`0.0–1.2 s`)**: Starts at `1.42×` on the top-left blueprint header, snapping out to the full 12-column spread at `t = 1.0 s`.
2. **Locked spread (`1.2–18.0 s`)**: Left page builds Clauses `01` and `02` while the right sheet runs the KV-Cache knife cuts (`6.0–7.0 s`), the off-grid MoE break (`13.0–14.2 s`), and modular re-flow (`14.4 s`).
3. **90° rotation reveal (`18.0–21.4 s`)**: Right sheet rotates `-90°` (`18.0–18.75 s`), holds while labels wipe in (`18.95 s`) and the playhead sweeps (`18.85–20.65 s`), then rotates back (`20.75–21.25 s`).
4. **Silence & hydraulic stamp (`21.5–23.0 s`)**: Music stops dead at `21.5 s`; at `22.0 s` the hydraulic stamp locks onto the bottom-right corner of the sheet.
5. **Wall pull-out (`23.2–26.2 s`)**: Camera pulls out to `0.44×` inside the HUD frame to reveal a 2×2 matrix of four blueprint specification sheets, then snaps back to the hero spread at `26.0 s` and holds to `28.0 s`.

## Score & foley

- **120 BPM Motorik score**: sampled `drum_kit` (kick, snare, closed hat, crash), `electric_bass` (A1 pedal and dorian progression), additive saw arpeggiator (`500 → 3200 Hz` filter sweep), marimba plucks (`fundamental + 4× partial`), and `glockenspiel` grid accents.
- **Arrangement**: drums drop out during the off-grid exception flight (`13.0–14.2 s`); all instruments cut to `-180 dBFS` silence at `21.5–22.0 s` right before the hydraulic stamp impact.
- **Industrial press foley**: letterpress clack, steel ruler hiss, paper slap, numeral step thunk, guillotine knife sweep + snick, redaction shutter rip, analog sine glide, and a 55 Hz hydraulic stamp impact + metal latch.

## Files in `demo/`

```
demo/
  index.html      canvas stage (1920×1080) and font stylesheet loader
  main.js         preloads Archivo, JetBrains Mono, Noto Sans SC; exposes window.render(t), DUR, EV
  ease.js         cubic-bezier(.7,0,.2,1), snap(), lin(), steps(), seeded Mulberry32 PRNG
  film.js         archive paper generator, 45° cyan halftone renderer, misregistered type, 4-corner HUD,
                  redaction bars, knife cuts, off-grid exception, 90° rotation, hydraulic stamp, 2×2 wall
  mix.py          120 BPM motorik score + industrial press foley → $OUT/mix.wav
  fonts/          self-hosted OFL woff2 subsets (Archivo, JetBrains Mono, Noto Sans SC) + fonts.css
  CREDITS         font and sample library licences (OFL, CC0, CC BY)
  build.sh        one-shot rebuild writing all intermediate/final outputs to ${OUT:-/tmp/lab-press-grid-out}
```
