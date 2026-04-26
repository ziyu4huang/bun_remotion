# Format Reference & Troubleshooting

## graph.json Format

NetworkX `node_link_data()` format:

```json
{
  "directed": true,
  "multigraph": false,
  "graph": {},
  "nodes": [{"id": "...", "label": "...", "community": 0, "source_file": "..."}],
  "links": [{"source": "node_id", "target": "node_id", "relation": "...", "confidence": "EXTRACTED", "confidence_score": 1.0, "weight": 1.0}],
  "hyperedges": []
}
```

- Key for edges is **`links`**, NOT `edges`
- Node `community` is an integer (map to label via `.labels.json`)
- `confidence_score`: 1.0 = EXTRACTED (AST truth), 0.6-0.9 = INFERRED, 0.1-0.3 = AMBIGUOUS

### Node ID Convention

| Node type | ID pattern | Example |
|-----------|-----------|---------|
| File | `<filestem>` | `book_manager` |
| Class | `<filestem>_<classname>` | `book_manager_bookmanager` |
| Method | `<filestem>_<classname>_<method>` | `book_manager_bookmanager_init` |
| Function | `<filestem>_<funcname>` | `cli_main` |
| Docstring/rationale | `<filestem>_rationale_<line>` | `book_manager_rationale_1` |

**Prefer class/function nodes for lookups** — they have the most connections. File nodes are containers; rationale nodes are docstring fragments.

## Windows-Specific Troubleshooting

### UnicodeEncodeError on report generation

Set `PYTHONUTF8=1` globally:
```bash
echo '$env:PYTHONUTF8 = "1"' >> "$HOME/Documents/PowerShell/Microsoft.PowerShell_profile.ps1"
# Or system-wide: setx PYTHONUTF8 1
```

### Unsupported language (.v, .sv, .vhd) not detected

graphify v0.3.20 has hardcoded `CODE_EXTENSIONS`. Step 2 patches it. Extraction script handles unsupported via direct tree-sitter.

### tree-sitter-languages doesn't work on Windows

No wheels for Windows. Use individual `tree-sitter-<lang>` packages (e.g. `tree-sitter-verilog`).

### Python heredoc fails in Bash on Windows

Write Python scripts to files first. `scripts/extract_enhanced.py` avoids heredoc issues.

## Honesty Rules

- Never invent an edge. If unsure, use AMBIGUOUS.
- Never skip the corpus check warning.
- Always show token cost in the report.
- Never hide cohesion scores behind symbols - show the raw number.
- Never run HTML viz on a graph with more than 5,000 nodes without warning the user.

## Flag Modifiers

- `--watch`: Not implemented
- `--cluster-only`: Skip Steps 1-3, re-cluster existing `.graphify_extract.json`
- `--neo4j` / `--neo4j-push`: `from graphify.export import to_cypher` in Step 7
- `--mcp`: `python -m graphify.serve graphify-out/graph.json` after Step 9
- `--svg`: `from graphify.export import to_svg` in Step 7
- `--graphml`: `from graphify.export import to_graphml` in Step 7
