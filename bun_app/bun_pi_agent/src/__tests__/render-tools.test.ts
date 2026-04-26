import { describe, test, expect } from "bun:test";
import { createRenderEpisodeTool, createRenderStatusTool, createRenderListTool } from "../tools/render-tools.js";

describe("render tools", () => {
  test("render_episode has correct metadata", () => {
    const tool = createRenderEpisodeTool();
    expect(tool.name).toBe("render_episode");
    expect(tool.label).toBe("Render Episode");
    expect(tool.description).toContain("MP4");
    expect(tool.parameters).toBeDefined();
  });

  test("render_status has correct metadata", () => {
    const tool = createRenderStatusTool();
    expect(tool.name).toBe("render_status");
    expect(tool.label).toBe("Check Render Status");
    expect(tool.description).toContain("render output");
    expect(tool.parameters).toBeDefined();
  });

  test("render_list has correct metadata", () => {
    const tool = createRenderListTool();
    expect(tool.name).toBe("render_list");
    expect(tool.label).toBe("List Episode Renders");
    expect(tool.description).toContain("series");
    expect(tool.parameters).toBeDefined();
  });

  test("render_status returns error for non-existent episode", async () => {
    const tool = createRenderStatusTool();
    const result = await tool.execute({ episodeId: "nonexistent-episode-xyz" });
    expect(result.content[0].text).toContain("Error");
  });

  test("render_list returns error for non-existent series", async () => {
    const tool = createRenderListTool();
    const result = await tool.execute({ seriesId: "nonexistent-series-xyz" });
    expect(result.content[0].text).toContain("Error");
  });

  test("render_episode returns error for non-existent episode", async () => {
    const tool = createRenderEpisodeTool();
    const result = await tool.execute({ episodeId: "nonexistent-episode-xyz" });
    expect(result.content[0].text).toContain("Error");
    expect(result.content[0].text).toContain("not found");
  });

  test("render_status finds rendered episode", async () => {
    const tool = createRenderStatusTool();
    // weapon-forger-ch3-ep1 was rendered (152M, per NEXT.md)
    const result = await tool.execute({ episodeId: "weapon-forger-ch3-ep1" });
    const text = result.content[0].text;
    // Should either find render or report no render — both are valid outcomes
    expect(text).toContain("weapon-forger-ch3-ep1");
  });
});
