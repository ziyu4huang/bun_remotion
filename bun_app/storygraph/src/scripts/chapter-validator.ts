/**
 * Chapter validator — checks plan-struct.json against structural rules.
 *
 * Runs plan-parser first if plan-struct.json is missing or stale.
 *
 * Usage:
 *   bun run src/scripts/chapter-validator.ts <series-dir> [options]
 *
 * Output: <series-dir>/storygraph_out/plan-validation.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";
import { parsePlan } from "./plan-parser";
import type { PlanStruct, EpisodeDef, ChapterSummary } from "./plan-parser";
import { detectSeries } from "./series-config";
import type { SeriesConfig } from "./series-config";

// ─── Types ───

export interface ValidationError {
  rule: string;
  message: string;
  chapter?: number;
  episode?: string;
  evidence?: string[];
}

export interface ValidationWarning {
  rule: string;
  message: string;
  chapter?: number;
  episode?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: {
    totalEpisodes: number;
    completedEpisodes: number;
    chaptersChecked: number;
  };
}

interface RuleResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ─── Rules ───

function checkEpisodeCount(plan: PlanStruct): RuleResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!plan.chapterRules || !plan.episodeGuide) return { errors, warnings };

  // Extract min-max from rule text like "Episode count: Each chapter MUST have 3-5 episodes"
  const countRule = plan.chapterRules.find(r =>
    r.toLowerCase().includes("episode count") || r.toLowerCase().includes("episodes per chapter")
  );
  if (!countRule) return { errors, warnings };

  const rangeMatch = countRule.match(/(\d+)\s*[-–]\s*(\d+)\s*episodes?/i);
  if (!rangeMatch) return { errors, warnings };

  const min = parseInt(rangeMatch[1], 10);
  const max = parseInt(rangeMatch[2], 10);

  for (const ch of plan.chapters) {
    if (ch.episodeCount < min) {
      errors.push({
        rule: "EPISODE_COUNT",
        message: `Chapter ${ch.chapter} has ${ch.episodeCount} episodes, minimum is ${min}`,
        chapter: ch.chapter,
      });
    } else if (ch.episodeCount > max) {
      errors.push({
        rule: "EPISODE_COUNT",
        message: `Chapter ${ch.chapter} has ${ch.episodeCount} episodes, maximum is ${max}`,
        chapter: ch.chapter,
      });
    }
  }

  return { errors, warnings };
}

function checkSequentialCompletion(plan: PlanStruct): RuleResult {
  const warnings: ValidationWarning[] = [];
  if (!plan.episodeGuide) return { errors: [], warnings };

  const byChapter = new Map<number, EpisodeDef[]>();
  for (const ep of plan.episodeGuide) {
    if (ep.chapter === null) continue;
    if (!byChapter.has(ep.chapter)) byChapter.set(ep.chapter, []);
    byChapter.get(ep.chapter)!.push(ep);
  }

  for (const [, eps] of byChapter) {
    const sorted = [...eps].sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const isComplete = current.status.toLowerCase().includes("complete") ||
        current.status.toLowerCase().includes("rendered");

      // Check if a later episode is already complete while this one is planned
      if (!isComplete && current.status.toLowerCase().includes("planned")) {
        for (let j = i + 1; j < sorted.length; j++) {
          const later = sorted[j];
          const laterComplete = later.status.toLowerCase().includes("complete") ||
            later.status.toLowerCase().includes("rendered");
          if (laterComplete) {
            warnings.push({
              rule: "SEQUENTIAL_COMPLETION",
              message: `${current.id} is Planned but ${later.id} is ${later.status}`,
              episode: current.id,
            });
          }
        }
      }
    }
  }

  return { errors: [], warnings };
}

function checkCharacterConsistency(plan: PlanStruct): RuleResult {
  const errors: ValidationError[] = [];
  if (!plan.characters || !plan.episodeGuide) return { errors, warnings: [] };

  const charIds = new Set(plan.characters.map(c => c.id.toLowerCase()));

  for (const ep of plan.episodeGuide) {
    for (const charId of ep.characters) {
      if (!charIds.has(charId)) {
        errors.push({
          rule: "CHARACTER_CONSISTENCY",
          message: `Episode ${ep.id} references undefined character "${charId}"`,
          episode: ep.id,
        });
      }
    }
  }

  return { errors, warnings: [] };
}

function checkArcPositionValidity(plan: PlanStruct): RuleResult {
  const warnings: ValidationWarning[] = [];
  if (!plan.storyArcs || !plan.episodeGuide) return { errors: [], warnings };

  const epIds = new Set(plan.episodeGuide.map(e => e.id));

  for (const arc of plan.storyArcs) {
    for (const ep of arc.episodes) {
      if (!epIds.has(ep.id)) {
        warnings.push({
          rule: "ARC_POSITION_VALIDITY",
          message: `Story arc Ch${arc.chapter} references ${ep.id} not in episode guide`,
          chapter: arc.chapter,
          episode: ep.id,
        });
      }
    }
  }

  return { errors: [], warnings };
}

function checkGagEvolutionMinimum(plan: PlanStruct): RuleResult {
  const warnings: ValidationWarning[] = [];
  if (!plan.runningGags || !plan.episodeGuide || !plan.gagRules) return { errors: [], warnings };

  // Extract minimum from rule text like "每集至少推進 2 條梗"
  const minRule = plan.gagRules.find(r => r.includes("至少"));
  if (!minRule) return { errors: [], warnings };

  const numMatch = minRule.match(/(\d+)/);
  if (!numMatch) return { errors: [], warnings };

  const minimum = parseInt(numMatch[1], 10);

  // Count gags per episode
  const gagCountPerEp = new Map<string, number>();
  for (const gagType of plan.runningGags.gagTypes) {
    const manifestations = plan.runningGags.matrix[gagType] ?? {};
    for (const epId of Object.keys(manifestations)) {
      gagCountPerEp.set(epId, (gagCountPerEp.get(epId) ?? 0) + 1);
    }
  }

  for (const ep of plan.episodeGuide) {
    const count = gagCountPerEp.get(ep.id) ?? 0;
    if (count < minimum) {
      warnings.push({
        rule: "GAG_EVOLUTION_MINIMUM",
        message: `${ep.id} has ${count} gag manifestations, minimum is ${minimum}`,
        episode: ep.id,
      });
    }
  }

  return { errors: [], warnings };
}

function checkDuplicateEpisodeIds(plan: PlanStruct): RuleResult {
  const errors: ValidationError[] = [];
  if (!plan.episodeGuide) return { errors, warnings: [] };

  const seen = new Map<string, number>();
  for (const ep of plan.episodeGuide) {
    const count = seen.get(ep.id) ?? 0;
    seen.set(ep.id, count + 1);
  }

  for (const [id, count] of seen) {
    if (count > 1) {
      errors.push({
        rule: "DUPLICATE_EPISODE_IDS",
        message: `Episode ID "${id}" appears ${count} times`,
        episode: id,
      });
    }
  }

  return { errors, warnings: [] };
}

function checkEpisodeIdFormat(plan: PlanStruct): RuleResult {
  const warnings: ValidationWarning[] = [];
  if (!plan.episodeGuide) return { errors: [], warnings };

  const validPattern = /^(ch\d+ep\d+|ep\d+)$/;

  for (const ep of plan.episodeGuide) {
    if (!validPattern.test(ep.id)) {
      warnings.push({
        rule: "EPISODE_ID_FORMAT",
        message: `Episode ID "${ep.id}" has unexpected format`,
        episode: ep.id,
      });
    }
  }

  return { errors: [], warnings };
}

function checkMissingRequiredSections(plan: PlanStruct): RuleResult {
  const errors: ValidationError[] = [];

  if (!plan.characters) {
    errors.push({
      rule: "MISSING_REQUIRED_SECTIONS",
      message: "PLAN.md has no Characters table",
    });
  }

  if (!plan.episodeGuide) {
    errors.push({
      rule: "MISSING_REQUIRED_SECTIONS",
      message: "PLAN.md has no Episode Guide table",
    });
  }

  return { errors, warnings: [] };
}

// ─── Main Validator ───

export function validatePlan(
  plan: PlanStruct,
  _config?: SeriesConfig | null,
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationWarning[] = [];

  const rules = [
    checkMissingRequiredSections,
    checkEpisodeCount,
    checkSequentialCompletion,
    checkCharacterConsistency,
    checkArcPositionValidity,
    checkGagEvolutionMinimum,
    checkDuplicateEpisodeIds,
    checkEpisodeIdFormat,
  ];

  for (const rule of rules) {
    const result = rule(plan);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  const totalEpisodes = plan.episodeGuide?.length ?? 0;
  const completedEpisodes = plan.episodeGuide?.filter(e =>
    e.status.toLowerCase().includes("complete") ||
    e.status.toLowerCase().includes("rendered")
  ).length ?? 0;

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    stats: {
      totalEpisodes,
      completedEpisodes,
      chaptersChecked: plan.chapters.length,
    },
  };
}

// ─── CLI Entry ───

if (import.meta.main) {
const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(`chapter-validator — Validate PLAN.md structure against rules

Usage:
  bun run src/scripts/chapter-validator.ts <series-dir> [options]

Options:
  --mode regex|ai|hybrid   Parser mode for plan-parser (default: regex)

Output:
  <series-dir>/storygraph_out/plan-validation.json

Runs plan-parser first if plan-struct.json is missing or stale.
`);
  process.exit(0);
}

const seriesDir = resolve(args[0]);
if (!seriesDir.startsWith("/")) {
  console.error(`Error: "${seriesDir}" is not an absolute path.`);
  process.exit(1);
}

const outDir = resolve(seriesDir, "storygraph_out");
const structPath = resolve(outDir, "plan-struct.json");
const planPath = resolve(seriesDir, "PLAN.md");

// Run plan-parser if struct is missing or stale
if (!existsSync(structPath) ||
    (existsSync(planPath) && existsSync(structPath) &&
     statSync(planPath).mtimeMs > statSync(structPath).mtimeMs)) {
  console.log("Running plan-parser first...");
  const { execSync } = await import("node:child_process");
  const modeFlag = args.includes("--mode") ? `--mode ${args[args.indexOf("--mode") + 1]}` : "--mode regex";
  execSync(`bun run ${resolve(import.meta.dir, "plan-parser.ts")} ${seriesDir} ${modeFlag}`, {
    stdio: "inherit",
  });
}

if (!existsSync(structPath)) {
  console.error(`plan-struct.json not found at ${structPath}`);
  process.exit(1);
}

const plan: PlanStruct = JSON.parse(readFileSync(structPath, "utf-8"));
const config = detectSeries(seriesDir);
const result = validatePlan(plan, config);

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "plan-validation.json"), JSON.stringify(result, null, 2));

console.log(`\nValidation: ${result.valid ? "PASS" : "FAIL"}`);
console.log(`  Errors: ${result.errors.length}, Warnings: ${result.warnings.length}`);
console.log(`  Episodes: ${result.stats.totalEpisodes} total, ${result.stats.completedEpisodes} completed, ${result.stats.chaptersChecked} chapters`);

if (result.errors.length > 0) {
  console.log("\nErrors:");
  for (const e of result.errors) {
    console.log(`  [${e.rule}] ${e.message}`);
  }
}

if (result.warnings.length > 0) {
  console.log("\nWarnings:");
  for (const w of result.warnings) {
    console.log(`  [${w.rule}] ${w.message}`);
  }
}
}
