#!/usr/bin/env bash
# Copy fixture images to all episodes (NOT symlinks — Remotion's static server
# doesn't reliably follow symlinks, causing 404 errors during render).
# Run after fresh clone: bash bun_remotion_proj/weapon-forger/fixture/scripts/sync-images.sh
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="$SCRIPT_DIR/.."
GROUP_DIR="$(cd "$FIXTURE/.." && pwd)"

echo "Syncing images from fixture to episodes (copying, not symlinking)..."

for ep_dir in "$GROUP_DIR"/weapon-forger-ch*-ep*/; do
  ep_name="$(basename "$ep_dir")"
  img_dir="$ep_dir/public/images"
  mkdir -p "$img_dir"

  # Copy character images
  for img in "$FIXTURE"/characters/*.png; do
    [ -f "$img" ] || continue
    cp -f "$img" "$img_dir/$(basename "$img")"
    echo "  $ep_name: $(basename "$img")"
  done

  # Copy background images
  for img in "$FIXTURE"/backgrounds/*.png; do
    [ -f "$img" ] || continue
    cp -f "$img" "$img_dir/$(basename "$img")"
    echo "  $ep_name: $(basename "$img")"
  done
done

echo "Done. All episodes synced with fixture images."
