/**
 * Consistency checking via link edges.
 *
 * Reads the merged graph and traverses link edges to detect conflicts:
 * - Character 人設崩壞 (personality drift)
 * - Gag stagnation (no evolution)
 * - Artifact failure mode duplication
 * - Tech term diversity
 *
 * Usage:
 *   bun run src/scripts/graphify-check.ts <series-dir>
 *
 * Example:
 *   bun run src/scripts/graphify-merge.ts ../../bun_remotion_proj/weapon-forger
 *   bun run src/scripts/graphify-check.ts ../../bun_remotion_proj/weapon-forger
 */

import { resolve, basename } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { computeJaccardSimilarity, computePlotArcScore, computeThemeCoherence, computeComedyArcScore, computeGagDiversity } from "./story-algorithms";
import { callAI, parseArgsForAI } from "../ai-client";
import { detectSeries, resolveGenre } from "./series-config";
import type { StoryGenre } from "./series-config";
import type { CommunityReport } from "../types";

// ─── Types ───

type Status = "PASS" | "WARN" | "FAIL";

interface CheckResult {
  check: string;
  status: Status;
  details: string;
  evidence: string[];
}

// ─── Args ───

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-check — Consistency checking via link edges

Usage:
  bun run src/scripts/graphify-check.ts <series-dir> [options]

Options:
  --mode regex|ai|hybrid Enrichment mode (default: hybrid)
                      ai: use LLM for enrichment analysis (requires API key)
                      regex: write input file for manual subagent
                      hybrid: use LLM for enrichment (default, falls back to regex)
  --provider <name>   AI provider (default: zai)
  --model <name>      AI model (default: glm-4.7-flash)

