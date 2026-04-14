#!/usr/bin/env bash
# Sync assets images to all episodes.
# - Converts any existing symlinks to real files first (Remotion can't follow symlinks)
# - Uses rsync --ignore-existing so episode-specific images are never overwritten
# Run after adding new poses: bash bun_remotion_proj/weapon-forger/assets/scripts/sync-images.sh
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$SCRIPT_DIR/.."
GROUP_DIR="$(cd "$ASSETS/.." && pwd)"

echo "Syncing images from assets to episodes..."

for ep_dir in "$GROUP_DIR"/weapon-forger-ch*-ep*/; do
  ep_name="$(basename "$ep_dir")"
  img_dir="$ep_dir/public/images"
  mkdir -p "$img_dir"

  # Convert any existing symlinks to real files (Remotion can't follow symlinks)
  for link in "$img_dir"/*.png "$img_dir"/*.json; do
    [ -L "$link" ] || continue
    target="$(readlink "$link")"
    # Resolve relative path from symlink location
    if [[ "$target" != /* ]]; then
      target="$(cd "$(dirname "$link")" && cd "$(dirname "$target")" && pwd)/$(basename "$target")"
    fi
    if [ -f "$target" ]; then
      rm "$link"
      cp "$target" "$link"
      echo "  $ep_name: converted symlink $(basename "$link")"
    fi
  done

  # Sync character images (skip files already in episode)
  rsync --ignore-existing "$ASSETS"/characters/*.png "$img_dir/" 2>/dev/null || true
  # Sync character JSON metadata
  rsync --ignore-existing "$ASSETS"/characters/*.json "$img_dir/" 2>/dev/null || true

  # Sync background images
  rsync --ignore-existing "$ASSETS"/backgrounds/*.png "$img_dir/" 2>/dev/null || true

  echo "  $ep_name: synced"
done

echo "Done. Assets images synced (episode-specific files preserved)."
