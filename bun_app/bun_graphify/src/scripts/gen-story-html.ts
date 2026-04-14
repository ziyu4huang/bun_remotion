/**
 * Generate vis.js HTML visualization from story KG graph.json.
 *
 * Supports two modes:
 *   1. Single episode — reads <episode-dir>/bun_graphify_out/graph.json
 *   2. Merged series — reads <series-dir>/bun_graphify_out/merged-graph.json
 *
 * Auto-detects mode: if path contains merged-graph.json → merged; if graph.json → single.
 *
 * Usage:
 *   bun run src/scripts/gen-story-html.ts <dir-containing-graph-json>
 *
 * Examples:
 *   bun run src/scripts/gen-story-html.ts ../../bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep1
 *   bun run src/scripts/gen-story-html.ts ../../bun_remotion_proj/weapon-forger
 */
import { resolve, basename } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import Graph from "graphology";
import louvain from "graphology-communities-louvain";

// ─── Args ───

const targetDir = resolve(process.argv[2] || ".");

// Auto-detect graph source
const mergedPath = resolve(targetDir, "bun_graphify_out", "merged-graph.json");
const singlePath = resolve(targetDir, "bun_graphify_out", "graph.json");

let isMerged = false;
let graphPath: string;
let outDir: string;

if (existsSync(mergedPath)) {
  isMerged = true;
  graphPath = mergedPath;
  outDir = resolve(targetDir, "bun_graphify_out");
} else if (existsSync(singlePath)) {
  isMerged = false;
  graphPath = singlePath;
  outDir = resolve(targetDir, "bun_graphify_out");
} else {
  console.error(`No graph.json or merged-graph.json found in ${targetDir}`);
  console.error(`Expected: ${mergedPath} or ${singlePath}`);
  process.exit(1);
}

console.log(`Mode: ${isMerged ? "merged" : "single-episode"}`);
console.log(`Reading: ${graphPath}`);

// ─── Read graph data ───

const raw = JSON.parse(readFileSync(graphPath, "utf-8"));
const nodes = raw.nodes || [];
const links = raw.links || [];
const epId = raw.episode_id || basename(targetDir);
const linkEdgesData: Array<{ source: string; target: string; relation: string }> = raw.link_edges || [];

// ─── Build graphology graph ───

const G = new Graph({ multi: false, type: "directed" });
for (const n of nodes) {
  if (!G.hasNode(n.id)) {
    G.addNode(n.id, {
      label: n.label || n.properties?.name || n.properties?.title || n.id,
      type: n.type || n.file_type || "unknown",
      episode: n.episode || "",
      source_file: n.source_file || "",
      properties: n.properties || {},
    });
  }
}
for (const e of links) {
  if (e.source === e.target) continue;
  if (!G.hasNode(e.source) || !G.hasNode(e.target)) continue;
  if (!G.hasEdge(e.source, e.target)) {
    try {
      G.addDirectedEdge(e.source, e.target, {
        relation: e.relation || "related",
        confidence: e.confidence || "EXTRACTED",
        weight: e.weight || 1.0,
      });
    } catch {}
  }
}

// ─── Community detection ───

let communities: Record<string, string[]> = {};
try {
  const mapping: Record<string, number> = louvain(G);
  for (const [node, cid] of Object.entries(mapping)) {
    const key = String(cid);
    if (!communities[key]) communities[key] = [];
    communities[key].push(node);
  }
} catch (e) {
  console.warn(`Clustering failed: ${e}`);
}

const communityLabels: Record<string, string> = {};
for (const [cid, members] of Object.entries(communities)) {
  const types: Record<string, number> = {};
  for (const m of members) {
    const t = G.getNodeAttribute(m, "type") || "unknown";
    types[t] = (types[t] || 0) + 1;
  }
  communityLabels[cid] = Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t).join(", ");
}

// ─── Color palettes ───

const TYPE_COLORS: Record<string, string> = {
  episode_plot: "#E15759",
  scene: "#FF9DA7",
  character_instance: "#4E79A7",
  plot_event: "#F28E2B",
  artifact: "#76B7B2",
  running_gag: "#EDC948",
  gag_manifestation: "#EDC948",
  character_trait: "#59A14F",
  relationship: "#B07AA1",
  theme: "#9C755F",
  tech_term: "#BAB0AC",
};

