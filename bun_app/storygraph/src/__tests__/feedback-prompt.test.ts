import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { buildEnrichmentFeedbackPrompt } from "../scripts/subagent-prompt";

const TMP = resolve(import.meta.dir, "__tmp_feedback__");

beforeEach(() => { mkdirSync(TMP, { recursive: true }); });
afterEach(() => { rmSync(TMP, { recursive: true }); });

describe("buildEnrichmentFeedbackPrompt", () => {
  test("returns empty string when gate.json missing", () => {
    const result = buildEnrichmentFeedbackPrompt({
      episode_id: "ch1ep1",
      gateJsonPath: resolve(TMP, "nonexistent.json"),
      consistencyReportPath: resolve(TMP, "nonexistent.md"),
    });
    expect(result).toBe("");
  });

  test("returns empty string when all checks PASS", () => {
    writeFileSync(resolve(TMP, "gate.json"), JSON.stringify({
      checks: [
        { name: "Trait Coverage", status: "PASS", score_impact: 5 },
        { name: "Interaction Density", status: "PASS", score_impact: 5 },
      ],
    }));
    const result = buildEnrichmentFeedbackPrompt({
      episode_id: "ch1ep1",
      gateJsonPath: resolve(TMP, "gate.json"),
      consistencyReportPath: resolve(TMP, "report.md"),
    });
    expect(result).toBe("");
  });

  test("generates feedback from gate.json WARNs without report", () => {
    writeFileSync(resolve(TMP, "gate.json"), JSON.stringify({
      checks: [
        { name: "Trait Coverage", status: "WARN", score_impact: -0.2 },
        { name: "Interaction Density", status: "PASS", score_impact: 5 },
        { name: "Community Cohesion", status: "WARN", score_impact: -0.1 },
      ],
    }));
    const result = buildEnrichmentFeedbackPrompt({
      episode_id: "ch1ep1",
      gateJsonPath: resolve(TMP, "gate.json"),
      consistencyReportPath: resolve(TMP, "report.md"),
    });
    expect(result).toContain("上次提取的問題回饋");
    expect(result).toContain("Trait Coverage");
    expect(result).toContain("Community Cohesion");
    expect(result).toContain("全系列問題類型");
    expect(result).not.toContain("本集特定問題");
  });

  test("includes episode-specific feedback from report", () => {
    writeFileSync(resolve(TMP, "gate.json"), JSON.stringify({
      checks: [
        { name: "Trait Coverage", status: "WARN", score_impact: -0.2 },
      ],
    }));
    writeFileSync(resolve(TMP, "report.md"), [
      "## Trait Coverage",
      "### ⚠️ Trait Coverage — WARN",
      "ch1ep1_char_linyi has no detected traits (regex missed: baseline has 7)",
      "### ⚠️ Trait Coverage — WARN",
      "ch1ep2_char_linyi has no detected traits (regex missed: baseline has 7)",
    ].join("\n"));

    const result = buildEnrichmentFeedbackPrompt({
      episode_id: "ch1ep1",
      gateJsonPath: resolve(TMP, "gate.json"),
      consistencyReportPath: resolve(TMP, "report.md"),
    });
    expect(result).toContain("本集特定問題");
    expect(result).toContain("ch1ep1_char_linyi");
    expect(result).not.toContain("ch1ep2_char_linyi");
  });

  test("limits episode-specific lines to 8", () => {
    writeFileSync(resolve(TMP, "gate.json"), JSON.stringify({
      checks: [{ name: "Trait Coverage", status: "WARN", score_impact: -0.2 }],
    }));
    const lines = Array.from({ length: 15 }, (_, i) =>
      `### ⚠️ Some Check — WARN\nch1ep1_item_${i} detail here`
    );
    writeFileSync(resolve(TMP, "report.md"), lines.join("\n"));

    const result = buildEnrichmentFeedbackPrompt({
      episode_id: "ch1ep1",
      gateJsonPath: resolve(TMP, "gate.json"),
      consistencyReportPath: resolve(TMP, "report.md"),
    });
    const epLines = result.split("\n").filter(l => l.startsWith("- ") && l.includes("ch1ep1"));
    expect(epLines.length).toBe(8);
  });
});
