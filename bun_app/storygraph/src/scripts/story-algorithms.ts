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
    nodes: Array<{ id: string; type?: string; label?: string }>;
    links: Array<{ source: string; target: string; relation?: string }>;
  }>
): Record<string, Record<string, number>> {
  // Build per-episode sets:
  // 1. Node labels (actual content, e.g. tech_term "AST" vs "PageRank")
  // 2. Node types (structural, e.g. "scene", "tech_term")
  // 3. Edge patterns (normalized srcType-relation-tgtType)
  // Labels are prefixed with type to avoid cross-type collisions ("scene:TitleScene" vs "tech_term:TitleScene")
  const epSets: EpisodeNodeSet[] = episodeGraphs.map(eg => ({
    episodeId: eg.episode_id,
    nodeIds: new Set([
      ...eg.nodes.map(n => n.type ?? "unknown"),
      ...eg.nodes.filter(n => n.label).map(n => `${n.type}:${n.label}`),
    ]),
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
      // Jaccard = |A ∩ B| / |A ∪ B| over node types + node labels + edge patterns
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

// ─── Character Arc Score (Phase 24-D: Direction-Aware) ───

export type TraitChangeDirection =
  | "positive_growth"
  | "negative_decline"
  | "neutral_shift"
  | "reintroduction";

export type ArcClassification =
  | "positive"
  | "negative"
  | "flat"
  | "cyclical";

export interface TraitChange {
  trait: string;
  direction: TraitChangeDirection;
  from_episode: string;
  to_episode: string;
}

export interface CharacterArcResult {
  score: number;
  classification: ArcClassification;
  traitChanges: TraitChange[];
  perEpisode: Array<{ episode: string; traits: string[] }>;
}

/**
 * Direction-aware character arc scoring.
 *
 * Classifies each trait change across consecutive episode pairs:
 * - positive_growth: new trait appears (character learns/grows)
 * - negative_decline: stable trait disappears (character regresses)
 * - neutral_shift: one trait replaces another (lateral change)
 * - reintroduction: previously lost trait returns (character rediscovers)
 *
 * Trajectory vector: (positive - negative) / total_changes
 * Arc classification: positive (>0.3), negative (<-0.3), flat (|score|<0.1), cyclical
 */
export function computeCharacterArcScore(
  graph: Graph,
  charId: string
): CharacterArcResult {
  const empty: CharacterArcResult = {
    score: 0,
    classification: "flat",
    traitChanges: [],
    perEpisode: [],
  };

  // Find all character_instance nodes for this char, ordered by episode
  const instances: Array<{ nodeId: string; episode: string }> = [];
  graph.forEachNode((node, attrs) => {
    if (attrs.type === "character_instance") {
      const props = graph.getNodeAttributes(node);
      const cid = props.character_id;
      if (cid === charId) {
        const ep = node.match(/^ch\d+ep\d+/)?.[0] ?? node;
        instances.push({ nodeId: node, episode: ep });
      }
    }
  });

  if (instances.length < 2) return empty;

  // Sort by episode order
  instances.sort((a, b) => a.episode.localeCompare(b.episode));

  // Extract traits per instance
  const perEpisode: Array<{ episode: string; traits: string[] }> = instances.map(({ nodeId, episode }) => {
    const traits = new Set<string>();
    graph.forEachOutEdge(nodeId, (_edge, attrs, _src, tgt) => {
      if (attrs.relation === "character_speaks_like" || attrs.relation === "exhibits") {
        const tgtAttrs = graph.getNodeAttributes(tgt);
        traits.add(tgtAttrs.label ?? tgt);
      }
    });
    graph.forEachInEdge(nodeId, (_edge, attrs, src, _tgt) => {
      if (attrs.relation === "character_speaks_like" || attrs.relation === "exhibits") {
        const srcAttrs = graph.getNodeAttributes(src);
        traits.add(srcAttrs.label ?? src);
      }
    });
    return { episode, traits: [...traits] };
  });

  if (perEpisode.every(ep => ep.traits.length === 0)) return empty;

  // Classify changes between consecutive episodes
  const traitChanges: TraitChange[] = [];
  const traitHistory: Map<string, Array<{ episode: string; present: boolean }>> = new Map();

  for (let i = 0; i < perEpisode.length; i++) {
    const { episode, traits } = perEpisode[i];
    const traitSet = new Set(traits);

    for (const trait of traitSet) {
      if (!traitHistory.has(trait)) traitHistory.set(trait, []);
      traitHistory.get(trait)!.push({ episode, present: true });
    }

    // Record absence for traits that appeared before but not in this episode
    if (i > 0) {
      const prevTraits = new Set(perEpisode[i - 1].traits);
      for (const trait of prevTraits) {
        if (!traitSet.has(trait)) {
          if (!traitHistory.has(trait)) traitHistory.set(trait, []);
          traitHistory.get(trait)!.push({ episode, present: false });
        }
      }
    }
  }

  // Build change list from consecutive pairs
  for (let i = 1; i < perEpisode.length; i++) {
    const prev = new Set(perEpisode[i - 1].traits);
    const curr = new Set(perEpisode[i].traits);

    const gained = [...curr].filter(t => !prev.has(t));
    const lost = [...prev].filter(t => !curr.has(t));

    // Pair up gains and losses as neutral_shifts, remainder as growth/decline
    const paired = Math.min(gained.length, lost.length);
    for (let j = 0; j < paired; j++) {
      traitChanges.push({
        trait: `${lost[j]} → ${gained[j]}`,
        direction: "neutral_shift",
        from_episode: perEpisode[i - 1].episode,
        to_episode: perEpisode[i].episode,
      });
    }

    for (let j = paired; j < gained.length; j++) {
      // Check if this trait was present in an earlier episode (reintroduction)
      const history = traitHistory.get(gained[j]) ?? [];
      const wasPresentBefore = history.some(
        h => h.present && h.episode !== perEpisode[i].episode && h.episode !== perEpisode[i - 1].episode
      );
      traitChanges.push({
        trait: gained[j],
        direction: wasPresentBefore ? "reintroduction" : "positive_growth",
        from_episode: perEpisode[i - 1].episode,
        to_episode: perEpisode[i].episode,
      });
    }

    for (let j = paired; j < lost.length; j++) {
      traitChanges.push({
        trait: lost[j],
        direction: "negative_decline",
        from_episode: perEpisode[i - 1].episode,
        to_episode: perEpisode[i].episode,
      });
    }
  }

  if (traitChanges.length === 0) {
    return { score: 0, classification: "flat", traitChanges, perEpisode };
  }

  // Trajectory vector: (positive + reintroduction - negative_decline) / total
  const positiveCount = traitChanges.filter(c =>
    c.direction === "positive_growth" || c.direction === "reintroduction"
  ).length;
  const negativeCount = traitChanges.filter(c => c.direction === "negative_decline").length;
  const total = traitChanges.length;

  const trajectory = (positiveCount - negativeCount) / total;

  // Classify arc
  let classification: ArcClassification;
  if (trajectory > 0.3) classification = "positive";
  else if (trajectory < -0.3) classification = "negative";
  else if (Math.abs(trajectory) < 0.1) classification = "flat";
  else classification = "cyclical";

  // Score: 0-100 based on trajectory magnitude + change diversity
  const trajectoryScore = Math.abs(trajectory) * 50;
  const diversityScore = Math.min(1, new Set(traitChanges.map(c => c.trait)).size / total) * 50;
  const score = Math.round(trajectoryScore + diversityScore);

  return { score, classification, traitChanges, perEpisode };
}

// ─── Plot Arc Score (Phase 24-B) ───

export type PlotArcDiagnosis =
  | "complete"
  | "no_climax"
  | "flat_middle"
  | "inverted"
  | "no_inciting_incident";

export interface PlotArcResult {
  score: number;
  diagnosis: PlotArcDiagnosis;
  tensionCurve: Array<{ scene: string; beat_type: string; tension: number }>;
  expectedTensions: number[];
  actualTensions: number[];
}

/**
 * Compute plot arc score from an ordered array of plot beats.
 *
 * Expected tension curve (normalized 0-1):
 *   inciting_incident → 0.3, rising_action → 0.55, climax → 1.0,
 *   falling_action → 0.45, resolution → 0.2
 *
 * Score (0-100): correlation between actual and expected tension distributions.
 * Diagnosis flags structural problems.
 */
export function computePlotArcScore(
  beats: Array<{ scene: string; beat_type: string; tension: number }>
): PlotArcResult {
  if (beats.length === 0) {
    return {
      score: 0,
      diagnosis: "no_climax",
      tensionCurve: [],
      expectedTensions: [],
      actualTensions: [],
    };
  }

  const expectedMap: Record<string, number> = {
    inciting_incident: 0.3,
    rising_action: 0.55,
    climax: 1.0,
    falling_action: 0.45,
    resolution: 0.2,
  };

  const tensionCurve = beats.map(b => ({
    scene: b.scene,
    beat_type: b.beat_type,
    tension: b.tension,
  }));

  const expectedTensions = beats.map(b => expectedMap[b.beat_type] ?? 0.3);
  const actualTensions = beats.map(b => b.tension);

  // Diagnosis checks
  const hasInciting = beats.some(b => b.beat_type === "inciting_incident");
  const hasClimax = beats.some(b => b.beat_type === "climax");
  const climaxBeat = beats.find(b => b.beat_type === "climax");
  const risingBeats = beats.filter(b => b.beat_type === "rising_action");

  let diagnosis: PlotArcDiagnosis = "complete";

  if (!hasClimax) {
    diagnosis = "no_climax";
  } else if (!hasInciting) {
    diagnosis = "no_inciting_incident";
  } else if (climaxBeat && risingBeats.length > 0) {
    const maxRisingTension = Math.max(...risingBeats.map(b => b.tension));
    if (climaxBeat.tension < maxRisingTension * 0.8) {
      diagnosis = "inverted";
    }
    // Check flat middle: variance between inciting and climax should be meaningful
    const betweenBeats = beats.filter(
      b => b.beat_type === "rising_action" || b.beat_type === "falling_action"
    );
    if (betweenBeats.length >= 2) {
      const midTensions = betweenBeats.map(b => b.tension);
      const variance = midTensions.reduce((s, t) => s + Math.pow(t - mean(midTensions), 2), 0) / midTensions.length;
      if (variance < 0.01) {
        diagnosis = "flat_middle";
      }
    }
  }

  // Score: 1 - normalized mean absolute deviation from expected
  const deviations = expectedTensions.map((exp, i) => Math.abs(actualTensions[i] - exp));
  const meanDeviation = mean(deviations);
  // Max possible deviation ≈ 1.0, so score = (1 - meanDeviation) * 100
  const score = Math.round(Math.max(0, Math.min(100, (1 - meanDeviation) * 100)));

  return { score, diagnosis, tensionCurve, expectedTensions, actualTensions };
}

// ─── Pacing Curve (Phase 24-E) ───

export type PacingDiagnosis = "dynamic" | "flat" | "inverted" | "insufficient_data";

export interface PacingPoint {
  scene: string;
  episode: string;
  tension: number;
  dialogDensity: number;
  characterDensity: number;
  effectDensity: number;
}

export interface PacingResult {
  curve: PacingPoint[];
  variance: number;
  isFlat: boolean;
  isInverted: boolean;
  diagnosis: PacingDiagnosis;
}

/**
 * Per-episode pacing curve from scene dialog density.
 *
 * Tension is normalized dialog_line_count (0-1 per episode).
 * Diagnosis:
 *   - flat: variance < 0.01 (all scenes have similar dialog count)
 *   - inverted: OutroScene tension > avg ContentScene tension
 *   - dynamic: healthy variation
 *   - insufficient_data: fewer than 2 scenes
 */
export function computePacingCurve(
  graph: Graph,
  episodeId: string
): PacingResult {
  const insufficient: PacingResult = {
    curve: [], variance: 0, isFlat: false, isInverted: false, diagnosis: "insufficient_data",
  };

  const sceneNodes: Array<{ id: string; dialogLines: number; charCount: number; effectCount: number; label: string }> = [];
  graph.forEachNode((node, attrs) => {
    if (attrs.type === "scene" && node.startsWith(episodeId)) {
      sceneNodes.push({
        id: node,
        dialogLines: parseInt(String(attrs.dialog_line_count ?? 0), 10),
        charCount: parseInt(String(attrs.character_count ?? 0), 10),
        effectCount: parseInt(String(attrs.effect_count ?? 0), 10),
        label: attrs.label ?? node,
      });
    }
  });

  if (sceneNodes.length < 2) return insufficient;

  const maxDialog = Math.max(...sceneNodes.map(s => s.dialogLines), 1);
  const maxChars = Math.max(...sceneNodes.map(s => s.charCount), 1);
  const maxEffects = Math.max(...sceneNodes.map(s => s.effectCount), 1);
  const curve: PacingPoint[] = sceneNodes.map(s => {
    const dialogD = s.dialogLines / maxDialog;
    const charD = s.charCount / maxChars;
    const effectD = s.effectCount / maxEffects;
    return {
      scene: s.id,
      episode: episodeId,
      tension: 0.4 * dialogD + 0.3 * charD + 0.3 * effectD,
      dialogDensity: dialogD,
      characterDensity: charD,
      effectDensity: effectD,
    };
  });

  const tensions = curve.map(p => p.tension);
  const m = mean(tensions);
  const variance = tensions.reduce((s, t) => s + Math.pow(t - m, 2), 0) / tensions.length;

  const isFlat = variance < 0.01;

  // Inverted: OutroScene has more dialog activity than average ContentScene
  const outroScene = curve.find(p => p.scene.includes("OutroScene"));
  const contentScenes = curve.filter(p => p.scene.includes("ContentScene"));
  const avgContentTension = contentScenes.length > 0 ? mean(contentScenes.map(p => p.tension)) : 0;
  const isInverted = outroScene ? outroScene.tension > avgContentTension && avgContentTension > 0 : false;

  let diagnosis: PacingDiagnosis;
  if (isFlat) diagnosis = "flat";
  else if (isInverted) diagnosis = "inverted";
  else diagnosis = "dynamic";

  return { curve, variance, isFlat, isInverted, diagnosis };
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
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

// ─── Theme Coherence (Phase 24-F) ───

export interface ThemeCoherenceResult {
  coherence: number;
  sharedThemes: string[];
  uniqueThemes: Map<string, string[]>;
}

/**
 * Measure thematic coherence across episodes.
 * Coherence = themes appearing in >= 2 episodes / total unique themes.
 * Returns coherence=1 and empty data if no theme nodes exist.
 */
export function computeThemeCoherence(
  nodes: Array<{ id: string; type?: string; properties?: Record<string, string>; episode?: string }>
): ThemeCoherenceResult {
  const themeNodes = nodes.filter(n => n.type === "theme");
  if (themeNodes.length === 0) {
    return { coherence: 1, sharedThemes: [], uniqueThemes: new Map() };
  }

  const keywordToEpisodes = new Map<string, Set<string>>();
  for (const node of themeNodes) {
    const keyword = node.properties?.keyword
      ?? node.id.split("_theme_")[1]
      ?? node.id;
    const episode = node.episode ?? node.properties?.episode ?? "unknown";
    if (!keywordToEpisodes.has(keyword)) {
      keywordToEpisodes.set(keyword, new Set());
    }
    keywordToEpisodes.get(keyword)!.add(episode);
  }

  const allKeywords = [...keywordToEpisodes.keys()];
  const sharedThemes = allKeywords.filter(k => (keywordToEpisodes.get(k)?.size ?? 0) >= 2);
  const uniqueThemes = new Map<string, string[]>();
  for (const [keyword, episodes] of keywordToEpisodes) {
    uniqueThemes.set(keyword, [...episodes]);
  }

  const coherence = allKeywords.length > 0 ? sharedThemes.length / allKeywords.length : 1;
  return { coherence, sharedThemes, uniqueThemes };
}

// ─── Gag Diversity (Phase 30-B2) ───

export interface GagDiversityResult {
  /** Ratio of unique gag types to total manifestations (0-1) */
  diversity: number;
  /** Unique gag types found */
  gagTypes: string[];
  /** Total manifestation count */
  totalManifestations: number;
  /** Per-episode breakdown */
  perEpisode: Record<string, { types: string[]; count: number }>;
}

/**
 * Measure gag diversity across episodes.
 * diversity = unique gag_types / total gag_manifestations.
 * Low diversity (<0.3) means same gag repeated without variety.
 */
export function computeGagDiversity(
  nodes: Array<{ id: string; type?: string; properties?: Record<string, string>; episode?: string }>
): GagDiversityResult {
  const gagNodes = nodes.filter(n => n.type === "gag_manifestation");

  if (gagNodes.length === 0) {
    return { diversity: 1, gagTypes: [], totalManifestations: 0, perEpisode: {} };
  }

  const gagTypes = new Set<string>();
  const perEpisode: Record<string, { types: Set<string>; count: number }> = {};

  for (const n of gagNodes) {
    const gagType = n.properties?.gag_type ?? n.id.split("_gag_")[1] ?? "unknown";
    const episode = n.episode ?? n.properties?.episode ?? n.id.match(/^(ch\d+ep\d+|ep\d+)/)?.[1] ?? "unknown";

    gagTypes.add(gagType);

    if (!perEpisode[episode]) {
      perEpisode[episode] = { types: new Set(), count: 0 };
    }
    perEpisode[episode].types.add(gagType);
    perEpisode[episode].count++;
  }

  const diversity = gagTypes.size / gagNodes.length;

  return {
    diversity,
    gagTypes: [...gagTypes],
    totalManifestations: gagNodes.length,
    perEpisode: Object.fromEntries(
      Object.entries(perEpisode).map(([ep, data]) => [ep, { types: [...data.types], count: data.count }])
    ),
  };
}

// ─── Comedy Arc Score (Phase 30-B1 support) ───

export type ComedyBeatType = "setup" | "buildup" | "punchline" | "callback" | "escalation";
export type ComedyArcDiagnosis = "complete" | "no_punchline" | "all_setup" | "stagnant" | "orphan_callback";

export interface ComedyArcResult {
  score: number;
  diagnosis: ComedyArcDiagnosis;
  beats: Array<{ scene: string; beat_type: ComedyBeatType; tension: number }>;
}

const COMEDY_EXPECTED_TENSION: Record<string, number> = {
  setup: 0.2,
  buildup: 0.4,
  escalation: 0.6,
  punchline: 1.0,
  callback: 0.3,
};

/**
 * Compute comedy arc score based on joke cycle structure.
 * Expected: setup(0.2) -> buildup(0.4) -> punchline(1.0) -> callback(0.3)
 */
export function computeComedyArcScore(
  beats: Array<{ scene: string; beat_type: string; tension: number }>
): ComedyArcResult {
  if (beats.length === 0) {
    return { score: 0, diagnosis: "all_setup", beats: [] };
  }

  const typedBeats = beats.map(b => ({
    ...b,
    beat_type: b.beat_type as ComedyBeatType,
  }));

  const hasPunchline = typedBeats.some(b => b.beat_type === "punchline");
  const hasSetup = typedBeats.some(b => b.beat_type === "setup");
  const hasCallback = typedBeats.some(b => b.beat_type === "callback");
  const setupCount = typedBeats.filter(b => b.beat_type === "setup").length;

  let diagnosis: ComedyArcDiagnosis = "complete";

  if (!hasPunchline) {
    diagnosis = "no_punchline";
  } else if (setupCount === typedBeats.length) {
    diagnosis = "all_setup";
  } else if (hasCallback && !hasSetup) {
    diagnosis = "orphan_callback";
  } else {
    const tensions = typedBeats.map(b => b.tension);
    const mean = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    const variance = tensions.reduce((s, t) => s + (t - mean) ** 2, 0) / tensions.length;
    if (variance < 0.01) {
      diagnosis = "stagnant";
    }
  }

  const expected = typedBeats.map(b => COMEDY_EXPECTED_TENSION[b.beat_type] ?? 0.3);
  const actual = typedBeats.map(b => b.tension);
  const deviations = expected.map((exp, i) => Math.abs(actual[i] - exp));
  const meanDev = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const score = Math.round(Math.max(0, Math.min(100, (1 - meanDev) * 100)));

  return { score, diagnosis, beats: typedBeats };
}