const EPISODE_COLORS: Record<string, string> = {
  ch1ep1: "#E15759",
  ch1ep2: "#F28E2B",
  ch1ep3: "#EDC948",
  ch2ep1: "#59A14F",
  ch2ep2: "#76B7B2",
  ch2ep3: "#4E79A7",
  ch3ep1: "#B07AA1",
  ch3ep2: "#9C755F",
  ch3ep3: "#FF9DA7",
  ch4ep1: "#FF6B6B",
  ch4ep2: "#4ECDC4",
  ch4ep3: "#FFE66D",
};

const LINK_EDGE_COLORS: Record<string, string> = {
  same_character: "#FF6B6B",
  story_continues: "#4ECDC4",
  gag_evolves: "#FFE66D",
};

const defaultEpColor = "#BAB0AC";

// ─── Prepare viz data ───

let maxDeg = 1;
G.forEachNode(node => { const d = G.degree(node); if (d > maxDeg) maxDeg = d; });

const vizNodes: any[] = [];
G.forEachNode((id, attrs) => {
  const comm = Object.entries(communities).find(([_, m]) => m.includes(id))?.[0] || "0";
  const deg = G.degree(id);
  vizNodes.push({
    id,
    label: attrs.label || id,
    community: Number(comm),
    community_name: communityLabels[comm] || `Community ${comm}`,
    source_file: attrs.source_file || "",
    file_type: attrs.type || "unknown",
    episode: attrs.episode || "",
    degree: deg,
    size: Math.round(10 + 30 * (deg / maxDeg)),
    font_size: deg >= maxDeg * 0.15 ? 12 : 0,
    properties: attrs.properties || {},
  });
});

// Build a set of link edge keys for fast lookup
const linkEdgeSet = new Set<string>();
for (const le of linkEdgesData) {
  linkEdgeSet.add(`${le.source}→${le.target}`);
  linkEdgeSet.add(`${le.target}→${le.source}`); // bidirectional
}

const vizEdges: any[] = [];
G.forEachEdge((_key, attrs, src, tgt) => {
  const edgeKey = `${src}→${tgt}`;
  const isLink = linkEdgeSet.has(edgeKey);
  const relation = attrs.relation || "";

  if (isLink && isMerged) {
    // Link edges: dashed, colored by relation type
    vizEdges.push({
      from: src, to: tgt,
      title: `[LINK] ${relation}`,
      dashes: true,
      width: 2.5,
      color_opacity: 0.8,
      link_relation: relation,
      is_link: true,
    });
  } else {
    // Regular edges: solid gray
    vizEdges.push({
      from: src, to: tgt,
      title: relation,
      dashes: false,
      width: 1.5,
      color_opacity: 0.5,
      is_link: false,
    });
  }
});

// ─── Episode stats ───

const episodeCounts: Record<string, number> = {};
for (const n of vizNodes) {
  const ep = n.episode || "unknown";
  episodeCounts[ep] = (episodeCounts[ep] || 0) + 1;
}
const episodeList = Object.entries(episodeCounts).sort(([a], [b]) => a.localeCompare(b));

// ─── Title ───

const title = isMerged ? `Merged Story KG — ${epId} (${raw.episode_count || "?"} episodes)` : `Story KG — ${epId}`;

