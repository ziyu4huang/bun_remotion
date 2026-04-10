// HTML export — generates vis.js interactive visualization
// Matches Python graphify's to_html() output format

import Graph from 'graphology';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CommunityMap, Hyperedge } from '../types';

const COMMUNITY_COLORS = [
  '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
  '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC',
];

const MAX_NODES_FOR_VIZ = 5000;

interface NodeData {
  id: string;
  label: string;
  community: number;
  community_name: string;
  source_file: string;
  file_type: string;
  degree: number;
  size: number;
  font_size: number;
}

interface EdgeData {
  from: string;
  to: string;
  title: string;
  dashes: boolean | number;
  width: number;
  color_opacity: number;
}

export function generateHTML(
  graph: Graph,
  communities: CommunityMap,
  communityLabels: Record<string, string>,
  hyperedges: Hyperedge[],
  title = 'graphify',
): string {
  const nodes = prepareNodes(graph, communities, communityLabels);
  const edges = prepareEdges(graph);

  // Truncate if too many nodes
  const vizNodes = nodes.slice(0, MAX_NODES_FOR_VIZ);
  const vizNodeIds = new Set(vizNodes.map(n => n.id));
  const vizEdges = edges.filter(e => vizNodeIds.has(e.from) && vizNodeIds.has(e.to));

  const nNodes = vizNodes.length;
  const nEdges = vizEdges.length;
  const nCommunities = Object.keys(communities).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <title>graphify - ${title}</title>
  <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f1a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; height: 100vh; overflow: hidden; }
    #graph { flex: 1; position: relative; }
    #sidebar { width: 300px; background: #1a1a2e; border-left: 1px solid #2a2a4e; display: flex; flex-direction: column; overflow-y: auto; }
    #search-wrap { padding: 12px; border-bottom: 1px solid #2a2a4e; }
    #search { width: 100%; padding: 8px 12px; background: #0f0f1a; border: 1px solid #2a2a4e; border-radius: 6px; color: #e0e0e0; font-size: 13px; outline: none; }
    #search:focus { border-color: #4E79A7; }
    #search-results { margin-top: 8px; max-height: 200px; overflow-y: auto; }
    .search-item { padding: 4px 8px; cursor: pointer; border-radius: 4px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
    .search-item:hover { background: #2a2a4e; }
    .search-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    #info-panel { padding: 12px; border-bottom: 1px solid #2a2a4e; }
    #info-panel h3 { font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    #info-content { font-size: 13px; line-height: 1.6; }
    #info-content .label { font-size: 15px; font-weight: 600; margin-bottom: 6px; }
    #info-content .meta { color: #888; font-size: 12px; }
    #info-content .neighbors { margin-top: 8px; }
    #info-content .neighbor { display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 10px; font-size: 11px; cursor: pointer; background: #2a2a4e; }
    #legend-wrap { padding: 12px; border-bottom: 1px solid #2a2a4e; }
    #legend-wrap h3 { font-size: 13px; color: #888; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .legend-item { display: flex; align-items: center; gap: 8px; padding: 3px 0; cursor: pointer; font-size: 12px; }
    .legend-item:hover { opacity: 0.8; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-count { color: #666; margin-left: auto; font-size: 11px; }
    .legend-item.dimmed { opacity: 0.3; }
    #stats { padding: 12px; font-size: 12px; color: #666; border-top: 1px solid #2a2a4e; margin-top: auto; }
  </style>
</head>
<body>
  <div id="graph"></div>
  <div id="sidebar">
    <div id="search-wrap">
      <input id="search" type="text" placeholder="Search nodes...">
      <div id="search-results"></div>
    </div>
    <div id="info-panel">
      <h3>Node Info</h3>
      <div id="info-content">Click a node to see details.</div>
    </div>
    <div id="legend-wrap">
      <h3>Communities</h3>
      <div id="legend"></div>
    </div>
    <div id="stats">${nNodes} nodes · ${nEdges} edges · ${nCommunities} communities</div>
  </div>
  <script>
const RAW_NODES = ${JSON.stringify(vizNodes)};
const RAW_EDGES = ${JSON.stringify(vizEdges)};
const RAW_HYPEREDGES = ${JSON.stringify(hyperedges)};
const COMMUNITY_COLORS = ${JSON.stringify(COMMUNITY_COLORS)};

const color = (c) => COMMUNITY_COLORS[c % COMMUNITY_COLORS.length] || '#666';

const nodesDS = new vis.DataSet(RAW_NODES.map(n => ({
  id: n.id,
  label: n.label,
  color: { background: color(n.community), border: color(n.community), highlight: { background: '#ffffff', border: color(n.community) } },
  size: n.size,
  font: { size: n.font_size, color: '#ffffff' },
  title: n.label + ' (' + n.community_name + ')\\n' + n.source_file,
  _community: n.community,
  _community_name: n.community_name,
  _source_file: n.source_file,
  _file_type: n.file_type,
  _degree: n.degree
})));

const edgesDS = new vis.DataSet(RAW_EDGES.map((e, i) => ({
  id: i,
  from: e.from,
  to: e.to,
  title: e.title,
  dashes: e.dashes,
  width: e.width,
  color: { opacity: e.color_opacity },
  arrows: { to: { enabled: true, scaleFactor: 0.5 } }
})));

const container = document.getElementById('graph');
const network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, {
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    forceAtlas2Based: { gravitationalConstant: -60, centralGravity: 0.005, springLength: 120, springConstant: 0.08, damping: 0.4, avoidOverlap: 0.8 },
    stabilization: { iterations: 200, fit: true },
  },
  interaction: { hover: true, tooltipDelay: 100, hideEdgesOnDrag: true, navigationButtons: false, keyboard: false },
  nodes: { shape: 'dot', borderWidth: 1.5 },
  edges: { smooth: { type: 'continuous', roundness: 0.2 }, selectionWidth: 3 }
});

network.once('stabilizationIterationsDone', () => { network.setOptions({ physics: { enabled: false } }); });

// Search
const searchInput = document.getElementById('search');
const searchResults = document.getElementById('search-results');
searchInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  searchResults.innerHTML = '';
  if (!q || q.length < 2) return;
  const matches = RAW_NODES.filter(n => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)).slice(0, 20);
  matches.forEach(n => {
    const div = document.createElement('div');
    div.className = 'search-item';
    div.innerHTML = '<span class="search-dot" style="background:' + color(n.community) + '"></span>' + n.label;
    div.onclick = () => { network.focus(n.id, { scale: 1.5, animation: true }); network.selectNodes([n.id]); };
    searchResults.appendChild(div);
  });
});

