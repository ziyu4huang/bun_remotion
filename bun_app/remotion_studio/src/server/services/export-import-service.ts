import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, basename } from "node:path";
import { getProject, scanProjects } from "./project-scanner";
import { listRules, type AutomationRule } from "./automation-rules";
import type { ProjectExport, EpisodeExport, AutomationRuleExport } from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// ── Export ──

export function exportProjectConfig(seriesId: string): ProjectExport | null {
  const project = getProject(seriesId);
  if (!project) return null;

  const seriesDir = project.path;

  const planMd = existsSync(resolve(seriesDir, "PLAN.md"))
    ? readFileSync(resolve(seriesDir, "PLAN.md"), "utf-8")
    : undefined;

  const todoMd = existsSync(resolve(seriesDir, "TODO.md"))
    ? readFileSync(resolve(seriesDir, "TODO.md"), "utf-8")
    : undefined;

  const episodes: EpisodeExport[] = project.episodes.map((ep) => {
    const epPlanPath = resolve(ep.path, "PLAN.md");
    return {
      id: ep.id,
      chapter: ep.chapter,
      episode: ep.episode,
      planMd: existsSync(epPlanPath) ? readFileSync(epPlanPath, "utf-8") : undefined,
      hasScaffold: ep.hasScaffold,
      hasTTS: ep.hasTTS,
      hasRender: ep.hasRender,
    };
  });

  // Read quality data
  const gatePath = resolve(seriesDir, "storygraph_out/gate.json");
  let quality: ProjectExport["quality"];
  if (existsSync(gatePath)) {
    try {
      const gate = JSON.parse(readFileSync(gatePath, "utf-8"));
      quality = {
        gateScore: gate.score,
        blendedScore: gate.blended_score,
        decision: gate.decision,
      };
    } catch {
      quality = undefined;
    }
  }

  // Read automation rules for this series
  const rules = listRules();
  const automationRules: AutomationRuleExport[] = rules
    .filter((r: AutomationRule) => r.action.options?.seriesId === seriesId)
    .map((r: AutomationRule) => ({
      name: r.name,
      trigger: r.trigger,
      templateId: r.action.templateId,
      enabled: r.enabled,
      cooldownMs: r.cooldownMs,
    }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    series: {
      id: project.id,
      name: project.name,
      category: project.category,
      genre: detectGenre(seriesId),
      path: project.path,
    },
    planMd,
    todoMd,
    episodes,
    quality,
    automationRules,
  };
}

export function listExportableSeries(): Array<{ id: string; name: string; episodeCount: number }> {
  return scanProjects().map((p) => ({
    id: p.id,
    name: p.name,
    episodeCount: p.episodeCount,
  }));
}

// ── Import ──

export interface ImportResult {
  seriesId: string;
  seriesDir: string;
  filesWritten: string[];
  warnings: string[];
}

export function importProjectConfig(data: unknown): ImportResult {
  const config = validateExport(data);

  const seriesDir = resolve(PROJ_DIR, config.series.id);
  const filesWritten: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(seriesDir)) {
    mkdirSync(seriesDir, { recursive: true });
  }

  // Write PLAN.md
  if (config.planMd) {
    const planPath = resolve(seriesDir, "PLAN.md");
    if (existsSync(planPath)) {
      warnings.push("PLAN.md already exists — skipped (use overwrite option to replace)");
    } else {
      writeFileSync(planPath, config.planMd, "utf-8");
      filesWritten.push("PLAN.md");
    }
  }

  // Write TODO.md
  if (config.todoMd) {
    const todoPath = resolve(seriesDir, "TODO.md");
    if (existsSync(todoPath)) {
      warnings.push("TODO.md already exists — skipped");
    } else {
      writeFileSync(todoPath, config.todoMd, "utf-8");
      filesWritten.push("TODO.md");
    }
  }

  // Write episode PLAN.md files
  for (const ep of config.episodes) {
    if (!ep.planMd) continue;
    const epDir = resolve(seriesDir, ep.id);
    if (!existsSync(epDir)) {
      mkdirSync(epDir, { recursive: true });
    }
    const epPlanPath = resolve(epDir, "PLAN.md");
    if (existsSync(epPlanPath)) {
      warnings.push(`${ep.id}/PLAN.md already exists — skipped`);
    } else {
      writeFileSync(epPlanPath, ep.planMd, "utf-8");
      filesWritten.push(`${ep.id}/PLAN.md`);
    }
  }

  return {
    seriesId: config.series.id,
    seriesDir,
    filesWritten,
    warnings,
  };
}

// ── Validation ──

export function validateExport(data: unknown): ProjectExport {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid export: expected an object");
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== 1) {
    throw new Error(`Unsupported export version: ${obj.version}`);
  }

  if (!obj.series || typeof obj.series !== "object") {
    throw new Error("Invalid export: missing series object");
  }

  const series = obj.series as Record<string, unknown>;
  if (!series.id || typeof series.id !== "string") {
    throw new Error("Invalid export: missing series.id");
  }
  if (!series.category || typeof series.category !== "string") {
    throw new Error("Invalid export: missing series.category");
  }

  if (!Array.isArray(obj.episodes)) {
    throw new Error("Invalid export: missing episodes array");
  }

  for (const ep of obj.episodes as unknown[]) {
    if (!ep || typeof ep !== "object") {
      throw new Error("Invalid export: episode must be an object");
    }
    const epObj = ep as Record<string, unknown>;
    if (!epObj.id || typeof epObj.id !== "string") {
      throw new Error("Invalid export: episode missing id");
    }
  }

  return data as ProjectExport;
}

// ── Helpers ──

function detectGenre(seriesId: string): string | undefined {
  const configs: Record<string, string> = {
    "weapon-forger": "xianxia_comedy",
    "my-core-is-boss": "novel_system",
    "galgame-meme-theater": "galgame_meme",
    "xianxia-system-meme": "xianxia_comedy",
  };
  return configs[seriesId];
}
