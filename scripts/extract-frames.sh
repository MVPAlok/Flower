#!/usr/bin/env bash
# Turn the hero video into WebP frames (every 2nd frame → 360 frames from 30s @ 24fps).
# Usage: npm run frames              (uses source/flower-hero.mp4)
#        npm run frames -- other.mp4
set -euo pipefail
VIDEO="${1:-source/flower-hero.mp4}"
OUT="public/frames"
STEP="${STEP:-2}"   # keep every Nth frame
rm -rf "$OUT" && mkdir -p "$OUT/desktop" "$OUT/mobile"

ffmpeg -v error -y -i "$VIDEO" -an -vf "select='not(mod(n\,$STEP))',scale=1280:-2" -fps_mode vfr -c:v libwebp -quality 72 -compression_level 5 "$OUT/desktop/f_%04d.webp"
ffmpeg -v error -y -i "$VIDEO" -an -vf "select='not(mod(n\,$STEP))',scale=720:-2"  -fps_mode vfr -c:v libwebp -quality 64 -compression_level 5 "$OUT/mobile/f_%04d.webp"
ffmpeg -v error -y -i "$VIDEO" -frames:v 1 -vf "scale=1280:-2" -c:v libwebp -quality 70 public/poster.webp

COUNT=$(ls "$OUT/desktop" | wc -l | tr -d ' ')
echo "Extracted $COUNT frames. Set FRAME_COUNT = $COUNT in src/hero/config.ts"