Reads storygraph_out/merged-graph.json and link-edges.json.
Outputs storygraph_out/consistency-report.md.
`);
  process.exit(0);
}

const aiConfig = parseArgsForAI(args);
const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}
const mergedPath = resolve(seriesDir, "storygraph_out", "merged-graph.json");
const linkEdgesPath = resolve(seriesDir, "storygraph_out", "link-edges.json");
const outPath = resolve(seriesDir, "storygraph_out", "consistency-report.md");

if (!existsSync(mergedPath)) {
  console.error(`No merged graph found at ${mergedPath}`);
  console.error(`Run graphify-merge first.`);
  process.exit(1);
}

const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
const linkEdges = existsSync(linkEdgesPath)
  ? JSON.parse(readFileSync(linkEdgesPath, "utf-8"))
  : [];

// Detect genre from series config
const seriesConfig = detectSeries(seriesDir);
const genre: StoryGenre = seriesConfig ? resolveGenre(seriesConfig) : "generic";
console.log(`Genre: ${genre}`);

// Build lookup maps
const nodesMap = new Map<string, any>();
for (const n of merged.nodes) {
  nodesMap.set(n.id, n);
}

const linksBySource = new Map<string, any[]>();
for (const l of merged.links) {
  const arr = linksBySource.get(l.source) ?? [];
  arr.push(l);
  linksBySource.set(l.source, arr);
}

const linkEdgesByRelation = new Map<string, any[]>();
for (const le of linkEdges) {
  const arr = linkEdgesByRelation.get(le.relation) ?? [];
  arr.push(le);
  linkEdgesByRelation.set(le.relation, arr);
}

// ─── Helper: get neighborhood ───

function getNeighborIds(nodeId: string, relation?: string): string[] {
  const neighbors: string[] = [];
  for (const l of merged.links) {
    if (l.source === nodeId && (!relation || l.relation === relation)) {
      neighbors.push(l.target);
    }
    if (l.target === nodeId && (!relation || l.relation === relation)) {
      neighbors.push(l.source);
    }
  }
  return neighbors;
}

function getTraits(charNodeId: string): string[] {
  // Support both regex pipeline (character_speaks_like) and subagent (exhibits) edge relations
  const bySpeaksLike = getNeighborIds(charNodeId, "character_speaks_like");
  const byExhibits = getNeighborIds(charNodeId, "exhibits");
  const allNeighborIds = [...new Set([...bySpeaksLike, ...byExhibits])];
  return allNeighborIds.map(id => nodesMap.get(id)?.label ?? id);
}

function getTechTerms(charNodeId: string): string[] {
  const neighbors = getNeighborIds(charNodeId, "uses_tech_term");
  return neighbors.map(id => nodesMap.get(id)?.label ?? id);
}

// ─── Check 1: Character Consistency ───

interface CharTraitComparison {
  charId: string;
  charLabel: string;
  episodes: { id: string; label: string; traits: string[] }[];
  sharedTraits: string[];
  variantTraits: Map<string, string[]>; // trait → which episodes have it
}

function checkCharacterConsistency(): { results: CheckResult[]; comparisons: CharTraitComparison[] } {
  const results: CheckResult[] = [];
  const comparisons: CharTraitComparison[] = [];

  const sameCharLinks = linkEdgesByRelation.get("same_character") ?? [];
  if (sameCharLinks.length === 0) {
    return {
      results: [{ check: "Character Consistency", status: "PASS", details: "No same_character link edges to check", evidence: [] }],
      comparisons: [],
    };
  }

  // Group by character: find all episode instances
  const charEpisodes = new Map<string, string[]>();
  for (const le of sameCharLinks) {
    // source and target are episode instances
    const srcChar = le.source.split("_char_")[1]?.split("_")[0] ?? "";
    const tgtChar = le.target.split("_char_")[1]?.split("_")[0] ?? "";
    const charId = srcChar || tgtChar;
    if (!charEpisodes.has(charId)) charEpisodes.set(charId, []);

    const set = charEpisodes.get(charId)!;
    if (!set.includes(le.source)) set.push(le.source);
    if (!set.includes(le.target)) set.push(le.target);
  }

  // For each character, check if traits are consistent across episodes
  for (const [charId, instances] of charEpisodes) {
    const traitsPerEpisode = instances.map(id => ({
      id,
      label: nodesMap.get(id)?.label ?? charId,
      traits: getTraits(id),
    }));

    // Find core traits (present in ≥75% of episodes, minimum 2 episodes required)
    // With 2 episodes: threshold=2 → only shared traits are "core"
    // With 3 episodes: threshold=3
    // With 4+ episodes: threshold=ceil(N*0.75)
    const minEpisodes = 2; // Need ≥2 episodes for consistency to be meaningful
    const traitCounts = new Map<string, number>();
    for (const ep of traitsPerEpisode) {
      for (const t of ep.traits) {
        traitCounts.set(t, (traitCounts.get(t) ?? 0) + 1);
      }
    }
    const coreThreshold = Math.ceil(traitsPerEpisode.length * 0.75);
    const coreTraits = traitsPerEpisode.length >= minEpisodes
      ? [...traitCounts.entries()]
          .filter(([, count]) => count >= coreThreshold)
          .map(([trait]) => trait)
      : []; // Skip core trait check if only 1 episode instance

    // Build variant map: trait → which episodes have it
    const variantTraits = new Map<string, string[]>();
    for (const [trait, count] of traitCounts) {
      if (count < coreThreshold) {
        const eps = traitsPerEpisode.filter(ep => ep.traits.includes(trait)).map(ep => ep.id);
        variantTraits.set(trait, eps);
      }
    }

    // Store comparison data
    comparisons.push({
      charId,
      charLabel: (traitsPerEpisode[0]?.label ?? charId).replace(/\s*\(ch\d+ep\d+\)$/, ""),
      episodes: traitsPerEpisode,
      sharedTraits: coreTraits,
      variantTraits,
    });

    // Check each episode for missing core traits
    for (const ep of traitsPerEpisode) {
      const missingCore = coreTraits.filter(ct => !ep.traits.includes(ct));
      if (missingCore.length > 0 && ep.traits.length > 0) {
        results.push({
          check: `Character Consistency: ${charId}`,
          status: "WARN",
          details: `Episode instance ${ep.id} missing core traits: ${missingCore.join(", ")}`,
          evidence: [ep.id, ...missingCore.map(t => `missing: ${t}`)],
        });
      }
    }

    // If all episodes have traits and no warnings, it's a pass
    if (results.filter(r => r.check.includes(charId)).length === 0 && traitsPerEpisode.every(e => e.traits.length > 0)) {
      results.push({
        check: `Character Consistency: ${charId}`,
        status: "PASS",
        details: `${charId} has consistent traits across ${instances.length} episodes (${coreTraits.length} core traits)`,
        evidence: instances,
      });
    }
  }

  return { results, comparisons };
}

// ─── Check 2: Gag Evolution ───

function checkGagEvolution(): CheckResult[] {
  const results: CheckResult[] = [];

  const gagLinks = linkEdgesByRelation.get("gag_evolves") ?? [];
  if (gagLinks.length === 0) {
    return [{ check: "Gag Evolution", status: "PASS", details: "No gag_evolves link edges to check", evidence: [] }];
  }

  // Group by gag type
  const gagChains = new Map<string, string[]>();
  for (const le of gagLinks) {
    // Extract gag type from source ID: ch1ep1_gag_TYPE
    const gagType = le.source.split("_gag_")[1] ?? "unknown";
    if (!gagChains.has(gagType)) gagChains.set(gagType, []);
    const chain = gagChains.get(gagType)!;
    if (!chain.includes(le.source)) chain.push(le.source);
    if (!chain.includes(le.target)) chain.push(le.target);
  }

  for (const [gagType, chain] of gagChains) {
    // Get manifestation text for each node in chain
    const manifestations = chain.map(id => {
      const node = nodesMap.get(id);
      return {
        id,
        text: node?.label?.split("：")[1] ?? node?.label ?? id,
      };
    });

    // Check for stagnation: consecutive identical manifestations
    let stagnationFound = false;
    for (let i = 1; i < manifestations.length; i++) {
      const prev = manifestations[i - 1].text;
      const curr = manifestations[i].text;
      if (prev === curr || similarity(prev, curr) > 0.8) {
        results.push({
          check: `Gag Evolution: ${gagType}`,
          status: "FAIL",
          details: `Stagnation: ${manifestations[i - 1].id} and ${manifestations[i].id} have identical/near-identical manifestations`,
          evidence: [manifestations[i - 1].id, manifestations[i].id],
        });
        stagnationFound = true;
      }
    }

    if (!stagnationFound) {
      results.push({
        check: `Gag Evolution: ${gagType}`,
        status: "PASS",
        details: `${gagType} evolves across ${chain.length} episodes without stagnation`,
        evidence: chain,
      });
    }
  }

  return results;
}

function similarity(a: string, b: string): number {
  // Simple character overlap ratio
  const setA = new Set(a.split(""));
  const setB = new Set(b.split(""));
  const intersection = [...setA].filter(c => setB.has(c)).length;
  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

// ─── Check 3: Tech Term Diversity ───

function checkTechTermDiversity(): CheckResult[] {
  const results: CheckResult[] = [];

  // Group tech term nodes by episode
  const termsByEpisode = new Map<string, Set<string>>();
  for (const n of merged.nodes) {
    if (n.type !== "tech_term") continue;
    const epId = n.id.match(/^ch\d+ep\d+/)?.[0] ?? "unknown";
    if (!termsByEpisode.has(epId)) termsByEpisode.set(epId, new Set());
    termsByEpisode.get(epId)!.add(n.label);
  }

  for (const [epId, terms] of termsByEpisode) {
    if (terms.size < 2) {
      results.push({
        check: "Tech Term Diversity",
        status: "WARN",
        details: `${epId} has only ${terms.size} tech terms (minimum 2 expected)`,
        evidence: [epId, ...terms],
      });
    } else {
      results.push({
        check: "Tech Term Diversity",
        status: "PASS",
        details: `${epId} has ${terms.size} tech terms: ${[...terms].slice(0, 5).join(", ")}`,
        evidence: [epId],
      });
    }
  }

  return results;
}

// ─── Check 4: Character Trait Coverage ───

function checkTraitCoverage(): CheckResult[] {
  const results: CheckResult[] = [];

  // For each character, check that they have at least 1 trait per episode appearance
  const charInstances = new Map<string, string[]>();
  for (const n of merged.nodes) {
    if (n.type !== "character_instance") continue;
    const charId = n.properties?.character_id ?? n.id.split("_char_")[1] ?? "";
    if (!charInstances.has(charId)) charInstances.set(charId, []);
    charInstances.get(charId)!.push(n.id);
  }

  for (const [charId, instances] of charInstances) {
    for (const instanceId of instances) {
      const traits = getTraits(instanceId);
      if (charId !== "narrator" && traits.length === 0) {
        results.push({
          check: "Trait Coverage",
          status: "WARN",
          details: `${instanceId} has no detected character traits`,
          evidence: [instanceId],
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      check: "Trait Coverage",
      status: "PASS",
      details: "All character instances have at least 1 detected trait",
      evidence: [],
    });
  }

  return results;
}

// ─── Check 5: Interaction Density ───

function checkInteractionDensity(): CheckResult[] {
  const results: CheckResult[] = [];

  for (const n of merged.nodes) {
    if (n.type !== "episode_plot") continue;
    const epId = n.episode ?? n.id.match(/^ch\d+ep\d+/)?.[0] ?? "";
    const interactions = getNeighborIds(n.id)
      .filter(id => {
        const link = merged.links.find((l: any) =>
          (l.source === n.id && l.target === id) ||
          (l.target === n.id && l.source === id)
        );
        return false; // We'll count interact edges differently
      });

    // Count character instances in this episode
    const charNodes = merged.nodes.filter((nd: any) =>
      nd.type === "character_instance" && nd.id.startsWith(epId)
    );

    // Count interaction edges between them (regex: interacts_with, subagent: involves/frustrates)
    const interactEdges = merged.links.filter((l: any) =>
      (l.relation === "interacts_with" || l.relation === "involves" || l.relation === "frustrates") &&
      l.source.startsWith(epId) && l.target.startsWith(epId)
    );

    // Each character should interact with at least 1 other
    for (const charNode of charNodes) {
      const charInteractions = interactEdges.filter((l: any) =>
        l.source === charNode.id || l.target === charNode.id
      );
      if (charInteractions.length === 0 && !charNode.id.includes("narrator")) {
        results.push({
          check: "Interaction Density",
          status: "WARN",
          details: `${charNode.id} has no interactions in ${epId}`,
          evidence: [charNode.id],
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      check: "Interaction Density",
      status: "PASS",
      details: "All character instances have at least 1 interaction",
      evidence: [],
    });
  }

  return results;
}

// ─── Check 6: Community Structure Health ───

function checkCommunityStructure(analysis: CommunityReport): CheckResult[] {
  const results: CheckResult[] = [];

  // Global modularity check
  if (analysis.globalModularity < 0) {
    results.push({
      check: "Community Structure",
      status: "FAIL",
      details: `Global modularity is negative (${analysis.globalModularity.toFixed(4)}): partition is worse than random`,
      evidence: [`globalModularity: ${analysis.globalModularity}`],
    });
  } else {
    results.push({
      check: "Community Structure",
      status: "PASS",
      details: `Global modularity: ${analysis.globalModularity.toFixed(4)} (${analysis.totalCommunities} communities)`,
      evidence: [],
    });
  }

  // Per-community checks
  for (const ca of analysis.communities) {
    if (!ca.isConnected) {
      results.push({
        check: "Community Connectivity",
        status: "WARN",
        details: `Community ${ca.id} ("${ca.label}") is not internally connected after refinement`,
        evidence: [`community_${ca.id}`, ...ca.dominantTypes],
      });
    }

    if (ca.cohesion < 0.1 && ca.size > 3) {
      results.push({
        check: "Community Cohesion",
        status: "WARN",
        details: `Community ${ca.id} ("${ca.label}") has very low cohesion (${ca.cohesion.toFixed(2)}): members may not belong together`,
        evidence: [`community_${ca.id}`, `cohesion: ${ca.cohesion}`],
      });
    }

    if (ca.modularityContribution < 0) {
      results.push({
        check: "Community Modularity",
        status: "WARN",
        details: `Community ${ca.id} ("${ca.label}") has negative modularity contribution (${ca.modularityContribution.toFixed(4)}): hurts partition quality`,
        evidence: [`community_${ca.id}`, `modularityContribution: ${ca.modularityContribution}`],
      });
    }
  }

  return results;
}

// ─── Check 7: Isolated Node Detection ───

function checkIsolatedNodes(analysis: CommunityReport): CheckResult[] {
  const results: CheckResult[] = [];

  const isolated = analysis.nodes.filter(n => n.isIsolated);
  if (isolated.length === 0) {
    results.push({
      check: "Isolated Nodes",
      status: "PASS",
      details: "No isolated nodes found (all nodes have intra-community edges)",
      evidence: [],
    });
  } else {
    for (const node of isolated) {
      const label = nodesMap.get(node.nodeId)?.label ?? node.nodeId;
      results.push({
        check: "Isolated Nodes",
        status: "WARN",
        details: `${label} (community ${node.communityId}) has no edges to other community members — assignment may be suboptimal`,
        evidence: [node.nodeId],
      });
    }
  }

  return results;
}

// ─── Check 8: Cross-Community Coherence ───

function checkCrossCommunityCoherence(analysis: CommunityReport): CheckResult[] {
  const results: CheckResult[] = [];

  const totalEdges = merged.links.length;
  const crossEdges = analysis.surprisingConnections.length;

  if (totalEdges === 0) {
    return [{ check: "Cross-Community Coherence", status: "PASS", details: "No edges to analyze", evidence: [] }];
  }

  const crossRatio = crossEdges / totalEdges;

  if (crossRatio > 0.4) {
    results.push({
      check: "Cross-Community Coherence",
      status: "FAIL",
      details: `${crossEdges}/${totalEdges} edges cross community boundaries (${(crossRatio * 100).toFixed(1)}%): partition quality is poor`,
      evidence: [`crossRatio: ${crossRatio.toFixed(3)}`],
    });
  } else if (crossRatio > 0.2) {
    results.push({
      check: "Cross-Community Coherence",
      status: "WARN",
      details: `${crossEdges}/${totalEdges} edges cross community boundaries (${(crossRatio * 100).toFixed(1)}%): some communities may need merging`,
      evidence: [`crossRatio: ${crossRatio.toFixed(3)}`],
    });
  } else {
    results.push({
      check: "Cross-Community Coherence",
      status: "PASS",
      details: `${crossEdges}/${totalEdges} edges cross community boundaries (${(crossRatio * 100).toFixed(1)}%): communities are well-separated`,
      evidence: [],
    });
  }

  // Report top surprising connections as informational
  const topSurprising = analysis.surprisingConnections.slice(0, 5);
  for (const sc of topSurprising) {
    results.push({
      check: "Surprising Connection",
      status: "PASS",
      details: `${sc.sourceLabel} (comm ${sc.sourceCommunity}) → ${sc.targetLabel} (comm ${sc.targetCommunity}) [${sc.relation}]`,
      evidence: [sc.source, sc.target],
    });
  }

  return results;
}

// ─── Check 9: Duplicate Content ───

interface DupContentPair {
  epA: string;
  epB: string;
  similarity: number;
}

function checkDuplicateContent(): { results: CheckResult[]; pairs: DupContentPair[] } {
  const results: CheckResult[] = [];
  const episodes = [...new Set((merged.nodes as any[]).map((n: any) => n.episode).filter(Boolean))].sort();

  if (episodes.length < 2) {
    return {
      results: [{ check: "Duplicate Content", status: "PASS", details: "Only 1 episode — duplicate check not applicable", evidence: [] }],
      pairs: [],
    };
  }

  const nodeIdSet = new Set((merged.nodes as any[]).map((n: any) => n.id));
  const episodeGraphs = episodes.map(ep => ({
    episode_id: ep,
    nodes: (merged.nodes as any[]).filter((n: any) => n.episode === ep),
    links: (merged.links as any[]).filter((l: any) => {
      const srcNode = (merged.nodes as any[]).find((n: any) => n.id === l.source);
      const tgtNode = (merged.nodes as any[]).find((n: any) => n.id === l.target);
      return nodeIdSet.has(l.source) && nodeIdSet.has(l.target) &&
        (srcNode ? srcNode.episode === ep : false) &&
        (tgtNode ? tgtNode.episode === ep : false);
    }),
  }));

  const similarityMatrix = computeJaccardSimilarity(episodeGraphs);
  const pairs: DupContentPair[] = [];

  for (let i = 0; i < episodes.length; i++) {
    for (let j = i + 1; j < episodes.length; j++) {
      const sim = similarityMatrix[episodes[i]]?.[episodes[j]] ?? 0;
      pairs.push({ epA: episodes[i], epB: episodes[j], similarity: sim });

      if (sim > 0.7) {
        results.push({
          check: "Duplicate Content",
          status: "FAIL",
          details: `${episodes[i]} ↔ ${episodes[j]}: Jaccard similarity ${sim.toFixed(3)} > 0.7 — structurally near-duplicate`,
          evidence: [episodes[i], episodes[j], `jaccard: ${sim.toFixed(3)}`],
        });
      } else if (sim > 0.5) {
        results.push({
          check: "Duplicate Content",
          status: "WARN",
          details: `${episodes[i]} ↔ ${episodes[j]}: Jaccard similarity ${sim.toFixed(3)} > 0.5 — significant structural overlap`,
          evidence: [episodes[i], episodes[j], `jaccard: ${sim.toFixed(3)}`],
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({
      check: "Duplicate Content",
      status: "PASS",
      details: `No duplicate content detected across ${episodes.length} episodes (all Jaccard ≤ 0.5)`,
      evidence: [],
    });
  }

  return { results, pairs };
}

// ─── Check 10: Plot Arc ───

interface PlotArcBeat {
  scene: string;
  beat_type: string;
  tension: number;
}

function checkPlotArc(): { results: CheckResult[]; beats: PlotArcBeat[]; arcScore: number; diagnosis: string } {
  // Look for plot_beat nodes in the merged graph
  const plotBeats = (merged.nodes as any[]).filter((n: any) => n.type === "plot_beat");

  if (plotBeats.length === 0) {
    return {
      results: [{ check: "Plot Arc", status: "PASS", details: "No plot_beat nodes found — plot arc analysis not yet run", evidence: [] }],
      beats: [],
      arcScore: -1,
      diagnosis: "not_analyzed",
    };
  }

  // Extract and sort beats by scene order (assuming IDs encode order)
  const beats: PlotArcBeat[] = plotBeats
    .map((n: any) => ({
      scene: n.properties?.scene ?? n.id,
      beat_type: n.properties?.beat_type ?? n.label ?? "unknown",
      tension: parseFloat(n.properties?.tension ?? "0.5"),
    }))
    .sort((a, b) => a.scene.localeCompare(b.scene));

  const arcResult = computePlotArcScore(beats);

  const results: CheckResult[] = [];

  switch (arcResult.diagnosis) {
    case "no_climax":
      results.push({
        check: "Plot Arc",
        status: "FAIL",
        details: "No climax beat detected — the episode has no dramatic peak",
        evidence: beats.map(b => `${b.scene}:${b.beat_type}`),
      });
      break;
    case "inverted":
      results.push({
        check: "Plot Arc",
        status: "WARN",
        details: "Inverted arc — climax tension is lower than rising action tension",
        evidence: beats.map(b => `${b.scene}:${b.beat_type}(${b.tension.toFixed(2)})`),
      });
      break;
    case "flat_middle":
      results.push({
        check: "Plot Arc",
        status: "WARN",
        details: "Flat middle — tension variance between inciting incident and climax is too low",
        evidence: beats.map(b => `${b.scene}:${b.beat_type}(${b.tension.toFixed(2)})`),
      });
      break;
    case "no_inciting_incident":
      results.push({
        check: "Plot Arc",
        status: "WARN",
        details: "No inciting incident detected — the episode may lack a clear opening hook",
        evidence: beats.map(b => `${b.scene}:${b.beat_type}`),
      });
      break;
    case "complete":
      results.push({
        check: "Plot Arc",
        status: "PASS",
        details: `Plot arc score: ${arcResult.score}/100 — structure is complete with proper dramatic curve`,
        evidence: beats.map(b => `${b.scene}:${b.beat_type}(${b.tension.toFixed(2)})`),
      });
      break;
  }

  return { results, beats, arcScore: arcResult.score, diagnosis: arcResult.diagnosis };
}

// ─── Check 10b: Comedy Arc (Phase 30-B1, galgame_meme only) ───

function checkComedyArc(): { results: CheckResult[]; beats: Array<{ scene: string; beat_type: string; tension: number }>; arcScore: number; diagnosis: string } {
  const comedyBeatTypes = ["setup", "buildup", "escalation", "punchline", "callback"];
  const plotBeats = (merged.nodes as any[]).filter((n: any) =>
    n.type === "plot_beat" && comedyBeatTypes.includes(n.properties?.beat_type ?? n.label ?? "")
  );

  if (plotBeats.length === 0) {
    return {
      results: [{ check: "Comedy Arc", status: "PASS", details: "No comedy beat nodes found — comedy arc analysis not yet run", evidence: [] }],
      beats: [],
      arcScore: -1,
      diagnosis: "not_analyzed",
    };
  }

  const beats = plotBeats
    .map((n: any) => ({
      scene: n.properties?.scene ?? n.id,
      beat_type: n.properties?.beat_type ?? n.label ?? "unknown",
      tension: parseFloat(n.properties?.tension ?? "0.5"),
    }))
    .sort((a: any, b: any) => a.scene.localeCompare(b.scene));

  const arcResult = computeComedyArcScore(beats);
  const results: CheckResult[] = [];

  const diagnosisMessages: Record<string, { status: Status; details: string }> = {
    no_punchline: { status: "FAIL", details: "No punchline beat detected — the episode has no comedic payoff" },
    all_setup: { status: "WARN", details: "All beats are setups — the episode builds but never delivers" },
    orphan_callback: { status: "WARN", details: "Callback without prior setup — reference to a joke that was not established" },
    stagnant: { status: "WARN", details: "Comedy beats have flat tension — all gags land with the same energy" },
    complete: { status: "PASS", details: `Comedy arc score: ${arcResult.score}/100 — joke cycle structure is complete` },
  };

  const msg = diagnosisMessages[arcResult.diagnosis] ?? {
    status: "PASS" as Status,
    details: `Comedy arc score: ${arcResult.score}/100`,
  };

  results.push({
    check: "Comedy Arc",
    status: msg.status,
    details: msg.details,
    evidence: beats.map(b => `${b.scene}:${b.beat_type}`),
  });

  return { results, beats, arcScore: arcResult.score, diagnosis: arcResult.diagnosis };
}

// ─── Check 10c: Gag Diversity (Phase 30-B2, galgame_meme only) ───

function checkGagDiversityCheck(): CheckResult[] {
  const results: CheckResult[] = [];
  const diversityResult = computeGagDiversity(merged.nodes);

  if (diversityResult.totalManifestations === 0) {
    return [{ check: "Gag Diversity", status: "PASS", details: "No gag manifestations found — diversity check not applicable", evidence: [] }];
  }

  if (diversityResult.diversity < 0.3) {
    results.push({
      check: "Gag Diversity",
      status: "WARN",
      details: `Low gag diversity (${(diversityResult.diversity * 100).toFixed(0)}%): ${diversityResult.gagTypes.length} unique types across ${diversityResult.totalManifestations} manifestations — gags may be repetitive`,
      evidence: diversityResult.gagTypes,
    });
  } else {
    results.push({
      check: "Gag Diversity",
      status: "PASS",
      details: `Gag diversity: ${(diversityResult.diversity * 100).toFixed(0)}% (${diversityResult.gagTypes.length} types / ${diversityResult.totalManifestations} manifestations)`,
      evidence: diversityResult.gagTypes,
    });
  }

  for (const [epId, data] of Object.entries(diversityResult.perEpisode)) {
    if (data.count >= 3 && data.types.length === 1) {
      results.push({
        check: `Gag Stagnation: ${epId}`,
        status: "WARN",
        details: `${epId} has ${data.count} gag manifestations but only 1 unique type ("${data.types[0]}") — repetitive`,
        evidence: [epId],
      });
    }
  }

  return results;
}

// ─── Check 11: Foreshadowing ───

interface ForeshadowRecord {
  id: string;
  planted_episode: string;
  paid_off: boolean;
  description: string;
  payoff_episode?: string;
}

function checkForeshadowing(): { results: CheckResult[]; records: ForeshadowRecord[] } {
  const results: CheckResult[] = [];
  const records: ForeshadowRecord[] = [];

  // Look for foreshadow nodes in the merged graph
  const foreshadowNodes = (merged.nodes as any[]).filter((n: any) => n.type === "foreshadow");

  if (foreshadowNodes.length === 0) {
    return {
      results: [{ check: "Foreshadowing", status: "PASS", details: "No foreshadowing nodes found — foreshadow tracking not yet run", evidence: [] }],
      records: [],
    };
  }

  // Also check link_edges for foreshadows relation
  const foreshadowLinks = linkEdges.filter((le: any) => le.relation === "foreshadows");

  // Extract episode ordering from episode_plot nodes
  const episodeOrder = (merged.nodes as any[])
    .filter((n: any) => n.type === "episode_plot")
    .map((n: any) => n.episode ?? n.id.match(/^ch\d+ep\d+/)?.[0] ?? "")
    .filter(Boolean)
    .sort();

  // Build foreshadow records from nodes
  for (const n of foreshadowNodes) {
    const props = n.properties ?? {};
    const paidOff = props.paid_off === "true" || props.paid_off === true;
    const payoffEp = props.payoff_episode ?? undefined;

    records.push({
      id: n.id,
      planted_episode: props.planted_episode ?? n.id.split("_foreshadow")[0] ?? "",
      paid_off: paidOff,
      description: n.label ?? props.description ?? "",
      payoff_episode: payoffEp,
    });
  }

  // Also extract from link edges (foreshadows relation)
  for (const le of foreshadowLinks) {
    const srcNode = nodesMap.get(le.source);
    const tgtNode = nodesMap.get(le.target);
    if (!srcNode || !tgtNode) continue;

    // Avoid duplicates
    if (records.some(r => r.id === le.source)) continue;

    records.push({
      id: le.source,
      planted_episode: srcNode.properties?.planted_episode ?? le.source.split("_foreshadow")[0] ?? "",
      paid_off: true,
      description: srcNode.label ?? "",
      payoff_episode: tgtNode.properties?.planted_episode ?? tgtNode.id.split("_foreshadow")[0] ?? "",
    });
  }

  // Check for unpaid foreshadowing overdue by 2+ episodes
  const unpaid = records.filter(r => !r.paid_off);
  for (const f of unpaid) {
    const plantedIdx = episodeOrder.indexOf(f.planted_episode);
    if (plantedIdx >= 0 && episodeOrder.length - plantedIdx > 2) {
      results.push({
        check: "Foreshadowing",
        status: "WARN",
        details: `Unpaid foreshadow "${f.description}" planted in ${f.planted_episode} — ${episodeOrder.length - plantedIdx} episodes since planting (threshold: 2)`,
        evidence: [f.id, f.planted_episode],
      });
    }
  }

  // Count stats
  const plantedCount = records.length;
  const paidOffCount = records.filter(r => r.paid_off).length;
  const overdueCount = unpaid.filter(f => {
    const idx = episodeOrder.indexOf(f.planted_episode);
    return idx >= 0 && episodeOrder.length - idx > 2;
  }).length;

  if (results.length === 0) {
    results.push({
      check: "Foreshadowing",
      status: "PASS",
      details: `${plantedCount} foreshadowing tracked: ${paidOffCount} paid off, ${unpaid.length} pending${overdueCount > 0 ? `, ${overdueCount} overdue` : ""}`,
      evidence: records.map(r => r.id),
    });
  }

  return { results, records };
}

// ─── Check 12: Character Growth ───

interface CharacterGrowthInfo {
  charId: string;
  charLabel: string;
  episodes: number;
  classification: string;
  score: number;
  traitChanges: Array<{ trait: string; direction: string; from: string; to: string }>;
}

function checkCharacterGrowth(): { results: CheckResult[]; characters: CharacterGrowthInfo[] } {
  const results: CheckResult[] = [];
  const characters: CharacterGrowthInfo[] = [];

  // Group character instances by character_id using same_character link edges
  const sameCharLinks = linkEdgesByRelation.get("same_character") ?? [];
  if (sameCharLinks.length === 0) {
    return {
      results: [{ check: "Character Growth", status: "PASS", details: "No same_character link edges — growth analysis not applicable", evidence: [] }],
      characters: [],
    };
  }

  // Build charId → instances map
  const charInstances = new Map<string, string[]>();
  for (const le of sameCharLinks) {
    const srcChar = le.source.split("_char_")[1]?.split("_")[0] ?? "";
    const tgtChar = le.target.split("_char_")[1]?.split("_")[0] ?? "";
    const charId = srcChar || tgtChar;
    if (!charInstances.has(charId)) charInstances.set(charId, []);
    const set = charInstances.get(charId)!;
    if (!set.includes(le.source)) set.push(le.source);
    if (!set.includes(le.target)) set.push(le.target);
  }

  // Also add characters without link edges but with character_id property
  for (const n of merged.nodes) {
    if (n.type !== "character_instance") continue;
    const cid = n.properties?.character_id ?? "";
    if (!cid || charInstances.has(cid)) continue;
    charInstances.set(cid, [n.id]);
  }

  for (const [charId, instances] of charInstances) {
    if (instances.length < 2) continue;

    // Sort by episode
    instances.sort((a, b) => a.localeCompare(b));

    // Extract traits per instance
    const perEpisode: Array<{ episode: string; traits: string[] }> = instances.map(id => {
      const ep = id.match(/^ch\d+ep\d+/)?.[0] ?? id;
      return { episode: ep, traits: getTraits(id) };
    });

    if (perEpisode.every(ep => ep.traits.length === 0)) continue;

    // Compute trait changes between consecutive episodes
    const traitChanges: Array<{ trait: string; direction: string; from: string; to: string }> = [];
    const traitHistory: Map<string, Array<{ episode: string; present: boolean }>> = new Map();

    for (let i = 0; i < perEpisode.length; i++) {
      const { episode, traits } = perEpisode[i];
      const traitSet = new Set(traits);

      for (const trait of traitSet) {
        if (!traitHistory.has(trait)) traitHistory.set(trait, []);
        traitHistory.get(trait)!.push({ episode, present: true });
      }

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

    for (let i = 1; i < perEpisode.length; i++) {
      const prev = new Set(perEpisode[i - 1].traits);
      const curr = new Set(perEpisode[i].traits);
      const gained = [...curr].filter(t => !prev.has(t));
      const lost = [...prev].filter(t => !curr.has(t));
      const paired = Math.min(gained.length, lost.length);

      for (let j = 0; j < paired; j++) {
        traitChanges.push({ trait: `${lost[j]} → ${gained[j]}`, direction: "neutral_shift", from: perEpisode[i - 1].episode, to: perEpisode[i].episode });
      }
      for (let j = paired; j < gained.length; j++) {
        const history = traitHistory.get(gained[j]) ?? [];
        const wasPresentBefore = history.some(h => h.present && h.episode !== perEpisode[i].episode && h.episode !== perEpisode[i - 1].episode);
        traitChanges.push({ trait: gained[j], direction: wasPresentBefore ? "reintroduction" : "positive_growth", from: perEpisode[i - 1].episode, to: perEpisode[i].episode });
      }
      for (let j = paired; j < lost.length; j++) {
        traitChanges.push({ trait: lost[j], direction: "negative_decline", from: perEpisode[i - 1].episode, to: perEpisode[i].episode });
      }
    }

    if (traitChanges.length === 0) continue;

    const positiveCount = traitChanges.filter(c => c.direction === "positive_growth" || c.direction === "reintroduction").length;
    const negativeCount = traitChanges.filter(c => c.direction === "negative_decline").length;
    const total = traitChanges.length;
    const trajectory = (positiveCount - negativeCount) / total;

    let classification: string;
    if (trajectory > 0.3) classification = "positive";
    else if (trajectory < -0.3) classification = "negative";
    else if (Math.abs(trajectory) < 0.1) classification = "flat";
    else classification = "cyclical";

    const trajectoryScore = Math.abs(trajectory) * 50;
    const diversityScore = Math.min(1, new Set(traitChanges.map(c => c.trait)).size / total) * 50;
    const score = Math.round(trajectoryScore + diversityScore);

    const charLabel = (nodesMap.get(instances[0])?.label ?? charId).replace(/\s*\(ch\d+ep\d+\)$/, "");

    characters.push({ charId, charLabel, episodes: instances.length, classification, score, traitChanges });

    // WARN: main character has flat arc across 3+ episodes
    if (classification === "flat" && instances.length >= 3) {
      results.push({
        check: `Character Growth: ${charId}`,
        status: "WARN",
        details: `${charLabel} has a flat arc across ${instances.length} episodes (score: ${score}/100) — character may be stagnant`,
        evidence: instances,
      });
    }
  }

  if (results.length === 0 && characters.length > 0) {
    results.push({
      check: "Character Growth",
      status: "PASS",
      details: `${characters.length} characters analyzed — arc classifications: ${characters.map(c => `${c.charLabel}=${c.classification}`).join(", ")}`,
      evidence: characters.map(c => c.charId),
    });
  } else if (characters.length === 0) {
    results.push({
      check: "Character Growth",
      status: "PASS",
      details: "No multi-episode characters with traits to analyze",
      evidence: [],
    });
  }

  return { results, characters };
}

// ─── Check 13: Pacing Curve ───

interface PacingSceneInfo {
  scene: string;
  episode: string;
  dialogLines: number;
  charCount: number;
  effectCount: number;
  tension: number;
}

function checkPacing(): { results: CheckResult[]; curves: Map<string, PacingSceneInfo[]> } {
  const results: CheckResult[] = [];
  const curves = new Map<string, PacingSceneInfo[]>();

  // Group scene nodes by episode
  const sceneByEpisode = new Map<string, PacingSceneInfo[]>();
  for (const n of merged.nodes) {
    if (n.type !== "scene") continue;
    const epId = n.id.match(/^ch\d+ep\d+/)?.[0] ?? "";
    if (!epId) continue;
    const dialogLines = parseInt(n.properties?.dialog_line_count ?? "0", 10);
    const charCount = parseInt(n.properties?.character_count ?? "0", 10);
    const effectCount = parseInt(n.properties?.effect_count ?? "0", 10);
    if (!sceneByEpisode.has(epId)) sceneByEpisode.set(epId, []);
    sceneByEpisode.get(epId)!.push({
      scene: n.id,
      episode: epId,
      dialogLines,
      charCount,
      effectCount,
      tension: 0, // computed below
    });
  }

  if (sceneByEpisode.size === 0) {
    return {
      results: [{ check: "Pacing", status: "PASS", details: "No scene nodes found — pacing analysis not applicable", evidence: [] }],
      curves,
    };
  }

  for (const [epId, scenes] of sceneByEpisode) {
    if (scenes.length < 2) continue;

    // Weighted tension: 0.4*dialog + 0.3*character + 0.3*effect
    const maxDialog = Math.max(...scenes.map(s => s.dialogLines), 1);
    const maxChars = Math.max(...scenes.map(s => s.charCount), 1);
    const maxEffects = Math.max(...scenes.map(s => s.effectCount), 1);
    for (const s of scenes) {
      const dialogD = s.dialogLines / maxDialog;
      const charD = s.charCount / maxChars;
      const effectD = s.effectCount / maxEffects;
      s.tension = 0.4 * dialogD + 0.3 * charD + 0.3 * effectD;
    }

    curves.set(epId, scenes);

    const tensions = scenes.map(s => s.tension);
    const m = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    const variance = tensions.reduce((s, t) => s + Math.pow(t - m, 2), 0) / tensions.length;

    // Check flat pacing
    if (variance < 0.01) {
      results.push({
        check: `Pacing: ${epId}`,
        status: "WARN",
        details: `Flat pacing — all scenes have similar dialog density (variance: ${variance.toFixed(4)})`,
        evidence: scenes.map(s => `${s.scene}=${s.dialogLines} lines`),
      });
      continue;
    }

    // Check inverted pacing: OutroScene tension > avg ContentScene tension
    const outroScene = scenes.find(s => s.scene.includes("OutroScene"));
    const contentScenes = scenes.filter(s => s.scene.includes("ContentScene"));
    if (outroScene && contentScenes.length > 0) {
      const avgContent = contentScenes.reduce((s, c) => s + c.tension, 0) / contentScenes.length;
      if (outroScene.tension > avgContent && avgContent > 0) {
        results.push({
          check: `Pacing: ${epId}`,
          status: "WARN",
          details: `Inverted pacing — OutroScene tension (${outroScene.tension.toFixed(2)}) > avg ContentScene (${avgContent.toFixed(2)})`,
          evidence: scenes.map(s => `${s.scene}: ${s.tension.toFixed(2)}`),
        });
        continue;
      }
    }

    results.push({
      check: `Pacing: ${epId}`,
      status: "PASS",
      details: `Dynamic pacing (variance: ${variance.toFixed(4)}, ${scenes.length} scenes)`,
      evidence: scenes.map(s => `${s.scene}: ${s.tension.toFixed(2)}`),
    });
  }

  if (results.length === 0) {
    results.push({
      check: "Pacing",
      status: "PASS",
      details: "No episodes with enough scenes for pacing analysis",
      evidence: [],
    });
  }

  return { results, curves };
}

// ─── Phase 24-F: Thematic Coherence ───

function checkThematicCoherence(): { results: CheckResult[]; coherence: number; themeTable: string[] } {
  const themeResult = computeThemeCoherence(merged.nodes);
  const results: CheckResult[] = [];
  const themeTable: string[] = [];

  if (themeResult.uniqueThemes.size === 0) {
    return {
      results: [{ check: "Thematic Coherence", status: "PASS", details: "No theme nodes found — thematic coherence not applicable (add --mode hybrid for AI theme extraction)", evidence: [] }],
      coherence: 1,
      themeTable: [],
    };
  }

  // Build theme table for report
  themeTable.push("| 主題關鍵字 | 出現集數 | 狀態 |");
  themeTable.push("|-----------|---------|------|");
  for (const [keyword, episodes] of themeResult.uniqueThemes) {
    const isShared = episodes.length >= 2;
    const status = isShared ? "✅ 跨集共享" : "📝 單集主題";
    themeTable.push(`| ${keyword} | ${episodes.join(", ")} | ${status} |`);
  }

  if (themeResult.coherence < 0.3) {
    results.push({
      check: "Thematic Coherence",
      status: "WARN",
      details: `主題連貫性偏低 (${(themeResult.coherence * 100).toFixed(0)}%) — ${themeResult.sharedThemes.length}/${themeResult.uniqueThemes.size} 主題跨集共享`,
      evidence: themeResult.sharedThemes.length > 0 ? themeResult.sharedThemes : ["No shared themes across episodes"],
    });
  } else {
    results.push({
      check: "Thematic Coherence",
      status: "PASS",
      details: `主題連貫性良好 (${(themeResult.coherence * 100).toFixed(0)}%) — ${themeResult.sharedThemes.length}/${themeResult.uniqueThemes.size} 主題跨集共享`,
      evidence: themeResult.sharedThemes,
    });
  }

  return { results, coherence: themeResult.coherence, themeTable };
}

// ─── Run all checks ───

console.log("Running consistency checks...\n");

// Load community analysis (if available from Leiden-inspired clustering)
const communityAnalysis: CommunityReport | null = merged.community_analysis ?? null;

const charConsistency = checkCharacterConsistency();
const dupContent = checkDuplicateContent();

// Genre-aware arc checks
let arcChecks: CheckResult[] = [];
let arcReportData: { beats: any[]; arcScore: number; diagnosis: string } | null = null;

if (genre === "galgame_meme") {
  const comedyArc = checkComedyArc();
  arcChecks = comedyArc.results;
  arcReportData = comedyArc;
} else {
  // xianxia_comedy, novel_system, generic all use Freytag pyramid
  const plotArc = checkPlotArc();
  arcChecks = plotArc.results;
  arcReportData = plotArc;
}

// Foreshadowing only for novel/xianxia genres
const foreshadowing = (genre === "xianxia_comedy" || genre === "novel_system")
  ? checkForeshadowing()
  : { results: [{ check: "Foreshadowing", status: "PASS" as Status, details: "Foreshadowing check skipped for comedy genre", evidence: [] as string[] }], records: [] as any[] };

// Gag diversity only for comedy genre
const gagDiversityChecks = genre === "galgame_meme"
  ? checkGagDiversityCheck()
  : [];

// Tech term diversity only for genres that use tech terms
const techDiversityChecks = (genre === "xianxia_comedy" || genre === "novel_system")
  ? checkTechTermDiversity()
  : [];

const charGrowth = checkCharacterGrowth();
const pacing = checkPacing();
const themeCoherence = checkThematicCoherence();
const allChecks: CheckResult[] = [
  ...charConsistency.results,
  ...checkGagEvolution(),
  ...techDiversityChecks,
  ...checkTraitCoverage(),
  ...checkInteractionDensity(),
  ...dupContent.results,
  ...arcChecks,
  ...foreshadowing.results,
  ...gagDiversityChecks,
  ...charGrowth.results,
  ...pacing.results,
  ...themeCoherence.results,
  ...(communityAnalysis ? checkCommunityStructure(communityAnalysis) : []),
  ...(communityAnalysis ? checkIsolatedNodes(communityAnalysis) : []),
  ...(communityAnalysis ? checkCrossCommunityCoherence(communityAnalysis) : []),
];

// ─── Generate report ───

const report: string[] = [];
report.push(`# Consistency Report`);
report.push(``);
report.push(`Generated: ${new Date().toISOString()}`);
report.push(`Generator: storygraph_check v0.13.0`);
report.push(`Mode: ${aiConfig.mode}${aiConfig.mode !== "regex" ? ` (${aiConfig.provider}/${aiConfig.model})` : ""}`);
report.push(`Series: ${seriesDir}`);
report.push(`Episodes: ${merged.episode_count ?? "unknown"}`);
report.push(`Link edges: ${linkEdges.length}`);
if (merged.manifest) {
  report.push(`Source manifest: ${JSON.stringify(merged.manifest)}`);
}
report.push(``);

