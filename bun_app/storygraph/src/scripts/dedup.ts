/**
 * Canonical node ID builders + fuzzy label normalization.
 *
 * Regex and AI pipelines may produce different labels for the same concept
 * (e.g., "TitleScene" vs "title"). This module provides:
 * 1. Canonical ID builders per node type — shared by regex + AI paths
 * 2. Fuzzy label normalization for hybrid dedup
 */

/** Normalize whitespace in an ID fragment: spaces→underscores, strip parens. */
function normalizeIdFragment(s: string): string {
  return s.replace(/\s+/g, "_").replace(/[()（）]/g, "");
}

// ─── Canonical node ID builders ───

/** episode_plot: `${epId}_plot` */
export function plotNodeId(epId: string): string {
  return `${epId}_plot`;
}

/** scene: `${epId}_scene_${name}` */
export function sceneNodeId(epId: string, sceneName: string): string {
  return `${epId}_scene_${sceneName}`;
}

/** character_instance: `${epId}_char_${charId}` */
export function charNodeId(epId: string, charId: string): string {
  return `${epId}_char_${charId}`;
}

/** tech_term: `${epId}_tech_${normalizedTerm}` */
export function techTermNodeId(epId: string, term: string): string {
  return `${epId}_tech_${normalizeIdFragment(term)}`;
}

/** plot_event: `${epId}_event_${seq}` */
export function plotEventNodeId(epId: string, seq: number): string {
  return `${epId}_event_${seq}`;
}

/** artifact: `${epId}_artifact_${normalizedText}` */
export function artifactNodeId(epId: string, matchText: string): string {
  return `${epId}_artifact_${normalizeIdFragment(matchText)}`;
}

/** character_trait: `${epId}_trait_${charId}_${normalizedTrait}` */
export function traitNodeId(epId: string, charId: string, trait: string): string {
  return `${epId}_trait_${charId}_${normalizeIdFragment(trait)}`;
}

/** gag_manifestation: `${epId}_gag_${normalizedType}` */
export function gagNodeId(epId: string, gagType: string): string {
  return `${epId}_gag_${normalizeIdFragment(gagType)}`;
}

// ─── Fuzzy dedup ───

/** Normalize a label or ID fragment for fuzzy dedup. */
export function normalizeForDedup(s: string): string {
  return s.toLowerCase().replace(/[_\s-]+/g, "").replace(/[()（）]/g, "");
}
