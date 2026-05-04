import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// ── Types ──

export type ContinuityIssueKind =
  | "character_name"
  | "trait_inconsistency"
  | "missing_character"
  | "gag_gap"
  | "theme_gap";

export type Severity = "error" | "warning" | "info";

export interface ContinuityIssue {
  kind: ContinuityIssueKind;
  severity: Severity;
  subject: string;
  episodes: string[];
  detail: string;
  suggestion: string;
}

export interface ContinuityReport {
  seriesId: string;
  episodeCount: number;
  issues: ContinuityIssue[];
  checkedAt: string;
}

// ── Graph types ──

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  episode?: string;
  properties?: Record<string, string>;
}

interface MergedGraph {
  manifest?: { episode_count?: number };
  nodes: GraphNode[];
}

// ── Helpers ──

function readJsonSafe<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function extractCharName(label: string): string {
  const idx = label.lastIndexOf(" (");
  return idx > 0 ? label.slice(0, idx) : label;
}

function sortedEpisodes(episodes: string[]): string[] {
  return [...new Set(episodes)].sort();
}

// ── Checks ──

export function checkCharacterNames(
  charNodes: GraphNode[],
  allEpisodes: string[],
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  const byCharId = new Map<string, Map<string, string>>();

  for (const node of charNodes) {
    const cid = node.properties?.character_id;
    if (!cid) continue;
    const ep = node.episode ?? node.id.split("_")[0];
    const name = extractCharName(node.label);
    if (!byCharId.has(cid)) byCharId.set(cid, new Map());
    byCharId.get(cid)!.set(ep, name);
  }

  for (const [cid, epNames] of byCharId) {
    const uniqueNames = new Set(epNames.values());
    if (uniqueNames.size <= 1) continue;
    const nameList = [...epNames.entries()]
      .map(([ep, name]) => `${ep}: ${name}`)
      .join(", ");
    issues.push({
      kind: "character_name",
      severity: "error",
      subject: cid,
      episodes: sortedEpisodes([...epNames.keys()]),
      detail: `Character "${cid}" has different names across episodes: ${nameList}`,
      suggestion: "Unify the character name across all episodes for consistency.",
    });
  }
  return issues;
}

export function checkTraitConsistency(
  traitNodes: GraphNode[],
  allEpisodes: string[],
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  if (allEpisodes.length < 2) return issues;

  // Group traits by character_id
  const charTraits = new Map<string, Map<string, string[]>>();
  for (const node of traitNodes) {
    const cid = node.properties?.character_id;
    if (!cid) continue;
    const ep = node.episode ?? node.id.split("_")[0];
    // Extract trait name from label like "周墨: 科技工程術語"
    const colonIdx = node.label.indexOf(": ");
    const traitName = colonIdx >= 0 ? node.label.slice(colonIdx + 2) : node.label;
    if (!charTraits.has(cid)) charTraits.set(cid, new Map());
    if (!charTraits.get(cid)!.has(ep)) charTraits.get(cid)!.set(ep, []);
    charTraits.get(cid)!.get(ep)!.push(traitName);
  }

  // Check characters appearing in 3+ episodes where a trait appears/disappears
  for (const [cid, epTraits] of charTraits) {
    const episodes = [...epTraits.keys()];
    if (episodes.length < 3) continue;

    const traitCounts = new Map<string, number>();
    for (const traits of epTraits.values()) {
      for (const t of traits) {
        traitCounts.set(t, (traitCounts.get(t) ?? 0) + 1);
      }
    }

    // Traits that appear in some but not all episodes for this character
    const charEpCount = episodes.length;
    for (const [trait, count] of traitCounts) {
      if (count >= charEpCount) continue; // consistent
      if (count === 1) continue; // one-off trait, not inconsistency
      const missingEps = episodes.filter((ep) => {
        const epTraitList = epTraits.get(ep) ?? [];
        return !epTraitList.includes(trait);
      });
      if (missingEps.length === 0) continue;
      issues.push({
        kind: "trait_inconsistency",
        severity: "warning",
        subject: `${cid}: ${trait}`,
        episodes: sortedEpisodes(missingEps),
        detail: `Trait "${trait}" for character "${cid}" appears in ${count}/${charEpCount} episodes. Missing in: ${missingEps.join(", ")}`,
        suggestion: `Consider whether "${trait}" should be present in all episodes or explicitly explained when absent.`,
      });
    }
  }
  return issues;
}

