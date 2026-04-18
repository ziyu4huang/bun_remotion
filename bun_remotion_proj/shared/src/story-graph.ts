/**
 * Story graph data utilities for Remotion components.
 * Consumes graph.json / merged-graph.json produced by bun_graphify pipeline.
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
