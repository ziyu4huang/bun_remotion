import { describe, test, expect } from "bun:test";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

describe("CI gate infrastructure", () => {
  test("ci.ts script file exists", () => {
    expect(existsSync(resolve(REPO_ROOT, "bun_app/bun_pi_agent/src/ci.ts"))).toBe(true);
  });

  test("graphify-regression.ts script exists", () => {
    expect(existsSync(resolve(REPO_ROOT, "bun_app/storygraph/src/scripts/graphify-regression.ts"))).toBe(true);
  });

  test("weapon-forger has baseline for CI gate testing", () => {
    const baselinePath = resolve(PROJ_DIR, "weapon-forger", "storygraph_out", "baseline-gate.json");
    expect(existsSync(baselinePath)).toBe(true);
  });

  test("weapon-forger has current gate for CI comparison", () => {
    const gatePath = resolve(PROJ_DIR, "weapon-forger", "storygraph_out", "gate.json");
    expect(existsSync(gatePath)).toBe(true);
  });

  test("root package.json has ci:kg script", async () => {
    const pkg = await import(resolve(REPO_ROOT, "package.json"));
    expect(pkg.scripts["ci:kg"]).toBeDefined();
    expect(pkg.scripts["ci:kg"]).toContain("ci.ts");
  });

  test("root package.json has ci:kg-all script", async () => {
    const pkg = await import(resolve(REPO_ROOT, "package.json"));
    expect(pkg.scripts["ci:kg-all"]).toBeDefined();
    expect(pkg.scripts["ci:kg-all"]).toContain("graphify-regression");
  });
});