const passCount = allChecks.filter(c => c.status === "PASS").length;
const warnCount = allChecks.filter(c => c.status === "WARN").length;
const failCount = allChecks.filter(c => c.status === "FAIL").length;

report.push(`## Summary`);
report.push(``);
report.push(`- **PASS:** ${passCount}`);
report.push(`- **WARN:** ${warnCount}`);
report.push(`- **FAIL:** ${failCount}`);

// ─── Aggregate Quality Score ───

let aggregateScore = 100;
for (const c of allChecks) {
  if (c.status === "PASS") aggregateScore += 5;
  else if (c.status === "WARN") aggregateScore -= 5;
  else aggregateScore -= 15;
}
aggregateScore = Math.max(0, Math.min(100, aggregateScore));
const gateDecision: "PASS" | "WARN" | "FAIL" = aggregateScore >= 70 ? "PASS" : aggregateScore >= 40 ? "WARN" : "FAIL";

report.push(`- **品質評分：** ${aggregateScore}/100 (${gateDecision})`);
report.push(``);

console.log(`Results: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL — Score: ${aggregateScore}/100 (${gateDecision})`);

// Group by check type
const checkGroups = new Map<string, CheckResult[]>();
for (const c of allChecks) {
  const group = c.check.split(":")[0];
  if (!checkGroups.has(group)) checkGroups.set(group, []);
  checkGroups.get(group)!.push(c);
}

