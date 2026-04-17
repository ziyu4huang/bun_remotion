#!/usr/bin/env bash
# sync-images.sh — No longer needed.
#
# remotion.config.ts now uses setPublicDir("../assets") so Remotion serves
# images directly from assets/characters/ and assets/backgrounds/.
# This script is kept as a no-op placeholder for backwards compatibility.
#
# If you added new images to assets/characters/ or assets/backgrounds/,
# they are automatically available to all episodes — no sync step required.
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS="$SCRIPT_DIR/.."

echo "No sync needed. Images are served directly from: $ASSETS"
echo "  characters/ → staticFile('characters/<name>.png')"
echo "  backgrounds/ → staticFile('backgrounds/<name>.png')"
