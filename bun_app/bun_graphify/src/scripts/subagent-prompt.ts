/**
 * Subagent prompt templates for AI-assisted graph extraction.
 *
 * Builders for:
 * - Episode NL extraction (Phase 26-B1)
 * - Cross-link discovery (Phase 23)
 * - Plot arc classification (Phase 24-B)
 * - Foreshadowing extraction (Phase 24-C)
 */

import type { StoryCrossLink } from "../types";
import type { SeriesConfig } from "./series-config";

// ─── Graph Summary Builder ───

export interface NodeSummary {
  id: string;
  label: string;
  type: string;
  episode?: string;
}

export interface EdgeSummary {
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

// ─── Plot Arc Prompt (Phase 24-B) ───

export interface SceneSummary {
  scene_id: string;
  label: string;
  episode_id: string;
  dialog_lines: Array<{ character: string; text: string }>;
  conflict_edges: number;
  character_count: number;
}

/**
 * Build the plot arc classification prompt for Claude subagent.
 *
 * Sends the ordered scene sequence with dialog summaries and conflict density.
 * The AI classifies each scene as a plot beat with a tension score.
 *
 * File-based I/O pattern:
 *   Write `plotarc-input.json` → AI classifies → Read `plotarc-output.json`
 */
export function buildPlotArcPrompt(
  scenes: SceneSummary[],
  episodeId: string,
  episodeTitle: string
): string {
  const sceneEntries = scenes.map((s, i) => {
    const dialogPreview = s.dialog_lines
      .slice(0, 3)
      .map(d => `${d.character}: ${d.text}`)
      .join("\n    ");
    return `**Scene ${i + 1}: ${s.label}** (\`${s.scene_id}\`)
    - Characters: ${s.character_count}
    - Conflict edges: ${s.conflict_edges}
    - Dialog preview:
${dialogPreview || "    (no dialog)"}`;
  });

  return `You are a narrative structure analyst for a comedy video series.
Classify each scene's dramatic function in the episode's plot arc.

## Episode: ${episodeTitle} (${episodeId})
## Scene Sequence (${scenes.length} scenes)

${sceneEntries.join("\n\n")}

## Plot Beat Types

- **inciting_incident**: The event that disrupts normalcy and kicks off the story. Often the first real conflict or surprise.
- **rising_action**: Escalating tension — conflicts intensify, stakes rise, complications accumulate.
- **climax**: The peak of tension — the decisive confrontation, revelation, or turning point. Should have the highest tension.
- **falling_action**: Tension decreasing — aftermath of the climax, characters processing what happened.
- **resolution**: Return to (new) normalcy — wrap-up, lesson learned, or setup for next episode.

## Tension Scoring (0.0–1.0)

Score each scene's dramatic tension:
- 0.0–0.2: Calm, slice-of-life, setup
- 0.3–0.4: Mild tension, curiosity, light conflict
- 0.5–0.6: Active conflict, rising stakes
- 0.7–0.8: High tension, emotional peak
- 0.9–1.0: Maximum tension — climax, confrontation, revelation

## Output Format

Return a JSON array with one entry per scene (in the same order as above):
\`\`\`json
[
  {
    "scene_id": "${scenes[0]?.scene_id ?? "scene_id"}",
    "beat_type": "inciting_incident|rising_action|climax|falling_action|resolution",
    "tension": 0.5,
    "description": "Brief explanation of why this scene serves this dramatic function"
  }
]
\`\`\`

IMPORTANT:
- Every scene must have exactly one beat_type
- Exactly one scene should be "climax" (the tension peak)
- The first meaningful scene should typically be "inciting_incident"
- The last scene should typically be "resolution" or "falling_action"
- Tension values must be between 0.0 and 1.0
- Return ONLY the JSON array, no other text

Plot beats:`;
}

// ─── Foreshadow Extraction Prompt (Phase 24-C) ───

export interface ForeshadowInput {
  episode_id: string;
  episode_title: string;
  scenes: Array<{
    scene_id: string;
    label: string;
    dialog_lines: Array<{ character: string; text: string }>;
  }>;
  existing_foreshadows: Array<{
    id: string;
    description: string;
    planted_episode: string;
    paid_off: boolean;
  }>;
}

/**
 * Build the foreshadowing extraction prompt for Claude subagent.
 *
 * Analyzes dialog/narration for setups (promises, unanswered questions,
 * mysterious objects, character hints) and identifies payoffs from
 * previously planted foreshadowing.
 *
 * File-based I/O:
 *   Write `foreshadow-input.json` → AI extracts → Read `foreshadow-output.json`
 */
export function buildForeshadowPrompt(input: ForeshadowInput): string {
  const sceneEntries = input.scenes.map((s, i) => {
    const dialogPreview = s.dialog_lines
      .slice(0, 4)
      .map(d => `${d.character}: ${d.text}`)
      .join("\n    ");
    return `**Scene ${i + 1}: ${s.label}** (\`${s.scene_id}\`)
    - Dialog preview:
${dialogPreview || "    (no dialog)"}`;
  });

  const existingSection = input.existing_foreshadows.length > 0
    ? `## Previously Planted Foreshadowing (check for payoffs)

${input.existing_foreshadows.map(f => `- **${f.id}** (${f.planted_episode}): ${f.description} [${f.paid_off ? "PAID OFF" : "UNPAID"}]`).join("\n")}

For each unpaid foreshadow above, check if this episode contains its payoff.`
    : "## Previously Planted Foreshadowing\n\nNone — this is the first episode or no foreshadowing has been tracked.";

  return `You are a narrative analysis engine for a comedy video series.
Extract foreshadowing (planted setups) from this episode's dialog, and identify payoffs for previously planted foreshadowing.

## Episode: ${input.episode_title} (${input.episode_id})
## Scene Sequence (${input.scenes.length} scenes)

${sceneEntries.join("\n\n")}

${existingSection}

## What Counts as Foreshadowing

Planted setups include:
- **Promises or threats** — "下次見面一定讓你好看" (a character vows revenge)
- **Unanswered questions** — mysterious objects, unexplained abilities, hinted backstory
- **Chekhov's gun** — an object or detail introduced that seems insignificant but will matter later
- **Character hints** — subtle suggestions about a character's true nature, hidden motive, or secret
- **World-building seeds** — rules or systems mentioned that will become plot-relevant

Payoffs include:
- **Direct resolution** — a previously unanswered question gets answered
- **Reversal** — a planted expectation is subverted
- **Callback** — a character references an earlier event/dialog that now gains new meaning

## Output Format

Return a JSON object:
\`\`\`json
{
  "planted": [
    {
      "id": "${input.episode_id}_foreshadow_1",
      "description": "Brief description of the planted setup (zh_TW)",
      "confidence": 0.8,
      "scene_id": "${input.scenes[0]?.scene_id ?? "scene_id"}",
      "character_involved": "character_id or null"
    }
  ],
  "payoffs": [
    {
      "foreshadow_id": "existing_foreshadow_id",
      "payoff_episode": "${input.episode_id}",
      "payoff_description": "How the foreshadow was paid off (zh_TW)",
      "confidence": 0.9
    }
  ]
}
\`\`\`

IMPORTANT:
- "planted" is for NEW foreshadowing introduced in THIS episode
- "payoffs" is for PREVIOUSLY planted foreshadowing that THIS episode resolves
- confidence should reflect how clear/explicit the setup or payoff is (0.5–1.0)
- Only extract foreshadowing with narrative significance, not casual references
- Return ONLY the JSON object, no other text

Foreshadowing:`;
}

// ─── Episode NL Extraction Prompt (Phase 26-B1) ───

export interface EpisodeExtractionInput {
  episode_id: string;
  episode_title: string;
  series_name: string;
  narration_text: string;
  charNames: Record<string, string>;
  techPatterns: string[];
}

/**
 * Build the episode NL extraction prompt for direct AI call.
 *
 * Sends raw narration text and asks the AI to extract the same
 * node/edge types as the regex pipeline, plus richer types that
 * regex can't detect (plot_event, artifact, relationship, theme).
 *
 * Output matches the graph.json format so merge can consume it directly.
 */
export function buildEpisodeExtractionPrompt(input: EpisodeExtractionInput): string {
  const charList = Object.entries(input.charNames)
    .map(([id, name]) => `- \`${id}\` → ${name}`)
    .join("\n");

  const techList = input.techPatterns.length > 0
    ? input.techPatterns.map(p => `- \`${p}\``).join("\n")
    : "- (none specified)";

  // Truncate narration to ~3000 chars to fit context
  const narration = input.narration_text.length > 3000
    ? input.narration_text.slice(0, 3000) + "\n... (truncated)"
    : input.narration_text;

  return `You are a story analysis engine for a comedy video series.
Extract structured knowledge graph nodes and edges from the narration below.

## Series: ${input.series_name}
## Episode: ${input.episode_title} (${input.episode_id})

## Known Characters
${charList}

## Known Tech Patterns
${techList}

## Narration Text

${narration}

## Node Types to Extract

Extract these node types from the narration:

1. **episode_plot** — The episode's overall plot. Exactly one node.
   - ID: \`${input.episode_id}_plot\`
   - label: Episode title or summary

2. **scene** — Each distinct scene/section.
   - ID: \`${input.episode_id}_scene_{n}\` (n = 1, 2, 3...)

3. **character_instance** — Each character that appears.
   - ID: \`${input.episode_id}_char_{character_id}\`
   - properties: character_id, dialog_count, dialog_text (first 500 chars)

4. **tech_term** — Technical terms, abilities, or techniques mentioned.
   - ID: \`${input.episode_id}_tech_{term}\`

5. **gag_manifestation** — Running gags or comedic moments.
   - ID: \`${input.episode_id}_gag_{gag_type}\`
   - properties: gag_type, episode

6. **character_trait** — Personality traits revealed through speech or behavior.
   - ID: \`${input.episode_id}_trait_{char}_{trait}\`

7. **plot_event** — Key story events (regex can't detect these).
   - ID: \`${input.episode_id}_event_{n}\`

8. **artifact** — Important objects or items in the story.
   - ID: \`${input.episode_id}_artifact_{name}\`

9. **theme** — Recurring thematic concept across the episode (e.g., 成長, 認同, 友情, 權力).
   - ID: \`${input.episode_id}_theme_{keyword}\`
   - label: Theme keyword in zh_TW
   - properties: { keyword, description }

## Edge Relation Types

- \`part_of\` — scene → episode_plot
- \`appears_in\` — character_instance → episode_plot, gag → episode_plot
- \`uses_tech_term\` — character_instance → tech_term
- \`interacts_with\` — character_instance ↔ character_instance (bidirectional)
- \`character_speaks_like\` — character_trait → character_instance
- \`triggers\` — plot_event → plot_event (causality chain)
- \`uses\` — character_instance → artifact
- \`relates_to\` — any → plot_event (thematic connection)
- \`illustrates\` — theme → scene or theme → plot_event (thematic connection)

## Output Format

Return a JSON object:
\`\`\`json
{
  "nodes": [
    {
      "id": "${input.episode_id}_plot",
      "label": "Episode title or summary",
      "type": "episode_plot",
      "properties": {}
    }
  ],
  "edges": [
    {
      "source": "${input.episode_id}_scene_1",
      "target": "${input.episode_id}_plot",
      "relation": "part_of"
    }
  ]
}
\`\`\`

IMPORTANT:
- All node IDs MUST start with \`${input.episode_id}_\`
- Use known character IDs from the list above when possible
- Include at least: 1 episode_plot, N scenes, M character_instances
- dialog_text in character_instance should be truncated to 500 chars
- Return ONLY the JSON object, no other text

Extraction result:`;
}
