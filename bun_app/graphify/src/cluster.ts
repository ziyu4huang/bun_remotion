// Community detection via Louvain algorithm

import Graph from 'graphology';
import louvain from 'graphology-communities-louvain';
import type { CommunityMap } from './types';

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