for (const [group, checks] of checkGroups) {
  report.push(`## ${group}`);
  report.push(``);

  for (const check of checks) {
    const icon = check.status === "PASS" ? "✅" : check.status === "WARN" ? "⚠️" : "❌";
    report.push(`### ${icon} ${check.check} — ${check.status}`);
    report.push(``);
    report.push(check.details);
    report.push(``);
    if (check.evidence.length > 0) {
      report.push(`Evidence: \`${check.evidence.join("`, `")}\``);
      report.push(``);
    }
  }
}

// ─── Trait Comparison Table ───

if (charConsistency.comparisons.length > 0) {
  report.push(`## Character Trait Comparison`);
  report.push(``);

  for (const comp of charConsistency.comparisons) {
    // Skip characters with no detected traits (e.g., narrator)
    const hasAnyTraits = comp.episodes.some(ep => ep.traits.length > 0);
    if (!hasAnyTraits) continue;

    report.push(`### ${comp.charLabel} (${comp.charId})`);
    report.push(``);

    // Build header row from episode IDs
    const epIds = comp.episodes.map(ep => ep.id.replace(/_char_.*$/, ""));
    report.push(`| Trait | ${epIds.join(" | ")} | Status |`);
    report.push(`| ${"--- | ".repeat(epIds.length + 1)}--- |`);

    // Collect all unique traits
    const allTraits = new Set<string>();
    for (const ep of comp.episodes) {
      for (const t of ep.traits) allTraits.add(t);
    }

    for (const trait of [...allTraits].sort()) {
      const cols = comp.episodes.map(ep => ep.traits.includes(trait) ? "✓" : "—");
      const isShared = comp.sharedTraits.includes(trait);
      const status = isShared ? "**stable**" : "variant";
      report.push(`| ${trait} | ${cols.join(" | ")} | ${status} |`);
    }

    report.push(``);
    report.push(`- **Shared traits (${comp.sharedTraits.length}):** ${comp.sharedTraits.length > 0 ? comp.sharedTraits.join(", ") : "none (all traits are episode-specific)"}`);
    if (comp.variantTraits.size > 0) {
      const variants = [...comp.variantTraits.entries()].map(([t, eps]) => `${t} (${eps.join(", ")})`);
      report.push(`- **Variant traits (${comp.variantTraits.size}):** ${variants.join("; ")}`);
    }
    report.push(``);
  }
}