export function checkMissingCharacters(
  charNodes: GraphNode[],
  allEpisodes: string[],
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  if (allEpisodes.length < 3) return issues;

  const charEpisodes = new Map<string, Set<string>>();
  for (const node of charNodes) {
    const cid = node.properties?.character_id;
    if (!cid) continue;
    const ep = node.episode ?? node.id.split("_")[0];
    if (!charEpisodes.has(cid)) charEpisodes.set(cid, new Set());
    charEpisodes.get(cid)!.add(ep);
  }

  const majority = Math.ceil(allEpisodes.length * 0.6);
  for (const [cid, eps] of charEpisodes) {
    if (eps.size < majority) continue; // minor character
    const missing = allEpisodes.filter((ep) => !eps.has(ep));
    if (missing.length === 0) continue;
    issues.push({
      kind: "missing_character",
      severity: missing.length > 1 ? "warning" : "info",
      subject: cid,
      episodes: sortedEpisodes(missing),
      detail: `Character "${cid}" appears in ${eps.size}/${allEpisodes.length} episodes but is absent from: ${missing.join(", ")}`,
      suggestion: `If "${cid}" is a main character, consider adding them to the missing episodes or explicitly explaining their absence.`,
    });
  }
  return issues;
}

export function checkGagGaps(
  gagNodes: GraphNode[],
  allEpisodes: string[],
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  if (allEpisodes.length < 3) return issues;

  const gagEpisodes = new Map<string, string[]>();
  for (const node of gagNodes) {
    const gagType = node.properties?.gag_type;
    if (!gagType) continue;
    const ep = node.episode ?? node.id.split("_")[0];
    if (!gagEpisodes.has(gagType)) gagEpisodes.set(gagType, []);
    gagEpisodes.get(gagType)!.push(ep);
  }

  for (const [gagType, eps] of gagEpisodes) {
    const uniqueEps = new Set(eps);
    if (uniqueEps.size < 2) continue; // one-off gag
    // Check if there's a gap in the middle episodes
    const epIndices = [...uniqueEps]
      .map((ep) => allEpisodes.indexOf(ep))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
    if (epIndices.length < 2) continue;
    const minIdx = epIndices[0];
    const maxIdx = epIndices[epIndices.length - 1];
    const gapEps: string[] = [];
    for (let i = minIdx + 1; i < maxIdx; i++) {
      if (!epIndices.includes(i)) {
        gapEps.push(allEpisodes[i]);
      }
    }
    if (gapEps.length === 0) continue;
    issues.push({
      kind: "gag_gap",
      severity: "info",
      subject: gagType,
      episodes: sortedEpisodes(gapEps),
      detail: `Running gag "${gagType}" appears in episodes ${[...uniqueEps].join(", ")} but has a gap at: ${gapEps.join(", ")}`,
      suggestion: `Consider whether "${gagType}" should appear in the gap episodes for continuity, or if the gap is intentional.`,
    });
  }
  return issues;
}

export function checkThemeGaps(
  themeNodes: GraphNode[],
  allEpisodes: string[],
): ContinuityIssue[] {
  const issues: ContinuityIssue[] = [];
  if (allEpisodes.length < 3) return issues;

  // Only check series-scope themes
  const seriesThemes = themeNodes.filter(
    (n) => n.properties?.scope === "series",
  );
  const themeEpisodes = new Map<string, Set<string>>();
  for (const node of seriesThemes) {
    const ep = node.episode ?? node.id.split("_")[0];
    const label = node.label;
    if (!themeEpisodes.has(label)) themeEpisodes.set(label, new Set());
    themeEpisodes.get(label)!.add(ep);
  }

  for (const [theme, eps] of themeEpisodes) {
    if (eps.size >= allEpisodes.length) continue;
    const missing = allEpisodes.filter((ep) => !eps.has(ep));
    if (missing.length <= 1) continue;
    issues.push({
      kind: "theme_gap",
      severity: "info",
      subject: theme,
      episodes: sortedEpisodes(missing),
      detail: `Series theme "${theme}" appears in ${eps.size}/${allEpisodes.length} episodes. Missing from: ${missing.join(", ")}`,
      suggestion: `Series-scope themes should ideally span all episodes. Consider weaving "${theme}" into the missing episodes.`,
    });
  }
  return issues;
}

