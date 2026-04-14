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

import { resolve } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

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
  bun run src/scripts/graphify-check.ts <series-dir>

Reads graphify-out/merged-graph.json and link-edges.json.
Outputs graphify-out/consistency-report.md.
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);
const mergedPath = resolve(seriesDir, "bun_graphify_out", "merged-graph.json");
const linkEdgesPath = resolve(seriesDir, "bun_graphify_out", "link-edges.json");
const outPath = resolve(seriesDir, "bun_graphify_out", "consistency-report.md");

if (!existsSync(mergedPath)) {
  console.error(`No merged graph found at ${mergedPath}`);
  console.error(`Run graphify-merge first.`);
  process.exit(1);
}

const merged = JSON.parse(readFileSync(mergedPath, "utf-8"));
const linkEdges = existsSync(linkEdgesPath)
  ? JSON.parse(readFileSync(linkEdgesPath, "utf-8"))
  : [];

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

function checkCharacterConsistency(): CheckResult[] {
  const results: CheckResult[] = [];

  const sameCharLinks = linkEdgesByRelation.get("same_character") ?? [];
  if (sameCharLinks.length === 0) {
    return [{ check: "Character Consistency", status: "PASS", details: "No same_character link edges to check", evidence: [] }];
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
      traits: getTraits(id),
    }));

    // Find core traits (present in ≥50% of episodes)
    const traitCounts = new Map<string, number>();
    for (const ep of traitsPerEpisode) {
      for (const t of ep.traits) {
        traitCounts.set(t, (traitCounts.get(t) ?? 0) + 1);
      }
    }
    const coreTraits = [...traitCounts.entries()]
      .filter(([, count]) => count >= Math.ceil(traitsPerEpisode.length * 0.5))
      .map(([trait]) => trait);

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

  return results;
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

// ─── Run all checks ───

console.log("Running consistency checks...\n");

const allChecks: CheckResult[] = [
  ...checkCharacterConsistency(),
  ...checkGagEvolution(),
  ...checkTechTermDiversity(),
  ...checkTraitCoverage(),
  ...checkInteractionDensity(),
];

// ─── Generate report ───

const report: string[] = [];
report.push(`# Consistency Report`);
report.push(``);
report.push(`Generated: ${new Date().toISOString()}`);
report.push(`Series: ${seriesDir}`);
report.push(`Episodes: ${merged.episode_count ?? "unknown"}`);
report.push(`Link edges: ${linkEdges.length}`);
report.push(``);

const passCount = allChecks.filter(c => c.status === "PASS").length;
const warnCount = allChecks.filter(c => c.status === "WARN").length;
const failCount = allChecks.filter(c => c.status === "FAIL").length;

report.push(`## Summary`);
report.push(``);
report.push(`- **PASS:** ${passCount}`);
report.push(`- **WARN:** ${warnCount}`);
report.push(`- **FAIL:** ${failCount}`);
report.push(``);

console.log(`Results: ${passCount} PASS, ${warnCount} WARN, ${failCount} FAIL`);

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

writeFileSync(outPath, report.join("\n"));
console.log(`\nReport: ${outPath}`);

// Print summary to console
for (const check of allChecks) {
  const icon = check.status === "PASS" ? "✓" : check.status === "WARN" ? "⚠" : "✗";
  console.log(`  ${icon} ${check.check}: ${check.details.slice(0, 80)}`);
}
