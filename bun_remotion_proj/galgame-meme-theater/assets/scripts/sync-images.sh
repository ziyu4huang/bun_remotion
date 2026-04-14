#!/usr/bin/env bash
# Copy asset images to all galgame-meme-theater episodes.
# Run after fresh clone: bash bun_remotion_proj/galgame-meme-theater/assets/scripts/sync-images.sh
#
# Always uses file copies — Remotion's static server does not reliably follow symlinks.
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$SCRIPT_DIR/.."
GROUP_DIR="$(cd "$ASSETS/.." && pwd)"

echo "Syncing images from assets to galgame-meme-theater episodes..."

for ep_dir in "$GROUP_DIR"/galgame-meme-theater-ep*/; do
  ep_name="$(basename "$ep_dir")"
  img_dir="$ep_dir/public/images"
  mkdir -p "$img_dir"

  # Copy character images
  for img in "$ASSETS"/characters/*.png; do
    [ -f "$img" ] || continue
    cp "$img" "$img_dir/$(basename "$img")"
    echo "  $ep_name: $(basename "$img")"
  done

  # Copy background images
  for img in "$ASSETS"/backgrounds/*.png; do
    [ -f "$img" ] || continue
    cp "$img" "$img_dir/$(basename "$img")"
    echo "  $ep_name: $(basename "$img")"
  done
done

echo "Done. All episodes synced with asset images."
