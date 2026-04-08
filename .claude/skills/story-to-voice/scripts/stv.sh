#!/usr/bin/env bash
# story-to-voice wrapper — runs from any directory, no cd needed.
# Usage: stv.sh <command> [args...]
#
# CLI commands (delegates to story_to_voice.py):
#   produce <story.json> [-o output.flac]
#   produce-book <book_dir> [--chapter NNN] [--force]
#   init-book <name> [--lang zh] [--title "Title"]
#   parse <story.txt> [--lang zh]
#   parse-chapter <book_dir> [--chapter NNN]
#
# Server commands (starts and runs in foreground):
#   webui          Start TTS Studio (port 7860)
#   studio         Start Story Studio (port 7861)
#
# Utility:
#   voices         List available voices
#   voices <lang>  List voices for a language (en, zh, ja)

set -euo pipefail

MLX_TTS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../mlx_tts" && pwd)"
PYTHON="$MLX_TTS_ROOT/.venv/bin/python"

if [ ! -x "$PYTHON" ]; then
  echo "Error: Python venv not found at $PYTHON" >&2
  echo "Run: cd $MLX_TTS_ROOT && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

cmd="${1:-help}"
shift || true

case "$cmd" in
  webui)
    exec "$PYTHON" "$MLX_TTS_ROOT/webui.py" "$@"
    ;;
  studio)
    exec "$PYTHON" "$MLX_TTS_ROOT/story_studio.py" "$@"
    ;;
  voices)
    lang="${1:-}"
    if [ -n "$lang" ]; then
      "$PYTHON" -c "
from mlx_tts.voices import VOICE_CATALOG
for v in VOICE_CATALOG:
    if v.get('language','').startswith('$lang') or v['id'].startswith('${lang}_'):
        print(f\"{v['id']:20s} {v.get('gender',''):6s} {v.get('description','')}\")
"
    else
      "$PYTHON" -c "
from mlx_tts.voices import VOICE_CATALOG
for v in VOICE_CATALOG:
    print(f\"{v['id']:20s} {v.get('gender',''):6s} {v.get('language',''):5s} {v.get('description','')}\")
"
    fi
    ;;
  produce|produce-book|init-book|parse|parse-chapter)
    exec "$PYTHON" "$MLX_TTS_ROOT/story_to_voice.py" "$cmd" "$@"
    ;;
  help|--help|-h|"")
    echo "Usage: stv.sh <command> [args...]"
    echo ""
    echo "CLI:"
    echo "  produce <story.json> [-o output.flac]"
    echo "  produce-book <book_dir> [--chapter NNN] [--force]"
    echo "  init-book <name> [--lang zh] [--title \"Title\"]"
    echo "  parse <story.txt> [--lang zh]"
    echo "  parse-chapter <book_dir> [--chapter NNN]"
    echo ""
    echo "Servers:"
    echo "  webui          TTS Studio (port 7860)"
    echo "  studio         Story Studio (port 7861)"
    echo ""
    echo "Utility:"
    echo "  voices [lang]  List voices (en, zh, ja)"
    ;;
  *)
    # Fallback: pass to story_to_voice.py as-is
    exec "$PYTHON" "$MLX_TTS_ROOT/story_to_voice.py" "$cmd" "$@"
    ;;
esac
