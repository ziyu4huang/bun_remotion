---
name: no-cd-in-bash
description: Never use cd in Bash tool — CWD persists across calls. Use bun run --cwd or absolute paths instead.
type: feedback
---

Never `cd` into a subdirectory in the Bash tool — not as a standalone call, and not with `&&`.

**Why:** The Bash tool's CWD persists across all subsequent calls in the session. After
`cd bun_remotion_proj/claude-code-intro && bun run script.ts`, the next Bash call also runs
from `bun_remotion_proj/claude-code-intro`. A second attempt to run the same command fails
because `bun_remotion_proj/claude-code-intro/bun_remotion_proj/claude-code-intro` doesn't exist.

**How to apply:**

For sub-app scripts, use `bun run --cwd` — it sets CWD only for the spawned process,
leaving the agent's CWD at repo root:
```bash
# ✅ correct — CWD stays at repo root after this
bun run --cwd bun_remotion_proj/claude-code-intro generate-tts

# ✅ also correct — __dirname in the script resolves paths from the script's own directory
bun bun_remotion_proj/claude-code-intro/scripts/generate-tts.ts

# ✅ correct — use root package.json scripts (they use --cwd not cd)
bun run generate-tts:claude

# ❌ wrong — persists CWD even with &&
cd bun_remotion_proj/claude-code-intro && bun run generate-tts

# ❌ wrong — obviously persists CWD
cd bun_remotion_proj/claude-code-intro
bun run generate-tts
```

For studio/render, always use `pwsh scripts/dev.ps1 <command> <app-name>` — the script uses
PowerShell `Push-Location`/`Pop-Location` internally and always restores CWD.

The root `package.json` scripts now use `bun run --cwd` (not `cd`) so `bun run generate-tts:claude`
etc. are safe to call from anywhere.
