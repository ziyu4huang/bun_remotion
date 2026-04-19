# op: html `<dir>`

Generate interactive vis.js HTML visualization.

**Command:**
```bash
bun run --cwd bun_app/storygraph src/scripts/gen-story-html.ts <dir>
```

> **Note:** `<dir>` must be an **absolute path**. The `--cwd` flag resolves relative paths from `bun_app/storygraph/`, not the repo root.

Auto-detects:
- `<dir>` contains `storygraph_out/merged-graph.json` → merged mode (episode coloring)
- `<dir>` contains `storygraph_out/graph.json` → single episode mode (type coloring)

**Features:**
- Episode-based coloring (default for merged) with type toggle
- Link edges shown as dashed colored lines
- Search, node info panel, legend with click-to-hide

**Validation:** Open in browser. Check no console errors. Verify toggle works.

## Debugging with Playwright

To visually inspect graph.html (find overflow issues, verify node rendering):

```bash
# 1. Start HTTP server (file:// doesn't work with Playwright)
npx -y http-server <dir>/storygraph_out -p 8765 --cors -c-1 &

# 2. Open in Playwright and wait for physics
playwright-cli open "http://localhost:8765/graph.html"
sleep 6

# 3. Find high-degree nodes (write to .playwright-cli/ then run)
cat > .playwright-cli/check.js << 'JS'
async (page) => {
  const result = await page.evaluate(() => {
    var ns = network.body.data.nodes;
    var es = network.body.data.edges;
    var d = {};
    es.forEach(function(e) { d[e.from]=(d[e.from]||0)+1; d[e.to]=(d[e.to]||0)+1; });
    return Object.entries(d).sort(function(a,b){return b[1]-a[1]}).slice(0,5)
      .map(function(x){return x[0]+' | '+ns.get(x[0]).label+' | deg='+x[1]});
  });
  return result.join('\n');
}
JS
playwright-cli --raw run-code --filename=.playwright-cli/check.js

# 4. Click a node by ID
cat > .playwright-cli/click.js << 'JS'
async (page) => {
  const pos = await page.evaluate(() => {
    var p = network.getPositions(['NODE_ID'])['NODE_ID'];
    var r = document.getElementById('graph').getBoundingClientRect();
    var vp = network.canvasToDOM({x:p.x,y:p.y});
    return {x:vp.x+r.left, y:vp.y+r.top};
  });
  await page.mouse.click(pos.x, pos.y);
}
JS
playwright-cli run-code --filename=.playwright-cli/click.js

# 5. Screenshot
playwright-cli screenshot --filename=graph-check.png
```

**Tips:** Files must be under project root or `.playwright-cli/`. Use `--raw` for return values. Always wait 5-6s for physics stabilization.
