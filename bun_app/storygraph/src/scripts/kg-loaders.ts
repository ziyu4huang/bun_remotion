/**
 * Server-side KG data loaders for buildRemotionPrompt().
 *
 * Reads merged-graph.json + auxiliary files and returns structured data.
 * These run on Node.js (Bun) — NOT in browser context.
 *
 * Reuses GraphJSON types from story-graph.ts for compatibility.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// ─── Types ───

interface GraphNode {
  id: string;
  type?: string;
  label?: string;
  properties?: Record<string, string>;
  episode?: string;
}

interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

interface MergedGraph {
  nodes: GraphNode[];
  links: GraphEdge[];
  link_edges?: GraphEdge[];
  communities?: Record<string, string[]>;
}

export interface EpisodeSummary {
  ep_id: string;
  plot_label: string;
  scenes: Array<{ id: string; label: string; dialog_lines: number; characters: number; effects: number }>;
  key_characters: Array<{ id: string; label: string; dialog_count: number }>;
  themes: string[];
}

export interface ForeshadowStatus {
  id: string;
  description: string;
  planted_episode: string;
  paid_off: boolean;
  payoff_episode: string | null;
  confidence: number;
}

export interface ScenePacing {
  scene_id: string;
  label: string;
  tension: number;
  dialog_density: number;
  character_density: number;
  effect_density: number;
}

export interface ThemeCluster {
  theme_id: string;
  label: string;
  episodes: string[];
  connected_nodes: string[];
}

export interface CharacterConstraint {
  char_id: string;
  char_name: string;
  stable_traits: string[];
  recent_variant_traits: string[];
}

export interface GagEvolution {
  gag_type: string;
  manifestations: Array<{ ep_id: string; label: string }>;
}

export interface InteractionPattern {
  char_a: string;
  char_a_name: string;
  char_b: string;
  char_b_name: string;
  history_episodes: string[];
  is_first_interaction: boolean;
}

export interface TechTermUsage {
  ep_id: string;
  terms: string[];
}

// ─── Helpers ───

function buildNodeMap(nodes: GraphNode[]): Map<string, GraphNode> {
  const m = new Map<string, GraphNode>();
  for (const n of nodes) m.set(n.id, n);
  return m;
}

function episodeSortKey(epId: string): number {
  const m = epId.match(/ch(\d+)ep(\d+)/);
  if (!m) return 0;
  return parseInt(m[1]) * 100 + parseInt(m[2]);
}

function findPreviousEpId(merged: MergedGraph, targetEpId: string): string | null {
  const targetKey = episodeSortKey(targetEpId);
  const epIds = new Set<string>();
  for (const n of merged.nodes) {
    if (n.type === "episode_plot" && n.episode) epIds.add(n.episode);
  }
  const before = [...epIds]
    .filter(id => episodeSortKey(id) < targetKey)
    .sort((a, b) => episodeSortKey(b) - episodeSortKey(a));
  return before[0] ?? null;
}

// ─── Loaders ───

/**
 * Extract a structured summary of the previous episode from merged graph data.
 * Returns null if targetEpId is the first episode or no previous data exists.
 */
export function loadPreviousEpisodeSummary(
  merged: MergedGraph,
  targetEpId: string
): EpisodeSummary | null {
  const prevEpId = findPreviousEpId(merged, targetEpId);
  if (!prevEpId) return null;

  const nodes = merged.nodes.filter(n => n.episode === prevEpId || n.id.startsWith(`${prevEpId}_`));
  if (nodes.length === 0) return null;

  // Episode plot node
  const plotNode = nodes.find(n => n.type === "episode_plot");

  // Scene nodes
  const sceneNodes = nodes
    .filter(n => n.type === "scene")
    .map(n => ({
      id: n.id,
      label: n.label ?? n.id,
      dialog_lines: parseInt(n.properties?.dialog_line_count ?? "0", 10),
      characters: parseInt(n.properties?.character_count ?? "0", 10),
      effects: parseInt(n.properties?.effect_count ?? "0", 10),
    }));

  // Character instances sorted by dialog count
  const charNodes = nodes
    .filter(n => n.type === "character_instance" && n.properties?.character_id !== "narrator")
    .map(n => ({
      id: n.properties?.character_id ?? n.id,
      label: (n.label ?? n.id).replace(/\s*\(.*\)$/, ""),
      dialog_count: parseInt(n.properties?.dialog_count ?? "0", 10),
    }))
    .sort((a, b) => b.dialog_count - a.dialog_count);

  // Theme nodes
  const themes = nodes
    .filter(n => n.type === "theme")
    .map(n => n.label ?? n.id);

  return {
    ep_id: prevEpId,
    plot_label: plotNode?.label ?? prevEpId,
    scenes: sceneNodes,
    key_characters: charNodes.slice(0, 5),
    themes,
  };
}