// ─── Duplicate Content Table ───

if (dupContent.pairs.length > 0) {
  report.push(`## Duplicate Content Analysis`);
  report.push(``);
  report.push(`| Episode A | Episode B | Jaccard | Status |`);
  report.push(`|-----------|-----------|---------|--------|`);

  for (const pair of dupContent.pairs) {
    const status = pair.similarity > 0.7 ? "FAIL" : pair.similarity > 0.5 ? "WARN" : "OK";
    const icon = status === "FAIL" ? "❌" : status === "WARN" ? "⚠️" : "✅";
    report.push(`| ${pair.epA} | ${pair.epB} | ${pair.similarity.toFixed(3)} | ${icon} ${status} |`);
  }

  report.push(``);
}

// ─── Arc Table (genre-aware) ───

if (arcReportData && arcReportData.beats.length > 0) {
  if (genre === "galgame_meme") {
    report.push(`## 喜劇弧分析 (Comedy Arc)`);
    report.push(``);
    report.push(`| Scene | Beat Type | Tension |`);
    report.push(`|-------|-----------|---------|`);

    for (const beat of arcReportData.beats) {
      report.push(`| ${beat.scene} | ${beat.beat_type} | ${beat.tension.toFixed(2)} |`);
    }

    const diagnosisLabel: Record<string, string> = {
      complete: "笑話循環完整",
      no_punchline: "缺乏笑點",
      all_setup: "全是鋪陳",
      stagnant: "節奏平淡",
      orphan_callback: "懸空 callback",
      not_analyzed: "未分析",
    };
    report.push(``);
    report.push(`- **弧線評分：** ${arcReportData.arcScore}/100`);
    report.push(`- **判定：** ${diagnosisLabel[arcReportData.diagnosis] ?? arcReportData.diagnosis}`);
    report.push(``);
  } else {
    report.push(`## Plot Arc Analysis`);
    report.push(``);
    report.push(`| Scene | Beat Type | Tension |`);
    report.push(`|-------|-----------|---------|`);

    for (const beat of arcReportData.beats) {
      report.push(`| ${beat.scene} | ${beat.beat_type} | ${beat.tension.toFixed(2)} |`);
    }

    const diagnosisLabel: Record<string, string> = {
      complete: "結構完整",
      no_climax: "缺乏高潮",
      flat_middle: "中段平淡",
      inverted: "高潮過早",
      no_inciting_incident: "缺乏開場引子",
      not_analyzed: "未分析",
    };
    report.push(``);
    report.push(`- **弧線評分：** ${arcReportData.arcScore}/100`);
    report.push(`- **判定：** ${diagnosisLabel[arcReportData.diagnosis] ?? arcReportData.diagnosis}`);
    report.push(``);
  }
}

