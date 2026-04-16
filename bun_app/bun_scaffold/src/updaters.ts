/**
 * Surgical updates to dev.sh and root package.json.
 * Appends new episode entries without rewriting the entire file.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScaffoldContext } from "./templates";

// ─── dev.sh updates ───────────────────────────────────────────────────────────────

export function updateDevSh(ctx: ScaffoldContext): void {
  const { naming } = ctx;
  const devShPath = resolve(ctx.naming.seriesDir, "../..", "scripts/dev.sh");

  let content = readFileSync(devShPath, "utf-8");

  // 1. Append to ALL_APPS array
  if (content.includes(naming.dirName)) {
    console.log(`  [SKIP] dev.sh already contains "${naming.dirName}" in ALL_APPS`);
  } else {
    // Find the ALL_APPS line and insert before the closing "
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
  if (content.includes(naming.dirName)) {
    const alreadyHasCase = content.includes(caseLine);
    if (alreadyHasCase) {
      console.log(`  [SKIP] dev.sh already has case for "${naming.dirName}"`);
    } else {
      // Insert before *) return 1 ;; — match on its own line
      content = content.replace(
        /^(\s+\*\) return 1 ;;)/m,
        `${caseLine}\n$1`,
      );
      console.log(`  [UPD] dev.sh: added case "${naming.dirName}) → ${naming.compositionId}"`);
    }
  }

  writeFileSync(devShPath, content, "utf-8");
}

// ─── Root package.json updates ─────────────────────────────────────────────────────

export function updateRootPackageJson(ctx: ScaffoldContext): void {
  const { naming, config } = ctx;
  const pkgPath = resolve(ctx.naming.seriesDir, "../..", "package.json");

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

  // Build the relative path from repo root to the episode dir
  const episodeRelative = `bun_remotion_proj/${config.id}/${naming.dirName}`;

  pkg.scripts[startKey] = `bash scripts/dev.sh studio ${naming.dirName}`;
  pkg.scripts[buildKey] = `bash scripts/dev.sh render ${naming.dirName}`;
  pkg.scripts[ttsKey] = `bun run --cwd ${episodeRelative} generate-tts`;

  // Find insertion point: after the last script for this series
  // This keeps scripts grouped by series
  const orderedScripts = reorderScripts(pkg.scripts, config.abbreviation);
  pkg.scripts = orderedScripts;

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  console.log(`  [UPD] package.json: added ${startKey}, ${buildKey}, ${ttsKey}`);
}

/**
 * Reorder scripts to keep series-grouped order.
 * Groups: start, build, generate-tts — each grouped by series.
 */
function reorderScripts(
  scripts: Record<string, string>,
  _seriesAbbr: string,
): Record<string, string> {
  // Preserve insertion order — JSON.stringify maintains key order
  // The new keys are already appended at the end, which is fine
  // for a first pass. Manual reordering can be done later if needed.
  return scripts;
}
