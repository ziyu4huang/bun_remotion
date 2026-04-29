/**
 * Surgical updates to dev.sh, root package.json, and series PLAN.md.
 * Appends new project entries without rewriting the entire file.
 * Supports both episode-based and standalone (category-based) projects.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScaffoldContext } from "./templates";
import type { NamingContext } from "./naming";

// ─── dev.sh updates ───────────────────────────────────────────────────────────────

export function updateDevSh(ctx: ScaffoldContext): void {
  const { naming } = ctx;
  const repoRoot = resolve(naming.seriesDir, naming.isStandalone ? ".." : "../..");
  const devShPath = resolve(repoRoot, "scripts/dev.sh");

  // Check dev.sh exists
  if (!requireExists(devShPath, "dev.sh")) return;

  let content = readFileSync(devShPath, "utf-8");

  // 1. Append to ALL_APPS array
  if (content.includes(naming.dirName)) {
    console.log(`  [SKIP] dev.sh already contains "${naming.dirName}" in ALL_APPS`);
  } else {
    const allAppsRegex = /^(ALL_APPS=".*?)(")/m;
    if (allAppsRegex.test(content)) {
      content = content.replace(allAppsRegex, `$1 ${naming.dirName}$2`);
      console.log(`  [UPD] dev.sh: added "${naming.dirName}" to ALL_APPS`);
    } else {
      console.error("  [WARN] Could not find ALL_APPS line in dev.sh — manual update needed");
    }
  }

  // 2. Add case to get_comp_id()
  const caseLine = `        ${naming.dirName}) echo "${naming.compositionId}" ;;`;
  if (content.includes(caseLine)) {
    console.log(`  [SKIP] dev.sh already has case for "${naming.dirName}"`);
  } else {
    content = content.replace(
      /^(\s+\*\) return 1 ;;)/m,
      `${caseLine}\n$1`,
    );
    console.log(`  [UPD] dev.sh: added case "${naming.dirName}) → ${naming.compositionId}"`);
  }

  writeFileSync(devShPath, content, "utf-8");
}

// ─── Root package.json updates ─────────────────────────────────────────────────────

export function updateRootPackageJson(ctx: ScaffoldContext): void {
  const { naming, config } = ctx;
  const repoRoot = resolve(naming.seriesDir, naming.isStandalone ? ".." : "../..");
  const pkgPath = resolve(repoRoot, "package.json");

  if (!requireExists(pkgPath, "package.json")) return;

  const content = readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(content) as { scripts: Record<string, string> };

  const startKey = `start:${naming.scriptAlias}`;
  const buildKey = `build:${naming.scriptAlias}`;
  const ttsKey = `generate-tts:${naming.scriptAlias}`;

  // Idempotency check
  if (pkg.scripts[startKey]) {
    console.log(`  [SKIP] package.json already has "${startKey}" script`);
    return;
  }

  // Build the relative path from repo root to the project dir
  const episodeRelative = naming.isStandalone
    ? `bun_remotion_proj/${naming.dirName}`
    : `bun_remotion_proj/${config.id}/${naming.dirName}`;

  pkg.scripts[startKey] = `bash scripts/dev.sh studio ${naming.dirName}`;
  pkg.scripts[buildKey] = `bash scripts/dev.sh render ${naming.dirName}`;
  pkg.scripts[ttsKey] = `bun run --cwd ${episodeRelative} generate-tts`;

  // Reorder scripts to group by series
  pkg.scripts = reorderScripts(pkg.scripts);

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  console.log(`  [UPD] package.json: added ${startKey}, ${buildKey}, ${ttsKey}`);
}

/**
 * Reorder scripts to group by series prefix, keeping generic scripts first.
 * Groups: start/build/generate-tts for wf-*, mcb-*, meme*, etc.
 */
