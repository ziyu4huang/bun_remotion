# op: merge `<series-dir>`

Merge per-episode sub-graphs into federated graph with cross-episode link edges.

**Command:**
```bash
bun run --cwd bun_app/storygraph src/scripts/graphify-merge.ts <series-dir>
```

> **Note:** `<series-dir>` must be an **absolute path**. The `--cwd` flag resolves relative paths from `bun_app/storygraph/`, not the repo root.

**Inputs:** All `<ep-dir>/storygraph_out/graph.json` files + optional `PLAN.md`

**Outputs:**
- `storygraph_out/merged-graph.json` — All nodes/edges + link edges
- `storygraph_out/link-edges.json` — Cross-episode link edges only
- `storygraph_out/MERGED_REPORT.md` — Summary report

**Link Edge Types (anchors for consistency checking):**
| Link Edge | Connects | Checks For |
|-----------|----------|------------|
| `same_character` | Character A in ep1 ↔ A in ep2 | Trait drift, personality conflict |
| `story_continues` | Plot node ep1 → Plot node ep2 | Duplicate plot, story arc gaps |
| `gag_evolves` | Gag manifestation → next | Stagnation, repetition |

**Validation:**
- Link edges exist: `jq '. | length' link-edges.json`
- Every node has `episode` property: `jq '.nodes[] | select(.episode == null)' merged-graph.json` should be empty
