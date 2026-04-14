/**
 * Subagent prompt templates for AI cross-link discovery.
 *
 * Builds structured prompts that include:
 * - Merged graph summary (characters, gags, plots, tech terms)
 * - Quantitative metrics (PageRank scores, Jaccard similarity)
 * - Instructions for discovering non-obvious cross-episode patterns
 *
 * The subagent returns StoryCrossLink[] as structured JSON.
 */

import type { StoryCrossLink } from "../types";

// ─── Graph Summary Builder ───

interface NodeSummary {
  id: string;
  label: string;
  type: string;
  episode?: string;
}

interface EdgeSummary {
  source: string;
  target: string;
  relation: string;
}

/**
 * Build a concise text summary of the merged graph for the subagent prompt.
 * Keeps output under ~2000 tokens to leave room for analysis.
 */
function buildGraphSummary(
  nodes: NodeSummary[],
  edges: EdgeSummary[],
  linkEdges: Array<{ source: string; target: string; relation: string }>
): string {
  // Group nodes by type
  const byType: Record<string, NodeSummary[]> = {};
  for (const n of nodes) {
    const t = n.type ?? "unknown";
    if (!byType[t]) byType[t] = [];
    byType[t].push(n);
  }

  const lines: string[] = [];

  for (const [type, typeNodes] of Object.entries(byType)) {
    lines.push(`### ${type} (${typeNodes.length})`);
    for (const n of typeNodes.slice(0, 20)) { // Cap per type
      const ep = n.episode ? ` [${n.episode}]` : "";
      lines.push(`- ${n.id}: ${n.label}${ep}`);
    }
    if (typeNodes.length > 20) {
      lines.push(`- ... and ${typeNodes.length - 20} more`);
    }
    lines.push("");
  }

  // Link edges summary
  if (linkEdges.length > 0) {
    lines.push(`### Cross-episode Link Edges (${linkEdges.length})`);
    const byRelation: Record<string, number> = {};
    for (const le of linkEdges) {
      byRelation[le.relation] = (byRelation[le.relation] ?? 0) + 1;
    }
    for (const [rel, count] of Object.entries(byRelation)) {
      lines.push(`- ${rel}: ${count} edges`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Main Prompt Builder ───

/**
 * Build the complete cross-link discovery prompt for Claude subagent.
 *
 * @param nodes - Merged graph nodes
 * @param edges - Merged graph edges
 * @param linkEdges - Cross-episode link edges
 * @param pageRankScores - PageRank scores per node
 * @param similarityMatrix - Jaccard similarity between episodes
 * @param maxCrossLinks - Maximum cross-links to request (default 10)
 */
export function buildCrossLinkPrompt(
  nodes: NodeSummary[],
  edges: EdgeSummary[],
  linkEdges: Array<{ source: string; target: string; relation: string }>,
  pageRankScores: Record<string, number>,
  similarityMatrix: Record<string, Record<string, number>>,
  maxCrossLinks: number = 10
): string {
  // PageRank top characters
  const topChars = Object.entries(pageRankScores)
    .filter(([id]) => {
      const n = nodes.find(x => x.id === id);
      return n?.type === "character_instance";
    })
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, score]) => {
      const n = nodes.find(x => x.id === id);
      return `${n?.label ?? id} (${score.toFixed(3)})`;
    });

  // High similarity pairs (>0.5)
  const similarPairs: string[] = [];
  for (const [epA, row] of Object.entries(similarityMatrix)) {
    for (const [epB, sim] of Object.entries(row)) {
      if (epA < epB && sim > 0.5) {
        similarPairs.push(`${epA} ↔ ${epB}: ${sim.toFixed(2)}`);
      }
    }
  }

  return `You are analyzing a federated story knowledge graph from a comedy series.
Discover non-obvious cross-episode patterns and return structured cross-link edges.

## Graph Summary

${buildGraphSummary(nodes, edges, linkEdges)}

## Algorithm Metrics

**Top Characters by PageRank (structural centrality):**
${topChars.length > 0 ? topChars.map(c => `- ${c}`).join("\n") : "- No PageRank data"}

**Episode Similarity (Jaccard >0.5):**
${similarPairs.length > 0 ? similarPairs.map(s => `- ${s}`).join("\n") : "- No high-similarity pairs"}

## Task

Analyze the above narrative elements for non-obvious cross-episode connections.
Look for patterns like:
1. **character_theme_affinity**: A character consistently associated with specific themes across episodes (not just their listed traits)
2. **gag_character_synergy**: Which gags work best with which characters (funny character + specific gag = memorable moment)
3. **narrative_cluster**: Scenes across different episodes that share thematic patterns
4. **story_anti_pattern**: Repetitive plot structures, pacing problems, or formulaic patterns

## Output Format

Return a JSON array of cross-link objects. Maximum ${maxCrossLinks} items.
Each item:
\`\`\`json
{
  "from": "node_id",
  "to": "node_id",
  "link_type": "character_theme_affinity|gag_character_synergy|narrative_cluster|story_anti_pattern",
  "confidence": 0.0-1.0,
  "evidence": ["node_id_1", "node_id_2"],
  "generated_by": "ai",
  "rationale": "Brief explanation of why this connection is meaningful"
}
\`\`\`

IMPORTANT:
- Only connect nodes that actually exist in the graph summary above
- confidence should reflect how non-obvious yet meaningful the connection is
- Focus on INSIGHTFUL patterns, not trivial ones (e.g., don't just link co-occurring characters)
- Return ONLY the JSON array, no other text

Cross-links:`;
}
