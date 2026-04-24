import { describe, test, expect } from "bun:test";
import { scaffold } from "../scaffold";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const TMP_REPO = resolve("/tmp/episodeforge-scaffold-test");

describe("scaffold() module API", () => {
  test("validates missing series", async () => {
    const result = await scaffold({ series: "", repoRoot: TMP_REPO });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("--series is required");
  });

  test("validates missing episode for episode-based series", async () => {
    const result = await scaffold({ series: "weapon-forger", repoRoot: TMP_REPO });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("--ep is required");
  });

  test("validates missing chapter for chapter-based series", async () => {
    const result = await scaffold({
      series: "weapon-forger",
      episode: 1,
      repoRoot: TMP_REPO,
    });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("--ch is required");
  });

  test("dry-run returns files without writing", async () => {
    const result = await scaffold({
      series: "weapon-forger",
      chapter: 9,
      episode: 99,
      dryRun: true,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    expect(result.success).toBe(true);
    expect(result.filesWritten).toBeGreaterThan(0);
    expect(result.naming.compositionId).toBe("WeaponForgerCh9Ep99");
    expect(result.naming.dirName).toBe("weapon-forger-ch9-ep99");
    // No directory should be created in dry-run
    expect(existsSync(result.naming.episodeDir)).toBe(false);
  });

  test("scaffolds weapon-forger episode to tmp dir", async () => {
    // Create the series dir structure
    const seriesDir = resolve(TMP_REPO, "bun_remotion_proj", "weapon-forger");
    mkdirSync(seriesDir, { recursive: true });

    const result = await scaffold({
      series: "weapon-forger",
      chapter: 1,
      episode: 99,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    expect(result.success).toBe(true);
    expect(result.filesWritten).toBeGreaterThan(0);
    expect(result.naming.dirName).toBe("weapon-forger-ch1-ep99");
    expect(existsSync(result.naming.episodeDir)).toBe(true);
    expect(existsSync(resolve(result.naming.episodeDir, "package.json"))).toBe(true);
    expect(existsSync(resolve(result.naming.episodeDir, "src", "Root.tsx"))).toBe(true);

    // Cleanup
    rmSync(resolve(TMP_REPO, "bun_remotion_proj"), { recursive: true, force: true });
  });

  test("rejects duplicate directory", async () => {
    const seriesDir = resolve(TMP_REPO, "bun_remotion_proj", "weapon-forger");
    const epDir = resolve(seriesDir, "weapon-forger-ch1-ep98");
    mkdirSync(epDir, { recursive: true });

    const result = await scaffold({
      series: "weapon-forger",
      chapter: 1,
      episode: 98,
      skipInstall: true,
      repoRoot: TMP_REPO,
    });

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("already exists");

    rmSync(resolve(TMP_REPO, "bun_remotion_proj"), { recursive: true, force: true });
  });
});
