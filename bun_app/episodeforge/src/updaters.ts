/**
 * Surgical updates to dev.sh and root package.json.
 * Appends new project entries without rewriting the entire file.
 * Supports both episode-based and standalone (category-based) projects.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ScaffoldContext } from "./templates";

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

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
  console.log(`  [UPD] package.json: added ${startKey}, ${buildKey}, ${ttsKey}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────────

function requireExists(path: string, label: string): boolean {
  if (!existsSync(path)) {
    console.error(`  [WARN] ${label} not found at ${path} — manual update needed`);
    return false;
  }
  return true;
}
