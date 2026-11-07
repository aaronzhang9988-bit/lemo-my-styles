#!/bin/sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-"D:/柠檬Skill/lemo-opuscar"}
OUT=${OUT:-"$HERE/../out-build"}
export LIB OUT
mkdir -p "$OUT"
cd "$LIB"
node "$LIB/core/render/events.mjs" "$HERE" --out "$OUT/events.json"
node "$LIB/core/render/video.mjs" "$HERE" --fps 24 --workers 3 --out "$OUT/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh "$LIB/core/render/mux.sh" "$OUT/video.mp4" "$OUT/mix.wav" "$OUT/test.mp4" 24 0
