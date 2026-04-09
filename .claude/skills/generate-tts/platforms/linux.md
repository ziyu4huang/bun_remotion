# Platform: Linux

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
mpg123 ./output/file.mp3        # install: apt install mpg123
# or
ffplay -nodisp -autoexit ./output/file.mp3
```

**WAV (Gemini output):**
```bash
aplay ./output/file.wav         # ALSA, built into most distros
# or
ffplay -nodisp -autoexit ./output/file.wav
```

**Check what's available:**
```bash
which mpg123 aplay ffplay 2>&1
```

---

## Linux-specific Notes

- Use `python3` explicitly if `python` is not aliased
- If running headless / no audio device: skip playback, just report the file path
- `import.meta.dirname` works in Bun on Linux
