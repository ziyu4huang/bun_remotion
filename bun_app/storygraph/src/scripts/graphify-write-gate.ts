/**
 * Quality gate report writer (Step 3b lite).
 *
 * Reads gate.json + kg-quality-score.json and generates a template-based
 * zh_TW quality gate section. This is the deploy-mode replacement for
 * Claude Code's Tier 2 review (Step 3b).
 *
 * Usage:
 *   bun run src/scripts/graphify-write-gate.ts <series-dir> [options]
 *
 * Options:
 *   --mode regex|ai|hybrid   Enrichment mode (default: hybrid)
 *   --provider <name>        AI provider (default: zai)
 *   --model <name>           AI model (default: glm-4.7-flash)
 */

import { resolve, basename } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { callAI, parseArgsForAI } from "../ai-client";
import { detectSeries, resolveGenre } from "./series-config";
import { buildDialogAssessmentPrompt } from "./subagent-prompt";
import type { StoryGenre } from "./series-config";

// ─── Types ───

interface GateCheck {
  name: string;
  status: "PASS" | "WARN" | "FAIL";
  score_impact: number;
  fix_suggestion_zhTW: string;
}

interface GateJson {
  version: string;
  timestamp: string;
  series: string;
  genre: string;
  generator: { mode: string; model: string; version?: string };
  score: number;
  decision: "PASS" | "WARN" | "FAIL";
  previous_score: number | null;
  score_delta: number | null;
  checks: GateCheck[];
  quality_breakdown: Record<string, number | null>;
  supervisor_hints: {
    focus_areas: string[];
    suggested_rubric_overrides: string[];
    escalation_reason: string | null;
  };
  requires_claude_review: boolean;
}

interface KGAiScore {
  dimensions: Record<string, number>;
  overall: number;
  justification: string;
}

interface KGQualityScore {
  version: string;
  timestamp: string;
  series: string;
  genre: string;
  generator: { mode: string; model: string };
  programmatic: {
    score: number;
    decision: string;
    quality_breakdown: Record<string, number | null>;
  };
  ai: KGAiScore | null;
  blended: {
    overall: number;
    formula: string;
    decision: string;
  };
}

// ─── Exported functions (for module use + CLI) ───

