# Platform: Windows

---

## Output Directory

Use forward slashes in Bun — they work on Windows:
```
./output/my-audio.mp3
```

Absolute path example: `C:/Users/<name>/proj/bun-remotion/output/my-audio.mp3`

---

## Playback (after generation)

Always play the file after generating so the user can hear it immediately.

**MP3 (edge-tts output):**
```bash
powershell.exe -Command "Start-Process 'C:/path/to/output/file.mp3'"
```

**WAV (Gemini output):**
```bash
powershell.exe -Command "Start-Process 'C:/path/to/output/file.wav'"
```

This opens the file in Windows Media Player or the default audio app.

**Alternative — PowerShell Media Player (inline playback, blocks until done):**
```powershell
powershell.exe -Command "
  \$player = New-Object System.Media.SoundPlayer 'C:/path/to/output/file.wav';
  \$player.PlaySync()
"
```
Only works for WAV. For MP3 use `Start-Process`.

**Alternative — FFplay (if FFmpeg installed):**
```bash
ffplay -nodisp -autoexit ./output/file.mp3
ffplay -nodisp -autoexit -f s16le -ar 24000 -ac 1 ./output/file.pcm   # raw PCM
```

---

## File Permissions

No special permissions needed. Bun can write to any user-owned directory.

---

## Path Notes

- `import.meta.dirname` works in Bun on Windows — use it for `__dirname` equivalent
- Avoid mixing `\` and `/` in the same path — stick to forward slashes
- PowerShell commands need the full absolute path with correct drive letter