// ─── Foreshadowing Table ───

if (foreshadowing.records.length > 0) {
  report.push(`## Foreshadowing Tracking`);
  report.push(``);
  report.push(`| ID | Planted | Status | Description | Payoff |`);
  report.push(`|----|---------|--------|-------------|--------|`);

  for (const rec of foreshadowing.records) {
    const status = rec.paid_off ? "✅ Paid" : "⏳ Pending";
    const payoff = rec.payoff_episode ?? "—";
    report.push(`| ${rec.id} | ${rec.planted_episode} | ${status} | ${rec.description} | ${payoff} |`);
  }

  const planted = foreshadowing.records.length;
  const paid = foreshadowing.records.filter(r => r.paid_off).length;
  const pending = planted - paid;
  report.push(``);
  report.push(`- **Planted:** ${planted}, **Paid off:** ${paid}, **Pending:** ${pending}`);
  report.push(``);
}

// ─── Character Growth Table ───

if (charGrowth.characters.length > 0) {
  report.push(`## Character Growth Trajectory`);
  report.push(``);
  report.push(`| Character | Episodes | Arc | Score | Trait Changes |`);
  report.push(`|-----------|----------|-----|-------|--------------|`);

  for (const cg of charGrowth.characters) {
    const arcEmoji = cg.classification === "positive" ? "📈" : cg.classification === "negative" ? "📉" : cg.classification === "flat" ? "➡️" : "🔄";
    const changeSummary = cg.traitChanges.slice(0, 3).map(c => `${c.trait} (${c.direction})`).join("; ");
    report.push(`| ${cg.charLabel} | ${cg.episodes} | ${arcEmoji} ${cg.classification} | ${cg.score}/100 | ${changeSummary} |`);
  }

  report.push(``);
}

