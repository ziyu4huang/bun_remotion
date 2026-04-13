#!/usr/bin/env bash
# Sync fixture images to all episodes.
# - Converts any existing symlinks to real files first (Remotion can't follow symlinks)
# - Uses rsync --ignore-existing so episode-specific images are never overwritten
# Run after adding new emotions: bash bun_remotion_proj/my-core-is-boss/fixture/scripts/sync-images.sh
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="$SCRIPT_DIR/.."
GROUP_DIR="$(cd "$FIXTURE/.." && pwd)"

echo "Syncing images from fixture to episodes..."

for ep_dir in "$GROUP_DIR"/my-core-is-boss-ch*-ep*/; do
  [ -d "$ep_dir" ] || continue
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
  rsync --ignore-existing "$FIXTURE"/characters/*.png "$img_dir/" 2>/dev/null || true
  # Sync character JSON metadata
  rsync --ignore-existing "$FIXTURE"/characters/*.json "$img_dir/" 2>/dev/null || true

  # Sync background images
  rsync --ignore-existing "$FIXTURE"/backgrounds/*.png "$img_dir/" 2>/dev/null || true

  echo "  $ep_name: synced"
done

echo "Done. Fixture images synced (episode-specific files preserved)."
