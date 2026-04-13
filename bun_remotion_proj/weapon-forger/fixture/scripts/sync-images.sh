#!/usr/bin/env bash
# Create symlinks from fixture images to all episodes.
# Run after fresh clone: bash bun_remotion_proj/weapon-forger/fixture/scripts/sync-images.sh
#
# On macOS/Linux: creates symlinks (preferred, zero duplication)
# On Windows (MSYS/Git Bash): falls back to file copies
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FIXTURE="$SCRIPT_DIR/.."
GROUP_DIR="$(cd "$FIXTURE/.." && pwd)"

# Detect Windows (MSYS, Git Bash, Cygwin)
is_windows() {
  [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* || "$(uname -s)" == CYGWIN* ]]
}

echo "Syncing images from fixture to episodes..."

for ep_dir in "$GROUP_DIR"/weapon-forger-ch*-ep*/; do
  ep_name="$(basename "$ep_dir")"
  img_dir="$ep_dir/public/images"
  mkdir -p "$img_dir"

  # Link character images
  for img in "$FIXTURE"/characters/*.png; do
    [ -f "$img" ] || continue
    target="$img_dir/$(basename "$img")"
    if is_windows; then
      cp "$img" "$target"
    else
      # Relative symlink so it works regardless of mount point
      ln -sf "$(python3 -c "import os; print(os.path.relpath('$img', '$img_dir'))" 2>/dev/null || \
               realpath --relative-to="$img_dir" "$img")" "$target"
    fi
    echo "  $ep_name: $(basename "$img")"
  done

  # Link background images
  for img in "$FIXTURE"/backgrounds/*.png; do
    [ -f "$img" ] || continue
    target="$img_dir/$(basename "$img")"
    if is_windows; then
      cp "$img" "$target"
    else
      ln -sf "$(python3 -c "import os; print(os.path.relpath('$img', '$img_dir'))" 2>/dev/null || \
               realpath --relative-to="$img_dir" "$img")" "$target"
    fi
    echo "  $ep_name: $(basename "$img")"
  done
done

echo "Done. All episodes synced with fixture images."