export function buildGateReportZh(gate: GateJson, kgScore: KGQualityScore | null): string {
  const lines: string[] = [];

  const decisionLabel: Record<string, string> = {
    PASS: "通過 ✅",
    WARN: "注意 ⚠️",
    FAIL: "未通過 ❌",
  };
  const blendedDecisionLabel: Record<string, string> = {
    ACCEPT: "通過 ✅",
    REVIEW: "需審查 ⚠️",
    REJECT: "駁回 ❌",
  };

  // Header
  lines.push(`# 品質閘門報告`);
  lines.push(``);
  lines.push(`- **系列：** ${gate.series}`);
  lines.push(`- **類型：** ${gate.genre}`);
  lines.push(`- **產生時間：** ${new Date(gate.timestamp).toLocaleString("zh-TW")}`);
  lines.push(`- **產生器：** ${gate.generator.mode}/${gate.generator.model}${gate.generator.version ? ` v${gate.generator.version}` : ""}`);
  lines.push(``);

  // Overall score
  const scoreIcon = gate.score >= 70 ? "✅" : gate.score >= 40 ? "⚠️" : "❌";
  lines.push(`## 總評`);
  lines.push(``);
  lines.push(`- **程式化評分：** ${scoreIcon} ${gate.score}/100 (${decisionLabel[gate.decision] ?? gate.decision})`);

  if (gate.previous_score !== null && gate.score_delta !== null) {
    const deltaStr = gate.score_delta >= 0 ? `+${gate.score_delta}` : `${gate.score_delta}`;
    const deltaIcon = gate.score_delta >= 0 ? "📈" : "📉";
    lines.push(`- **趨勢：** ${deltaIcon} ${deltaStr} 分（上次：${gate.previous_score}）`);
  }

  if (kgScore?.blended) {
    const b = kgScore.blended;
    const bIcon = b.overall >= 0.7 ? "✅" : b.overall >= 0.4 ? "⚠️" : "❌";
    lines.push(`- **綜合評分：** ${bIcon} ${(b.overall * 100).toFixed(1)}% (${blendedDecisionLabel[b.decision] ?? b.decision})`);
    lines.push(`- **公式：** ${b.formula}`);
  }

  if (gate.requires_claude_review) {
    lines.push(`- **升級狀態：** 🚨 建議由 Claude Code 進行 Tier 2 審查`);
    if (gate.supervisor_hints.escalation_reason) {
      lines.push(`  - 原因：${gate.supervisor_hints.escalation_reason}`);
    }
  }
  lines.push(``);

  // Per-dimension breakdown
  const dimLabels: Record<string, string> = {
    consistency: "角色一致性",
    arc_structure: "劇情弧線",
    pacing: "節奏掌控",
    character_growth: "角色成長",
    thematic_coherence: "主題連貫性",
    gag_evolution: "笑點演進",
  };

  lines.push(`## 各維度評分`);
  lines.push(``);
  lines.push(`| 維度 | 評分 | 狀態 |`);
  lines.push(`|------|------|------|`);

  for (const [dim, score] of Object.entries(gate.quality_breakdown)) {
    if (score === null) continue;
    const label = dimLabels[dim] ?? dim;
    const pct = (score * 100).toFixed(0);
    const icon = score >= 0.7 ? "✅" : score >= 0.4 ? "⚠️" : "❌";
    lines.push(`| ${label} | ${pct}% | ${icon} |`);
  }
  lines.push(``);

  // AI dimension scores
  if (kgScore?.ai) {
    const aiDimLabels: Record<string, string> = {
      entity_accuracy: "實體準確性",
      relationship_correctness: "關係正確性",
      completeness: "完整性",
      cross_episode_coherence: "跨集連貫性",
      actionability: "可操作性",
    };

    lines.push(`### AI 評分維度`);
    lines.push(``);
    lines.push(`| 維度 | 分數 (0-10) |`);
    lines.push(`|------|-------------|`);

    for (const [dim, score] of Object.entries(kgScore.ai.dimensions)) {
      if (score === null) continue;
      const label = aiDimLabels[dim] ?? dim;
      const bar = "█".repeat(Math.round(score));
      lines.push(`| ${label} | ${bar} ${score}/10 |`);
    }
    lines.push(``);
    lines.push(`> **AI 評語：** ${kgScore.ai.justification}`);
    lines.push(``);
  }

  // Issues
  const warnChecks = gate.checks.filter(c => c.status === "WARN");
  const failChecks = gate.checks.filter(c => c.status === "FAIL");

  if (failChecks.length > 0 || warnChecks.length > 0) {
    lines.push(`## 發現問題`);
    lines.push(``);

    if (failChecks.length > 0) {
      lines.push(`### ❌ 嚴重問題 (${failChecks.length})`);
      lines.push(``);
      for (const c of deduplicateChecks(failChecks)) {
        lines.push(`- **${c.name}**`);
        if (c.fix_suggestion_zhTW && !c.fix_suggestion_zhTW.startsWith("(see")) {
          lines.push(`  - 建議：${c.fix_suggestion_zhTW}`);
        }
      }
      lines.push(``);
    }

    if (warnChecks.length > 0) {
      lines.push(`### ⚠️ 需注意 (${warnChecks.length})`);
      lines.push(``);
      for (const c of deduplicateChecks(warnChecks)) {
        lines.push(`- **${c.name}**`);
        if (c.fix_suggestion_zhTW && !c.fix_suggestion_zhTW.startsWith("(see")) {
          lines.push(`  - 建議：${c.fix_suggestion_zhTW}`);
        }
      }
      lines.push(``);
    }
  }

  // Supervisor hints
  if (gate.supervisor_hints.focus_areas.length > 0) {
    lines.push(`## 關注焦點`);
    lines.push(``);
    for (const area of gate.supervisor_hints.focus_areas.slice(0, 10)) {
      lines.push(`- ${area}`);
    }
    if (gate.supervisor_hints.focus_areas.length > 10) {
      lines.push(`- ...以及其他 ${gate.supervisor_hints.focus_areas.length - 10} 項`);
    }
    lines.push(``);
  }

  // Pass summary
  const passChecks = gate.checks.filter(c => c.status === "PASS");
  const passGroups = groupChecks(passChecks);
  if (passGroups.size > 0) {
    lines.push(`## 通過項目`);
    lines.push(``);
    for (const [group, checks] of passGroups) {
      const count = checks.length;
      lines.push(`- **${group}：** ${count} 項通過`);
    }
    lines.push(``);
  }

  // Summary stats
  lines.push(`## 統計`);
  lines.push(``);
  lines.push(`| 指標 | 數值 |`);
  lines.push(`|------|------|`);
  lines.push(`| 通過 (PASS) | ${passChecks.length} |`);
  lines.push(`| 注意 (WARN) | ${warnChecks.length} |`);
  lines.push(`| 嚴重 (FAIL) | ${failChecks.length} |`);
  lines.push(`| 總檢查數 | ${gate.checks.length} |`);
  lines.push(``);

  return lines.join("\n");
}

function deduplicateChecks(checks: GateCheck[]): GateCheck[] {
  const seen = new Map<string, GateCheck>();
  for (const c of checks) {
    const group = c.name.split(":")[0];
    if (!seen.has(group)) {
      const count = checks.filter(x => x.name.split(":")[0] === group).length;
      const name = count > 1 ? `${group} (${count}項)` : c.name;
      seen.set(group, { ...c, name });
    }
  }
  return [...seen.values()];
}

