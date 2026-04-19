/**
 * Subagent prompt templates for AI-assisted graph extraction.
 *
 * Builders for:
 * - Episode NL extraction (Phase 26-B1)
 * - Cross-link discovery (Phase 23)
 * - Plot arc classification (Phase 24-B)
 * - Foreshadowing extraction (Phase 24-C)
 * - KG quality scoring (Phase 31-A1)
 */

import type { StoryCrossLink } from "../types";
import type { SeriesConfig } from "./series-config";
import type {
  EpisodeSummary,
  ForeshadowStatus,
  ScenePacing,
  ThemeCluster,
  CharacterConstraint,
  GagEvolution,
  InteractionPattern,
  TechTermUsage,
} from "./kg-loaders";

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

// ─── Comedy Analysis Prompt (Phase 30-B3) ───

export interface ComedyAnalysisInput {
  episode_id: string;
  episode_title: string;
  scenes: Array<{
    scene_id: string;
    label: string;
    dialog_lines: Array<{ character: string; text: string }>;
  }>;
  gag_manifestations: Array<{
    gag_type: string;
    manifestation: string;
  }>;
}

export function buildComedyAnalysisPrompt(input: ComedyAnalysisInput): string {
  const sceneEntries = input.scenes.map((s, i) => {
    const dialogPreview = s.dialog_lines
      .slice(0, 3)
      .map(d => `${d.character}: ${d.text}`)
      .join("\n    ");
    return `**Scene ${i + 1}: ${s.label}** (\`${s.scene_id}\`)
    - Dialog preview:
${dialogPreview || "    (no dialog)"}`;
  });

  const gagList = input.gag_manifestations.length > 0
    ? input.gag_manifestations.map(g => `- [${g.gag_type}] ${g.manifestation}`).join("\n")
    : "(none detected by regex)";

  return `You are a comedy structure analyst for a meme/gag video series.
Classify each scene's comedic function in the episode's joke cycle.

## Episode: ${input.episode_title} (${input.episode_id})
## Scene Sequence (${input.scenes.length} scenes)

${sceneEntries.join("\n\n")}

## Known Gag Manifestations

${gagList}

## Comedy Beat Types

- **setup**: Establishing a premise, expectation, or normal situation that the joke will subvert. Low energy.
- **buildup**: Raising the comedic tension — escalating absurdity, adding detail, or creating anticipation.
- **escalation**: A sudden increase in absurdity or chaos — the situation spirals beyond control.
- **punchline**: The comedic payoff — the moment of surprise, twist, or absurd reveal. Should have the highest tension.
- **callback**: Reference to an earlier joke or gag from a previous scene/episode. Often a quiet closer.

## Tension Scoring (0.0–1.0)

Score each scene's comedic tension:
- 0.0–0.2: Calm, establishing shot, slice-of-life setup
- 0.3–0.4: Light setup, gentle absurdity, expectation building
- 0.5–0.6: Active comedic escalation, the situation is getting weird
- 0.7–0.8: High comedic tension, things are spiraling
- 0.9–1.0: Peak punchline — the big laugh, the absurd reveal, the twist landing

## Output Format

Return a JSON array with one entry per scene (in the same order as above):
\`\`\`json
[
  {
    "scene_id": "${input.scenes[0]?.scene_id ?? "scene_id"}",
    "beat_type": "setup|buildup|escalation|punchline|callback",
    "tension": 0.5,
    "gag_reference": "gag_type or null if no specific gag",
    "description": "Brief explanation of this scene's comedic function (zh_TW)"
  }
]
\`\`\`

IMPORTANT:
- Every scene must have exactly one beat_type
- At least one scene should be "punchline" (the comedic peak)
- Use "callback" when a scene references a joke from an earlier scene
- Use "escalation" when absurdity suddenly increases (not just gradual buildup)
- Tension values must be between 0.0 and 1.0
- Return ONLY the JSON array, no other text

Comedy beats:`;
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

  // Truncate narration to ~2000 chars to keep prompt compact
  const narration = input.narration_text.length > 2000
    ? input.narration_text.slice(0, 2000) + "\n... (truncated)"
    : input.narration_text;

  return `Extract knowledge graph nodes and edges from this narration.

Series: ${input.series_name} | Episode: ${input.episode_title} (${input.episode_id})
Characters: ${Object.values(input.charNames).join(", ") || "narrator only"}
Tech patterns: ${input.techPatterns.slice(0, 10).join(", ") || "none"}

## Narration
${narration}

## Extract these node types (use minimal properties):

1. **episode_plot** (1 node, id: ${input.episode_id}_plot)
2. **scene** (id: ${input.episode_id}_scene_{n})
3. **character_instance** (id: ${input.episode_id}_char_{id})
4. **tech_term** (id: ${input.episode_id}_tech_{term})
5. **plot_beat** — key story turning points (id: ${input.episode_id}_beat_{n})
6. **theme** — recurring concepts like 成長, 認同 (id: ${input.episode_id}_theme_{keyword})

## Edges: part_of, appears_in, uses_tech_term, triggers, illustrates

## Output: JSON only, no markdown fences

{"nodes":[{"id":"${input.episode_id}_plot","label":"...","type":"episode_plot","properties":{}}],"edges":[{"source":"...","target":"...","relation":"part_of"}]}

IMPORTANT: All IDs must start with ${input.episode_id}_. Keep properties minimal (1-2 fields). Limit to ≤20 nodes total.`;
}

