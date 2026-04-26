import { describe, test, expect } from "bun:test";
import {
  createScaffoldTool,
  createSeriesListTool,
  createEpisodeListTool,
  createScaffoldTools,
} from "../tools/scaffold-tools.js";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");

describe("scaffold-tools", () => {
  test("createScaffoldTools returns 3 tools", () => {
    const tools = createScaffoldTools();
    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name)).toEqual(["sc_scaffold", "sc_series_list", "sc_episode_list"]);
  });

  // ── sc_series_list ──

  test("sc_series_list returns all series from registry", async () => {
    const tool = createSeriesListTool();
    const result = await tool.execute({});
    expect(result.content[0].type).toBe("text");
    const text = result.content[0].text as string;
    expect(text).toContain("weapon-forger");
    expect(text).toContain("my-core-is-boss");
    expect(text).toContain("galgame-meme-theater");
    expect(text).toContain("storygraph-explainer");
    expect(text).toContain("Available series (4)");
  });

  // ── sc_episode_list ──

  test("sc_episode_list scans series directory", async () => {
    const tool = createEpisodeListTool();
    const seriesDir = resolve(PROJ_DIR, "weapon-forger");
    const result = await tool.execute({ seriesDir });
    expect(result.content[0].type).toBe("text");
    const text = result.content[0].text as string;
    // Should list episodes in the weapon-forger directory
    expect(text).toContain("weapon-forger");
  });

  test("sc_episode_list returns error for missing directory", async () => {
    const tool = createEpisodeListTool();
    const result = await tool.execute({ seriesDir: "/nonexistent/path" });
    const text = result.content[0].text as string;
    expect(text).toContain("Error:");
    expect(text).toContain("not found");
  });

  // ── sc_scaffold ──

  test("sc_scaffold scaffolds a known series with dryRun", async () => {
    const tool = createScaffoldTool();
    const result = await tool.execute({
      series: "weapon-forger",
      chapter: 99,
      episode: 99,
      dryRun: true,
    });
    const text = result.content[0].text as string;
    expect(text).toContain("weapon-forger");
    expect(text).toContain("Scaffolded");
  });

  test("sc_scaffold rejects missing series parameter", async () => {
    const tool = createScaffoldTool();
    const result = await tool.execute({
      series: "",
      chapter: 1,
      episode: 1,
    });
    const text = result.content[0].text as string;
    expect(text).toContain("Error:");
  });
});
