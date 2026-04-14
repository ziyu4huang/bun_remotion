---
name: sequential-render
description: Video renders must be done one at a time, never in parallel — they compete for CPU/GPU/memory and can cause frame drops or crashes
type: feedback
---

## Rule: Always render videos sequentially, never in parallel

**Why:** Remotion renders are CPU/GPU intensive. Running two renders simultaneously causes resource contention, slower overall time, and potential frame quality issues.

**How to apply:** Queue renders one after another. Wait for the first render to complete before starting the next. Use `run_in_background` for the current render, then start the next after completion notification.
