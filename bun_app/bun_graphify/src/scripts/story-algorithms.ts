/**
 * Story graph algorithms for narrative analysis.
 *
 * Provides structural metrics on federated story knowledge graphs:
 * - PageRank: identify structurally central characters/scenes
 * - Jaccard similarity: compare episode structures for repetition detection
 *
 * Used by the AI cross-link generator (Phase 23) to enrich prompts with
 * quantitative metrics alongside qualitative narrative analysis.
 */

import Graph from "graphology";
import pagerank from "graphology-pagerank";

// ─── PageRank ───

/**
 * Compute PageRank scores for all nodes in the merged graph.
 * Returns a map of node ID → PageRank score (0–1).
 *
 * High-scoring character_instance nodes are "structurally central" —
 * they connect to many scenes, traits, and other characters across episodes.
 */
export function computePageRank(graph: Graph): Record<string, number> {
  try {
    return pagerank(graph) as Record<string, number>;
  } catch (e) {
    console.warn(`PageRank computation failed: ${e}`);
    return {};
  }
}

/**
 * Get top-K nodes by PageRank score, optionally filtered by type.
 */
export function getTopKByPageRank(
  scores: Record<string, number>,
  k: number = 10,
  nodeType?: string,
  graph?: Graph
): Array<{ id: string; score: number; label?: string }> {
  let entries = Object.entries(scores);

  if (nodeType && graph) {
    entries = entries.filter(([id]) => {
      try {
        return graph.getNodeAttribute(id, "type") === nodeType;
      } catch {
        return false;
      }
    });
  }

  return entries
    .sort(([, a], [, b]) => b - a)
    .slice(0, k)
    .map(([id, score]) => ({
      id,
      score,
      label: graph?.getNodeAttribute(id, "label"),
    }));
}

// ─── Jaccard Similarity ───

interface EpisodeNodeSet {
  episodeId: string;
  nodeIds: Set<string>;
  edgeKeys: Set<string>;
}

/**
 * Compute Jaccard similarity between all pairs of episodes.
 * Compares both node sets and edge relation sets.
 *
 * Returns a matrix: { epA → { epB → similarity } }
 * Similarity > 0.7 may indicate repetitive plot structure.
 */
export function computeJaccardSimilarity(
  episodeGraphs: Array<{
    episode_id: string;
    nodes: Array<{ id: string; type?: string }>;
    links: Array<{ source: string; target: string; relation?: string }>;
  }>
): Record<string, Record<string, number>> {
  // Build per-episode sets of node types (not IDs, since IDs include ep prefix)
  // and edge relations (normalized)
  const epSets: EpisodeNodeSet[] = episodeGraphs.map(eg => ({
    episodeId: eg.episode_id,
    nodeIds: new Set(eg.nodes.map(n => n.type ?? "unknown")),
    edgeKeys: new Set(eg.links.map(l => {
      const srcType = eg.nodes.find(n => n.id === l.source)?.type ?? "?";
      const tgtType = eg.nodes.find(n => n.id === l.target)?.type ?? "?";
      return `${srcType}-${l.relation ?? "related"}-${tgtType}`;
    })),
  }));

  const matrix: Record<string, Record<string, number>> = {};

  for (let i = 0; i < epSets.length; i++) {
    const a = epSets[i];
    matrix[a.episodeId] = {};

    for (let j = 0; j < epSets.length; j++) {
      if (i === j) {
        matrix[a.episodeId][epSets[j].episodeId] = 1.0;
        continue;
      }

      const b = epSets[j];
      // Jaccard = |A ∩ B| / |A ∪ B| over node types + edge patterns
      const allElements = new Set([...a.nodeIds, ...a.edgeKeys, ...b.nodeIds, ...b.edgeKeys]);
      const intersection = [...allElements].filter(
        e => (a.nodeIds.has(e) || a.edgeKeys.has(e)) && (b.nodeIds.has(e) || b.edgeKeys.has(e))
      );

      matrix[a.episodeId][b.episodeId] = allElements.size > 0
        ? intersection.length / allElements.size
        : 0;
    }
  }

  return matrix;
}

// ─── Character Arc Score ───

/**
 * Measure trait drift magnitude along same_character chains.
 * Higher score = more character development (or inconsistency).
 *
 * Returns 0 if character appears in only one episode.
 */
export function computeCharacterArcScore(
  graph: Graph,
  charId: string
): number {
  // Find all character_instance nodes for this char
  const instances: string[] = [];
  graph.forEachNode((node, attrs) => {
    if (attrs.type === "character_instance") {
      const props = graph.getNodeAttributes(node);
      const cid = props.character_id;
      if (cid === charId) instances.push(node);
    }
  });

  if (instances.length < 2) return 0;

  // Count unique traits across all instances
  const traitsPerInstance: Set<string>[] = instances.map(inst => {
    const traits = new Set<string>();
    graph.forEachOutEdge(inst, (edge, attrs, src, tgt) => {
      if (attrs.relation === "character_speaks_like" || attrs.relation === "exhibits") {
        const tgtAttrs = graph.getNodeAttributes(tgt);
        traits.add(tgtAttrs.label ?? tgt);
      }
    });
    // Also check incoming edges (trait → character)
    graph.forEachInEdge(inst, (edge, attrs, src, tgt) => {
      if (attrs.relation === "character_speaks_like" || attrs.relation === "exhibits") {
        const srcAttrs = graph.getNodeAttributes(src);
        traits.add(srcAttrs.label ?? src);
      }
    });
    return traits;
  });

  // Compute trait overlap: shared traits / total unique traits
  const allTraits = new Set(traitsPerInstance.flatMap(s => [...s]));
  if (allTraits.size === 0) return 0;

  const sharedTraits = new Set(
    [...allTraits].filter(t => traitsPerInstance.every(s => s.has(t)))
  );

  // Arc score = 1 - overlap ratio (more unique traits across episodes = higher arc)
  return 1 - (sharedTraits.size / allTraits.size);
}

// ─── Gag Evolution Score ───

/**
 * Measure gag variation richness along gag_evolves chains.
 * Higher score = more creative gag evolution.
 *
 * Returns 0 if gag type has only one manifestation.
 */
export function computeGagEvolutionScore(
  graph: Graph,
  gagType: string
): number {
  const manifestations: string[] = [];
  graph.forEachNode((node, attrs) => {
    if (attrs.type === "gag_manifestation") {
      const props = graph.getNodeAttributes(node);
      if (props.gag_type === gagType || (attrs.label && attrs.label.includes(gagType))) {
        manifestations.push(attrs.label ?? node);
      }
    }
  });

  if (manifestations.length < 2) return 0;

  // Count unique words across manifestations
  const wordSets = manifestations.map(m =>
    new Set(m.replace(/[：:，,。.！!？?]/g, " ").split(/\s+/).filter(w => w.length > 1))
  );

  const allWords = new Set(wordSets.flatMap(s => [...s]));
  if (allWords.size === 0) return 0;

  const sharedWords = new Set(
    [...allWords].filter(w => wordSets.every(s => s.has(w)))
  );

  // Evolution score = 1 - shared ratio (more unique words = richer evolution)
  return 1 - (sharedWords.size / allWords.size);
}