// Node click → info panel
network.on('click', (params) => {
  const info = document.getElementById('info-content');
  if (params.nodes.length === 0) { info.innerHTML = 'Click a node to see details.'; return; }
  const nodeId = params.nodes[0];
  const node = RAW_NODES.find(n => n.id === nodeId);
  if (!node) return;

  const neighbors = network.getConnectedNodes(nodeId);
  const neighborNodes = neighbors.map(nid => RAW_NODES.find(n => n.id === nid)).filter(Boolean);

  let html = '<div class="label">' + node.label + '</div>';
  html += '<div class="meta">Type: ' + node.file_type + '</div>';
  html += '<div class="meta">Community: ' + node.community_name + '</div>';
  html += '<div class="meta">File: ' + node.source_file + '</div>';
  html += '<div class="meta">Connections: ' + node.degree + '</div>';
  html += '<div class="neighbors">';
  neighborNodes.slice(0, 20).forEach(n => {
    html += '<span class="neighbor" style="border-left: 2px solid ' + color(n.community) + '" onclick="network.focus(\\'' + n.id + '\\', {scale:1.5,animation:true})">' + n.label + '</span>';
  });
  if (neighborNodes.length > 20) html += '<span class="neighbor">+' + (neighborNodes.length - 20) + ' more</span>';
  html += '</div>';
  info.innerHTML = html;
});

