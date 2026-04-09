# Platform: macOS

---

## Output Directory

```
./output/my-audio.mp3
```

---

## Playback (after generation)

Always play the file after generating so the user can hear it immediately.

**MP3 (edge-tts output):**
```bash
afplay ./output/file.mp3
```

**WAV (Gemini output):**
```bash
afplay ./output/file.wav
```

`afplay` is built into macOS — no install needed. It blocks until playback is done.

**Alternative — open in default app:**
```bash
open ./output/file.mp3
```

**Alternative — FFplay (if FFmpeg installed):**
```bash
ffplay -nodisp -autoexit ./output/file.mp3
```

---

## macOS-specific Notes

- `python3` is the default on macOS — use `python3 -m edge_tts` if `python` is not found
- `import.meta.dirname` works in Bun on macOS
