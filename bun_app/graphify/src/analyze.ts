// Graph analysis — god nodes, betweenness, surprising connections

import Graph from 'graphology';
import type { CommunityMap, GraphNode } from './types';

/**
 * Get the most connected nodes (god nodes).
 */
export function godNodes(graph: Graph, topN = 10): Array<{ id: string; label: string; edges: number; sourceFile: string }> {
  const degrees: Array<{ id: string; degree: number }> = [];
  graph.forEachNode((node) => {
    degrees.push({ id: node, degree: graph.degree(node) });
  });

  degrees.sort((a, b) => b.degree - a.degree);
  const results: Array<{ id: string; label: string; edges: number; sourceFile: string }> = [];

  for (const { id, degree } of degrees.slice(0, topN)) {
    const attrs = graph.getNodeAttributes(id) as Record<string, unknown>;
    const label = (attrs.label as string) || id;
    const sourceFile = (attrs.source_file as string) || '';
    if (id.includes('_rationale_')) continue;
    results.push({ id, label, edges: degree, sourceFile });
  }

  return results;
}

/**
 * Compute betweenness centrality using BFS from each node.
 * Simplified version — for large graphs, consider sampling.
 */
export function betweennessCentrality(graph: Graph): Map<string, number> {
  const nodes = graph.nodes();
  const result = new Map<string, number>();
  const n = nodes.length;

  for (const start of nodes) {
    if (graph.degree(start) === 0) continue;

    // BFS from start
    const visited = new Map<string, string | null>();
    visited.set(start, null);
    const queue = [start];
    let qi = 0;
    while (qi < queue.length) {
      const node = queue[qi++];
      graph.forEachNeighbor(node, (neighbor) => {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, node);
          queue.push(neighbor);
        }
      });
    }

    // Count paths through each intermediate node
    for (const node of nodes) {
      if (node === start || !visited.has(node)) continue;
      let cur: string | null = node;
      while (cur !== null && cur !== start) {
        if (cur !== node) {
          result.set(cur, (result.get(cur) || 0) + 1);
        }
        cur = visited.get(cur)!;
      }
    }
  }

  // Normalize
  if (n > 2) {
    const norm = (n - 1) * (n - 2);
    for (const [key, val] of result) {
      result.set(key, val / norm);
    }
  }

  return result;
}

/**
 * Find surprising connections — edges between different communities.
 */
export function surprisingConnections(
  graph: Graph,
  communities: CommunityMap,
  topN = 5,
): Array<{
  source: { id: string; label: string; community: number };
  target: { id: string; label: string; community: number };
  relation: string;
  confidence: string;
}> {
  // Build node -> community map
  const nodeCommunity = new Map<string, number>();
  for (const [cid, members] of Object.entries(communities)) {
    for (const m of members) {
      nodeCommunity.set(m, Number(cid));
    }
  }

  const crossEdges: Array<{
    source: { id: string; label: string; community: number };
    target: { id: string; label: string; community: number };
    relation: string;
    confidence: string;
  }> = [];

  graph.forEachEdge((edge, attrs, source, target) => {
    const srcComm = nodeCommunity.get(source);
    const tgtComm = nodeCommunity.get(target);
    if (srcComm === undefined || tgtComm === undefined) return;
    if (srcComm === tgtComm) return;

    const srcAttrs = graph.getNodeAttributes(source) as Record<string, unknown>;
    const tgtAttrs = graph.getNodeAttributes(target) as Record<string, unknown>;

    crossEdges.push({
      source: {
        id: source,
        label: (srcAttrs.label as string) || source,
        community: srcComm,
      },
      target: {
        id: target,
        label: (tgtAttrs.label as string) || target,
        community: tgtComm,
      },
      relation: (attrs.relation as string) || 'unknown',
      confidence: (attrs.confidence as string) || 'UNKNOWN',
    });
  });

  // Prioritize INFERRED cross-community edges
  crossEdges.sort((a, b) => {
    const aScore = a.confidence === 'INFERRED' ? 1 : 0;
    const bScore = b.confidence === 'INFERRED' ? 1 : 0;
    return bScore - aScore;
  });

  return crossEdges.slice(0, topN);
}

/**
 * Get bridge nodes — nodes connecting multiple communities.
 */
export function bridgeNodes(
  graph: Graph,
  communities: CommunityMap,
  betweenness: Map<string, number>,
  threshold = 0.05,
): Array<{ id: string; label: string; betweenness: number; communities: number[] }> {
  const nodeCommunity = new Map<string, Set<number>>();
  for (const [cid, members] of Object.entries(communities)) {
    for (const m of members) {
      if (!nodeCommunity.has(m)) nodeCommunity.set(m, new Set());
      nodeCommunity.get(m)!.add(Number(cid));
    }
  }

  const bridges: Array<{ id: string; label: string; betweenness: number; communities: number[] }> = [];

  for (const [nodeId, bw] of betweenness) {
    if (bw < threshold) continue;
    if (nodeId.includes('_rationale_')) continue;

    const connectedComms = new Set<number>();
    graph.forEachNeighbor(nodeId, (neighbor) => {
      const comm = nodeCommunity.get(neighbor);
      if (comm) {
        for (const c of comm) connectedComms.add(c);
      }
    });

    if (connectedComms.size >= 2) {
      const attrs = graph.getNodeAttributes(nodeId) as Record<string, unknown>;
      bridges.push({
        id: nodeId,
        label: (attrs.label as string) || nodeId,
        betweenness: bw,
        communities: [...connectedComms].sort(),
      });
    }
  }

  bridges.sort((a, b) => b.betweenness - a.betweenness);
  return bridges.slice(0, 10);
}
