import { describe, test, expect } from "bun:test";
import { createRemotionAnalyzeTool } from "../tools/remotion-tools.js";
import { validateResult } from "../tools/result-types.js";
import { resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dir, "../../../..");
const FIXTURE_EP = resolve(REPO_ROOT, "bun_remotion_proj/weapon-forger/weapon-forger-ch1-ep1");

describe("snapshot: rm_analyze on weapon-forger-ch1-ep1", () => {
  test("returns stable JSON structure", async () => {
    const tool = createRemotionAnalyzeTool();
    const result = await tool.execute("test", {
      episodeDir: FIXTURE_EP,
    });

    // Validate shape
    const errors = validateResult(result.details as any);
    expect(errors).toEqual([]);

    // Structure assertions
    const d = result.details as { tool: string; success: boolean; data: Record<string, unknown> };
    expect(d.tool).toBe("rm_analyze");
    expect(d.success).toBe(true);
    expect(d.data.episode).toBe("weapon-forger-ch1-ep1");
    expect(d.data.category).toBe("narrative_drama");
    expect(Array.isArray(d.data.scenes)).toBe(true);
    expect(typeof d.data.totalFrames).toBe("number");
    expect(typeof d.data.totalSeconds).toBe("number");
    expect(typeof d.data.source).toBe("string");

    // Snapshot the data shape (keys only, values change)
    const snapshot = Object.keys(d.data).sort();
    expect(snapshot).toMatchSnapshot("rm_analyze data keys");
  });
});
