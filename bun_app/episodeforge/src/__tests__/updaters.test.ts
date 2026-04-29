import { describe, test, expect } from "bun:test";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { scaffold } from "../scaffold";

const TMP_REPO = resolve("/tmp/episodeforge-updaters-test");

function cleanTmp() {
  rmSync(TMP_REPO, { recursive: true, force: true });
}

describe("updateRootPackageJson with reorderScripts", () => {
  test("scripts are sorted by series prefix after scaffold", async () => {
    cleanTmp();
    mkdirSync(TMP_REPO, { recursive: true });
    const pkgPath = resolve(TMP_REPO, "package.json");
    writeFileSync(pkgPath, JSON.stringify({
      name: "test-repo",
      scripts: {
        "start": "echo start",
        "start:mcb-ch2-ep1": "bash scripts/dev.sh studio my-core-is-boss-ch2-ep1",
        "build:mcb-ch2-ep1": "bash scripts/dev.sh render my-core-is-boss-ch2-ep1",
        "generate-tts:mcb-ch2-ep1": "bun run --cwd bun_remotion_proj/my-core-is-boss/my-core-is-boss-ch2-ep1 generate-tts",
        "start:wf-ch1-ep1": "bash scripts/dev.sh studio weapon-forger-ch1-ep1",
        "build:wf-ch1-ep1": "bash scripts/dev.sh render weapon-forger-ch1-ep1",
        "generate-tts:wf-ch1-ep1": "bun run --cwd bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep1 generate-tts",
        "episodeforge": "bun run bun_app/episodeforge/src/index.ts",
      },
    }, null, 2) + "\n");

    mkdirSync(resolve(TMP_REPO, "scripts"), { recursive: true });
    writeFileSync(resolve(TMP_REPO, "scripts/dev.sh"), '#!/bin/bash\nALL_APPS=""\nget_comp_id() { case "$1" in *) return 1 ;; esac }\n');

    const seriesDir = resolve(TMP_REPO, "bun_remotion_proj", "weapon-forger");
    mkdirSync(seriesDir, { recursive: true });

    const result = await scaffold({
      series: "weapon-forger",
      chapter: 1,
      episode: 2,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    expect(result.success).toBe(true);

    const updated = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const keys = Object.keys(updated.scripts);

    // "start" should come before series scripts
    expect(keys.indexOf("start")).toBeLessThan(keys.indexOf("start:wf-ch1-ep1"));

    // mcb-* scripts should come before wf-* scripts (alphabetically: m < w)
    const mcbIdx = keys.findIndex((k) => k.startsWith("start:mcb"));
    const wfIdx = keys.findIndex((k) => k.startsWith("start:wf"));
    expect(mcbIdx).toBeLessThan(wfIdx);

    // New episode scripts exist
    expect(updated.scripts["start:wf-ch1-ep2"]).toBeDefined();
    expect(updated.scripts["build:wf-ch1-ep2"]).toBeDefined();
    expect(updated.scripts["generate-tts:wf-ch1-ep2"]).toBeDefined();
  });

  test("chapter numbers sort numerically (ch2 after ch10)", async () => {
    cleanTmp();
    mkdirSync(TMP_REPO, { recursive: true });
    const pkgPath = resolve(TMP_REPO, "package.json");
    writeFileSync(pkgPath, JSON.stringify({
      name: "test-repo",
      scripts: {
        "start:wf-ch10-ep1": "bash scripts/dev.sh studio weapon-forger-ch10-ep1",
        "build:wf-ch10-ep1": "bash scripts/dev.sh render weapon-forger-ch10-ep1",
        "generate-tts:wf-ch10-ep1": "tts",
        "start:wf-ch2-ep1": "bash scripts/dev.sh studio weapon-forger-ch2-ep1",
        "build:wf-ch2-ep1": "bash scripts/dev.sh render weapon-forger-ch2-ep1",
        "generate-tts:wf-ch2-ep1": "tts",
      },
    }, null, 2) + "\n");

    mkdirSync(resolve(TMP_REPO, "scripts"), { recursive: true });
    writeFileSync(resolve(TMP_REPO, "scripts/dev.sh"), '#!/bin/bash\nALL_APPS=""\nget_comp_id() { case "$1" in *) return 1 ;; esac }\n');

    const seriesDir = resolve(TMP_REPO, "bun_remotion_proj", "weapon-forger");
    mkdirSync(seriesDir, { recursive: true });

    await scaffold({
      series: "weapon-forger",
      chapter: 1,
      episode: 1,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    const updated = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const keys = Object.keys(updated.scripts);

    // ch2 should come before ch10 (numeric sort)
    const ch2Idx = keys.indexOf("start:wf-ch2-ep1");
    const ch10Idx = keys.indexOf("start:wf-ch10-ep1");
    expect(ch2Idx).toBeLessThan(ch10Idx);

    // ch1 should come before ch2
    const ch1Idx = keys.indexOf("start:wf-ch1-ep1");
    expect(ch1Idx).toBeLessThan(ch2Idx);
  });
});

describe("updateSeriesPlanMd", () => {
  test("adds episode row to weapon-forger PLAN.md", async () => {
    cleanTmp();
    mkdirSync(TMP_REPO, { recursive: true });
    const pkgPath = resolve(TMP_REPO, "package.json");
    writeFileSync(pkgPath, JSON.stringify({ name: "test", scripts: {} }, null, 2) + "\n");
    mkdirSync(resolve(TMP_REPO, "scripts"), { recursive: true });
    writeFileSync(resolve(TMP_REPO, "scripts/dev.sh"), '#!/bin/bash\nALL_APPS=""\nget_comp_id() { case "$1" in *) return 1 ;; esac }\n');

    const seriesDir = resolve(TMP_REPO, "bun_remotion_proj", "weapon-forger");
    mkdirSync(seriesDir, { recursive: true });

    const planMd = `# weapon-forger

## Episode Guide

| Episode | Title | Language | Characters | Status |
|---------|-------|----------|------------|--------|
| ch1-ep1 | 入宗考试 | zh-TW | zhoumo, examiner | Complete |

## Other Section
`;
    writeFileSync(resolve(seriesDir, "PLAN.md"), planMd);

    const result = await scaffold({
      series: "weapon-forger",
      chapter: 1,
      episode: 2,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    expect(result.success).toBe(true);

    const updated = readFileSync(resolve(seriesDir, "PLAN.md"), "utf-8");
    expect(updated).toContain("| ch1-ep2 | TODO | zh-TW |");
    expect(updated).toContain("| ch1-ep1 |"); // existing row preserved
    expect(updated).toContain("## Other Section"); // rest of file preserved
  });

  test("adds episode row to my-core-is-boss PLAN.md with Ch|Ep format", async () => {
    cleanTmp();
    mkdirSync(TMP_REPO, { recursive: true });
    writeFileSync(resolve(TMP_REPO, "package.json"), JSON.stringify({ name: "test", scripts: {} }, null, 2) + "\n");
    mkdirSync(resolve(TMP_REPO, "scripts"), { recursive: true });
    writeFileSync(resolve(TMP_REPO, "scripts/dev.sh"), '#!/bin/bash\nALL_APPS=""\nget_comp_id() { case "$1" in *) return 1 ;; esac }\n');

    const seriesDir = resolve(TMP_REPO, "bun_remotion_proj", "my-core-is-boss");
    mkdirSync(seriesDir, { recursive: true });

    const planMd = `# my-core-is-boss

## Episode Guide

| Ch | Ep | Title | Characters | Status |
|----|-----|-------|------------|--------|
| 1 | 1 | 首次誤會 | linyi, zhaoxiaoqi | Complete |
`;
    writeFileSync(resolve(seriesDir, "PLAN.md"), planMd);

    const result = await scaffold({
      series: "my-core-is-boss",
      chapter: 1,
      episode: 2,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    expect(result.success).toBe(true);

    const updated = readFileSync(resolve(seriesDir, "PLAN.md"), "utf-8");
    expect(updated).toContain("| 1 | 2 | TODO | linyi, zhaoxiaoqi, xiaoelder | Planned |");
  });

  test("skips if episode already in PLAN.md", async () => {
    cleanTmp();
    mkdirSync(TMP_REPO, { recursive: true });
    writeFileSync(resolve(TMP_REPO, "package.json"), JSON.stringify({ name: "test", scripts: {} }, null, 2) + "\n");
    mkdirSync(resolve(TMP_REPO, "scripts"), { recursive: true });
    writeFileSync(resolve(TMP_REPO, "scripts/dev.sh"), '#!/bin/bash\nALL_APPS=""\nget_comp_id() { case "$1" in *) return 1 ;; esac }\n');

    const seriesDir = resolve(TMP_REPO, "bun_remotion_proj", "weapon-forger");
    mkdirSync(seriesDir, { recursive: true });

    const planMd = `# weapon-forger

## Episode Guide

| Episode | Title | Language | Characters | Status |
|---------|-------|----------|------------|--------|
| ch1-ep1 | 入宗考试 | zh-TW | zhoumo, examiner | Complete |
`;
    writeFileSync(resolve(seriesDir, "PLAN.md"), planMd);

    // Try to scaffold ch1-ep1 which already exists
    await scaffold({
      series: "weapon-forger",
      chapter: 1,
      episode: 2,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    // Now scaffold ch1-ep1 which already exists — it should fail (dir exists)
    mkdirSync(resolve(seriesDir, "weapon-forger-ch1-ep1"), { recursive: true });

    // But scaffold ch1-ep2, then scaffold it again — PLAN.md should not duplicate
    const r1 = await scaffold({
      series: "weapon-forger",
      chapter: 1,
      episode: 3,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });
    expect(r1.success).toBe(true);

    const after1 = readFileSync(resolve(seriesDir, "PLAN.md"), "utf-8");
    const count = (after1.match(/ch1-ep3/g) ?? []).length;
    expect(count).toBe(1); // only one row for ch1-ep3
  });
});