// Legend
const legend = document.getElementById('legend');
const communityCounts = {};
RAW_NODES.forEach(n => { communityCounts[n.community] = (communityCounts[n.community] || 0) + 1; });
const hiddenCommunities = new Set();
Object.entries(communityCounts).sort((a,b) => b[1] - a[1]).forEach(([cid, count]) => {
  const c = parseInt(cid);
  const name = RAW_NODES.find(n => n.community === c)?._community_name || ('Community ' + cid);
  const div = document.createElement('div');
  div.className = 'legend-item';
  div.innerHTML = '<span class="legend-dot" style="background:' + color(c) + '"></span>' + name + ' <span class="legend-count">' + count + '</span>';
  div.onclick = () => {
    if (hiddenCommunities.has(c)) { hiddenCommunities.delete(c); div.classList.remove('dimmed'); }
    else { hiddenCommunities.add(c); div.classList.add('dimmed'); }
    RAW_NODES.forEach(n => { nodesDS.update({ id: n.id, hidden: hiddenCommunities.has(n.community) }); });
  };
  legend.appendChild(div);
});

// Hyperedges
function drawHyperedges() {
  const canvas = network.canvas.frame.canvas;
  const ctx = canvas.getContext('2d');
  RAW_HYPEREDGES.forEach(h => {
    const positions = h.nodes.map(nid => network.getPositions([nid])[nid]).filter(Boolean);
    if (positions.length < 2) return;
    // Convex hull
    const points = positions;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#6366f1';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, (maxX - minX) / 2 + 20, (maxY - minY) / 2 + 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#4f46e5';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.label || h.id, cx, cy - 5);
    ctx.restore();
  });
}
network.on('afterDrawing', drawHyperedges);
  </script>
</body>
</html>`;
}

function prepareNodes(graph: Graph, communities: CommunityMap, labels: Record<string, string>): NodeData[] {
  // Build node -> community map
  const nodeComm = new Map<string, number>();
  for (const [cid, members] of Object.entries(communities)) {
    for (const m of members) nodeComm.set(m, Number(cid));
  }

  // Compute max degree for normalization
  let maxDeg = 1;
  graph.forEachNode(node => {
    const deg = graph.degree(node);
    if (deg > maxDeg) maxDeg = deg;
  });

  // Compute top 15% degree threshold for font sizing
  const degrees: number[] = [];
  graph.forEachNode(node => degrees.push(graph.degree(node)));
  degrees.sort((a, b) => b - a);
  const fontThreshold = degrees[Math.floor(degrees.length * 0.15)] || 1;

  const nodes: NodeData[] = [];
  graph.forEachNode((id, attrs) => {
    const a = attrs as Record<string, unknown>;
    const comm = nodeComm.get(id) ?? 0;
    const deg = graph.degree(id);
    const label = (a.label as string) || id;

    nodes.push({
      id,
      label,
      community: comm,
      community_name: labels[String(comm)] || `Community ${comm}`,
      source_file: (a.source_file as string) || '',
      file_type: (a.file_type as string) || 'code',
      degree: deg,
      size: 10 + 30 * (deg / maxDeg),
      font_size: deg >= fontThreshold ? 12 : 0,
    });
  });

  return nodes;
}

function prepareEdges(graph: Graph): EdgeData[] {
  const edges: EdgeData[] = [];
  graph.forEachEdge((_edge, attrs, source, target) => {
    const a = attrs as Record<string, unknown>;
    const confidence = (a.confidence as string) || 'EXTRACTED';
    const relation = (a.relation as string) || '';

    edges.push({
      from: source,
      to: target,
      title: `${relation} [${confidence}]`,
      dashes: confidence === 'EXTRACTED' ? false : [5, 5],
      width: confidence === 'EXTRACTED' ? 2 : 1,
      color_opacity: confidence === 'EXTRACTED' ? 0.7 : 0.35,
    });
  });
  return edges;
}

export async function writeGraphHTML(
  graph: Graph,
  communities: CommunityMap,
  communityLabels: Record<string, string>,
  hyperedges: Hyperedge[],
  outputPath: string,
  title?: string,
): Promise<void> {
  const html = generateHTML(graph, communities, communityLabels, hyperedges, title);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html, 'utf-8');
}
