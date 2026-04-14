# op: html `<dir>`

Generate interactive vis.js HTML visualization.

**Command:**
```bash
bun run --cwd bun_app/bun_graphify src/scripts/gen-story-html.ts <dir>
```

> **Note:** `<dir>` must be an **absolute path**. The `--cwd` flag resolves relative paths from `bun_app/bun_graphify/`, not the repo root.

Auto-detects:
- `<dir>` contains `bun_graphify_out/merged-graph.json` → merged mode (episode coloring)
- `<dir>` contains `bun_graphify_out/graph.json` → single episode mode (type coloring)

**Features:**
- Episode-based coloring (default for merged) with type toggle
- Link edges shown as dashed colored lines
- Search, node info panel, legend with click-to-hide

**Validation:** Open in browser. Check no console errors. Verify toggle works.
