---
name: graphify-bun
description: Bun/TypeScript knowledge graph generator — code to graph to communities to HTML + JSON (no Python needed for AST pipeline)
trigger: /graphify-bun
---

# /graphify-bun

Pure Bun/TypeScript implementation of the graphify pipeline. Uses Python tree-sitter as a subprocess for AST extraction (no PYTHONUTF8 needed, no monkey-patching).

## Prerequisites

```bash
# Bun + dependencies (installed in bun_app/graphify/)
bun install --cwd bun_app/graphify

# Python tree-sitter (used as subprocess for AST extraction)
python -c "import graphify" 2>/dev/null || pip install graphifyy -q
```

## Usage

```
/graphify-bun <path>                              # full pipeline
/graphify-bun <path> --no-viz                     # skip HTML, just JSON + report
/graphify-bun <path> --output-dir <dir>            # custom output dir
```

## Query Tools (on existing graph.json)

```bash
# Codebase map
bun run --cwd bun_app/graphify src/scripts/codebase-map.ts graphify-out/graph.json --labels graphify-out/.labels.json

# Node explanation
bun run --cwd bun_app/graphify src/scripts/explain.ts graphify-out/graph.json "NodeName"
```

## What You Must Do When Invoked

If no path was given, use `.` (current directory). Do not ask the user for a path.

### Step 1 — Run the pipeline

```bash
bun run --cwd bun_app/graphify src/cli.ts full <path> --output-dir graphify-out
```

Wait for completion. It will output:
- `graphify-out/graph.json` — node_link format (NetworkX compatible)
- `graphify-out/graph.html` — interactive vis.js visualization
- `graphify-out/GRAPH_REPORT.md` — analysis report

### Step 2 — Show results

Present the stats line (nodes, edges, communities). If `graph.html` was generated, offer to open it.

### Step 3 — Generate CODEBASE_MAP.md

```bash
bun run --cwd bun_app/graphify src/scripts/codebase-map.ts graphify-out/graph.json --output graphify-out/CODEBASE_MAP.md
cp graphify-out/CODEBASE_MAP.md .agent/memory/project/codebase-map.md
```

Show the CODEBASE_MAP.md content.

## Architecture

The TypeScript pipeline handles: **detect → AST extract → build → cluster → export**.

- **AST extraction** uses Python tree-sitter as a subprocess (reliable on Windows)
- **Graph operations** use `graphology` (pure JS, no native deps)
- **Community detection** uses Louvain (via `graphology-communities-louvain`)
- **HTML export** generates vis.js visualization matching Python graphify output
- **Semantic extraction** (docs/papers/images) is NOT included — dispatch Claude subagents for this separately if needed

## Output Format

`graph.json` is NetworkX node_link_data compatible:
```json
{
  "directed": false,
  "multigraph": false,
  "graph": { "hyperedges": [] },
  "nodes": [{ "id", "label", "file_type", "source_file", "source_location", "community" }],
  "links": [{ "source", "target", "relation", "confidence", "confidence_score", "source_file", "weight", "_src", "_tgt" }]
}
```

This format is compatible with the Python graphify tools (`explain.py`, `codebase_map.py`, etc.) for cross-tool analysis.
