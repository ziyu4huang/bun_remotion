---
name: CWD Safety — Never cd into subdirectories
description: Agent must never change CWD via cd commands. Use --cwd flag or subshells instead.
type: feedback
---

Agent Bash tool persists working directory across calls. A single `cd bun_remotion_proj/<name>` corrupts all subsequent commands.

**Why:** The agent runs in a persistent shell. `cd` changes CWD for ALL future commands, causing silent failures (wrong package.json, missing scripts, path resolution errors).

**How to apply:**
- Use `bun run --cwd <path> <script>` for sub-app scripts
- Use `bash scripts/dev.sh` for studio/render (handles cd internally via subshell)
- Use absolute paths with Read/Write/Edit tools
- Use `spawn` with `cwd` option in server code (already correct in remotion-renderer.ts, pipeline-api.ts)
- Package.json scripts must use `--cwd` not `cd &&` (fixed `generate-tts:youth` in root package.json)
- NEVER use `cd <subdir>` in any Bash tool command
