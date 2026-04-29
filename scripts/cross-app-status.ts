/**
 * Cross-app status checker — health audit for all bun_apps.
 *
 * Checks: package.json, tests, PLAN.md, TODO.md, source file count.
 * Output: consolidated table + flag outliers.
 *
 * Usage:
 *   bun scripts/cross-app-status.ts [--json] [--verbose]
 */

import { resolve, basename } from "node:path";
import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync,
} from "node:fs";
import { spawnSync } from "child_process";

const ROOT = resolve(import.meta.dir, "..");
const BUN_APP_DIR = resolve(ROOT, "bun_app");

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const verbose = args.includes("--verbose");

interface AppStatus {
  name: string;
  version: string;
  srcFiles: number;
  testFiles: number;
  testsPass: number;
  testsFail: number;
  hasPlan: boolean;
  hasTodo: boolean;
  lastHistory: string;
  planStale: boolean;
}

function discoverApps(): string[] {
  return readdirSync(BUN_APP_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(resolve(BUN_APP_DIR, d.name, "package.json")))
    .map(d => d.name)
    .sort();
}

function countTsFiles(dir: string, pattern: RegExp): number {
  let count = 0;
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      const full = resolve(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (pattern.test(entry.name)) count++;
    }
  }
  if (!existsSync(dir)) return 0;
  walk(dir);
  return count;
}

function getLastHistory(todoContent: string): string {
  const lines = todoContent.split("\n");
  for (const line of lines) {
    const m = line.match(/^###?\s+(\d{4}-\d{2}-\d{2})\s+(.+)/);
    if (m) return `${m[1]} — ${m[2].slice(0, 60)}`;
  }
  return "(none)";
}

function checkPlanStale(planPath: string, srcDir: string): boolean {
  if (!existsSync(planPath) || !existsSync(srcDir)) return true;
  const planMtime = statSync(planPath).mtimeMs;
  let newestSrc = 0;
  function walk(d: string) {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "__tests__") continue;
      const full = resolve(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".ts")) {
        const m = statSync(full).mtimeMs;
        if (m > newestSrc) newestSrc = m;
      }
    }
  }
  walk(srcDir);
  // Stale if any source file is newer than PLAN.md by >7 days
  return (newestSrc - planMtime) > 7 * 24 * 60 * 60 * 1000;
}

function checkApp(name: string): AppStatus {
  const appDir = resolve(BUN_APP_DIR, name);
  const srcDir = resolve(appDir, "src");
  const pkgPath = resolve(appDir, "package.json");
  const planPath = resolve(appDir, "PLAN.md");
  const todoPath = resolve(appDir, "TODO.md");

  // Package info
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const version = pkg.version ?? "?";

  // File counts
  const srcFiles = countTsFiles(srcDir, /\.ts$/);
  const testFiles = countTsFiles(resolve(appDir, "src", "__tests__"), /\.test\.ts$/);

  // Run tests
  const result = spawnSync("bun", ["test", "src/"], {
    cwd: appDir,
    timeout: 120_000,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  const output = (result.stdout ?? "") + (result.stderr ?? "");
  const passMatch = output.match(/(\d+)\s+pass/);
  const failMatch = output.match(/(\d+)\s+fail/);
  const testsPass = passMatch ? parseInt(passMatch[1]) : 0;
  const testsFail = failMatch ? parseInt(failMatch[1]) : 0;

  // Docs
  const hasPlan = existsSync(planPath);
  const hasTodo = existsSync(todoPath);
  let lastHistory = "(none)";
  if (hasTodo) {
    lastHistory = getLastHistory(readFileSync(todoPath, "utf-8"));
  }

  const planStale = checkPlanStale(planPath, srcDir);

  return { name, version, srcFiles, testFiles, testsPass, testsFail, hasPlan, hasTodo, lastHistory, planStale };
}

// ─── Main ───

const apps = discoverApps();
if (verbose) console.log(`Checking ${apps.length} bun_apps...\n`);

const statuses: AppStatus[] = [];
for (const name of apps) {
  if (verbose) process.stdout.write(`  ${name}...`);
  const status = checkApp(name);
  statuses.push(status);
  if (verbose) console.log(` ${status.testsPass} pass, ${status.testsFail} fail`);
}

if (jsonMode) {
  console.log(JSON.stringify(statuses, null, 2));
} else {
  // Table output
  const col = [20, 8, 6, 6, 10, 5, 5];
  const header = ["App", "Version", "Src", "Tests", "Pass/Fail", "PLAN", "TODO"];
  const sep = header.map((_, i) => "─".repeat(col[i])).join("─┼─");

  console.log(`\n╭─${sep}─╮`);
  console.log(`│ ${header.map((h, i) => h.padEnd(col[i])).join(" │ ")} │`);
  console.log(`├─${sep}─┤`);

  for (const s of statuses) {
    const planIcon = s.hasPlan ? (s.planStale ? "⚠️ stale" : "✅") : "❌";
    const todoIcon = s.hasTodo ? "✅" : "❌";
    const row = [
      s.name.padEnd(col[0]),
      (`v${s.version}`).padEnd(col[1]),
      String(s.srcFiles).padEnd(col[2]),
      String(s.testFiles).padEnd(col[3]),
      `${s.testsPass}/${s.testsFail}`.padEnd(col[4]),
      planIcon.padEnd(col[5]),
      todoIcon.padEnd(col[6]),
    ];
    console.log(`│ ${row.join(" │ ")} │`);
  }

  console.log(`╰─${sep}─╯`);

  // Flag issues
  const issues: string[] = [];
  for (const s of statuses) {
    if (s.testsFail > 0) issues.push(`${s.name}: ${s.testsFail} test(s) failing`);
    if (!s.hasPlan) issues.push(`${s.name}: missing PLAN.md`);
    if (!s.hasTodo) issues.push(`${s.name}: missing TODO.md`);
    if (s.planStale && s.hasPlan) issues.push(`${s.name}: PLAN.md stale (source files newer by >7d)`);
  }

  if (issues.length > 0) {
    console.log("\n⚠️  Issues:");
    for (const issue of issues) console.log(`  - ${issue}`);
  } else {
    console.log("\n✅ All apps healthy");
  }

  // Summary
  const totalSrc = statuses.reduce((s, x) => s + x.srcFiles, 0);
  const totalTests = statuses.reduce((s, x) => s + x.testFiles, 0);
  const totalPass = statuses.reduce((s, x) => s + x.testsPass, 0);
  const totalFail = statuses.reduce((s, x) => s + x.testsFail, 0);
  console.log(`\n📊 ${statuses.length} apps, ${totalSrc} source files, ${totalTests} test files, ${totalPass} tests passing, ${totalFail} failing`);
}
