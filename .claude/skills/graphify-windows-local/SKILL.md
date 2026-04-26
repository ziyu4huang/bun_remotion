---
name: graphify-windows-local
description: any input (code, docs, papers, images) to knowledge graph to clustered communities to HTML + JSON + audit report (Windows-enhanced with unsupported language support)
trigger: /graphify-windows
---

# /graphify-windows (Windows-Enhanced)

Enhanced graphify for Windows: PYTHONUTF8=1, unsupported language support (.v, .sv, .vhd), Bash commands, standalone extraction script.

## Usage

```
/graphify-windows <path>                              # full pipeline
/graphify-windows <path> --mode deep                  # richer INFERRED edges
/graphify-windows <path> --no-viz                     # skip visualization
/graphify-windows <path> --svg / --graphml            # export formats
/graphify-windows <path> --summarize                  # regenerate CODEBASE_MAP.md only
/graphify-windows <path> --claudemd                   # generate CLAUDE.md section
/graphify-windows <path> --diff                       # compare vs previous run
/graphify-windows <path> --quick                      # skip unchanged via cache
/graphify-windows <path> --update                     # incremental re-extraction
/graphify-windows query "<question>"                  # BFS traversal
/graphify-windows path "NodeA" "NodeB"                # shortest path
/graphify-windows explain "NodeName"                  # node explanation
/graphify-windows explain-how-it-works [topic]        # pipeline docs
```

If no path given, use `.` (current directory). Do not ask.

## Dispatch Rules

**Early exits** — skip pipeline, read [`operations/early-exits.md`](operations/early-exits.md):
- `--summarize`, `--claudemd`, `explain-how-it-works`, `--diff`, `--quick`, `--update`

**Query/explain/path** — post-pipeline, read [`operations/query-explain.md`](operations/query-explain.md):
- `query`, `path`, `explain`, `add`

**Full pipeline** — read [`operations/pipeline.md`](operations/pipeline.md) and execute Steps 1-9:
1. Install check + PYTHONUTF8
2. Detect files + patch unsupported extensions
3. Extract: Part A (AST) + Part B (semantic subagents) in parallel, then Part C (merge)
4. Build graph, cluster, analyze
5. Label communities (AI names each cluster)
6. Generate HTML
7. Optional exports (--svg, --graphml, --neo4j, --mcp)
8. Token benchmark (>5000 words only)
9. Cleanup + CODEBASE_MAP.md

**Format reference** — read [`operations/format-reference.md`](operations/format-reference.md):
- graph.json node_link format, node ID conventions, flag modifiers, Windows troubleshooting
