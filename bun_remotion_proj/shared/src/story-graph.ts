/**
 * Story graph data utilities for Remotion components.
 * Consumes graph.json / merged-graph.json produced by storygraph pipeline.
 *
 * These functions take parsed JSON objects (callers import via webpack).
 * Do NOT use Node.js fs/path — Remotion runs in browser context.
 */

export interface SceneTension {
  sceneId: string;
  tension: number;
  dialogDensity: number;
  characterDensity: number;
  effectDensity: number;
}

export interface PlotBeatData {
  beat_type: string;
  tension: number;
  label: string;
  sceneId: string;
}

export interface CharacterGrowthData {
  direction: "positive" | "negative" | "flat" | "cyclical";
  score: number;
  traits: string[];
}

interface GraphNode {
  id: string;
  type?: string;
  label?: string;
  properties?: Record<string, string>;
  episode?: string;
}

interface GraphJSON {
  nodes: GraphNode[];
  links: Array<{ source: string; target: string; relation: string }>;
  link_edges?: Array<{ source: string; target: string; relation: string }>;
}

export function loadSceneTensions(graphData: GraphJSON): SceneTension[] {
  const scenes = graphData.nodes.filter(n => n.type === "scene");
  if (scenes.length === 0) return [];

  const maxDialog = Math.max(...scenes.map(n => parseInt(n.properties?.dialog_line_count ?? "0", 10)), 1);
  const maxChars = Math.max(...scenes.map(n => parseInt(n.properties?.character_count ?? "0", 10)), 1);
  const maxEffects = Math.max(...scenes.map(n => parseInt(n.properties?.effect_count ?? "0", 10)), 1);

  return scenes.map(n => {
    const d = parseInt(n.properties?.dialog_line_count ?? "0", 10) / maxDialog;
    const c = parseInt(n.properties?.character_count ?? "0", 10) / maxChars;
    const e = parseInt(n.properties?.effect_count ?? "0", 10) / maxEffects;
    return {
      sceneId: n.id,
      tension: 0.4 * d + 0.3 * c + 0.3 * e,
      dialogDensity: d,
      characterDensity: c,
      effectDensity: e,
    };
  });
}

export function loadPlotBeats(graphData: GraphJSON): PlotBeatData[] {
  return graphData.nodes
    .filter(n => n.type === "plot_beat")
    .map(n => ({
      beat_type: n.properties?.beat_type ?? "rising_action",
      tension: parseFloat(n.properties?.tension ?? "0.5"),
      label: n.label ?? n.id,
      sceneId: n.properties?.scene ?? "",
    }))
    .sort((a, b) => {
      const order = ["inciting_incident", "rising_action", "climax", "falling_action", "resolution"];
      return order.indexOf(a.beat_type) - order.indexOf(b.beat_type);
    });
}

export function loadCharacterGrowth(
  graphData: GraphJSON,
  _characterId: string
): CharacterGrowthData {
  // Simplified: derive from character_trait nodes for the character
  const traits = graphData.nodes
    .filter(n => n.type === "character_trait" && n.id.includes(_characterId))
    .map(n => n.label ?? n.id);

  return {
    direction: traits.length >= 3 ? "positive" : traits.length >= 1 ? "flat" : "cyclical",
    score: Math.min(1, traits.length / 5),
    traits,
  };
}

// ─── Episode Summary & Foreshadowing (Phase 32-A2) ───

export interface EpisodeScene {
  id: string;
  label: string;
  dialog_lines: number;
  characters: number;
  effects: number;
}

export interface EpisodeCharacter {
  id: string;
  label: string;
  dialog_count: number;
}

export interface EpisodeSummary {
  ep_id: string;
  plot_label: string;
  scenes: EpisodeScene[];
  key_characters: EpisodeCharacter[];
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

function episodeSortKey(epId: string): number {
  const m = epId.match(/ch(\d+)ep(\d+)/);
  if (!m) return 0;
  return parseInt(m[1]) * 100 + parseInt(m[2]);
}

/**
 * Extract a structured summary of the previous episode from merged graph data.
 * Pure data transformation — no I/O. Works on pre-loaded GraphJSON.
 */
export function loadPreviousEpisodeSummary(
  graphData: GraphJSON,
  targetEpId: string
): EpisodeSummary | null {
  // Find previous episode ID
  const targetKey = episodeSortKey(targetEpId);
  const epIds = new Set<string>();
  for (const n of graphData.nodes) {
    if (n.type === "episode_plot" && n.episode) epIds.add(n.episode);
  }
  const before = [...epIds]
    .filter(id => episodeSortKey(id) < targetKey)
    .sort((a, b) => episodeSortKey(b) - episodeSortKey(a));
  const prevEpId = before[0];
  if (!prevEpId) return null;

  const nodes = graphData.nodes.filter(
    n => n.episode === prevEpId || n.id.startsWith(`${prevEpId}_`)
  );
  if (nodes.length === 0) return null;

  const plotNode = nodes.find(n => n.type === "episode_plot");

  const scenes: EpisodeScene[] = nodes
    .filter(n => n.type === "scene")
    .map(n => ({
      id: n.id,
      label: n.label ?? n.id,
      dialog_lines: parseInt(n.properties?.dialog_line_count ?? "0", 10),
      characters: parseInt(n.properties?.character_count ?? "0", 10),
      effects: parseInt(n.properties?.effect_count ?? "0", 10),
    }));

  const keyCharacters: EpisodeCharacter[] = nodes
    .filter(n => n.type === "character_instance" && n.properties?.character_id !== "narrator")
    .map(n => ({
      id: n.properties?.character_id ?? n.id,
      label: (n.label ?? n.id).replace(/\s*\(.*\)$/, ""),
      dialog_count: parseInt(n.properties?.dialog_count ?? "0", 10),
    }))
    .sort((a, b) => b.dialog_count - a.dialog_count);

  const themes = nodes
    .filter(n => n.type === "theme")
    .map(n => n.label ?? n.id);

  return {
    ep_id: prevEpId,
    plot_label: plotNode?.label ?? prevEpId,
    scenes,
    key_characters: keyCharacters.slice(0, 5),
    themes,
  };
}

/**
 * Extract active (planted but unpaid) foreshadowing from foreshadow output data.
 * Pure data transformation — no I/O. Works on pre-loaded JSON.
 */
export function loadActiveForeshadowing(foreshadowData: {
  planted?: Array<{
    id: string;
    description?: string;
    planted_episode?: string;
    confidence?: number;
  }>;
  payoffs?: Array<{ foreshadow_id: string }>;
}): ForeshadowStatus[] {
  const planted = foreshadowData.planted ?? [];
  const payoffs = foreshadowData.payoffs ?? [];
  const paidOffIds = new Set(payoffs.map(p => p.foreshadow_id));

  return planted
    .filter(f => !paidOffIds.has(f.id))
    .map(f => ({
      id: f.id,
      description: f.description ?? "",
      planted_episode: f.planted_episode ?? "",
      paid_off: false,
      payoff_episode: null,
      confidence: f.confidence ?? 0.7,
    }));
}
