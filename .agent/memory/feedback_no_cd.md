---
name: no-cd-in-bash
description: Never use cd in Claude Code Bash tool — CWD persists across calls causing silent failures
type: feedback
---

# Never `cd` in Claude Code Bash commands

## Rule
NEVER run `cd <subdirectory>` in Bash tool calls. Always run commands from the repo root.

## Why
Claude Code's Bash tool persists the working directory across calls. Once you `cd apps/xxx`, all subsequent commands silently run from that wrong directory. This caused:
- `bun run build:stock` failing with "script not found" because it looked in the app's package.json instead of root
- Multiple wasted retries trying to figure out why commands kept failing
- The CWD gets "stuck" and even background tasks inherit the wrong directory

## How to apply
- Use absolute paths or the Read/Write/Edit tools for file operations
- Use wrapper scripts (`scripts/dev.ps1`) that handle directory changes internally with `Push-Location`/`Pop-Location`
- For this project specifically: `bun start`, `bun run build`, etc. all work from root via `dev.ps1`
- If you must change directory, use `cd /path && command` in a single Bash call so CWD reverts after
