---
name: bun_graphify
description: Bun/TypeScript knowledge graph generator — multiple input sources to graph to communities to HTML + JSON + plan file
trigger: /bun_graphify
---

# /bun_graphify

Bun/TypeScript knowledge graph generator. Accepts multiple input sources, produces a single output folder with graph.json, graph.html, GRAPH_REPORT.md, and plan.json.

## Prerequisites

```bash
# Bun + dependencies (installed in bun_app/bun_graphify/)
bun install --cwd bun_app/bun_graphify

# Python tree-sitter (used as subprocess for AST extraction)
python -c "import graphify" 2>/dev/null || pip install graphifyy -q
```

## Usage

```
/bun_graphify <path>                                # full pipeline on single path
/bun_graphify src/ lib/ tests/                      # full pipeline on multiple paths
/bun_graphify <path> --no-viz                       # skip HTML, just JSON + report
/bun_graphify <path> --output-dir <dir>             # custom output dir
/bun_graphify <path> --include .ts,.py              # only process these extensions
/bun_graphify <path> --exclude .test.ts,.spec.ts    # skip these extensions
/bun_graphify <path> --exclude-dir vendor,__tests__ # skip these directories
/bun_graphify <path> --max-files 100                # cap file count
/bun_graphify <path> --format json                  # only JSON, no HTML
/bun_graphify <path> --verbose                      # detailed progress
```

## Query Tools (on existing graph.json)

```bash
# BFS traversal from a node
bun run --cwd bun_app/bun_graphify src/cli.ts query graphify-out/graph.json "NodeName"

# Node explanation (fuzzy search)
bun run --cwd bun_app/bun_graphify src/cli.ts explain graphify-out/graph.json "NodeName"

# Show plan info from previous run
bun run --cwd bun_app/bun_graphify src/cli.ts plan graphify-out/plan.json

# Codebase map
bun run --cwd bun_app/bun_graphify src/scripts/codebase-map.ts graphify-out/graph.json --labels graphify-out/.labels.json

# Node explanation script
bun run --cwd bun_app/bun_graphify src/scripts/explain.ts graphify-out/graph.json "NodeName"
```

## What You Must Do When Invoked

If no path was given, use `.` (current directory). Do not ask the user for a path.

### Step 1 — Run the pipeline

```bash
bun run --cwd bun_app/bun_graphify src/cli.ts full <paths...> --output-dir graphify-out
```

Wait for completion. It will output:
- `graphify-out/graph.json` — node_link format (NetworkX compatible)
- `graphify-out/graph.html` — interactive vis.js visualization
- `graphify-out/GRAPH_REPORT.md` — analysis report
- `graphify-out/plan.json` — run config snapshot (inputs, options, stats, timestamp)

### Step 2 — Show results

Present the stats line (nodes, edges, communities). If `graph.html` was generated, offer to open it.

### Step 3 — Generate CODEBASE_MAP.md

```bash
bun run --cwd bun_app/bun_graphify src/scripts/codebase-map.ts graphify-out/graph.json --output graphify-out/CODEBASE_MAP.md
cp graphify-out/CODEBASE_MAP.md .agent/memory/project/codebase-map.md
```

Show the CODEBASE_MAP.md content.

## Architecture

The TypeScript pipeline handles: **detect → AST extract → build → cluster → export → plan**.

- **Multiple input sources**: detect each path, merge results by deduplicating absolute paths
- **Filtering**: --include, --exclude, --exclude-dir, --max-files applied after detection
- **AST extraction** uses Python tree-sitter as a subprocess (reliable on Windows)
- **Graph operations** use `graphology` (pure JS, no native deps)
- **Community detection** uses Louvain (via `graphology-communities-louvain`)
- **HTML export** generates vis.js visualization matching Python graphify output
- **Plan file** saves run config snapshot (version, inputs, options, stats, timestamp)
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

`plan.json` captures the run configuration:
```json
{
  "version": "0.2.0",
  "inputs": ["src/", "lib/"],
  "output_dir": "graphify-out",
  "options": { "format": "both", "title": "graphify", "include": null, "exclude": null, "exclude_dirs": [], "no_viz": false },
  "stats": { "files_detected": 42, "nodes": 150, "edges": 280, "communities": 8 },
  "timestamp": "2026-04-13T10:30:00Z"
}
```

These formats are compatible with the Python graphify tools (`explain.py`, `codebase_map.py`, etc.) for cross-tool analysis.
