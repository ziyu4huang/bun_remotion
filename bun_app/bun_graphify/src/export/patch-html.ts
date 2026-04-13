// Post-process graph.html to add toggle buttons for hyperedges and isolated nodes

import { readFile, writeFile } from 'node:fs/promises';

export async function patchHTML(htmlPath: string): Promise<boolean> {
  let text: string;
  try {
    text = await readFile(htmlPath, 'utf-8');
  } catch {
    console.error(`ERROR: ${htmlPath} not found`);
    return false;
  }

  if (text.includes('toggle-wrap')) {
    console.log('Already patched — skipping.');
    return true;
  }

  // 1. Inject CSS before </style>
  const toggleCSS = `
  #toggle-wrap { padding: 8px 14px; border-top: 1px solid #2a2a4e; display: flex; gap: 6px; flex-wrap: wrap; }
  .toggle-btn { background: #2a2a4e; border: 1px solid #3a3a5e; color: #ccc; padding: 5px 10px; border-radius: 5px; font-size: 11px; cursor: pointer; transition: all 0.15s; }
  .toggle-btn:hover { background: #3a3a5e; }
  .toggle-btn.active { background: #4E79A7; border-color: #4E79A7; color: #fff; }`;
  text = text.replace('</style>', toggleCSS + '\n</style>');

  // 2. Inject buttons before <div id="stats">
  const toggleHTML = `
  <div id="toggle-wrap">
    <button class="toggle-btn active" id="btn-hyperedges" onclick="toggleHyperedges()">Hyperedges</button>
    <button class="toggle-btn active" id="btn-isolated" onclick="toggleIsolated()">Isolated Nodes</button>
  </div>
`;
  text = text.replace('<div id="stats">', toggleHTML + '<div id="stats">');

  // 3. Inject toggle JS before hyperedge drawing script
  const toggleJS = `<script>
let showHyperedges = true;
const isolatedNodeIds = new Set();
(function findIsolated() {
  const deg = {};
  RAW_EDGES.forEach(e => { deg[e.from] = (deg[e.from]||0)+1; deg[e.to] = (deg[e.to]||0)+1; });
  RAW_NODES.forEach(n => { if (!deg[n.id]) isolatedNodeIds.add(n.id); });
})();
function toggleHyperedges() {
  showHyperedges = !showHyperedges;
  document.getElementById('btn-hyperedges').classList.toggle('active', showHyperedges);
  network.redraw();
}
function toggleIsolated() {
  const btn = document.getElementById('btn-isolated');
  const hide = btn.classList.contains('active');
  btn.classList.toggle('active', !hide);
  isolatedNodeIds.forEach(id => { network.body.data.nodes.update({ id, hidden: !hide }); });
}
</script>
`;
  text = text.replace(
    '<script>\n// Hyperedges',
    toggleJS + '<script>\n// Hyperedges',
  );

  // 4. Guard drawHyperedges with showHyperedges check
  text = text.replace(
    'function drawHyperedges() {\n  const canvas',
    'function drawHyperedges() {\n  if (!showHyperedges) return;\n  const canvas',
  );

  await writeFile(htmlPath, text, 'utf-8');
  console.log(`Patched ${htmlPath} — added toggle buttons.`);
  return true;
}
