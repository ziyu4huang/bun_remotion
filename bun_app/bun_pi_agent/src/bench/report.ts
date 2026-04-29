/**
 * GLM5 Benchmark — types and report generation.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KGModelResult {
  model: string;
  gateScore: number | null;
  blendedScore: number | null;
  nodeCount: number;
  edgeCount: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface AgentTaskResult {
  taskId: string;
  taskName: string;
  model: string;
  toolUseScore: number;   // 0-4
  responseScore: number;  // 0-3
  efficiencyScore: number; // 0-3
  totalScore: number;     // 0-10
  toolCalls: string[];
  textLength: number;
  durationMs: number;
  turnCount: number;
  toolCallBudget: number;
  budgetExceeded: boolean;
  error?: string;
}

export interface BenchmarkReport {
  date: string;
  seriesDir: string;
  models: string[];
  kgResults: KGModelResult[];
  agentResults: AgentTaskResult[];
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

export function generateReport(report: BenchmarkReport): string {
  const lines: string[] = [];

  lines.push(`# GLM5 Model Benchmark Report`);
  lines.push(`Date: ${report.date}`);
  lines.push(`Models: ${report.models.join(", ")}`);
  lines.push(``);

  // --- Suite A: KG Quality ---
  if (report.kgResults.length > 0) {
    lines.push(`## Suite A: KG Quality`);
    lines.push(``);
    lines.push(`| Model | Gate | Blended | Nodes | Edges | Duration | Status |`);
    lines.push(`|-------|------|---------|-------|-------|----------|--------|`);
    for (const r of report.kgResults) {
      const gate = r.gateScore !== null ? r.gateScore.toFixed(1) : "-";
      const blended = r.blendedScore !== null ? r.blendedScore.toFixed(1) : "-";
      const dur = (r.durationMs / 1000).toFixed(1) + "s";
      const status = r.success ? "OK" : `FAIL: ${r.error ?? "unknown"}`;
      lines.push(`| ${r.model} | ${gate} | ${blended} | ${r.nodeCount} | ${r.edgeCount} | ${dur} | ${status} |`);
    }
    lines.push(``);
  }

  // --- Suite B: Agent Coding ---
  if (report.agentResults.length > 0) {
    lines.push(`## Suite B: Agent Coding`);
    lines.push(``);

    // Per-model summary
    const taskIds = [...new Set(report.agentResults.map(r => r.taskId))];
    const models = [...new Set(report.agentResults.map(r => r.model))];

    // Header
    const header = `| Model | ${taskIds.map(id => {
      const num = id.split("-")[0].replace("task", "");
      return `T${num}`;
    }).join(" | ")} | Avg |`;
    const sep = `|-------|${taskIds.map(() => "------").join("|")}|------|`;
    lines.push(header);
    lines.push(sep);

    for (const model of models) {
      const modelResults = report.agentResults.filter(r => r.model === model);
      const scores = taskIds.map(tid => {
        const r = modelResults.find(r => r.taskId === tid);
        return r ? `${r.totalScore}/10` : "-";
      });
      const avg = modelResults.length > 0
        ? (modelResults.reduce((s, r) => s + r.totalScore, 0) / modelResults.length).toFixed(1)
        : "-";
      lines.push(`| ${model} | ${scores.join(" | ")} | ${avg} |`);
    }
    lines.push(``);

    // Model efficiency summary
    lines.push(`### Model Efficiency Summary`);
    lines.push(``);
    lines.push(`| Model | Avg Score | Avg Tool Calls | Avg Turns | Budget Exceeded | Avg Duration |`);
    lines.push(`|-------|-----------|----------------|-----------|-----------------|--------------|`);
    for (const model of models) {
      const modelResults = report.agentResults.filter(r => r.model === model && !r.error);
      if (modelResults.length === 0) continue;
      const avgScore = (modelResults.reduce((s, r) => s + r.totalScore, 0) / modelResults.length).toFixed(1);
      const avgCalls = (modelResults.reduce((s, r) => s + r.toolCalls.length, 0) / modelResults.length).toFixed(1);
      const avgTurns = (modelResults.reduce((s, r) => s + r.turnCount, 0) / modelResults.length).toFixed(1);
      const budgetHits = modelResults.filter(r => r.budgetExceeded).length;
      const avgDur = (modelResults.reduce((s, r) => s + r.durationMs, 0) / modelResults.length / 1000).toFixed(1);
      lines.push(`| ${model} | ${avgScore} | ${avgCalls} | ${avgTurns} | ${budgetHits} | ${avgDur}s |`);
    }
    lines.push(``);

    // Detailed results
    lines.push(`### Detail`);
    lines.push(``);
    for (const r of report.agentResults) {
      const budgetTag = r.budgetExceeded ? " **BUDGET EXCEEDED**" : "";
      lines.push(`**${r.model} / ${r.taskName}** (${r.totalScore}/10)${budgetTag}`);
      lines.push(`  Tool use: ${r.toolUseScore}/4 | Response: ${r.responseScore}/3 | Efficiency: ${r.efficiencyScore}/3`);
      lines.push(`  Tools called: ${r.toolCalls.length}/${r.toolCallBudget} (${r.toolCalls.join(", ") || "none"})`);
      lines.push(`  Turns: ${r.turnCount} | Duration: ${(r.durationMs / 1000).toFixed(1)}s`);
      if (r.error) lines.push(`  Error: ${r.error}`);
      lines.push(``);
    }

    // Recommendation
    lines.push(`### Recommendation`);
    lines.push(``);
    const successfulModels = models.filter(m => {
      const results = report.agentResults.filter(r => r.model === m && !r.error);
      return results.length > 0;
    });

    if (successfulModels.length > 0) {
      const getModelAvg = (m: string) => {
        const results = report.agentResults.filter(r => r.model === m && !r.error);
        return results.length > 0 ? results.reduce((s, r) => s + r.totalScore, 0) / results.length : 0;
      };
      const getModelDuration = (m: string) => {
        return report.agentResults.filter(r => r.model === m && !r.error).reduce((s, r) => s + r.durationMs, 0);
      };
      const getModelEfficiency = (m: string) => {
        const results = report.agentResults.filter(r => r.model === m && !r.error);
        return results.length > 0 ? results.reduce((s, r) => s + r.efficiencyScore, 0) / results.length : 0;
      };
      const getModelBudgetHits = (m: string) => {
        return report.agentResults.filter(r => r.model === m && !r.error).filter(r => r.budgetExceeded).length;
      };

      // Best quality (highest avg score)
      const bestQuality = [...successfulModels].sort((a, b) => getModelAvg(b) - getModelAvg(a))[0];
      lines.push(`- **Best quality:** ${bestQuality} (avg ${getModelAvg(bestQuality).toFixed(1)}/10)`);

      // Best efficiency (highest avg efficiency score)
      const bestEfficiency = [...successfulModels].sort((a, b) => getModelEfficiency(b) - getModelEfficiency(a))[0];
      lines.push(`- **Best efficiency:** ${bestEfficiency} (avg efficiency ${getModelEfficiency(bestEfficiency).toFixed(1)}/3)`);

      // Best speed (lowest total duration)
      const bestSpeed = [...successfulModels].sort((a, b) => getModelDuration(a) - getModelDuration(b))[0];
      lines.push(`- **Best speed:** ${bestSpeed} (${(getModelDuration(bestSpeed) / 1000).toFixed(1)}s total)`);

      // Best value (quality × efficiency / duration, normalized)
      const valueScores = new Map(successfulModels.map(m => {
        const avg = getModelAvg(m);
        const eff = getModelEfficiency(m);
        const dur = getModelDuration(m) || 1;
        const budgetHits = getModelBudgetHits(m);
        // Penalize budget-exceeded models
        const penalty = budgetHits > 0 ? 0.8 : 1;
        return [m, (avg * eff * penalty) / (dur / 1000)] as const;
      }));
      const bestValue = [...successfulModels].sort((a, b) => (valueScores.get(b) ?? 0) - (valueScores.get(a) ?? 0))[0];
      lines.push(`- **Best value:** ${bestValue}`);

      if (bestQuality === bestSpeed && bestQuality === bestEfficiency) {
        lines.push(`- **Recommended default:** ${bestQuality} (sweeps all categories)`);
      } else if (bestQuality === bestSpeed) {
        lines.push(`- **Recommended default:** ${bestQuality} (best quality + speed)`);
      } else {
        lines.push(`- **Recommended default:** ${bestValue} (best quality/speed/efficiency tradeoff)`);
      }
    }
    lines.push(``);
  }

  return lines.join("\n");
}
