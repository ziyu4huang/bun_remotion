---
name: sequential-tts-render
description: TTS generation and video rendering must be done sequentially per episode, not parallelized
type: feedback
---

TTS generation and MP4 rendering must run sequentially — one episode at a time (TTS → render → verify → next episode).

**Why:** Parallel TTS causes resource contention on the local MLX model and rate-limited Gemini API. Parallel rendering can hit memory limits. Sequential per-ep ensures each step completes cleanly before moving on.

**How to apply:** For episode verification pipelines, always: 1) generate TTS for ep N, 2) render ep N, 3) verify ep N, 4) then proceed to ep N+1. Never run TTS for multiple episodes simultaneously.
