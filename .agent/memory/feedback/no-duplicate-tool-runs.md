---
name: no-duplicate-tool-runs
description: Don't re-run long commands (render, build, tests) that already produced a clear result. Wait for completion once, then move on.
type: feedback
---

**Rule:** Never re-run a command that already completed successfully and produced readable output.

**Why:** The first `bash scripts/dev.sh render weapon-forger-ch1-ep1` completed and showed `Rendered 4860/4860` — proof it worked. Re-running it wasted ~10 minutes of the user's time waiting for a redundant render.

**How to apply:**
- If a build/render/test command completes and the output clearly shows success or failure, trust it and move on
- If you need to verify the output file exists, use `ls -la out/` instead of re-rendering
- If a background task is already running, check its output rather than starting a new one
- For renders specifically: `Rendered N/N` in the output means success — no need to re-run