// ── Main ──

export function runContinuityCheck(seriesId: string): ContinuityReport {
  const seriesDir = resolve(PROJ_DIR, seriesId);
  if (!existsSync(seriesDir)) {
    return {
      seriesId,
      episodeCount: 0,
      issues: [],
      checkedAt: new Date().toISOString(),
    };
  }

  // 1. Find all episode directories
  const entries = readdirSync(seriesDir, { withFileTypes: true });
  const episodePattern = new RegExp(`^${seriesId}-(?:ch\\d+-)?ep\\d+$`);
  const episodes = entries
    .filter((e) => e.isDirectory() && episodePattern.test(e.name))
    .sort()
    .map((e) => e.name);

  if (episodes.length === 0) {
    // Try short episode IDs (e.g., "ep1", "ep2") extracted from graph nodes
    const episodeIds = new Set<string>();
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const graphPath = resolve(seriesDir, entry.name, "storygraph_out", "graph.json");
      const graph = readJsonSafe<{ nodes?: GraphNode[] }>(graphPath);
      if (graph?.nodes?.length) {
        episodeIds.add(entry.name);
      }
    }
    if (episodeIds.size === 0) {
      return {
        seriesId,
        episodeCount: 0,
        issues: [],
        checkedAt: new Date().toISOString(),
      };
    }
    episodes.push(...sortedEpisodes([...episodeIds]));
  }

  // Extract short episode IDs for node matching (e.g., "ch1ep1")
  const shortIds = episodes.map((dir) => {
    const match = dir.match(/(ch\d+ep\d+|ep\d+)$/);
    return match ? match[1] : dir;
  });

  // 2. Load merged graph or fall back to per-episode graphs
  let nodes: GraphNode[] = [];
  const mergedPath = resolve(seriesDir, "storygraph_out", "merged-graph.json");
  const merged = readJsonSafe<MergedGraph>(mergedPath);
  if (merged?.nodes?.length) {
    nodes = merged.nodes;
  } else {
    for (const ep of episodes) {
      const graphPath = resolve(
        seriesDir,
        ep,
        "storygraph_out",
        "graph.json",
      );
      const graph = readJsonSafe<{ nodes?: GraphNode[] }>(graphPath);
      if (graph?.nodes) {
        for (const n of graph.nodes) {
          if (!n.episode) {
            const epShort = ep.match(/(ch\d+ep\d+|ep\d+)$/);
            n.episode = epShort ? epShort[1] : ep;
          }
          nodes.push(n);
        }
      }
    }
  }

  if (nodes.length === 0) {
    return {
      seriesId,
      episodeCount: episodes.length,
      issues: [],
      checkedAt: new Date().toISOString(),
    };
  }

  // 3. Derive all episode IDs from nodes (more reliable than dir names)
  const nodeEpisodes = sortedEpisodes(
    nodes
      .filter((n) => n.episode)
      .map((n) => n.episode!),
  );

  // 4. Run checks by node type
  const charNodes = nodes.filter((n) => n.type === "character_instance");
  const traitNodes = nodes.filter((n) => n.type === "character_trait");
  const gagNodes = nodes.filter((n) => n.type === "gag_manifestation");
  const themeNodes = nodes.filter((n) => n.type === "theme");

  const issues: ContinuityIssue[] = [
    ...checkCharacterNames(charNodes, nodeEpisodes),
    ...checkTraitConsistency(traitNodes, nodeEpisodes),
    ...checkMissingCharacters(charNodes, nodeEpisodes),
    ...checkGagGaps(gagNodes, nodeEpisodes),
    ...checkThemeGaps(themeNodes, nodeEpisodes),
  ];

  // Sort by severity (error > warning > info)
  const severityOrder: Record<Severity, number> = {
    error: 0,
    warning: 1,
    info: 2,
  };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    seriesId,
    episodeCount: nodeEpisodes.length,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