/**
 * Load active (planted but unpaid) foreshadowing from foreshadow-output.json.
 * Returns empty array if no foreshadow data exists.
 */
export function loadActiveForeshadowing(outDir: string): ForeshadowStatus[] {
  const foreshadowPath = resolve(outDir, "foreshadow-output.json");
  if (!existsSync(foreshadowPath)) return [];

  try {
    const raw = JSON.parse(readFileSync(foreshadowPath, "utf-8"));

    // Handle array or object format
    const planted: any[] = Array.isArray(raw) ? raw : (raw.planted ?? []);
    const payoffs: any[] = raw.payoffs ?? [];

    const paidOffIds = new Set(payoffs.map((p: any) => p.foreshadow_id));

    return planted
      .filter((f: any) => !paidOffIds.has(f.id))
      .map((f: any) => ({
        id: f.id,
        description: f.description ?? f.label ?? "",
        planted_episode: f.planted_episode ?? f.episode ?? "",
        paid_off: false,
        payoff_episode: null,
        confidence: f.confidence ?? 0.7,
      }));
  } catch {
    return [];
  }
}

/**
 * Compute pacing profile for a specific episode from merged graph scene nodes.
 * Uses the same tension formula as story-graph.ts loadSceneTensions().
 */
export function loadPacingProfile(merged: MergedGraph, epId: string): ScenePacing[] {
  const sceneNodes = merged.nodes.filter(
    n => n.type === "scene" && (n.episode === epId || n.id.startsWith(`${epId}_`))
  );
  if (sceneNodes.length === 0) return [];

  const maxDialog = Math.max(
    ...sceneNodes.map(n => parseInt(n.properties?.dialog_line_count ?? "0", 10)),
    1
  );
  const maxChars = Math.max(
    ...sceneNodes.map(n => parseInt(n.properties?.character_count ?? "0", 10)),
    1
  );
  const maxEffects = Math.max(
    ...sceneNodes.map(n => parseInt(n.properties?.effect_count ?? "0", 10)),
    1
  );

  return sceneNodes.map(n => {
    const d = parseInt(n.properties?.dialog_line_count ?? "0", 10) / maxDialog;
    const c = parseInt(n.properties?.character_count ?? "0", 10) / maxChars;
    const e = parseInt(n.properties?.effect_count ?? "0", 10) / maxEffects;
    return {
      scene_id: n.id,
      label: n.label ?? n.id,
      tension: 0.4 * d + 0.3 * c + 0.3 * e,
      dialog_density: d,
      character_density: c,
      effect_density: e,
    };
  });
}

/**
 * Extract theme clusters from merged graph.
 * Groups theme nodes by their connected episodes.
 */
export function loadThematicCoherence(merged: MergedGraph): ThemeCluster[] {
  const themeNodes = merged.nodes.filter(n => n.type === "theme");
  if (themeNodes.length === 0) return [];

  const nodeMap = buildNodeMap(merged.nodes);

  return themeNodes.map(t => {
    // Find episodes connected to this theme via edges
    const connectedEpisodes = new Set<string>();
    const connectedNodes: string[] = [];

    for (const edge of merged.links) {
      let otherId: string | null = null;
      if (edge.source === t.id) otherId = edge.target;
      else if (edge.target === t.id) otherId = edge.source;

      if (otherId) {
        const other = nodeMap.get(otherId);
        if (other?.episode) connectedEpisodes.add(other.episode);
        connectedNodes.push(otherId);
      }
    }

    return {
      theme_id: t.id,
      label: t.label ?? t.id,
      episodes: [...connectedEpisodes].sort((a, b) => episodeSortKey(a) - episodeSortKey(b)),
      connected_nodes: connectedNodes,
    };
  }).filter(tc => tc.episodes.length > 0);
}

/**
 * Load character constraints from enrichment data (check-enrichment-input.json).
 * Returns stable traits + recent variant traits per character.
 */