// ─── KG Quality Scoring Prompt (Phase 31-A1) ───

export interface KGScoreInput {
  series_name: string;
  genre: string;
  episode_count: number;
  node_counts: Record<string, number>;
  edge_count: number;
  link_edge_count: number;
  gate_score: number;
  gate_decision: string;
  quality_breakdown: Record<string, number | null>;
  narration_excerpts: Array<{ episode_id: string; text: string }>;
}

export function buildKGScorePrompt(input: KGScoreInput): string {
  const nodeTable = Object.entries(input.node_counts)
    .sort(([, a], [, b]) => b - a)
    .map(([type, count]) => `- ${type}: ${count}`)
    .join("\n");

  const breakdownLines = Object.entries(input.quality_breakdown)
    .filter(([, v]) => v !== null)
    .map(([dim, v]) => `- ${dim}: ${(v! * 100).toFixed(0)}%`)
    .join("\n");

  const excerpts = input.narration_excerpts
    .map(e => `### ${e.episode_id}\n${e.text.slice(0, 500)}`)
    .join("\n\n");

  return `You are a knowledge graph quality evaluator for a story analysis pipeline.
Evaluate the quality of the extracted knowledge graph across 5 dimensions.

## Series: ${input.series_name} (${input.genre})
## Graph Statistics
- Episodes: ${input.episode_count}
- Nodes: ${nodeTable}
- Edges: ${input.edge_count}
- Cross-episode links: ${input.link_edge_count}

## Programmatic Quality (Tier 0)
- Score: ${input.gate_score}/100 (${input.gate_decision})
- Per-dimension breakdown:
${breakdownLines}

## Narration Excerpts (source text the graph was extracted from)

${excerpts || "(no narration excerpts available)"}

## Evaluation Rubric

Score each dimension 0-10:

1. **entity_accuracy** (0-10): Do entity labels match the source narration?
   - 10: All entity labels are accurate and specific
   - 7: Most labels correct, some vague or imprecise
   - 4: Several mislabeled entities
   - 0: Majority of labels wrong or generic

2. **relationship_correctness** (0-10): Are edges semantically valid?
   - 10: All relationships make narrative sense
   - 7: Most correct, some questionable connections
   - 4: Several incorrect or forced relationships
   - 0: Relationships don't reflect the story

3. **completeness** (0-10): Are major story elements captured?
   - 10: All key characters, events, themes present
   - 7: Most important elements present, minor gaps
   - 4: Missing significant characters or events
   - 0: Large portions of the story unrepresented

4. **cross_episode_coherence** (0-10): Do cross-links make sense?
   - 10: Cross-episode connections reveal real narrative patterns
   - 7: Most cross-links valid, some superficial
   - 4: Many cross-links forced or meaningless
   - 0: No meaningful cross-episode structure (or N/A for single ep)

5. **actionability** (0-10): Can a Remotion scene builder use this data?
   - 10: Rich enough to generate scene structure, dialog timing, effects
   - 7: Usable with minor gaps in pacing or effect data
   - 4: Missing critical data for scene construction
   - 0: Too sparse to inform video generation

## Output Format

Return a JSON object:
\`\`\`json
{
  "dimensions": {
    "entity_accuracy": 7,
    "relationship_correctness": 8,
    "completeness": 6,
    "cross_episode_coherence": 5,
    "actionability": 7
  },
  "overall": 6.6,
  "justification": "Brief explanation of strengths and weaknesses"
}
\`\`\`

IMPORTANT:
- overall = mean of all 5 dimensions
- For single-episode graphs, cross_episode_coherence should be N/A (score null)
- Be critical — inflated scores reduce the value of this evaluation
- Return ONLY the JSON object, no other text

Quality score:`;
}

