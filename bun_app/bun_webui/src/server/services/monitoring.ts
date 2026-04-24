import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { scanProjects } from "./project-scanner";
import type { Project, Episode } from "../../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

// ── Types ──

export interface SeriesHealth {
  seriesId: string;
  name: string;
  category: string;
  episodeCount: number;
  scaffoldedCount: number;
  ttsCount: number;
  renderedCount: number;
  completionRate: number;
  gateScore: number | null;
  blendedScore: number | null;
  qualityDecision: string | null;
  nodeCount: number;
  edgeCount: number;
  communityCount: number;
  trend: "improving" | "stable" | "declining" | "new";
}

export interface MonitoringOverview {
  totalSeries: number;
  totalEpisodes: number;
  totalScaffolded: number;
  totalRendered: number;
  overallCompletionRate: number;
  avgGateScore: number | null;
  avgBlendedScore: number | null;
  seriesHealth: SeriesHealth[];
  recentActivity: ActivityEntry[];
}

export interface ActivityEntry {
  timestamp: string;
  seriesId: string;
  type: "pipeline" | "render" | "scaffold";
  detail: string;
}

// ── Helpers ──

function readJsonSafe<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

interface GateJson {
  version?: string;
  score?: number;
  previous_score?: number;
  decision?: string;
  checks?: { name: string; status: string }[];
}

interface MergedGraph {
  nodes?: unknown[];
  edges?: unknown[];
  communities?: unknown[];
}

interface QualityScore {
  overall?: number;
  dimensions?: Record<string, number>;
}

// ── Series health computation ──

function computeSeriesHealth(project: Project): SeriesHealth {
  const outDir = resolve(project.path, "storygraph_out");
  const gate = readJsonSafe<GateJson>(resolve(outDir, "gate.json"));
  const merged = readJsonSafe<MergedGraph>(resolve(outDir, "merged-graph.json"));
  const quality = readJsonSafe<QualityScore>(resolve(outDir, "kg-quality-score.json"));

  const ttsCount = project.episodes.filter((e) => e.hasTTS).length;
  const renderedCount = project.episodes.filter((e) => e.hasRender).length;
  const completionRate = project.episodeCount > 0
    ? Math.round((renderedCount / project.episodeCount) * 100)
    : 0;

  let trend: SeriesHealth["trend"] = "new";
  if (gate?.score != null && gate?.previous_score != null) {
    const delta = gate.score - gate.previous_score;
    if (delta > 5) trend = "improving";
    else if (delta < -5) trend = "declining";
    else trend = "stable";
  } else if (gate?.score != null) {
    trend = "stable";
  }

  return {
    seriesId: project.seriesId,
    name: project.name,
    category: project.category,
    episodeCount: project.episodeCount,
    scaffoldedCount: project.scaffoldedCount,
    ttsCount,
    renderedCount,
    completionRate,
    gateScore: gate?.score ?? null,
    blendedScore: gate?.score != null
      ? quality?.overall != null
        ? Math.round(0.4 * gate.score + 0.6 * quality.overall * 10)
        : null
      : null,
    qualityDecision: gate?.decision ?? null,
    nodeCount: merged?.nodes?.length ?? 0,
    edgeCount: merged?.edges?.length ?? 0,
    communityCount: merged?.communities?.length ?? 0,
    trend,
  };
}

// ── Recent activity from file timestamps ──

function collectRecentActivity(limit = 10): ActivityEntry[] {
  const activities: ActivityEntry[] = [];

  const seriesDirs = readdirSync(PROJ_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "shared" && d.name !== "shared-fixture");

  for (const series of seriesDirs) {
    const seriesPath = resolve(PROJ_DIR, series.name);

    // Pipeline runs (gate.json modification time)
    const gatePath = resolve(seriesPath, "storygraph_out/gate.json");
    if (existsSync(gatePath)) {
      try {
        const stat = statSync(gatePath);
        activities.push({
          timestamp: stat.mtime.toISOString(),
          seriesId: series.name,
          type: "pipeline",
          detail: `Pipeline run (gate ${readJsonSafe<GateJson>(gatePath)?.score ?? "?"})`,
        });
      } catch { /* ignore */ }
    }

    // Renders (out/*.mp4 modification time)
    const outDir = resolve(REPO_ROOT, "out");
    if (existsSync(outDir)) {
      try {
        const files = readdirSync(outDir);
        for (const f of files) {
          if (f.startsWith(series.name) && f.endsWith(".mp4")) {
            const stat = statSync(resolve(outDir, f));
            activities.push({
              timestamp: stat.mtime.toISOString(),
              seriesId: series.name,
              type: "render",
              detail: `Rendered ${f}`,
            });
          }
        }
      } catch { /* ignore */ }
    }

    // Scaffolds (episode Root.tsx creation time)
    const epDirs = readdirSync(seriesPath, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith(series.name));
    for (const ep of epDirs) {
      const rootTsx = resolve(seriesPath, ep.name, "src/Root.tsx");
      if (existsSync(rootTsx)) {
        try {
          const stat = statSync(rootTsx);
          activities.push({
            timestamp: stat.birthtime.toISOString(),
            seriesId: series.name,
            type: "scaffold",
            detail: `Scaffolded ${ep.name}`,
          });
        } catch { /* ignore */ }
      }
    }
  }

  // Sort by timestamp descending, take top N
  activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return activities.slice(0, limit);
}

// ── Main exports ──

export function getMonitoringOverview(): MonitoringOverview {
  const projects = scanProjects();
  const seriesHealth = projects.map(computeSeriesHealth);

  const totalEpisodes = seriesHealth.reduce((s, h) => s + h.episodeCount, 0);
  const totalScaffolded = seriesHealth.reduce((s, h) => s + h.scaffoldedCount, 0);
  const totalRendered = seriesHealth.reduce((s, h) => s + h.renderedCount, 0);

  const gateScores = seriesHealth.filter((h) => h.gateScore != null).map((h) => h.gateScore!);
  const blendedScores = seriesHealth.filter((h) => h.blendedScore != null).map((h) => h.blendedScore!);

  let recentActivity: ActivityEntry[] = [];
  try {
    recentActivity = collectRecentActivity(10);
  } catch { /* ignore if PROJ_DIR scan fails */ }

  return {
    totalSeries: seriesHealth.length,
    totalEpisodes,
    totalScaffolded,
    totalRendered,
    overallCompletionRate: totalEpisodes > 0 ? Math.round((totalRendered / totalEpisodes) * 100) : 0,
    avgGateScore: gateScores.length > 0 ? Math.round(gateScores.reduce((a, b) => a + b, 0) / gateScores.length) : null,
    avgBlendedScore: blendedScores.length > 0 ? Math.round(blendedScores.reduce((a, b) => a + b, 0) / blendedScores.length) : null,
    seriesHealth,
    recentActivity,
  };
}

export function getSeriesHealthDetail(seriesId: string): SeriesHealth | null {
  const projects = scanProjects();
  const project = projects.find((p) => p.id === seriesId);
  if (!project) return null;
  return computeSeriesHealth(project);
}
