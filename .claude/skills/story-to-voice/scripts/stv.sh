#!/usr/bin/env bash
# story-to-voice CLI wrapper — runs from any directory, no cd needed.
# Usage: stv.sh <subcommand> [args...]
#
# Subcommands (mirrors story_to_voice.py):
#   produce <story.json> [-o output.flac]
#   produce-book <book_dir> [--chapter NNN] [--force]
#   init-book <name> [--lang zh] [--title "Title"]
#   parse <story.txt> [--lang zh]
#   parse-chapter <book_dir> [--chapter NNN]
#
# All paths are relative to mlx_tts/ (the TTS project root).

set -euo pipefail

MLX_TTS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../mlx_tts" && pwd)"
PYTHON="$MLX_TTS_ROOT/.venv/bin/python"

if [ ! -x "$PYTHON" ]; then
  echo "Error: Python venv not found at $PYTHON" >&2
  echo "Run: cd $MLX_TTS_ROOT && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

exec "$PYTHON" "$MLX_TTS_ROOT/story_to_voice.py" "$@"