function groupChecks(checks: GateCheck[]): Map<string, GateCheck[]> {
  const groups = new Map<string, GateCheck[]>();
  for (const c of checks) {
    const group = c.name.split(":")[0];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(c);
  }
  return groups;
}

// ─── CLI (guarded) ───

if (import.meta.main) {
  void main();
}

async function main() {
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`graphify-write-gate — Template-based zh_TW quality gate report (Step 3b lite)

Usage:
  bun run src/scripts/graphify-write-gate.ts <series-dir> [options]

Options:
  --mode regex|ai|hybrid   Enrichment mode (default: hybrid)
  --provider <name>        AI provider (default: zai)
  --model <name>           AI model (default: glm-4.7-flash)

Reads storygraph_out/gate.json [+ kg-quality-score.json].
Outputs storygraph_out/gate-report.md with zh_TW quality assessment.
`);
  process.exit(0);
}

const aiConfig = parseArgsForAI(args);
const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path. Use absolute paths.`);
  process.exit(1);
}

const gatePath = resolve(seriesDir, "storygraph_out", "gate.json");
const kgScorePath = resolve(seriesDir, "storygraph_out", "kg-quality-score.json");
const outputPath = resolve(seriesDir, "storygraph_out", "gate-report.md");

if (!existsSync(gatePath)) {
  console.error(`No gate.json found at ${gatePath}`);
  console.error(`Run graphify-check first.`);
  process.exit(1);
}

const gate: GateJson = JSON.parse(readFileSync(gatePath, "utf-8"));
const kgScore: KGQualityScore | null = existsSync(kgScorePath)
  ? JSON.parse(readFileSync(kgScorePath, "utf-8"))
  : null;

const seriesConfig = detectSeries(seriesDir);
const genre: StoryGenre = seriesConfig ? resolveGenre(seriesConfig) : "generic";

console.log(`Generating zh_TW gate report...`);
console.log(`  Series: ${gate.series}, Genre: ${genre}`);
console.log(`  Gate: ${gate.score}/100 (${gate.decision})`);
if (kgScore) {
  console.log(`  KG Score: ${(kgScore.blended.overall * 100).toFixed(1)}% (${kgScore.blended.decision})`);
}

// ─── Build template report ───

let report = buildGateReportZh(gate, kgScore);

// ─── Optional AI enrichment ───

if (aiConfig.mode !== "regex") {
  console.log(`\n[AI mode] Calling ${aiConfig.provider}/${aiConfig.model} for zh_TW assessment...`);

  const prompt = buildDialogAssessmentPrompt({
    series_name: seriesConfig?.displayName ?? gate.series,
    genre,
    episode_count: gate.checks.filter(c => c.name.startsWith("Pacing:")).length || 1,
    gate_score: gate.score,
    gate_decision: gate.decision,
    warn_checks: gate.checks.filter(c => c.status === "WARN"),
    fail_checks: gate.checks.filter(c => c.status === "FAIL"),
    quality_breakdown: gate.quality_breakdown,
    ai_scores: kgScore?.ai ?? null,
    supervisor_hints: gate.supervisor_hints.focus_areas,
  });

  const aiResult = await callAI(prompt, {
    provider: aiConfig.provider,
    model: aiConfig.model,
    jsonMode: false,
    maxRetries: 1,
  });

  if (aiResult) {
    report += `\n## AI 品質評估\n\n${aiResult}\n`;

    // Parse fix suggestions from AI response
    const jsonMatch = aiResult.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const suggestions = JSON.parse(jsonMatch[1]);
        if (Array.isArray(suggestions)) {
          // Update gate.json fix_suggestions with AI suggestions
          const suggestionMap = new Map<string, string>();
          for (const s of suggestions) {
            if (s.check_name && s.fix_suggestion_zhTW) {
              suggestionMap.set(s.check_name, s.fix_suggestion_zhTW);
            }
          }

          if (suggestionMap.size > 0) {
            let updated = false;
            for (const check of gate.checks) {
              if (check.status !== "PASS" && suggestionMap.has(check.name)) {
                check.fix_suggestion_zhTW = suggestionMap.get(check.name)!;
                updated = true;
              }
            }
            if (updated) {
              writeFileSync(gatePath, JSON.stringify(gate, null, 2));
              console.log(`  Updated gate.json with ${suggestionMap.size} AI fix suggestions`);
            }
          }
        }
      } catch {
        // JSON parsing failed — suggestions stay empty
      }
    }

    console.log(`  AI assessment written`);
  } else {
    report += `\n## AI 品質評估\n\n*(AI 評估失敗，請手動檢查 consistency-report.md)*\n`;
    console.warn(`  AI call returned null`);
  }
}

writeFileSync(outputPath, report);
console.log(`\nGate report: ${outputPath}`);
} // end main()