// ─── Dialog Assessment Prompt (Phase 33-F2b, Step 3b lite) ───

export interface DialogAssessmentInput {
  series_name: string;
  genre: string;
  episode_count: number;
  gate_score: number;
  gate_decision: string;
  warn_checks: Array<{ name: string; fix_suggestion_zhTW: string }>;
  fail_checks: Array<{ name: string; fix_suggestion_zhTW: string }>;
  quality_breakdown: Record<string, number | null>;
  ai_scores: {
    dimensions: Record<string, number>;
    overall: number;
    justification: string;
  } | null;
  supervisor_hints: string[];
}

export function buildDialogAssessmentPrompt(input: DialogAssessmentInput): string {
  const warnLines = input.warn_checks
    .slice(0, 10)
    .map(c => `- [WARN] ${c.name}: ${c.fix_suggestion_zhTW || "(無建議)"}`)
    .join("\n");

  const failLines = input.fail_checks
    .slice(0, 10)
    .map(c => `- [FAIL] ${c.name}: ${c.fix_suggestion_zhTW || "(無建議)"}`)
    .join("\n");

  const breakdownLines = Object.entries(input.quality_breakdown)
    .filter(([, v]) => v !== null)
    .map(([dim, v]) => `- ${dim}: ${(v! * 100).toFixed(0)}%`)
    .join("\n");

  const aiSection = input.ai_scores
    ? `## AI 評分
- 整體: ${input.ai_scores.overall}/10
- 實體準確性: ${input.ai_scores.dimensions.entity_accuracy}/10
- 關係正確性: ${input.ai_scores.dimensions.relationship_correctness}/10
- 完整性: ${input.ai_scores.dimensions.completeness}/10
- 評語: ${input.ai_scores.justification.slice(0, 300)}`
    : "(無 AI 評分)";

  return `你是影片劇本品質評估助手。根據以下知識圖譜品質閘門資料，用繁體中文（zh_TW）撰寫一份簡潔的品質評估摘要。

## 系列資訊
- 系列：${input.series_name} (${input.genre})
- 集數：${input.episode_count}

## 品質閘門
- 評分：${input.gate_score}/100 (${input.gate_decision})
- 各維度：
${breakdownLines}

${aiSection}

## 警告項目
${warnLines || "(無)"}

## 嚴重問題
${failLines || "(無)"}

## 關注焦點
${input.supervisor_hints.slice(0, 5).join("\n") || "(無)"}

## 任務

用繁體中文寫一份 3-5 段的品質評估摘要，包含：
1. 整體品質概況（1段）
2. 各維度分析（依數據說明強項和弱項，1-2段）
3. 改善建議（具體、可執行，1-2段）

每段 2-3 句。不要用 markdown 格式（標題、列表），只用純文字段落。
在摘要之後，附上一個 JSON 區塊，列出每個 WARN/FAIL 項目的改善建議：
\`\`\`json
[
  { "check_name": "exact check name", "fix_suggestion_zhTW": "一句繁體中文改善建議" }
]
\`\`\`

品質評估：`;
}

// ─── Remotion Prompt Builder (Phase 32-A1) ───

export interface RemotionPromptInput {
  series_name: string;
  target_ep: string;
  prev_episode_summary: EpisodeSummary | null;
  active_foreshadowing: ForeshadowStatus[];
  pacing_profile: ScenePacing[];
  thematic_clusters: ThemeCluster[];
  character_constraints: CharacterConstraint[];
  tech_terms_used: TechTermUsage[];
  gag_evolution: GagEvolution[];
  interaction_history: InteractionPattern[];
}

