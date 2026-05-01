## Studio Agent Tool Workflow Pattern

All studio agents that perform generation/rendering follow a 4-step workflow:

1. **Check status** — Use the agent's `*_status` tool to see current state before doing work.
2. **Review details** — Use the agent's detail tool (`*_voices`, `*_characters`, `*_list`) to understand scope.
3. **Generate/Render** — Execute the primary action. Always use `skipExisting: true` or stale-checking to avoid redundant work.
4. **Verify** — Re-run the status tool to confirm the output was created correctly.

### General Tool Rules

- **Always check status before generating** — avoid unnecessary re-generation or re-renders.
- **Use skipExisting** for incremental generation (only process missing/outdated items).
- **Stale outputs** (source newer than output) should be re-generated.
- **Failed items** are reported but should not stop the batch — note the error and continue.

### Render-Specific Rules

- Render timeout defaults to 600s (10 minutes). Increase for long episodes (>5 minutes of video).
- Output goes to `out/<episode-name>.mp4` within the episode directory.
- Expected output: 1920x1080 resolution, 30fps, MP4 format.

### TTS-Specific Rules

- macOS uses MLX TTS (local, offline). Other platforms use Gemini TTS (requires GOOGLE_API_KEY).
- Audio files go in `public/audio/` within the episode directory.
- After generation, Remotion Studio must reload to pick up new timings.

### Image-Specific Rules

- Uses z.ai image engine via Chrome browser automation (CDP mode).
- Character images: 1:1 aspect ratio, prompt ends with "solid magenta background".
- Background images: 16:9 aspect ratio, prompt includes "no text, no watermark, no characters, cinematic wide shot, 16:9".
