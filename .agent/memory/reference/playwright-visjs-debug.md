---
name: playwright-visjs-debug
description: How to use Playwright to inspect and debug vis.js graph HTML visualizations (node positions, degrees, clicking, screenshots)
type: reference
---

# Playwright + vis.js Debugging

## Setup

vis.js HTML files can't use `file://` protocol with Playwright. Use an HTTP server:

```bash
npx -y http-server <dir> -p 8765 --cors -c-1 &
playwright-cli open "http://localhost:8765/graph.html"
sleep 6  # wait for physics stabilization
```

## Key Techniques

### Find highest-degree nodes

Write a JS file to `.playwright-cli/` (only allowed root), then run with `run-code`:

```javascript
// .playwright-cli/degree-check.js
async (page) => {
  const result = await page.evaluate(() => {
    var ns = network.body.data.nodes;
    var es = network.body.data.edges;
    var d = {};
    es.forEach(function(e) { d[e.from]=(d[e.from]||0)+1; d[e.to]=(d[e.to]||0)+1; });
    var s = Object.entries(d).sort(function(a,b){return b[1]-a[1]}).slice(0,10);
    return s.map(function(x){return x[0]+' | '+ns.get(x[0]).label+' | deg='+x[1];});
  });
  return result.join('\n');
}
```

```bash
playwright-cli --raw run-code --filename=.playwright-cli/degree-check.js
```

### Click a specific node by ID

```javascript
// .playwright-cli/click-node.js
async (page) => {
  const pos = await page.evaluate(() => {
    var p = network.getPositions(['NODE_ID_HERE'])['NODE_ID_HERE'];
    var rect = document.getElementById('graph').getBoundingClientRect();
    var vp = network.canvasToDOM({x: p.x, y: p.y});
    return {x: vp.x + rect.left, y: vp.y + rect.top};
  });
  await page.mouse.click(pos.x, pos.y);
}
```

### Screenshot after interaction

```bash
playwright-cli screenshot --filename=result.png
```

## Caveats

- `playwright-cli eval` has parsing issues with complex JS (semicolons, `const`). Use `run-code --filename` instead.
- Files must be under project root or `.playwright-cli/` — `/tmp/` and `/dev/stdin` are blocked.
- Use `--raw` flag to get return values without wrapper output.
- Always `sleep 5-6` after page load for vis.js physics stabilization.
- `console.log` from `run-code` doesn't reliably appear in console logs — use return values instead.