/**
 * Build a structured zh_TW story-writing constraint prompt from KG data.
 *
 * Combines all KG-derived context into 8 sections that guide episode creation.
 * This closes the feedback loop: KG → generation prompt → story → KG extraction.
 *
 * Section order (by narrative importance):
 * 1. 前集摘要 — what happened before
 * 2. 活躍伏筆 — unresolved setups that need payoff
 * 3. 角色特質約束 — character consistency rules
 * 4. 招牌梗演進 — gag escalation history
 * 5. 互動模式 — character pair dynamics
 * 6. 節奏參考 — pacing profile from previous episodes
 * 7. 主題一致性 — theme continuity
 * 8. 科技術語 — tech term dedup
 */
export function buildRemotionPrompt(input: RemotionPromptInput): string {
  const lines: string[] = [];

  lines.push(`# 故事寫作約束 — ${input.series_name} ${input.target_ep}`);
  lines.push("");
  lines.push("由知識圖譜自動生成。目的：確保故事寫作符合已建立的結構約束。");
  lines.push(`目標集數：${input.target_ep}`);
  lines.push(`生成時間：${new Date().toISOString()}`);
  lines.push("");

  lines.push(...buildPrevEpisodeSection(input.prev_episode_summary));
  lines.push(...buildForeshadowingSection(input.active_foreshadowing));
  lines.push(...buildCharacterSection(input.character_constraints));
  lines.push(...buildGagSection(input.gag_evolution));
  lines.push(...buildInteractionSection(input.interaction_history));
  lines.push(...buildPacingSection(input.pacing_profile));
  lines.push(...buildThemeSection(input.thematic_clusters));
  lines.push(...buildTechTermSection(input.tech_terms_used));

  return lines.join("\n");
}

// ─── Prompt Section Builders ───

function buildPrevEpisodeSection(summary: EpisodeSummary | null): string[] {
  const lines: string[] = [];
  lines.push("## 前集摘要");
  lines.push("");

  if (!summary) {
    lines.push("*這是第一章第一集，無前集資料。*");
    lines.push("");
    return lines;
  }

  lines.push(`**${summary.ep_id}：${summary.plot_label}**`);
  lines.push("");

  // Scene breakdown
  if (summary.scenes.length > 0) {
    lines.push("場景結構：");
    for (const s of summary.scenes) {
      lines.push(`- ${s.label}：${s.dialog_lines} 句對話、${s.characters} 角色、${s.effects} 特效`);
    }
    lines.push("");
  }

  // Key characters
  if (summary.key_characters.length > 0) {
    const charList = summary.key_characters
      .map(c => `${c.label}（${c.dialog_count} 句）`)
      .join("、");
    lines.push(`主要角色：${charList}`);
    lines.push("");
  }

  // Themes
  if (summary.themes.length > 0) {
    lines.push(`主題：${summary.themes.join("、")}`);
    lines.push("");
  }

  return lines;
}

function buildForeshadowingSection(foreshadows: ForeshadowStatus[]): string[] {
  const lines: string[] = [];
  lines.push("## 活躍伏筆");
  lines.push("");

  if (foreshadows.length === 0) {
    lines.push("*尚無未回收的伏筆。*");
    lines.push("");
    return lines;
  }

  lines.push("以下伏筆已埋下但尚未回收。本集必須至少延續一條：");
  lines.push("");

  for (const f of foreshadows) {
    lines.push(`- **${f.id}**（${f.planted_episode}）：${f.description}`);
  }
  lines.push("");

  return lines;
}

function buildCharacterSection(constraints: CharacterConstraint[]): string[] {
  const lines: string[] = [];
  lines.push("## 角色特質約束");
  lines.push("");

  if (constraints.length === 0) {
    lines.push("*尚無跨集角色特質資料。請參考角色指南。*");
    lines.push("");
    return lines;
  }

  for (const c of constraints) {
    lines.push(`### ${c.char_name}（${c.char_id}）`);

    if (c.stable_traits.length > 0) {
      lines.push(`- **穩定特質（必須展現）：** ${c.stable_traits.join("、")}`);
    } else {
      lines.push("- **穩定特質：** 尚未建立（集數不足）");
    }

    if (c.recent_variant_traits.length > 0) {
      lines.push(`- **近集變體：** ${c.recent_variant_traits.join("、")}`);
    }

    lines.push("- **本集要求：** 至少展現 1 項穩定特質 + 1 項新變體特質");
    lines.push("");
  }

  return lines;
}

