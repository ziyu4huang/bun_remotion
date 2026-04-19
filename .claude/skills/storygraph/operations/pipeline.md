# op: pipeline `<series-dir>`

Full federated graph pipeline: episode extraction → merge → HTML → consistency check.

**Command:**
```bash
bun run --cwd bun_app/storygraph src/scripts/graphify-pipeline.ts <series-dir>
```

> **Note:** `<series-dir>` must be an **absolute path**. The `--cwd` flag resolves relative paths from `bun_app/storygraph/`, not the repo root.

**Inputs:**
- Series directory containing episode dirs (`*-ch*-ep*`)
- Each episode dir has `scripts/narration.ts`
- Optional: `PLAN.md` at series root (for gag table, character metadata)

**Outputs:**
- Per-episode: `<ep-dir>/storygraph_out/graph.json`
- Series-level: `<series-dir>/storygraph_out/merged-graph.json`
- Series-level: `<series-dir>/storygraph_out/graph.html` (interactive visualization)
- Series-level: `<series-dir>/storygraph_out/link-edges.json`
- Series-level: `<series-dir>/storygraph_out/consistency-report.md`

**Validation:**
1. Check all episodes processed: `ls <series-dir>/*/storygraph_out/graph.json | wc -l`
2. Check merged graph exists: `test -f <series-dir>/storygraph_out/merged-graph.json`
3. Check link edges present: `cat <series-dir>/storygraph_out/link-edges.json | jq length`
4. Check HTML opens without JS errors: `open <series-dir>/storygraph_out/graph.html`

**Knowledge Capture:** Record node counts, link edge counts, check results (PASS/WARN/FAIL) to TODO.md.
