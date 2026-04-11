#!/usr/bin/env bash
# setup.sh — Bootstrap mlx_music environment on Apple Silicon
#
# Usage:
#   ./setup.sh            # create .venv + install deps + pre-download model
#   ./setup.sh --no-model # skip model download (install only)
#
# Requirements:
#   - macOS + Apple Silicon (M1/M2/M3/M4)
#   - Python 3.11+ (brew install python@3.11)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/.venv"
DEFAULT_MODEL="facebook/musicgen-small"
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

# Install audiocraft_mlx from GitHub (no PyPI package)
echo "Installing audiocraft_mlx from GitHub..."
"$PIP" install git+https://github.com/andrade0/musicgen-mlx.git
echo "Dependencies installed"

# ── 4. Pre-download model ─────────────────────────────────────────────────────
if [[ "$SKIP_MODEL" == true ]]; then
  echo ""
  echo "Skipping model download (--no-model)"
else
  echo ""
  echo "Pre-downloading model: $DEFAULT_MODEL"
  echo "(~1.2 GB from HuggingFace — skipped if already cached)"
  "$PYTHON_VENV" - <<'PYEOF'
import sys
try:
    from audiocraft_mlx.models.musicgen import MusicGen
    print("Fetching model weights...")
    mg = MusicGen.get_pretrained("facebook/musicgen-small")
    print(f"Model ready  (sample_rate={mg.sample_rate} Hz)")
    del mg
except Exception as e:
    print(f"WARNING: model download failed: {e}", file=sys.stderr)
    print("You can retry later — model downloads automatically on first use.", file=sys.stderr)
PYEOF
fi

# ── 5. Done ───────────────────────────────────────────────────────────────────
echo ""
echo "Setup complete."
echo ""
echo "Usage (run from this directory):"
echo "  PYTHONPATH=. .venv/bin/python -m mlx_music generate \"chill lo-fi beat with piano\""
echo "  PYTHONPATH=. .venv/bin/python -m mlx_music generate \"epic orchestral\" -d 15 -o output/musicgen/epic.wav"
echo "  PYTHONPATH=. .venv/bin/python -m mlx_music play \"jazz piano solo\""
echo "  PYTHONPATH=. .venv/bin/python -m mlx_music batch prompts.txt -o output/musicgen/"
