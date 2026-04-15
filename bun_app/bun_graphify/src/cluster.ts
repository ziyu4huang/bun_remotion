// Community detection via Louvain algorithm + Leiden-inspired refinement

import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import modularity from 'graphology-metrics/graph/modularity';
import type { CommunityMap, CommunityReport, CommunityAnalysis, NodeCommunityInfo, SurprisingConnection } from './types';

/**
 * Run Louvain community detection on a graphology graph.
 * Returns a map of community_id -> [node_ids].
 */
export function cluster(graph: Graph): CommunityMap {
  if (graph.order === 0) return {};

  const communities = louvain(graph, { randomize: false });

  if (!communities || typeof communities !== 'object') return {};

  // Convert Map<nodeId, communityId> to Record<communityId, nodeId[]>
  const map: CommunityMap = {};
  const entries = communities instanceof Map ? communities.entries() : Object.entries(communities);
  for (const [nodeId, communityId] of entries) {
    if (!(communityId in map)) map[communityId] = [];
    map[communityId].push(nodeId);
  }

  // Sort communities by size (largest first) and reassign IDs
  const sorted = Object.entries(map)
    .sort((a, b) => b[1].length - a[1].length);
  const remapped: CommunityMap = {};
  for (let i = 0; i < sorted.length; i++) {
    remapped[i] = sorted[i][1];
  }

  return remapped;
}

/**
 * Compute cohesion score for a community (ratio of actual/possible edges).
 */
export function cohesionScore(graph: Graph, members: string[]): number {
  if (members.length < 2) return 0;

  let internalEdges = 0;
  for (const node of members) {
    if (!graph.hasNode(node)) continue;
    graph.forEachNeighbor(node, (neighbor) => {
      if (members.includes(neighbor)) internalEdges++;
    });
  }
  internalEdges /= 2; // Each edge counted twice

  const possibleEdges = (members.length * (members.length - 1)) / 2;
  return possibleEdges > 0 ? internalEdges / possibleEdges : 0;
}

/**
 * Compute cohesion scores for all communities.
 */
export function scoreAll(graph: Graph, communities: CommunityMap): Record<number, number> {
  const scores: Record<number, number> = {};
  for (const [cid, members] of Object.entries(communities)) {
    scores[Number(cid)] = cohesionScore(graph, members);
  }
  return scores;
}

/**
 * Split oversized communities (>25% of graph, min 10 nodes).
 */
export function splitOversized(
  graph: Graph,
  communities: CommunityMap,
  threshold = 0.25,
  minSize = 10,
): CommunityMap {
  const totalNodes = graph.order;
  const maxCommunitySize = Math.floor(totalNodes * threshold);
  const result: CommunityMap = {};
  let nextId = Object.keys(communities).length;

  for (const [cid, members] of Object.entries(communities)) {
    if (members.length > maxCommunitySize && members.length >= minSize) {
      // Split into sub-communities using Louvain on the subgraph
      const subgraph = graph.filterNodes(n => members.includes(n));
      const subCommunities = cluster(subgraph);

      for (const [, subMembers] of Object.entries(subCommunities)) {
        result[nextId++] = subMembers;
      }
    } else {
      result[Number(cid)] = members;
    }
  }

  // Re-sort by size
  const sorted = Object.entries(result)
    .sort((a, b) => b[1].length - a[1].length);
  const remapped: CommunityMap = {};
  for (let i = 0; i < sorted.length; i++) {
    remapped[i] = sorted[i][1];
  }
  return remapped;
}

// ─── Leiden-Inspired Community Analysis ───

/**
 * Check if a community's subgraph is internally connected via BFS.
 */
