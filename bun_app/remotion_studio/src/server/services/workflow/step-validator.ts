/**
 * Step validator — pre-execution checks for workflow DAG steps.
 *
 * Verifies that storygraph steps (pipeline/check/score) can actually run
 * before the DAG executor dispatches them. Returns structured validation
 * results with actionable error messages.
 */

import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { PROJ_DIR } from "./templates";
import type { WorkflowStepKind } from "../../../shared/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const STORYGRAPH_STEPS: Set<WorkflowStepKind> = new Set(["pipeline", "check", "score"]);

/**
 * Validate that a step's preconditions are met before execution.
 * Returns { valid, errors, warnings } with actionable messages.
 */
export function validateStep(
  kind: WorkflowStepKind,
  options: { seriesId?: string; episodePath?: string; images?: unknown[] },
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (STORYGRAPH_STEPS.has(kind)) {
    validateStorygraphStep(kind, options, errors, warnings);
  } else if (kind === "scaffold") {
    validateScaffoldStep(options, errors, warnings);
  } else if (kind === "tts") {
    validateTtsStep(options, errors, warnings);
  } else if (kind === "render") {
    validateRenderStep(options, errors, warnings);
  } else if (kind === "image") {
    validateImageStep(options, errors, warnings);
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateStorygraphStep(
  kind: WorkflowStepKind,
  options: { seriesId?: string },
  errors: string[],
  warnings: string[],
): void {
  if (!options.seriesId) {
    errors.push("seriesId is required for storygraph steps");
    return;
  }

  const seriesDir = resolve(PROJ_DIR, options.seriesId);
  if (!existsSync(seriesDir)) {
    errors.push(
      `Series directory not found: ${seriesDir}`,
      `Fix: ensure series "${options.seriesId}" exists under bun_remotion_proj/`,
    );
    return;
  }

  // Check step-specific prerequisites
  if (kind === "pipeline") {
    // Pipeline needs episodes to process
    const entries = findEpisodeDirs(seriesDir);
    if (entries.length === 0) {
      warnings.push(
        `No episode directories found in ${seriesDir}. Pipeline may produce empty results.`,
      );
    }
  }

  if (kind === "check" || kind === "score") {
    const outDir = resolve(seriesDir, "storygraph_out");
    if (!existsSync(outDir)) {
      errors.push(
        `No storygraph_out/ directory found for "${options.seriesId}"`,
        `Fix: run the pipeline step first to generate knowledge graph artifacts`,
      );
      return;
    }

    if (kind === "check") {
      // Check needs merged-graph.json
      const mergedPath = resolve(outDir, "merged-graph.json");
      if (!existsSync(mergedPath)) {
        errors.push(
          `merged-graph.json not found — pipeline extraction must complete first`,
          `Fix: run the pipeline step to generate the merged graph`,
        );
      }
    }

    if (kind === "score") {
      // Score needs gate.json (from check)
      const gatePath = resolve(outDir, "gate.json");
      if (!existsSync(gatePath)) {
        errors.push(
          `gate.json not found — quality check must complete first`,
          `Fix: run the check step before scoring`,
        );
      }
    }
  }
}

function validateScaffoldStep(
  options: { seriesId?: string },
  errors: string[],
  _warnings: string[],
): void {
  if (!options.seriesId) {
    errors.push("seriesId is required for scaffold step");
  }
  // Series dir doesn't need to exist yet — scaffold creates it
}

function validateTtsStep(
  options: { seriesId?: string; episodePath?: string },
  errors: string[],
  warnings: string[],
): void {
  if (options.episodePath) {
    if (!existsSync(options.episodePath)) {
      errors.push(
        `Episode path not found: ${options.episodePath}`,
        "Fix: ensure the episode was scaffolded before running TTS",
      );
    }
  } else if (!options.seriesId) {
    errors.push("TTS step requires either episodePath or seriesId");
  } else {
    warnings.push("No explicit episodePath — will attempt to resolve from scaffold output or seriesId");
  }
}

function validateRenderStep(
  options: { seriesId?: string; episodePath?: string },
  errors: string[],
  warnings: string[],
): void {
  if (!options.seriesId && !options.episodePath) {
    errors.push("Render step requires seriesId or episodePath to identify the episode");
  }
  warnings.push("Render requires Remotion project with audio files — verify TTS completed");
}

function validateImageStep(
  options: { images?: unknown[] },
  errors: string[],
  _warnings: string[],
): void {
  if (!options.images?.length) {
    errors.push(
      "No images provided for image generation step",
      "Fix: provide an images array with at least one { filename, prompt } entry",
    );
  }
}

/**
 * Validate all steps in a workflow template before execution begins.
 * Returns a map of step kind → ValidationResult.
 */
export function validateWorkflow(
  steps: Array<{ kind: WorkflowStepKind }>,
  options: { seriesId?: string; episodePath?: string; images?: unknown[] },
): Map<WorkflowStepKind, ValidationResult> {
  const results = new Map<WorkflowStepKind, ValidationResult>();

  for (const step of steps) {
    // Only validate once per kind
    if (!results.has(step.kind)) {
      results.set(step.kind, validateStep(step.kind, options));
    }
  }

  return results;
}

function findEpisodeDirs(seriesDir: string): string[] {
  try {
    return readdirSync(seriesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "shared" && d.name !== "assets" && d.name !== "out" && d.name !== "storygraph_out")
      .map((d) => d.name);
  } catch {
    return [];
  }
}
