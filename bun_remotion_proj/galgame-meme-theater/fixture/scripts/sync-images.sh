#!/usr/bin/env bash
# Copy fixture images to all galgame-meme-theater episodes.
# Run after fresh clone: bash bun_remotion_proj/galgame-meme-theater/fixture/scripts/sync-images.sh
#
# Always uses file copies — Remotion's static server does not reliably follow symlinks.
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="$SCRIPT_DIR/.."
GROUP_DIR="$(cd "$FIXTURE/.." && pwd)"

echo "Syncing images from fixture to galgame-meme-theater episodes..."

for ep_dir in "$GROUP_DIR"/galgame-meme-theater-ep*/; do
  ep_name="$(basename "$ep_dir")"
  img_dir="$ep_dir/public/images"
  mkdir -p "$img_dir"

  # Copy character images
  for img in "$FIXTURE"/characters/*.png; do
    [ -f "$img" ] || continue
    cp "$img" "$img_dir/$(basename "$img")"
    echo "  $ep_name: $(basename "$img")"
  done

  # Copy background images
  for img in "$FIXTURE"/backgrounds/*.png; do
    [ -f "$img" ] || continue
    cp "$img" "$img_dir/$(basename "$img")"
    echo "  $ep_name: $(basename "$img")"
  done
done

echo "Done. All episodes synced with fixture images."