function isConnected(graph: Graph, members: string[]): boolean {
  if (members.length <= 1) return true;
  const memberSet = new Set(members.filter(n => graph.hasNode(n)));
  if (memberSet.size <= 1) return true;

  const start = members.find(n => graph.hasNode(n));
  if (!start) return false;

  const visited = new Set<string>();
  const queue = [start];
  visited.add(start);
  while (queue.length > 0) {
    const node = queue.shift()!;
    graph.forEachNeighbor(node, (neighbor) => {
      if (memberSet.has(neighbor) && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    });
  }
  return visited.size === memberSet.size;
}

/**
 * Leiden-inspired refinement: ensure every community is internally connected.
 * Split any disconnected community into its connected components.
 * Returns refined CommunityMap and count of splits performed.
 */
export function refineCommunities(
  graph: Graph,
  communities: CommunityMap,
): { communities: CommunityMap; splitsPerformed: number } {
  const result: CommunityMap = {};
  let nextId = 0;
  let splitsPerformed = 0;

  for (const [, members] of Object.entries(communities)) {
    if (members.length <= 1) {
      result[nextId++] = members;
      continue;
    }

    if (isConnected(graph, members)) {
      result[nextId++] = members;
      continue;
    }

    // Find connected components via iterative BFS
    const memberSet = new Set(members.filter(n => graph.hasNode(n)));
    const assigned = new Set<string>();

    for (const start of memberSet) {
      if (assigned.has(start)) continue;
      const component: string[] = [];
      const queue = [start];
      assigned.add(start);
      while (queue.length > 0) {
        const node = queue.shift()!;
        component.push(node);
        graph.forEachNeighbor(node, (neighbor) => {
          if (memberSet.has(neighbor) && !assigned.has(neighbor)) {
            assigned.add(neighbor);
            queue.push(neighbor);
          }
        });
      }
      result[nextId++] = component;
      if (component.length < members.length) splitsPerformed++;
    }
  }

  // Re-sort by size (matches existing pattern)
  const sorted = Object.entries(result)
    .sort((a, b) => b[1].length - a[1].length);
  const remapped: CommunityMap = {};
  for (let i = 0; i < sorted.length; i++) {
    remapped[i] = sorted[i][1];
  }
  return { communities: remapped, splitsPerformed };
}

/**
 * Compute modularity contribution per community.
 * Q_c = (L_c / L) - (d_c / 2L)^2
 */
export function modularityContribution(
  graph: Graph,
  communities: CommunityMap,
): Record<number, number> {
  const totalEdges = graph.size;
  if (totalEdges === 0) return {};

  const contributions: Record<number, number> = {};
  for (const [cid, members] of Object.entries(communities)) {
    const memberSet = new Set(members.filter(n => graph.hasNode(n)));
    let internalEdges = 0;
    let totalDegree = 0;

    for (const node of memberSet) {
      totalDegree += graph.degree(node);
      graph.forEachNeighbor(node, (neighbor) => {
        if (memberSet.has(neighbor)) internalEdges++;
      });
    }
    internalEdges /= 2;

    const Lc = internalEdges;
    const dc = totalDegree;
    const L = totalEdges;
    contributions[Number(cid)] = (Lc / L) - Math.pow(dc / (2 * L), 2);
  }
  return contributions;
}

/**
 * Generate human-readable labels for communities based on content.
 * Story-KG aware: node types, episode IDs, character names, gag types.
 */
export function generateCommunityLabels(
  graph: Graph,
  communities: CommunityMap,
): Record<string, string> {
  const labels: Record<string, string> = {};

  for (const [cid, members] of Object.entries(communities)) {
    const types: Record<string, number> = {};
    const episodeIds: Set<string> = new Set();
    const gagTypes: Set<string> = new Set();
    const charNames: string[] = [];

    for (const m of members) {
      if (!graph.hasNode(m)) continue;
      const attrs = graph.getNodeAttributes(m);
      const type = attrs.type || 'unknown';
      types[type] = (types[type] || 0) + 1;

      const epMatch = m.match(/^(ch\d+ep\d+)_/);
      if (epMatch) episodeIds.add(epMatch[1]);

      if (type === 'character_instance') {
        const label = attrs.label || m;
        charNames.push(label);
      }

      if (type === 'gag_manifestation' && attrs.properties?.gag_type) {
        gagTypes.add(attrs.properties.gag_type);
      }
    }

    const sortedTypes = Object.entries(types).sort((a, b) => b[1] - a[1]);
    const eps = [...episodeIds].sort();

    if (gagTypes.size > 0 && sortedTypes[0]?.[0] === 'gag_manifestation') {
      labels[cid] = `Gags: ${[...gagTypes].slice(0, 3).join(', ')}`;
    } else if (charNames.length >= Math.floor(members.length * 0.3)) {
      labels[cid] = `Characters: ${charNames.slice(0, 4).join(', ')}`;
    } else if (eps.length > 0 && eps.length <= 2) {
      labels[cid] = `Story: ${eps.join(', ')}`;
    } else if (eps.length > 2) {
      labels[cid] = `Multi-ep (${eps.length} eps)`;
    } else {
      labels[cid] = sortedTypes.slice(0, 2).map(([t]) => t.replace(/_/g, ' ')).join(', ');
    }
  }

  return labels;
}

/**
 * Full Leiden-inspired clustering pipeline:
 * 1. Run Louvain
 * 2. Split oversized communities
 * 3. Refine for connectivity (Leiden guarantee)
 * Returns refined CommunityMap.
 */
export function leidenCluster(
  graph: Graph,
  options?: { sizeThreshold?: number; minSplitSize?: number },
): CommunityMap {
  if (graph.order === 0) return {};

  // Step 1: Louvain
  let communities = cluster(graph);

  // Step 2: Split oversized
  communities = splitOversized(
    graph,
    communities,
    options?.sizeThreshold ?? 0.25,
    options?.minSplitSize ?? 10,
  );

  // Step 3: Leiden refinement (connectivity guarantee)
  const { communities: refined } = refineCommunities(graph, communities);

  return refined;
}

/**
 * Run full Leiden-inspired community analysis on a graph.
 * Returns a CommunityReport for JSON serialization.
 */
export function analyzeCommunities(
  graph: Graph,
  communities: CommunityMap,
): CommunityReport {
  // 1. Refinement
  const { communities: refined, splitsPerformed } = refineCommunities(graph, communities);

  // 2. Labels
  const labels = generateCommunityLabels(graph, refined);

  // 3. Per-community metrics
  const cohesion = scoreAll(graph, refined);
  const modContrib = modularityContribution(graph, refined);

  // 4. Build node → community lookup
  const nodeCommunity = new Map<string, number>();
  for (const [cid, members] of Object.entries(refined)) {
    for (const m of members) nodeCommunity.set(m, Number(cid));
  }

  // 5. Bridge nodes: connect to ≥2 communities
  const bridgeNodeSet = new Set<string>();
  for (const [nodeId] of nodeCommunity) {
    if (!graph.hasNode(nodeId)) continue;
    const connectedComms = new Set<number>();
    graph.forEachNeighbor(nodeId, (neighbor) => {
      const nc = nodeCommunity.get(neighbor);
      if (nc !== undefined) connectedComms.add(nc);
    });
    if (connectedComms.size >= 2) bridgeNodeSet.add(nodeId);
  }

  // God nodes: top 10% by degree
  const degrees: Array<{ id: string; degree: number }> = [];
  graph.forEachNode((node) => {
    degrees.push({ id: node, degree: graph.degree(node) });
  });
  degrees.sort((a, b) => b.degree - a.degree);
  const godThreshold = degrees[Math.min(Math.floor(degrees.length * 0.1), 9)]?.degree ?? 0;
  const godNodeSet = new Set(degrees.filter(d => d.degree >= godThreshold).map(d => d.id));

  // 6. Build community analyses
  const communityAnalyses: CommunityAnalysis[] = [];
  for (const [cid, members] of Object.entries(refined)) {
    const types: Record<string, number> = {};
    const episodes: Set<string> = new Set();
    const bridges: string[] = [];

    for (const m of members) {
      if (!graph.hasNode(m)) continue;
      const type = graph.getNodeAttribute(m, 'type') || 'unknown';
      types[type] = (types[type] || 0) + 1;
      const epMatch = m.match(/^(ch\d+ep\d+)_/);
      if (epMatch) episodes.add(epMatch[1]);
      if (bridgeNodeSet.has(m)) bridges.push(m);
    }

    const sortedTypes = Object.entries(types).sort((a, b) => b[1] - a[1]);
    communityAnalyses.push({
      id: Number(cid),
      label: labels[cid] || `Community ${cid}`,
      size: members.length,
      cohesion: cohesion[Number(cid)] || 0,
      modularityContribution: modContrib[Number(cid)] || 0,
      isConnected: isConnected(graph, members),
      dominantTypes: sortedTypes.slice(0, 2).map(([t]) => t),
      episodes: [...episodes].sort(),
      bridgeNodes: bridges.slice(0, 3),
    });
  }

  // 7. Surprising connections (cross-community edges)
  const surprising: SurprisingConnection[] = [];
  graph.forEachEdge((_key, attrs, src, tgt) => {
    const srcComm = nodeCommunity.get(src);
    const tgtComm = nodeCommunity.get(tgt);
    if (srcComm === undefined || tgtComm === undefined || srcComm === tgtComm) return;
    const srcLabel = graph.getNodeAttribute(src, 'label') || src;
    const tgtLabel = graph.getNodeAttribute(tgt, 'label') || tgt;
    surprising.push({
      source: src, sourceLabel: srcLabel, sourceCommunity: srcComm,
      target: tgt, targetLabel: tgtLabel, targetCommunity: tgtComm,
      relation: attrs.relation || 'unknown',
    });
  });

  // 8. Node-level info
  const nodeInfo: NodeCommunityInfo[] = [];
  for (const [nodeId, commId] of nodeCommunity) {
    let hasIntraEdge = false;
    if (graph.hasNode(nodeId)) {
      graph.forEachNeighbor(nodeId, (neighbor) => {
        if (nodeCommunity.get(neighbor) === commId) hasIntraEdge = true;
      });
    }
    nodeInfo.push({
      nodeId,
      communityId: commId,
      isBridge: bridgeNodeSet.has(nodeId),
      isGodNode: godNodeSet.has(nodeId),
      isIsolated: !hasIntraEdge,
    });
  }

  // 9. Global modularity
  let globalModularity = 0;
  try {
    // Assign community attributes temporarily for modularity calculation
    graph.forEachNode((node) => {
      const c = nodeCommunity.get(node);
      if (c !== undefined) graph.setNodeAttribute(node, 'community', c);
    });
    globalModularity = modularity(graph, { getNodeCommunity: 'community' });
    graph.forEachNode((node) => graph.removeNodeAttribute(node, 'community'));
  } catch {
    globalModularity = Object.values(modContrib).reduce((a, b) => a + b, 0);
  }

  const avgCohesion = communityAnalyses.length > 0
    ? communityAnalyses.reduce((s, c) => s + c.cohesion, 0) / communityAnalyses.length
    : 0;

  return {
    communities: communityAnalyses,
    nodes: nodeInfo,
    surprisingConnections: surprising.slice(0, 50),
    globalModularity,
    totalCommunities: Object.keys(refined).length,
    averageCohesion: avgCohesion,
    refinementSplits: splitsPerformed,
  };
}
