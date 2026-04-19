# op: check `<series-dir>`

Run consistency checks on merged graph via link edge traversal.

**Command:**
```bash
bun run --cwd bun_app/storygraph src/scripts/graphify-check.ts <series-dir>
```

> **Note:** `<series-dir>` must be an **absolute path**. The `--cwd` flag resolves relative paths from `bun_app/storygraph/`, not the repo root.

**Inputs:** `storygraph_out/merged-graph.json` + `link-edges.json`

**Outputs:** `storygraph_out/consistency-report.md`

**Checks:**
| Check | Traverses | Detects |
|-------|-----------|---------|
| Character Consistency | `same_character` links | Missing core traits across episodes |
| Gag Evolution | `gag_evolves` links | Identical/near-identical manifestations |
| Tech Term Diversity | Per-episode nodes | <2 tech terms per episode |
| Trait Coverage | Character nodes | Characters with no detected traits |
| Interaction Density | Per-episode edges | Characters with no interactions |
