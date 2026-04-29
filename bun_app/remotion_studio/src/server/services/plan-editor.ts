import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { parsePlan, splitSections } from "../../../../storygraph/src/scripts/plan-parser";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const BUN_REMOTION_DIR = join(REPO_ROOT, "bun_remotion_proj");
const REVISIONS_DIR = join(REPO_ROOT, "bun_app/remotion_studio/data/plan-revisions");
const MAX_REVISIONS = 50;

export interface PlanSection {
  key: string;
  title: string;
  body: string;
}

export interface PlanReadResult {
  seriesId: string;
  raw: string;
  sections: PlanSection[];
  parsed: ReturnType<typeof parsePlan> extends Promise<infer T> ? T : never;
}

function findSeriesDir(seriesId: string): string | null {
  const direct = join(BUN_REMOTION_DIR, seriesId);
  if (existsSync(direct)) return direct;
  // Check for nested series dirs (e.g., weapon-forger/weapon-forger/)
  try {
    const entries = readdirSync(BUN_REMOTION_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const nested = join(BUN_REMOTION_DIR, entry.name, seriesId);
        if (existsSync(nested)) return nested;
      }
    }
  } catch { /* ignore */ }
  return null;
}

export function listPlans(): { seriesId: string; seriesName: string; hasPlan: boolean }[] {
  const results: { seriesId: string; seriesName: string; hasPlan: boolean }[] = [];
  try {
    const entries = readdirSync(BUN_REMOTION_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const seriesDir = join(BUN_REMOTION_DIR, entry.name);
      const planPath = join(seriesDir, "PLAN.md");
      if (existsSync(planPath)) {
        const content = readFileSync(planPath, "utf-8");
        const h1 = content.match(/^#\s+(.+)/m);
        results.push({
          seriesId: entry.name,
          seriesName: h1 ? h1[1].trim() : entry.name,
          hasPlan: true,
        });
      }
    }
  } catch { /* ignore */ }
  return results;
}

export async function readPlan(seriesId: string): Promise<PlanReadResult | null> {
  const seriesDir = findSeriesDir(seriesId);
  if (!seriesDir) return null;

  const planPath = join(seriesDir, "PLAN.md");
  if (!existsSync(planPath)) return null;

  const raw = readFileSync(planPath, "utf-8");

  const sectionMap = splitSections(raw);
  const sections: PlanSection[] = [];
  for (const [key, val] of sectionMap) {
    sections.push({ key, title: val.title, body: val.body });
  }

  const parsed = await parsePlan(raw, { sourcePath: planPath, mode: "regex" });

  return { seriesId, raw, sections, parsed };
}

export function readPlanRaw(seriesId: string): string | null {
  const seriesDir = findSeriesDir(seriesId);
  if (!seriesDir) return null;

  const planPath = join(seriesDir, "PLAN.md");
  if (!existsSync(planPath)) return null;

  return readFileSync(planPath, "utf-8");
}

export function writePlanRaw(seriesId: string, content: string): { ok: boolean; error?: string } {
  const seriesDir = findSeriesDir(seriesId);
  if (!seriesDir) return { ok: false, error: "Series not found" };

  const planPath = join(seriesDir, "PLAN.md");

  // Save revision before overwriting
  if (existsSync(planPath)) {
    try {
      const prev = readFileSync(planPath, "utf-8");
      saveRevision(seriesId, prev);
    } catch { /* ignore */ }
  }

  try {
    writeFileSync(planPath, content, "utf-8");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function saveRevision(seriesId: string, content: string): void {
  const dir = join(REVISIONS_DIR, seriesId);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(join(dir, `${ts}.json`), JSON.stringify({ timestamp: ts, content }), "utf-8");

  // Prune old revisions
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
    while (files.length > MAX_REVISIONS) {
      const old = files.shift()!;
      try { writeFileSync(join(dir, old), ""); } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export interface PlanRevision {
  id: string;
  timestamp: string;
  size: number;
}

export function listRevisions(seriesId: string): PlanRevision[] {
  const dir = join(REVISIONS_DIR, seriesId);
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .map((f) => ({
        id: f.replace(".json", ""),
        timestamp: f.replace(".json", "").replace(/-/g, (m, offset) => {
          // Restore ISO format: first 10 dashes are date/time, keep those; skip
          return offset < 19 ? "-" : "";
        }),
        size: readFileSync(join(dir, f), "utf-8").length,
      }));
  } catch { return []; }
}

export function readRevision(seriesId: string, revId: string): string | null {
  const dir = join(REVISIONS_DIR, seriesId);
  const path = join(dir, `${revId}.json`);
  if (!existsSync(path)) return null;
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return data.content ?? null;
  } catch { return null; }
}

export function readEpisodePlan(seriesId: string, episodeDir: string): string | null {
  const seriesDir = findSeriesDir(seriesId);
  if (!seriesDir) return null;

  const epPath = join(seriesDir, episodeDir, "PLAN.md");
  if (!existsSync(epPath)) return null;

  return readFileSync(epPath, "utf-8");
}

export function writeEpisodePlan(seriesId: string, episodeDir: string, content: string): { ok: boolean; error?: string } {
  const seriesDir = findSeriesDir(seriesId);
  if (!seriesDir) return { ok: false, error: "Series not found" };

  const epDir = join(seriesDir, episodeDir);
  if (!existsSync(epDir)) return { ok: false, error: "Episode directory not found" };

  const epPath = join(epDir, "PLAN.md");
  try {
    writeFileSync(epPath, content, "utf-8");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
