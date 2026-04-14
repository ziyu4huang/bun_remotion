# Environment Check — Auto-test TTS Engines

Run these checks in order. Report results to the user before proceeding.

---

## 1. Detect Platform

Read the `Platform:` field from the system context at the top of the conversation:
- `win32` → Windows → load `platforms/windows.md`
- `darwin` → macOS → load `platforms/macos.md`
- `linux` → Linux → load `platforms/linux.md`

---

## 2. Check Edge TTS (Python)

```bash
python -m edge_tts --version 2>&1
```

| Result | Status |
|--------|--------|
| `edge-tts X.X.X` | ✅ Available |
| `No module named edge_tts` | ❌ Not installed |
| `python: command not found` | ❌ Python missing |

**If not installed**, show:
```
pip install edge-tts
```

---

## 3. Check Gemini TTS

```bash
echo $GOOGLE_API_KEY | cut -c1-8
```

| Result | Status |
|--------|--------|
| 8 chars printed (e.g. `AIzaSyD5`) | ✅ Key set |
| Empty / blank | ❌ `GOOGLE_API_KEY` not set |

**If not set**, show:
```
# PowerShell
$env:GOOGLE_API_KEY = "AIzaSy..."
# bash
export GOOGLE_API_KEY="AIzaSy..."
Get key free at: https://aistudio.google.com/apikey
```

> Note: Gemini free tier is limited to **3 requests/minute**. Daily quota also applies.
> Edge TTS has no such limits for personal use.

---

## 4. Check MLX TTS (Apple Silicon only)

Skip this step on Windows/Linux.

```bash
python -c "import mlx_audio; print('mlx-audio OK')" 2>&1
```

| Result | Status |
|--------|--------|
| `mlx-audio OK` | ✅ Available |
| `No module named mlx_audio` | ❌ Not installed |
| Not on macOS | ⏭️ Skipped |

**If not installed**, show:
```
pip install mlx-audio misaki[zh]
```

---

## 5. Report & Select Engine

After running the checks, summarize clearly:

```
Environment check:
  Platform:  macos
  Edge TTS:  ✅ edge-tts 7.2.8  (Python 3.x)  — unlimited, MP3 output
  Gemini:    ✅ GOOGLE_API_KEY set             — 3 req/min, WAV output
  MLX TTS:   ✅ mlx-audio OK                  — local, WAV/FLAC, best Chinese voices

Selected engine: edge-tts  (change with --engine gemini or mlx-tts)
```

Then load the platform doc and the selected engine doc before proceeding.

---

## 6. Output Directory

Ensure output directory exists. Default: `./output/` relative to cwd.

```bash
mkdir -p ./output
```

On Windows the path `./output` works fine in Bun — no need to use backslashes.