// ─── Pacing Curve Table ───

if (pacing.curves.size > 0) {
  report.push(`## Pacing Curve Analysis`);
  report.push(``);

  for (const [epId, scenes] of pacing.curves) {
    report.push(`### ${epId}`);
    report.push(``);
    report.push(`| Scene | Dialog | Chars | Effects | Tension |`);
    report.push(`|-------|--------|-------|---------|---------|`);

    for (const s of scenes) {
      const bar = "█".repeat(Math.round(s.tension * 10));
      report.push(`| ${s.scene} | ${s.dialogLines} | ${s.charCount} | ${s.effectCount} | ${bar} ${s.tension.toFixed(2)} |`);
    }

    const tensions = scenes.map(s => s.tension);
    const m = tensions.reduce((a, b) => a + b, 0) / tensions.length;
    const variance = tensions.reduce((s, t) => s + Math.pow(t - m, 2), 0) / tensions.length;
    report.push(``);
    report.push(`- **Variance:** ${variance.toFixed(4)} (weighted: 40% dialog, 30% characters, 30% effects)`);
    report.push(``);
  }
}

// ─── Theme Coherence Table ───

if (themeCoherence.themeTable.length > 0) {
  report.push(`## 主題連貫性分析`);
  report.push(``);
  report.push(...themeCoherence.themeTable);
  report.push(``);
  const bar = "█".repeat(Math.round(themeCoherence.coherence * 10));
  report.push(`- **連貫性：** ${bar} ${(themeCoherence.coherence * 100).toFixed(0)}%`);
  report.push(``);
}

// ─── Subagent Enrichment ───

const enrichmentPath = resolve(seriesDir, "storygraph_out", "check-enrichment-input.json");
const enrichmentOutputPath = resolve(seriesDir, "storygraph_out", "check-enrichment-output.md");

const enrichmentPayload = {
  report: {
    summary: { pass: passCount, warn: warnCount, fail: failCount },
    checks: allChecks.map(c => ({ check: c.check, status: c.status, details: c.details })),
  },
  characterComparisons: charConsistency.comparisons.map(comp => ({
    character: comp.charLabel,
    id: comp.charId,
    sharedTraits: comp.sharedTraits,
    variantTraits: Object.fromEntries(comp.variantTraits),
    episodes: comp.episodes.map(ep => ({ id: ep.id, traits: ep.traits })),
  })),
  seriesDir,
  generatedAt: new Date().toISOString(),
};
writeFileSync(enrichmentPath, JSON.stringify(enrichmentPayload, null, 2));
console.log(`Enrichment input: ${enrichmentPath}`);