// ─── Generate HTML ───

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <title>${title}</title>
  <meta charset="utf-8">
  <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f1a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif; display: flex; height: 100vh; overflow: hidden; }
    #graph { flex: 1; position: relative; }
    #sidebar { width: 360px; background: #1a1a2e; border-left: 1px solid #2a2a4e; display: flex; flex-direction: column; overflow-y: auto; }
    #search-wrap { padding: 12px; border-bottom: 1px solid #2a2a4e; }
    #search { width: 100%; padding: 8px 12px; background: #0f0f1a; border: 1px solid #2a2a4e; border-radius: 6px; color: #e0e0e0; font-size: 13px; outline: none; }
    #search:focus { border-color: #4E79A7; }
    #search-results { margin-top: 8px; max-height: 200px; overflow-y: auto; }
    .search-item { padding: 4px 8px; cursor: pointer; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
    .search-item:hover { background: #2a2a4e; }
    .search-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    #info-panel { padding: 12px; border-bottom: 1px solid #2a2a4e; min-height: 160px; }
    #info-panel h3 { font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    #info-content { font-size: 13px; line-height: 1.7; }
    #info-content .label { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    #info-content .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-bottom: 6px; }
    #info-content .meta { color: #aaa; font-size: 12px; margin-bottom: 2px; }
    #info-content .meta b { color: #ddd; }
    #info-content .neighbors { margin-top: 8px; }
    #info-content .neighbor { display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 10px; font-size: 11px; cursor: pointer; background: #2a2a4e; }
    #color-mode { padding: 12px; border-bottom: 1px solid #2a2a4e; }
    #color-mode h3 { font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .mode-btn { padding: 6px 16px; border: 1px solid #2a2a4e; border-radius: 6px; background: #0f0f1a; color: #e0e0e0; font-size: 12px; cursor: pointer; margin-right: 6px; }
    .mode-btn.active { background: #2a2a4e; border-color: #4E79A7; color: #fff; }
    #legend-wrap { padding: 12px; border-bottom: 1px solid #2a2a4e; }
    #legend-wrap h3 { font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .legend-item { display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer; font-size: 12px; }
    .legend-item:hover { opacity: 0.8; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-line { width: 20px; height: 3px; flex-shrink: 0; border-radius: 1px; }
    .legend-count { color: #666; margin-left: auto; font-size: 11px; }
    .legend-item.dimmed { opacity: 0.3; }
    #stats { padding: 12px; font-size: 12px; color: #666; border-top: 1px solid #2a2a4e; margin-top: auto; }
  </style>
</head>
<body>
  <div id="graph"></div>
  <div id="sidebar">
    <div id="search-wrap">
      <input id="search" type="text" placeholder="Search story elements...">
      <div id="search-results"></div>
    </div>
    <div id="info-panel">
      <h3>Story Node</h3>
      <div id="info-content">Click a node to explore the story.</div>
    </div>
    ${isMerged ? `<div id="color-mode">
      <h3>Coloring</h3>
      <button class="mode-btn active" id="btn-episode">By Episode</button>
      <button class="mode-btn" id="btn-type">By Type</button>
    </div>` : ''}
    <div id="legend-wrap">
      <h3 id="legend-title">${isMerged ? 'Episodes' : 'Node Types'}</h3>
      <div id="legend"></div>
      ${isMerged && linkEdgesData.length > 0 ? `<h3 style="margin-top:12px">Link Edges</h3><div id="link-legend"></div>` : ''}
    </div>
    <div id="stats">${isMerged ? `${raw.episode_count || '?'} episodes · ` : ''}${vizNodes.length} nodes · ${vizEdges.length} edges${isMerged ? ` · ${linkEdgesData.length} link edges` : ''} · ${Object.keys(communities).length} communities</div>
  </div>
  <script>
const IS_MERGED = ${isMerged ? 'true' : 'false'};
const RAW_NODES = ${JSON.stringify(vizNodes)};
const RAW_EDGES = ${JSON.stringify(vizEdges)};
const TYPE_COLORS = ${JSON.stringify(TYPE_COLORS)};
const EPISODE_COLORS = ${JSON.stringify(EPISODE_COLORS)};
const LINK_EDGE_COLORS = ${JSON.stringify(LINK_EDGE_COLORS)};
const DEFAULT_EP_COLOR = '${defaultEpColor}';

let colorMode = IS_MERGED ? 'episode' : 'type';

function nodeColor(n) {
  if (colorMode === 'episode') {
    return EPISODE_COLORS[n.episode] || DEFAULT_EP_COLOR;
  }
  return TYPE_COLORS[n.file_type] || '#BAB0AC';
}

const nodesDS = new vis.DataSet(RAW_NODES.map(n => {
  const c = nodeColor(n);
  return {
    id: n.id,
    label: n.label,
    color: { background: c, border: c, highlight: { background: '#fff', border: c } },
    size: n.size,
    font: { size: n.font_size, color: '#fff', face: 'system-ui, sans-serif', strokeWidth: 2, strokeColor: '#0f0f1a' },
    title: n.label + ' [' + n.file_type + ']',
    _type: n.file_type,
    _episode: n.episode,
    _properties: n.properties || {},
    _community: n.community,
  };
}));

const edgesDS = new vis.DataSet(RAW_EDGES.map((e, i) => {
  const base = {
    id: i, from: e.from, to: e.to, title: e.title,
    arrows: { to: { enabled: true, scaleFactor: 0.5 } },
    width: e.width,
    smooth: { type: 'curvedCW', roundness: 0.15 },
  };
  if (e.is_link) {
    const lc = LINK_EDGE_COLORS[e.link_relation] || '#FF6B6B';
    base.color = { opacity: e.color_opacity, color: lc };
    base.dashes = true;
  } else {
    base.color = { opacity: e.color_opacity, color: '#666' };
    base.dashes = false;
  }
  return base;
}));

const network = new vis.Network(document.getElementById('graph'), { nodes: nodesDS, edges: edgesDS }, {
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    forceAtlas2Based: { gravitationalConstant: -80, centralGravity: 0.01, springLength: 110, springConstant: 0.08, damping: 0.4, avoidOverlap: 0.6 },
    stabilization: { iterations: 300, fit: true },
  },
  interaction: { hover: true, tooltipDelay: 150, hideEdgesOnDrag: true, zoomView: true },
  nodes: { shape: 'dot', borderWidth: 2 },
  edges: { selectionWidth: 3 },
});

network.once('stabilizationIterationsDone', () => { network.setOptions({ physics: { enabled: false } }); });

// Color mode toggle
if (IS_MERGED) {
  document.getElementById('btn-episode').addEventListener('click', () => {
    colorMode = 'episode';
    document.getElementById('btn-episode').classList.add('active');
    document.getElementById('btn-type').classList.remove('active');
    RAW_NODES.forEach(n => {
      const c = nodeColor(n);
      nodesDS.update({ id: n.id, color: { background: c, border: c, highlight: { background: '#fff', border: c } } });
    });
    buildLegend();
  });
  document.getElementById('btn-type').addEventListener('click', () => {
    colorMode = 'type';
    document.getElementById('btn-type').classList.add('active');
    document.getElementById('btn-episode').classList.remove('active');
    RAW_NODES.forEach(n => {
      const c = nodeColor(n);
      nodesDS.update({ id: n.id, color: { background: c, border: c, highlight: { background: '#fff', border: c } } });
    });
    buildLegend();
  });
}

// Search
document.getElementById('search').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  const sr = document.getElementById('search-results');
  sr.innerHTML = '';
  if (!q || q.length < 1) return;
  RAW_NODES.filter(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)).slice(0, 20).forEach(n => {
    const d = document.createElement('div');
    d.className = 'search-item';
    const c = nodeColor(n);
    d.innerHTML = '<span class="search-dot" style="background:' + c + '"></span>' + n.label;
    d.onclick = () => { network.focus(n.id, { scale: 1.5, animation: true }); network.selectNodes([n.id]); };
    sr.appendChild(d);
  });
});

// Node click
network.on('click', (params) => {
  const info = document.getElementById('info-content');
  if (!params.nodes.length) { info.innerHTML = 'Click a node to explore the story.'; return; }
  const nid = params.nodes[0];
  const n = RAW_NODES.find(x => x.id === nid);
  if (!n) return;

  const neighbors = network.getConnectedNodes(nid).map(id => RAW_NODES.find(x => x.id === id)).filter(Boolean);

  let h = '<div class="label">' + n.label + '</div>';
  const tc = TYPE_COLORS[n.file_type] || '#BAB0AC';
  h += '<div class="type-badge" style="background:' + tc + '33;color:' + tc + '">' + n.file_type.replace(/_/g, ' ') + '</div>';
  if (n.episode) {
    const ec = EPISODE_COLORS[n.episode] || DEFAULT_EP_COLOR;
    h += '<div class="type-badge" style="background:' + ec + '33;color:' + ec + '">' + n.episode + '</div>';
  }

  const props = n.properties || {};
  for (const [k, v] of Object.entries(props)) {
    if (k === 'character_id') continue;
    if (typeof v === 'string' && v.length > 200) {
      h += '<div class="meta"><b>' + k + ':</b> ' + v.slice(0, 200) + '…</div>';
    } else {
      h += '<div class="meta"><b>' + k + ':</b> ' + v + '</div>';
    }
  }

  h += '<div class="neighbors" style="margin-top:8px">';
  neighbors.slice(0, 12).forEach(nb => {
    const nc = nodeColor(nb);
    h += '<span class="neighbor" style="border-left:2px solid ' + nc + '" onclick="network.focus(\\'' + nb.id + '\\',{scale:1.5,animation:true})">' + nb.label + '</span>';
  });
  if (neighbors.length > 12) h += '<span class="neighbor">+' + (neighbors.length - 12) + '</span>';
  h += '</div>';
  info.innerHTML = h;
});

// Legend
const legend = document.getElementById('legend');
const hidden = new Set();

function buildLegend() {
  legend.innerHTML = '';
  hidden.clear();
  const legendTitle = document.getElementById('legend-title');

  if (colorMode === 'episode') {
    legendTitle.textContent = 'Episodes';
    const epCounts = {};
    RAW_NODES.forEach(n => { const ep = n.episode || 'unknown'; epCounts[ep] = (epCounts[ep] || 0) + 1; });
    Object.entries(epCounts).sort(([a], [b]) => a.localeCompare(b)).forEach(([ep, count]) => {
      const c = EPISODE_COLORS[ep] || DEFAULT_EP_COLOR;
      const d = document.createElement('div');
      d.className = 'legend-item';
      d.innerHTML = '<span class="legend-dot" style="background:' + c + '"></span>' + ep + ' <span class="legend-count">' + count + '</span>';
      d.onclick = () => {
        if (hidden.has(ep)) { hidden.delete(ep); d.classList.remove('dimmed'); }
        else { hidden.add(ep); d.classList.add('dimmed'); }
        RAW_NODES.forEach(n => { nodesDS.update({ id: n.id, hidden: hidden.has(n.episode || 'unknown') }); });
      };
      legend.appendChild(d);
    });
  } else {
    legendTitle.textContent = 'Node Types';
    const tc = {};
    RAW_NODES.forEach(n => { tc[n.file_type] = (tc[n.file_type] || 0) + 1; });
    Object.entries(tc).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
      const c = TYPE_COLORS[type] || '#BAB0AC';
      const d = document.createElement('div');
      d.className = 'legend-item';
      d.innerHTML = '<span class="legend-dot" style="background:' + c + '"></span>' + type.replace(/_/g, ' ') + ' <span class="legend-count">' + count + '</span>';
      d.onclick = () => {
        if (hidden.has(type)) { hidden.delete(type); d.classList.remove('dimmed'); }
        else { hidden.add(type); d.classList.add('dimmed'); }
        RAW_NODES.forEach(n => { nodesDS.update({ id: n.id, hidden: hidden.has(n.file_type) }); });
      };
      legend.appendChild(d);
    });
  }
}
buildLegend();

