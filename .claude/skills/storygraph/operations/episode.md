# op: episode `<episode-dir>`

Extract story KG for a single episode from narration.ts.

**Command:**
```bash
bun run --cwd bun_app/storygraph src/scripts/graphify-episode.ts <episode-dir> [--series-dir <series-dir>]
```

> **Note:** `<episode-dir>` and `<series-dir>` must be **absolute paths**. The `--cwd` flag resolves relative paths from `bun_app/storygraph/`, not the repo root.

**Inputs:**
- Episode directory with `scripts/narration.ts`
- Optional `--series-dir` for PLAN.md gag matching

**Outputs:**
- `<ep-dir>/storygraph_out/graph.json` — Episode story KG
- `<ep-dir>/storygraph_out/.narrative_extract.json` — Raw extraction data
- `<ep-dir>/storygraph_out/plan.json` — Run metadata

**Subagent Alternative:** For richer analysis, spawn a Claude subagent to analyze narration.ts and produce story KG JSON with node types: `episode_plot`, `scene`, `character_instance`, `plot_event`, `artifact`, `running_gag`, `character_trait`, `relationship`, `theme`.

**Validation:** Check graph.json has 20-50 nodes. Verify JSON is valid: `jq . <ep-dir>/storygraph_out/graph.json > /dev/null`.
