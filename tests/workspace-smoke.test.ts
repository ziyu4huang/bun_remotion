import { describe, test, expect } from "bun:test";
import { spawnSync } from "bun";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "..");

describe("workspace smoke tests", () => {
  test("bun run episodeforge --help exits with code 0", () => {
    const result = spawnSync([
      "bun", "run", "episodeforge", "--help",
    ], {
      cwd: REPO_ROOT,
    });
    expect(result.exitCode).toBe(0);
  });

  test("bun run storygraph --help exits with code 0", () => {
    const result = spawnSync([
      "bun", "run", "storygraph", "--help",
    ], {
      cwd: REPO_ROOT,
    });
    expect(result.exitCode).toBe(0);
  });

  test("remotion_types VIDEO_CATEGORIES can be imported from episodeforge workspace", () => {
    const result = spawnSync([
      "bun", "-e",
      `import { VIDEO_CATEGORIES } from 'remotion_types'; console.log(Object.keys(VIDEO_CATEGORIES).length)`,
    ], {
      cwd: resolve(REPO_ROOT, "bun_app/episodeforge"),
    });
    expect(result.exitCode).toBe(0);
    const stdout = new TextDecoder().decode(result.stdout).trim();
    // VIDEO_CATEGORIES has 7 categories
    const count = parseInt(stdout, 10);
    expect(count).toBeGreaterThan(0);
  });
});
