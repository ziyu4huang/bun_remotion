---
name: CLI CWD bug fix + arg resolution
description: storygraph CLI delegate commands had wrong CWD and resolved flag values as paths
type: feedback
---

## Rule: CLI arg resolution must handle flag-value pairs, not just prefix-based detection

**Why:** `args.map(a => a.startsWith('-') ? a : resolve(a))` resolved `hybrid` (value of `--mode`) as an absolute path like `/repo/hybrid`, breaking all `--mode` flags in delegated CLI commands. Also, `spawn('bun', ['run', 'src/scripts/...'], { cwd: scriptDir })` changed CWD from repo root, making all relative paths resolve incorrectly.

**How to apply:** When resolving CLI args for child processes:
1. Use explicit `flagsWithValues` set to skip flag values from path resolution
2. Use absolute script paths in spawn (not `bun run src/scripts/...`) to avoid CWD changes
3. Test CLI delegation end-to-end — running `bun run storygraph episode <dir> --mode hybrid` must produce AI enrichment, not just regex

Files: `bun_app/storygraph/src/cli.ts` lines 494-504
