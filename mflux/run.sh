#!/usr/bin/env bash
set -euo pipefail

# mflux image generation wrapper — M1 8G optimized
# Usage:
#   ./run.sh "a cat wearing sunglasses"
#   ./run.sh "a futuristic city skyline" flux2-klein-4b 512 512 4
#   ./run.sh "prompt" flux2-klein-4b 512 512 4 42 ./output/mflux/custom.png

PROMPT="${1:-"a serene mountain lake at sunrise, digital art"}"
MODEL="${2:-flux2-klein-4b}"
WIDTH="${3:-512}"
HEIGHT="${4:-512}"
STEPS="${5:-4}"
SEED="${6:-$RANDOM}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="${PROJECT_ROOT}/output/mflux"
mkdir -p "$OUTPUT_DIR"

# Auto-number output file
LAST=$(ls "$OUTPUT_DIR"/mflux-*.png 2>/dev/null | grep -oP 'mflux-\K\d+' | sort -rn | head -1)
NEXT=$((10#${LAST:-0} + 1))
OUTPUT="${7:-"${OUTPUT_DIR}/mflux-$(printf '%03d' $NEXT).png"}"

mflux-generate-flux2 \
  --model "$MODEL" \
  --prompt "$PROMPT" \
  --quantize 4 \
  --steps "$STEPS" \
  --width "$WIDTH" \
  --height "$HEIGHT" \
  --seed "$SEED" \
  --output "$OUTPUT" \
  --low-ram \
  --mlx-cache-limit-gb 2.0