// Link edge legend
const linkLegend = document.getElementById('link-legend');
if (linkLegend && IS_MERGED) {
  const linkTypes = {};
  const rawLinkEdges = ${JSON.stringify(linkEdgesData)};
  rawLinkEdges.forEach(le => { linkTypes[le.relation] = (linkTypes[le.relation] || 0) + 1; });
  Object.entries(linkTypes).sort((a, b) => b[1] - a[1]).forEach(([rel, count]) => {
    const c = LINK_EDGE_COLORS[rel] || '#FF6B6B';
    const d = document.createElement('div');
    d.className = 'legend-item';
    d.innerHTML = '<span class="legend-line" style="background:' + c + '; border-top: 2px dashed ' + c + '"></span>' + rel.replace(/_/g, ' ') + ' <span class="legend-count">' + count + '</span>';
    linkLegend.appendChild(d);
  });
}
  </script>
</body>
</html>`;

// ─── Write output ───

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "graph.html"), html, "utf-8");

const typeCounts: Record<string, number> = {};
for (const n of nodes) {
  const t = n.type || "unknown";
  typeCounts[t] = (typeCounts[t] || 0) + 1;
}

console.log(`Wrote ${resolve(outDir, "graph.html")}`);
console.log(`  Mode: ${isMerged ? "merged" : "single-episode"}`);
console.log(`  ${vizNodes.length} nodes: ${Object.entries(typeCounts).map(([t, c]) => `${t}=${c}`).join(', ')}`);
console.log(`  ${vizEdges.length} edges, ${linkEdgesData.length} link edges, ${Object.keys(communities).length} communities`);