// Build enrichment prompt from the structured payload
function buildEnrichmentPrompt(payload: typeof enrichmentPayload): string {
  const checkLines = payload.report.checks
    .map(c => `- [${c.status}] ${c.check}: ${c.details}`)
    .join("\n");

  const charLines = payload.characterComparisons
    .map(c => {
      const traits = c.sharedTraits.length > 0 ? `shared: ${c.sharedTraits.join(", ")}` : "no shared traits";
      return `- ${c.character} (${c.id}): ${traits}`;
    })
    .join("\n");

  return `You are a story analysis assistant reviewing consistency check results for a comedy video series.

## Summary
- PASS: ${payload.report.summary.pass}, WARN: ${payload.report.summary.warn}, FAIL: ${payload.report.summary.fail}

## Check Results
${checkLines}

## Character Comparisons
${charLines || "No multi-episode characters to compare."}

## Task
Analyze the warnings and failures above. For each WARN/FAIL:
1. Explain WHY this issue may have occurred
2. Suggest a concrete fix in zh_TW (the series uses Traditional Chinese)
3. Rate severity: low / medium / high

After the markdown analysis, include a JSON block with per-check fix suggestions:
\`\`\`json
[
  { "check_name": "exact check name from above", "fix_suggestion_zhTW": "One concrete sentence in zh_TW" }
]
\`\`\`

Format the main analysis as markdown sections (2-3 sentences each).
The JSON block must be at the end, containing entries for all WARN/FAIL checks.

Analysis:`;
}

if (aiConfig.mode === "ai") {
  // --mode ai: call LLM directly
  console.log(`\n[AI mode] Calling ${aiConfig.provider}/${aiConfig.model} for enrichment...`);
  const prompt = buildEnrichmentPrompt(enrichmentPayload);
  const result = await callAI(prompt, {
    provider: aiConfig.provider,
    model: aiConfig.model,
    jsonMode: false,
    maxRetries: 1,
  });

  if (result) {
    writeFileSync(enrichmentOutputPath, result);
    report.push(`## LLM Analysis`);
    report.push(``);
    report.push(result);
    report.push(``);
    console.log(`[AI mode] Enrichment written: ${enrichmentOutputPath}`);
  } else {
    report.push(`## LLM Analysis`);
    report.push(``);
    report.push(`*AI enrichment call failed. See check-enrichment-input.json for manual subagent analysis.*`);
    report.push(``);
    console.warn(`[AI mode] callAI returned null for enrichment`);
  }
} else if (existsSync(enrichmentOutputPath)) {
  const enrichmentOutput = readFileSync(enrichmentOutputPath, "utf-8");
  report.push(`## LLM Analysis`);
  report.push(``);
  report.push(enrichmentOutput);
  report.push(``);
  console.log(`Enrichment output: ${enrichmentOutputPath}`);
} else {
  report.push(`## LLM Analysis`);
  report.push(``);
  report.push(`*No LLM enrichment available. To generate, pass \`check-enrichment-input.json\` to a subagent with instructions to analyze warnings and provide explanations.*`);
  report.push(``);
  console.log(`No enrichment output found at ${enrichmentOutputPath}`);
}

writeFileSync(outPath, report.join("\n"));
console.log(`\nReport: ${outPath}`);

// ─── Write gate.json ───

// Parse fix suggestions from enrichment output (if available)
const fixSuggestions = new Map<string, string>();
if (existsSync(enrichmentOutputPath)) {
  try {
    const enrichmentText = readFileSync(enrichmentOutputPath, "utf-8");
    const jsonMatch = enrichmentText.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.check_name && item.fix_suggestion_zhTW) {
            fixSuggestions.set(item.check_name, item.fix_suggestion_zhTW);
          }
        }
      }
    }
  } catch {
    // Parsing failed — fix suggestions remain empty
  }
}

// ─── 33-A2: Regression detection — read previous gate.json ───

const gatePath = resolve(seriesDir, "storygraph_out", "gate.json");
let previousScore: number | null = null;
let scoreDelta: number | null = null;
if (existsSync(gatePath)) {
  try {
    const prevGate = JSON.parse(readFileSync(gatePath, "utf-8"));
    if (typeof prevGate.score === "number") {
      previousScore = prevGate.score;
      scoreDelta = aggregateScore - previousScore;
    }
  } catch {
    // Invalid JSON — treat as no previous run
  }
}

// ─── 33-A3: quality_breakdown per-dimension ───

function passRatio(checks: CheckResult[]): number | null {
  if (checks.length === 0) return null;
  const pass = checks.filter(c => c.status === "PASS").length;
  const warn = checks.filter(c => c.status === "WARN").length;
  return (pass + warn * 0.5) / checks.length;
}

const consistencyChecks = allChecks.filter(c =>
  c.check.startsWith("Character Consistency") || c.check === "Trait Coverage" || c.check === "Interaction Density"
);
const pacingChecks = allChecks.filter(c => c.check.startsWith("Pacing"));
const gagChecks = allChecks.filter(c => c.check.startsWith("Gag Evolution") || c.check.startsWith("Gag Diversity") || c.check.startsWith("Gag Stagnation"));

const qualityBreakdown: Record<string, number | null> = {
  consistency: passRatio(consistencyChecks),
  arc_structure: arcReportData && arcReportData.arcScore >= 0 ? arcReportData.arcScore / 100 : null,
  pacing: passRatio(pacingChecks),
  character_growth: charGrowth.characters.length > 0
    ? charGrowth.characters.reduce((s, c) => s + c.score, 0) / charGrowth.characters.length / 100
    : null,
  thematic_coherence: themeCoherence.coherence,
  gag_evolution: genre === "galgame_meme" ? passRatio(gagChecks) : null,
};

// ─── 33-A4: supervisor_hints ───

const warnFailChecks = allChecks.filter(c => c.status !== "PASS");
const focusAreas = warnFailChecks.map(c => {
  const detail = c.details.length > 60 ? c.details.slice(0, 57) + "..." : c.details;
  return `${c.check}: ${detail}`;
});

const escalationReason = aggregateScore < 70
  ? `Score ${aggregateScore} below threshold 70`
  : failCount > 0
    ? `${failCount} FAIL check(s) detected`
    : scoreDelta !== null && scoreDelta < -10
      ? `Score dropped ${Math.abs(scoreDelta)} points from previous run`
      : null;

// ─── 33-A5: requires_claude_review ───

const requiresClaudeReview = aggregateScore < 70 || failCount > 0 || (scoreDelta !== null && scoreDelta < -10);

// ─── Write gate.json v2 ───

const gateData = {
  version: "2.0",
  timestamp: new Date().toISOString(),
  series: seriesConfig?.seriesId ?? basename(seriesDir),
  genre,
  generator: {
    mode: aiConfig.mode,
    model: aiConfig.model,
    version: "0.16.0",
  },
  score: aggregateScore,
  decision: gateDecision,
  previous_score: previousScore,
  score_delta: scoreDelta,
  checks: allChecks.map(c => ({
    name: c.check,
    status: c.status,
    score_impact: c.status === "PASS" ? 5 : c.status === "WARN" ? -5 : -15,
    fix_suggestion_zhTW: fixSuggestions.get(c.check) ?? (c.status !== "PASS" ? "(see consistency-report.md for details)" : ""),
  })),
  quality_breakdown: qualityBreakdown,
  supervisor_hints: {
    focus_areas: focusAreas,
    suggested_rubric_overrides: [] as string[],
    escalation_reason: escalationReason,
  },
  requires_claude_review: requiresClaudeReview,
};

writeFileSync(gatePath, JSON.stringify(gateData, null, 2));
const regressionInfo = scoreDelta !== null ? `, delta: ${scoreDelta >= 0 ? "+" : ""}${scoreDelta}` : "";
const reviewInfo = requiresClaudeReview ? " [ESCALATED]" : "";
console.log(`Gate v2: ${gatePath} (score: ${aggregateScore}, decision: ${gateDecision}${regressionInfo}${reviewInfo})`);

// Print summary to console
for (const check of allChecks) {
  const icon = check.status === "PASS" ? "✓" : check.status === "WARN" ? "⚠" : "✗";
  console.log(`  ${icon} ${check.check}: ${check.details.slice(0, 80)}`);
}