export function loadCharacterConstraints(outDir: string): CharacterConstraint[] {
  const enrichPath = resolve(outDir, "check-enrichment-input.json");
  if (!existsSync(enrichPath)) return [];

  try {
    const raw = JSON.parse(readFileSync(enrichPath, "utf-8"));
    const comparisons = raw?.characterComparisons;
    if (!Array.isArray(comparisons)) return [];

    return comparisons
      .filter((c: any) => c.id !== "narrator")
      .map((c: any) => {
        const recentEpisodes = (c.episodes ?? []).slice(-2);
        const recentTraits = new Set<string>();
        for (const ep of recentEpisodes) {
          for (const t of (ep.traits ?? [])) {
            if (!(c.sharedTraits ?? []).includes(t)) {
              recentTraits.add(t);
            }
          }
        }
        return {
          char_id: c.id,
          char_name: c.character ?? c.id,
          stable_traits: c.sharedTraits ?? [],
          recent_variant_traits: [...recentTraits],
        };
      });
  } catch {
    return [];
  }
}

/**
 * Extract gag evolution chains from merged graph gag_manifestation nodes.
 */
export function loadGagEvolution(merged: MergedGraph): GagEvolution[] {
  const gagNodesByType = new Map<string, Array<{ ep_id: string; label: string }>>();

  for (const n of merged.nodes) {
    if (n.type !== "gag_manifestation") continue;
    const gagType = n.properties?.gag_type ?? n.label?.split("：")[0] ?? "unknown";
    const epId = n.episode ?? n.id.match(/^ch\d+ep\d+/)?.[0] ?? "";
    if (!gagNodesByType.has(gagType)) gagNodesByType.set(gagType, []);
    gagNodesByType.get(gagType)!.push({
      ep_id: epId,
      label: (n.label ?? n.id).replace(/\s*\(ch\d+ep\d+\)$/, ""),
    });
  }

  return [...gagNodesByType.entries()]
    .map(([gag_type, manifestations]) => {
      manifestations.sort((a, b) => episodeSortKey(a.ep_id) - episodeSortKey(b.ep_id));
      return { gag_type, manifestations };
    });
}

/**
 * Extract interaction patterns from merged graph interacts_with edges.
 */
export function loadInteractionPatterns(
  merged: MergedGraph,
  targetCharIds: string[],
  charNames: Record<string, string>
): InteractionPattern[] {
  const pairHistory = new Map<string, string[]>();

  for (const edge of merged.links) {
    if (edge.relation !== "interacts_with") continue;
    const sourceChar = edge.source.split("_char_")[1]?.split("_")[0];
    const targetChar = edge.target.split("_char_")[1]?.split("_")[0];
    if (!sourceChar || !targetChar) continue;
    if (sourceChar === "narrator" || targetChar === "narrator") continue;

    const key = [sourceChar, targetChar].sort().join(" ↔ ");
    const epId = edge.source.match(/^ch\d+ep\d+/)?.[0] ?? "";
    if (!pairHistory.has(key)) pairHistory.set(key, []);
    pairHistory.get(key)!.push(epId);
  }

  const patterns: InteractionPattern[] = [];
  for (let i = 0; i < targetCharIds.length; i++) {
    for (let j = i + 1; j < targetCharIds.length; j++) {
      const a = targetCharIds[i];
      const b = targetCharIds[j];
      if (a === "narrator" || b === "narrator") continue;
      const key = [a, b].sort().join(" ↔ ");
      const history = pairHistory.get(key) ?? [];
      patterns.push({
        char_a: a,
        char_a_name: charNames[a] ?? a,
        char_b: b,
        char_b_name: charNames[b] ?? b,
        history_episodes: [...new Set(history)].sort(),
        is_first_interaction: history.length === 0,
      });
    }
  }

  return patterns;
}

/**
 * Extract tech term usage grouped by episode from merged graph.
 */
export function loadTechTermUsage(merged: MergedGraph): TechTermUsage[] {
  const termsByEp = new Map<string, string[]>();

  for (const n of merged.nodes) {
    if (n.type !== "tech_term") continue;
    const epId = n.episode ?? n.id.match(/^ch\d+ep\d+/)?.[0];
    if (!epId) continue;
    if (!termsByEp.has(epId)) termsByEp.set(epId, []);
    termsByEp.get(epId)!.push(n.label ?? n.id);
  }

  return [...termsByEp.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([ep_id, terms]) => ({ ep_id, terms }));
}

/**
 * Read merged-graph.json from disk and return parsed MergedGraph.
 * Returns null if file doesn't exist.
 */
export function loadMergedGraph(outDir: string): MergedGraph | null {
  const mergedPath = resolve(outDir, "merged-graph.json");
  if (!existsSync(mergedPath)) return null;
  try {
    return JSON.parse(readFileSync(mergedPath, "utf-8"));
  } catch {
    return null;
  }
}
