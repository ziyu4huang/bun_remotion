#!/usr/bin/env bash
# setup.sh — Bootstrap mlx_tts environment on Apple Silicon
#
# Usage:
#   ./setup.sh          # create .venv + install deps + pre-download model
#   ./setup.sh --no-model  # skip model download (install only)
#
# Requirements:
#   - macOS + Apple Silicon (M1/M2/M3/M4)
#   - Python 3.11+ (brew install python@3.11)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/.venv"
MODEL_ID="mlx-community/Kokoro-82M-bf16"
SKIP_MODEL=false

for arg in "$@"; do
  [[ "$arg" == "--no-model" ]] && SKIP_MODEL=true
done

# ── 1. Resolve Python 3.11+ ───────────────────────────────────────────────────
find_python() {
  for py in python3.13 python3.12 python3.11; do
    if command -v "$py" &>/dev/null; then
      echo "$py"; return
    fi
  done
  # Homebrew fallback
  for py in /opt/homebrew/bin/python3.13 /opt/homebrew/bin/python3.12 /opt/homebrew/bin/python3.11; do
    [[ -x "$py" ]] && echo "$py" && return
  done
  echo ""
}

PYTHON=$(find_python)
if [[ -z "$PYTHON" ]]; then
  echo "ERROR: Python 3.11+ not found."
  echo "Install with: brew install python@3.11"
  exit 1
fi

PY_VER=$("$PYTHON" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "Using Python $PY_VER ($PYTHON)"

# ── 2. Create / reuse .venv ───────────────────────────────────────────────────
if [[ -d "$VENV" ]]; then
  echo ".venv already exists — skipping creation"
else
  echo "Creating .venv..."
  "$PYTHON" -m venv "$VENV"
  echo ".venv created"
fi

PIP="$VENV/bin/pip"
PYTHON_VENV="$VENV/bin/python"

# ── 3. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "Installing dependencies from requirements.txt..."
"$PIP" install --upgrade pip --quiet
"$PIP" install -r "$SCRIPT_DIR/requirements.txt"
echo "Dependencies installed"

# ── 4. Pre-download Kokoro model ──────────────────────────────────────────────
if [[ "$SKIP_MODEL" == true ]]; then
  echo ""
  echo "Skipping model download (--no-model)"
else
  echo ""
  echo "Pre-downloading model: $MODEL_ID"
  echo "(~350 MB from HuggingFace — skipped if already cached)"
  "$PYTHON_VENV" - <<'PYEOF'
import sys
try:
    from mlx_audio.tts import load as load_tts
    print("Fetching model weights...")
    model = load_tts("mlx-community/Kokoro-82M-bf16")
    print(f"Model ready  (sample_rate={model.sample_rate} Hz)")
    del model
except Exception as e:
    print(f"WARNING: model download failed: {e}", file=sys.stderr)
    print("You can retry later — model downloads automatically on first use.", file=sys.stderr)
PYEOF
fi

# ── 5. Done ───────────────────────────────────────────────────────────────────
echo ""
echo "Setup complete."
echo ""
echo "Run servers:"
echo "  .venv/bin/python story_to_voice.py produce <story.json>"
echo "  .venv/bin/python webui.py          # TTS Studio  http://localhost:7860"
echo "  .venv/bin/python story_studio.py   # Story Studio http://localhost:7861"