function buildGagSection(gags: GagEvolution[]): string[] {
  const lines: string[] = [];
  lines.push("## 招牌梗演進");
  lines.push("");

  if (gags.length === 0) {
    lines.push("*尚無招牌梗資料。*");
    lines.push("");
    return lines;
  }

  for (const g of gags) {
    lines.push(`### ${g.gag_type}`);
    lines.push("");
    for (const m of g.manifestations) {
      lines.push(`- ${m.ep_id}：${m.label}`);
    }
    lines.push("- 本集期望：演化升級，不要停滯（避免與前集相同的表現方式）");
    lines.push("");
  }

  return lines;
}

function buildInteractionSection(patterns: InteractionPattern[]): string[] {
  const lines: string[] = [];
  lines.push("## 互動模式");
  lines.push("");

  if (patterns.length === 0) {
    lines.push("*尚無目標角色互動資料。*");
    lines.push("");
    return lines;
  }

  for (const p of patterns) {
    if (p.is_first_interaction) {
      lines.push(`- ${p.char_a_name} ↔ ${p.char_b_name}：首次互動，建立兩人關係動態`);
    } else {
      lines.push(
        `- ${p.char_a_name} ↔ ${p.char_b_name}：前集已有互動（${p.history_episodes.join("、")}），本集需深化或展現新面向`
      );
    }
  }

  lines.push("");
  return lines;
}

function buildPacingSection(profile: ScenePacing[]): string[] {
  const lines: string[] = [];
  lines.push("## 節奏參考（前集場景張力）");
  lines.push("");

  if (profile.length === 0) {
    lines.push("*尚無前集節奏資料。*");
    lines.push("");
    return lines;
  }

  lines.push("前集各場景張力分布（供本集節奏設計參考）：");
  lines.push("");

  for (const s of profile) {
    const bar = "█".repeat(Math.round(s.tension * 10)) + "░".repeat(10 - Math.round(s.tension * 10));
    lines.push(`- ${s.label}：${bar} ${s.tension.toFixed(2)}（對話${s.dialog_density.toFixed(1)} 角色${s.character_density.toFixed(1)} 特效${s.effect_density.toFixed(1)}）`);
  }

  // Summary stats
  const avgTension = profile.reduce((sum, s) => sum + s.tension, 0) / profile.length;
  const maxTension = Math.max(...profile.map(s => s.tension));
  const minTension = Math.min(...profile.map(s => s.tension));
  lines.push("");
  lines.push(`平均張力：${avgTension.toFixed(2)}，最高：${maxTension.toFixed(2)}，最低：${minTension.toFixed(2)}`);
  lines.push("建議：本集節奏應有明顯起伏，張力峰值應超過前集平均。");
  lines.push("");

  return lines;
}

function buildThemeSection(clusters: ThemeCluster[]): string[] {
  const lines: string[] = [];
  lines.push("## 主題一致性");
  lines.push("");

  if (clusters.length === 0) {
    lines.push("*尚無主題節點資料。*");
    lines.push("");
    return lines;
  }

  lines.push("已建立的主題及其跨集出現：");
  lines.push("");

  for (const tc of clusters) {
    lines.push(`- **${tc.label}**：出現在 ${tc.episodes.join("、")}（${tc.episodes.length} 集）`);
  }

  lines.push("");
  lines.push("建議：本集至少延續一個已有主題，並可引入一個新主題。");
  lines.push("");

  return lines;
}

function buildTechTermSection(usage: TechTermUsage[]): string[] {
  const lines: string[] = [];
  lines.push("## 科技術語");
  lines.push("");

  if (usage.length === 0) {
    lines.push("*尚無科技術語資料。*");
    lines.push("");
    return lines;
  }

  lines.push("### 已使用（避免重複）");
  lines.push("");

  for (const u of usage) {
    lines.push(`- ${u.ep_id}：${u.terms.join("、")}`);
  }

  // All used terms
  const allTerms = new Set(usage.flatMap(u => u.terms));
  lines.push("");
  lines.push(`共 ${allTerms.size} 個不重複術語。本集應避免重複使用，選擇新術語或創造新的黑話。`);
  lines.push("");

  return lines;
}
