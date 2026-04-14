---
name: bun_graphify
description: Bun/TypeScript knowledge graph generator — codebase AST analysis AND federated story knowledge graph for Remotion series
trigger: /bun_graphify
version: 2.0.0
---

# /bun_graphify

Bun/TypeScript knowledge graph generator with two modes:
1. **Codebase mode** — AST extraction from source code → code structure graph
2. **Story KG mode** — Natural language analysis of narration.ts → federated story knowledge graph

## Prerequisites

```bash
bun install --cwd bun_app/bun_graphify
python -c "import graphify" 2>/dev/null || pip install graphifyy -q
```

## Mode Detection

Detect mode from the path argument:
- Path is a **Remotion episode directory** (contains `scripts/narration.ts`) → **Episode mode** → read `operations/episode.md`
- Path is a **Remotion series directory** (contains episode dirs matching `*-ch*-ep*`) → **Pipeline mode** → read `operations/pipeline.md`
- Otherwise → **Codebase mode** → read `operations/codebase.md`

## Operations (Load on Demand)

Read ONLY the operation file you need. Do NOT read all operation files.

| Op | When | Read |
|----|------|------|
| `pipeline` | Series dir with `*-ch*-ep*` episodes | `operations/pipeline.md` |
| `episode` | Single episode dir with `narration.ts` | `operations/episode.md` |
| `merge` | Explicit merge request | `operations/merge.md` |
| `html` | Explicit HTML gen request | `operations/html.md` |
| `check` | Explicit consistency check request | `operations/check.md` |
| `codebase` | Non-Remotion source path | `operations/codebase.md` |

After any operation, read `post-run.md` for knowledge capture and self-reflection protocol.

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `src/cli.ts` | Codebase mode: detect → extract → build → cluster → export |
| `src/scripts/graphify-episode.ts` | Per-episode regex extraction from narration.ts |
| `src/scripts/graphify-merge.ts` | Concatenate sub-graphs + add link edges |
| `src/scripts/graphify-check.ts` | Consistency checking via link edges |
| `src/scripts/graphify-pipeline.ts` | Full pipeline: episode → merge → html → check |
| `src/scripts/gen-story-html.ts` | graph.json → vis.js HTML (single + merged) |
| `src/scripts/codebase-map.ts` | Generate CODEBASE_MAP.md |

## Important Notes

- **Paths must be absolute** — `bun run --cwd bun_app/bun_graphify` sets CWD for the spawned process only. All `<dir>` arguments must be absolute paths (e.g., `/Users/.../weapon-forger-ch1-ep2`), NOT relative. Relative paths get resolved from `bun_app/bun_graphify/` and fail silently.
- **bun_graphify_out/** is in `.gitignore` — output is ephemeral
- **Never put TypeScript syntax in HTML templates** — crashes browsers
- **Subagent JSON is fragile** — always validate with try/catch before writing

## See Also

- [PLAN.md](PLAN.md) — Full architecture, node types, edge relations
- [TODO.md](TODO.md) — Pipeline-level tasks, run history, known issues
- [post-run.md](post-run.md) — Knowledge capture + self-reflection protocol
- [../../bun_app/bun_graphify/PLAN.md](../../bun_app/bun_graphify/PLAN.md) — Code-level plan + reuse reference
- [../../bun_app/bun_graphify/TODO.md](../../bun_app/bun_graphify/TODO.md) — Code-level tasks (file/line specific)
