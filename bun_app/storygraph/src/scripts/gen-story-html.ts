/**
 * Generate vis.js HTML visualization from story KG graph.json.
 *
 * Supports two modes:
 *   1. Single episode — reads <episode-dir>/storygraph_out/graph.json
 *   2. Merged series — reads <series-dir>/storygraph_out/merged-graph.json
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
import { leidenCluster, analyzeCommunities } from "../cluster";
import { computePageRank } from "./story-algorithms";
import type { CommunityReport, StoryCrossLink } from "../types";

// ─── Args ───

const targetDir = resolve(process.argv[2] || ".");
if (!targetDir.startsWith("/")) {
  console.error(`Error: "${targetDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

// Auto-detect graph source
const mergedPath = resolve(targetDir, "storygraph_out", "merged-graph.json");
const singlePath = resolve(targetDir, "storygraph_out", "graph.json");

let isMerged = false;
let graphPath: string;
let outDir: string;

if (existsSync(mergedPath)) {
  isMerged = true;
  graphPath = mergedPath;
  outDir = resolve(targetDir, "storygraph_out");
} else if (existsSync(singlePath)) {
  isMerged = false;
  graphPath = singlePath;
  outDir = resolve(targetDir, "storygraph_out");
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
const crossLinksData: StoryCrossLink[] = raw.cross_links || [];

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

// ─── PageRank (for glow effect on merged graphs) ───

const pageRankScores = isMerged ? computePageRank(G) : {};

// ─── Community detection (Leiden-inspired) ───

// Use community_analysis from JSON if available (from leidenCluster in episode/merge scripts)
const communityAnalysis: CommunityReport | null = raw.community_analysis ?? null;

let communities: Record<string, string[]> = {};
if (communityAnalysis) {
  // Reconstruct communities from analysis
  for (const ca of communityAnalysis.communities) {
    const key = String(ca.id);
    // Find nodes in this community from the nodeCommunityInfo
    communities[key] = communityAnalysis.nodes
      .filter(n => n.communityId === ca.id)
      .map(n => n.nodeId);
  }
} else {
  // Fallback: run clustering ourselves
  try {
    communities = leidenCluster(G);
  } catch (e) {
    console.warn(`Clustering failed: ${e}`);
  }
}

const communityLabels: Record<string, string> = {};
if (communityAnalysis) {
  for (const ca of communityAnalysis.communities) {
    communityLabels[String(ca.id)] = ca.label;
  }
} else {
  for (const [cid, members] of Object.entries(communities)) {
    const types: Record<string, number> = {};
    for (const m of members) {
      const t = G.getNodeAttribute(m, "type") || "unknown";
      types[t] = (types[t] || 0) + 1;
    }
    communityLabels[cid] = Object.entries(types).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t).join(", ");
  }
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

const AI_CROSS_LINK_COLORS: Record<string, string> = {
  character_theme_affinity: "#FF85A1",
  gag_character_synergy: "#FFD166",
  narrative_cluster: "#06D6A0",
  story_anti_pattern: "#EF476F",
};

const COMMUNITY_COLORS = [
  "#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
  "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC",
  "#86BCB6", "#8CD17D", "#B6992D", "#499894", "#D37295",
];

const defaultEpColor = "#BAB0AC";

// ─── Prepare viz data ───

let maxDeg = 1;
G.forEachNode(node => { const d = G.degree(node); if (d > maxDeg) maxDeg = d; });

const vizNodes: any[] = [];
// Build community analysis lookup for per-node metadata
const nodeCommInfo = new Map<string, { isBridge: boolean; isGodNode: boolean; isIsolated: boolean }>();
if (communityAnalysis) {
  for (const ni of communityAnalysis.nodes) {
    nodeCommInfo.set(ni.nodeId, { isBridge: ni.isBridge, isGodNode: ni.isGodNode, isIsolated: ni.isIsolated });
  }
}

G.forEachNode((id, attrs) => {
  const comm = Object.entries(communities).find(([_, m]) => m.includes(id))?.[0] || "0";
  const deg = G.degree(id);
  const nci = nodeCommInfo.get(id);
  vizNodes.push({
    id,
    label: attrs.label || id,
    community: Number(comm),
    community_name: communityLabels[comm] || `Community ${comm}`,
    community_cohesion: communityAnalysis?.communities.find(ca => ca.id === Number(comm))?.cohesion ?? 0,
    is_bridge: nci?.isBridge ?? false,
    is_god: nci?.isGodNode ?? false,
    is_isolated: nci?.isIsolated ?? false,
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

// AI cross-link edges (dotted, not dashed — dashed is for deterministic link edges)
const vizCrossLinks: any[] = [];
for (const cl of crossLinksData) {
  if (!G.hasNode(cl.from) || !G.hasNode(cl.to)) continue;
  vizCrossLinks.push({
    from: cl.from,
    to: cl.to,
    title: `[AI] ${cl.link_type.replace(/_/g, " ")} (confidence: ${cl.confidence.toFixed(2)})\n${cl.rationale}`,
    dashes: [4, 4],
    width: 2,
    color_opacity: 0.7,
    link_type: cl.link_type,
    confidence: cl.confidence,
    is_cross_link: true,
    rationale: cl.rationale,
  });
}

// ─── Episode stats ───

const episodeCounts: Record<string, number> = {};
for (const n of vizNodes) {
  const ep = n.episode || "unknown";
  episodeCounts[ep] = (episodeCounts[ep] || 0) + 1;
}
const episodeList = Object.entries(episodeCounts).sort(([a], [b]) => a.localeCompare(b));

// ─── Title ───

const title = isMerged ? `Merged Story KG — ${epId} (${raw.episode_count || "?"} episodes)` : `Story KG — ${epId}`;

// Build manifest string from source graph
const sourceManifest = raw.manifest ?? null;
const manifestStr = sourceManifest
  ? `${sourceManifest.generator} v${sourceManifest.version} | mode: ${sourceManifest.mode ?? "unknown"}${sourceManifest.ai_model ? ` | AI: ${sourceManifest.ai_model}` : ""} | ${sourceManifest.timestamp ?? new Date().toISOString()}`
  : `storygraph | ${new Date().toISOString()}`;

// ─── Generate HTML ───

const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <title>${title}</title>
  <meta charset="utf-8">
  <meta name="generator" content="${manifestStr}">
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
      <button class="mode-btn" id="btn-community">By Community</button>
    </div>` : ''}
    <div id="legend-wrap">
      <h3 id="legend-title">${isMerged ? 'Episodes' : 'Node Types'}</h3>
      <div id="legend"></div>
      ${isMerged && linkEdgesData.length > 0 ? `<h3 style="margin-top:12px">Link Edges</h3><div id="link-legend"></div>` : ''}
      ${crossLinksData.length > 0 ? `
      <div id="crosslink-wrap" style="padding:12px;border-bottom:1px solid #2a2a4e">
        <h3 style="font-size:13px;color:#888;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">AI Cross-Links</h3>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;margin-bottom:8px">
          <input type="checkbox" id="toggle-crosslinks" checked style="accent-color:#FF85A1">
          Show AI cross-links (${crossLinksData.length})
        </label>
        <div id="crosslink-legend"></div>
      </div>` : ''}
    </div>
    <div id="stats">${isMerged ? `${raw.episode_count || '?'} episodes · ` : ''}${vizNodes.length} nodes · ${vizEdges.length} edges${isMerged ? ` · ${linkEdgesData.length} link edges` : ''}${crossLinksData.length > 0 ? ` · ${crossLinksData.length} AI cross-links` : ''} · ${Object.keys(communities).length} communities</div>
  </div>
  <script>
function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const IS_MERGED = ${isMerged ? 'true' : 'false'};
const RAW_NODES = ${JSON.stringify(vizNodes)};
const RAW_EDGES = ${JSON.stringify(vizEdges)};
const TYPE_COLORS = ${JSON.stringify(TYPE_COLORS)};
const EPISODE_COLORS = ${JSON.stringify(EPISODE_COLORS)};
const LINK_EDGE_COLORS = ${JSON.stringify(LINK_EDGE_COLORS)};
const COMMUNITY_COLORS = ${JSON.stringify(COMMUNITY_COLORS)};
const DEFAULT_EP_COLOR = '${defaultEpColor}';
const COMMUNITY_ANALYSIS = ${JSON.stringify(communityAnalysis)};
const RAW_CROSS_LINKS = ${JSON.stringify(vizCrossLinks)};
const AI_CROSS_LINK_COLORS = ${JSON.stringify(AI_CROSS_LINK_COLORS)};
const PAGE_RANK_SCORES = ${JSON.stringify(pageRankScores)};
const HAS_CROSS_LINKS = ${crossLinksData.length > 0};

let colorMode = IS_MERGED ? 'episode' : 'type';

function nodeColor(n) {
  if (colorMode === 'episode') {
    return EPISODE_COLORS[n.episode] || DEFAULT_EP_COLOR;
  }
  if (colorMode === 'community') {
    return COMMUNITY_COLORS[n.community % COMMUNITY_COLORS.length];
  }
  return TYPE_COLORS[n.file_type] || '#BAB0AC';
}

// PageRank threshold: top 10% of nodes get glow effect
const prValues = Object.values(PAGE_RANK_SCORES).sort((a, b) => b - a);
const prThreshold = prValues.length > 0 ? prValues[Math.max(0, Math.floor(prValues.length * 0.1))] : 0;

const nodesDS = new vis.DataSet(RAW_NODES.map(n => {
  const c = nodeColor(n);
  const pr = PAGE_RANK_SCORES[n.id] || 0;
  const isHighPR = pr > 0 && pr >= prThreshold;
  return {
    id: n.id,
    label: n.label,
    color: { background: c, border: c, highlight: { background: '#fff', border: c } },
    size: n.size,
    font: { size: n.font_size, color: '#fff', face: 'system-ui, sans-serif', strokeWidth: 2, strokeColor: '#0f0f1a' },
    title: escapeHtml(n.label) + ' [' + n.file_type + ']' + (pr > 0 ? ' [PR: ' + pr.toFixed(3) + ']' : ''),
    _type: n.file_type,
    _episode: n.episode,
    _properties: n.properties || {},
    _community: n.community,
    _page_rank: pr,
    borderWidth: isHighPR ? 4 : 2,
    shadow: isHighPR ? { enabled: true, color: c, size: 15, x: 0, y: 0 } : { enabled: false },
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

// AI cross-link edges (dotted lines, separate from dashed link edges)
var crossLinkStartId = RAW_EDGES.length;
var crossLinkEdges = [];
for (var ci = 0; ci < RAW_CROSS_LINKS.length; ci++) {
  var ce = RAW_CROSS_LINKS[ci];
  var clc = AI_CROSS_LINK_COLORS[ce.link_type] || '#FF85A1';
  crossLinkEdges.push({
    id: crossLinkStartId + ci,
    from: ce.from, to: ce.to, title: ce.title,
    arrows: { to: { enabled: true, scaleFactor: 0.4 } },
    width: ce.width,
    smooth: { type: 'curvedCW', roundness: 0.25 },
    color: { opacity: ce.color_opacity, color: clc },
    dashes: ce.dashes,
    _is_cross_link: true,
    _cross_link_type: ce.link_type,
    _cross_link_confidence: ce.confidence,
    _cross_link_rationale: ce.rationale,
  });
}
crossLinkEdges.forEach(function(e) { edgesDS.add(e); });

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
function setActiveBtn(mode) {
  ['btn-episode', 'btn-type', 'btn-community'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', id === 'btn-' + mode);
  });
}
function recolorNodes() {
  RAW_NODES.forEach(n => {
    const c = nodeColor(n);
    nodesDS.update({ id: n.id, color: { background: c, border: c, highlight: { background: '#fff', border: c } } });
  });
  buildLegend();
}
if (IS_MERGED) {
  document.getElementById('btn-episode').addEventListener('click', () => { colorMode = 'episode'; setActiveBtn('episode'); recolorNodes(); });
  document.getElementById('btn-type').addEventListener('click', () => { colorMode = 'type'; setActiveBtn('type'); recolorNodes(); });
  document.getElementById('btn-community').addEventListener('click', () => { colorMode = 'community'; setActiveBtn('community'); recolorNodes(); });
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
    d.innerHTML = '<span class="search-dot" style="background:' + c + '"></span>' + escapeHtml(n.label);
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

  let h = '<div class="label">' + escapeHtml(n.label) + '</div>';
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
      h += '<div class="meta"><b>' + escapeHtml(k) + ':</b> ' + escapeHtml(v.slice(0, 200)) + '…</div>';
    } else {
      h += '<div class="meta"><b>' + escapeHtml(k) + ':</b> ' + escapeHtml(v) + '</div>';
    }
  }

  // Community info
  h += '<div class="meta" style="margin-top:6px"><b>Community:</b> ' + escapeHtml(n.community_name || 'Community ' + n.community) + '</div>';
  if (n.community_cohesion > 0) {
    const cohColor = n.community_cohesion >= 0.3 ? '#59A14F' : n.community_cohesion >= 0.1 ? '#EDC948' : '#E15759';
    h += '<div class="meta"><b>Cohesion:</b> <span style="color:' + cohColor + '">' + n.community_cohesion.toFixed(2) + '</span></div>';
  }
  if (n.is_bridge) h += '<div class="meta" style="color:#F28E2B">Bridge node (connects communities)</div>';
  if (n.is_god) h += '<div class="meta" style="color:#FF9DA7">Hub node (high connectivity)</div>';
  if (n.is_isolated) h += '<div class="meta" style="color:#E15759">Isolated (no intra-community edges)</div>';

  // PageRank info
  var pr = PAGE_RANK_SCORES[n.id];
  if (pr !== undefined && pr > 0) {
    var prColor = pr >= prThreshold ? '#FFD166' : '#888';
    h += '<div class="meta" style="margin-top:4px"><b>PageRank:</b> <span style="color:' + prColor + '">' + pr.toFixed(4) + '</span>';
    if (pr >= prThreshold) h += ' (top 10%)';
    h += '</div>';
  }

  h += '<div class="neighbors" style="margin-top:8px">';
  neighbors.slice(0, 12).forEach(nb => {
    const nc = nodeColor(nb);
    h += '<span class="neighbor" style="border-left:2px solid ' + nc + '" onclick="network.focus(\\'' + escapeHtml(nb.id) + '\\',{scale:1.5,animation:true})">' + escapeHtml(nb.label) + '</span>';
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

  if (colorMode === 'community') {
    legendTitle.textContent = 'Communities';
    const commGroups = {};
    RAW_NODES.forEach(n => { const c = n.community; commGroups[c] = (commGroups[c] || 0) + 1; });
    Object.entries(commGroups).sort((a, b) => b[1] - a[1]).forEach(([cid, count]) => {
      const color = COMMUNITY_COLORS[Number(cid) % COMMUNITY_COLORS.length];
      const label = RAW_NODES.find(n => n.community === Number(cid))?.community_name || ('Community ' + cid);
      const ca = COMMUNITY_ANALYSIS?.communities?.find(c => c.id === Number(cid));
      const cohesionStr = ca ? (' (cohesion: ' + ca.cohesion.toFixed(2) + ')') : '';
      const d = document.createElement('div');
      d.className = 'legend-item';
      d.innerHTML = '<span class="legend-dot" style="background:' + color + '"></span>' + escapeHtml(label) + cohesionStr + ' <span class="legend-count">' + count + '</span>';
      d.onclick = () => {
        if (hidden.has('comm_' + cid)) { hidden.delete('comm_' + cid); d.classList.remove('dimmed'); }
        else { hidden.add('comm_' + cid); d.classList.add('dimmed'); }
        RAW_NODES.forEach(n => { nodesDS.update({ id: n.id, hidden: hidden.has('comm_' + n.community) }); });
      };
      legend.appendChild(d);
    });
  } else if (colorMode === 'episode') {
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

// Cross-link legend and toggle
var crossLinkToggle = document.getElementById('toggle-crosslinks');
var crossLinkLegendEl = document.getElementById('crosslink-legend');
if (crossLinkToggle && HAS_CROSS_LINKS) {
  var clTypes = {};
  RAW_CROSS_LINKS.forEach(function(cl) { clTypes[cl.link_type] = (clTypes[cl.link_type] || 0) + 1; });
  Object.entries(clTypes).sort(function(a, b) { return b[1] - a[1]; }).forEach(function(entry) {
    var type = entry[0], count = entry[1];
    var c = AI_CROSS_LINK_COLORS[type] || '#FF85A1';
    var d = document.createElement('div');
    d.className = 'legend-item';
    d.innerHTML = '<span class="legend-line" style="background:' + c + ';border-top:2px dotted ' + c + '"></span>' + type.replace(/_/g, ' ') + ' <span class="legend-count">' + count + '</span>';
    crossLinkLegendEl.appendChild(d);
  });
  crossLinkToggle.addEventListener('change', function(e) {
    var show = e.target.checked;
    crossLinkEdges.forEach(function(edge) { edgesDS.update({ id: edge.id, hidden: !show }); });
  });
}
  </script>
  <div style="position:fixed;bottom:0;left:0;right:360px;padding:4px 12px;background:#0f0f1a;border-top:1px solid #2a2a4e;font-size:10px;color:#666;z-index:100;">
    ${manifestStr}
  </div>
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