function reorderScripts(scripts: Record<string, string>): Record<string, string> {
  const entries = Object.entries(scripts);

  // Classify each script key
  type Group = "top" | "series-start" | "series-build" | "series-tts" | "bottom";
  const classified: Array<{ key: string; value: string; group: Group; sortKey: string }> = [];

  // Known series prefixes (from SERIES_REGISTRY abbreviations + conventions)
  const seriesPrefixes = ["wf-", "mcb-", "meme", "xianxia", "sge"];
  // Generic keys that stay at top
  const topKeys = new Set(["start", "build", "build:all", "upgrade", "agent", "agent:cli", "agent:server", "review-agent", "episodeforge", "storygraph", "ci:kg", "ci:kg-all"]);

  for (const [key, value] of entries) {
    if (topKeys.has(key) || key.startsWith("start:claude") || key.startsWith("start:stock") ||
        key.startsWith("start:pigs") || key.startsWith("start:youth") || key.startsWith("start:commentary") ||
        key.startsWith("build:claude") || key.startsWith("build:stock") ||
        key.startsWith("build:pigs") || key.startsWith("build:youth") || key.startsWith("build:commentary") ||
        key.startsWith("generate-tts:claude") || key.startsWith("generate-tts:stock") ||
        key.startsWith("generate-tts:pigs") || key.startsWith("generate-tts:youth") || key.startsWith("generate-tts:commentary")) {
      classified.push({ key, value, group: "top", sortKey: key });
    } else if (key.startsWith("start:")) {
      classified.push({ key, value, group: "series-start", sortKey: extractSortKey(key, "start:", seriesPrefixes) });
    } else if (key.startsWith("build:")) {
      classified.push({ key, value, group: "series-build", sortKey: extractSortKey(key, "build:", seriesPrefixes) });
    } else if (key.startsWith("generate-tts:")) {
      classified.push({ key, value, group: "series-tts", sortKey: extractSortKey(key, "generate-tts:", seriesPrefixes) });
    } else {
      classified.push({ key, value, group: "bottom", sortKey: key });
    }
  }

  // Sort within each group by sortKey
  const groupOrder: Group[] = ["top", "series-start", "series-build", "series-tts", "bottom"];
  const result: Record<string, string> = {};

  for (const group of groupOrder) {
    const groupEntries = classified
      .filter((e) => e.group === group)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    for (const e of groupEntries) {
      result[e.key] = e.value;
    }
  }

  return result;
}

/** Extract a sort key that groups by series prefix then episode number. */
function extractSortKey(key: string, prefix: string, seriesPrefixes: string[]): string {
  const alias = key.slice(prefix.length);
  // Try to match known series prefix
  for (const sp of seriesPrefixes) {
    if (alias.startsWith(sp)) {
      // Parse ch/ep numbers for numeric sorting
      const rest = alias.slice(sp.length);
      const match = rest.match(/ch(\d+)-ep(\d+)/);
      if (match) {
        return `${sp}-${match[1].padStart(3, "0")}-${match[2].padStart(3, "0")}`;
      }
      // Flat series: just pad the number
      const numMatch = rest.match(/(\d+)/);
      if (numMatch) {
        return `${sp}-${numMatch[1].padStart(3, "0")}`;
      }
      return `${sp}-${rest}`;
    }
  }
  return alias;
}

// ─── Series PLAN.md updates ─────────────────────────────────────────────────────

export function updateSeriesPlanMd(ctx: ScaffoldContext): void {
  const { naming, config } = ctx;
  if (!config.planMdRow) return;

  const planPath = resolve(naming.seriesDir, "PLAN.md");
  if (!requireExists(planPath, "series PLAN.md")) return;

  let content = readFileSync(planPath, "utf-8");

  // Build row from template
  const row = config.planMdRow
    .replace("{episode}", `${naming.chapter != null ? `ch${naming.chapter}-ep${naming.episode}` : `ep${naming.episode}`}`)
    .replace("{ch}", String(naming.chapter ?? ""))
    .replace("{ep}", String(naming.episode ?? ""))
    .replace("{title}", "TODO")
    .replace("{theme}", "TODO")
    .replace("{language}", config.language)
    .replace("{characters}", config.voiceCharacters.filter((v) => v !== "narrator").join(", ") || "narrator");

  // Idempotency: skip if row already exists
  const episodeId = naming.chapter != null ? `ch${naming.chapter}-ep${naming.episode}` : `ep${naming.episode}`;
  if (content.includes(`| ${episodeId} |`) || content.includes(`| ${naming.chapter ?? ""} | ${naming.episode} |`)) {
    console.log(`  [SKIP] PLAN.md already has episode ${episodeId}`);
    return;
  }

  // Find the Episode Guide section and its table
  const guideMatch = content.match(/## Episode Guide\n\n(\|.+\n\|[-| ]+\n)((?:\|.+\n)*)/);
  if (!guideMatch) {
    console.log("  [SKIP] PLAN.md: no Episode Guide table found");
    return;
  }

  const header = guideMatch[1];
  const existingRows = guideMatch[2].trimEnd();

  // Insert row after existing rows
  const newBlock = `## Episode Guide\n\n${header}${existingRows}\n${row}\n`;
  content = content.replace(guideMatch[0], newBlock);

  writeFileSync(planPath, content, "utf-8");
  console.log(`  [UPD] PLAN.md: added episode ${episodeId} row`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────────

function requireExists(path: string, label: string): boolean {
  if (!existsSync(path)) {
    console.error(`  [WARN] ${label} not found at ${path} — manual update needed`);
    return false;
  }
  return true;
}
