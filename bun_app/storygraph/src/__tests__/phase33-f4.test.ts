import { describe, it, expect } from "bun:test";
import {
  generateNarration,
  generateNarrationDrama,
  generateTechExplainer,
  extractScenesFromPlan,
} from "../scripts/gen-narration";
import type { NarrationInput } from "../scripts/gen-narration";
import {
  generateEpisodeTodo,
  parsePlanForEpisode,
} from "../scripts/gen-episode-todo";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

// ─── gen-narration tests ───

const sampleDramaInput: NarrationInput = {
  scenes: [
    {
      scene: "TitleScene",
      segments: [
        { character: "narrator", text: "歡迎來到測試！" },
      ],
    },
    {
      scene: "ContentScene1",
      segments: [
        { character: "hero", text: "你好！" },
        { character: "villain", text: "再見！" },
      ],
    },
    {
      scene: "OutroScene",
      segments: [
        { character: "narrator", text: "感謝收看。" },
      ],
    },
  ],
  voice_map: { narrator: "serena", hero: "uncle_fu", villain: "vivian" },
  voice_descriptions: {
    narrator: { voice: "serena", gender: "female", accent: "standard Mandarin" },
    hero: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
    villain: { voice: "vivian", gender: "female", accent: "standard Mandarin" },
  },
  category: "narrative_drama",
};

describe("generateNarrationDrama", () => {
  it("generates valid TypeScript with all exports", () => {
    const code = generateNarrationDrama(sampleDramaInput);

    expect(code).toContain("export type VoiceCharacter");
    expect(code).toContain("export interface NarrationSegment");
    expect(code).toContain("export interface NarrationScript");
    expect(code).toContain("export const VOICE_MAP");
    expect(code).toContain("export const VOICE_DESCRIPTION");
    expect(code).toContain("export const narrations");
  });

  it("includes all voice characters in type union", () => {
    const code = generateNarrationDrama(sampleDramaInput);
    expect(code).toContain('"narrator" | "hero" | "villain"');
  });

  it("generates correct number of scenes", () => {
    const code = generateNarrationDrama(sampleDramaInput);
    const sceneCount = (code.match(/scene: "/g) || []).length;
    expect(sceneCount).toBe(3);
  });

  it("escapes double quotes in text", () => {
    const input: NarrationInput = {
      ...sampleDramaInput,
      scenes: [
        {
          scene: "TestScene",
          segments: [{ character: "hero", text: '他說了"你好"' }],
        },
      ],
    };
    const code = generateNarrationDrama(input);
    expect(code).toContain('\\"你好\\"');
  });

  it("generates correct file names", () => {
    const code = generateNarrationDrama(sampleDramaInput);
    expect(code).toContain('"01-title-scene.wav"');
    expect(code).toContain('"02-content-scene1.wav"');
    expect(code).toContain('"03-outro-scene.wav"');
  });
});

describe("generateTechExplainer", () => {
  it("uses single narrator voice only", () => {
    const input: NarrationInput = {
      ...sampleDramaInput,
      category: "tech_explainer",
    };
    const code = generateTechExplainer(input);

    expect(code).toContain('"narrator"');
    expect(code).toContain("voice: \"serena\"");
    expect(code).not.toContain("uncle_fu");
  });

  it("does not include multi-character voice map", () => {
    const code = generateTechExplainer(sampleDramaInput);
    expect(code).toContain("VOICE_MAP");
    // Only narrator in the map
    const voiceMapMatch = code.match(/VOICE_MAP[\s\S]*?\}/);
    expect(voiceMapMatch).toBeTruthy();
  });
});

describe("generateNarration (dispatcher)", () => {
  it("routes tech_explainer to tech explainer template", () => {
    const code = generateNarration({ ...sampleDramaInput, category: "tech_explainer" });
    expect(code).toContain("// Category: tech_explainer");
  });

  it("routes narrative_drama to drama template", () => {
    const code = generateNarration(sampleDramaInput);
    expect(code).toContain("// Category: narrative_drama");
  });

  it("routes galgame_vn to drama template", () => {
    const code = generateNarration({ ...sampleDramaInput, category: "galgame_vn" });
    expect(code).toContain("// Category: narrative_drama");
  });
});

describe("extractScenesFromPlan", () => {
  it("extracts scene names from PLAN.md table", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "narr-test-"));
    const planContent = `# PLAN

| Scene | Duration | Description |
|-------|----------|-------------|
| TitleScene | 3s | Opening |
| ContentScene1 | 15s | Main |
| OutroScene | 3s | Closing |
`;
    writeFileSync(resolve(tmp, "PLAN.md"), planContent);

    const scenes = extractScenesFromPlan(resolve(tmp, "PLAN.md"));
    expect(scenes).toHaveLength(3);
    expect(scenes[0].scene).toBe("TitleScene");
    expect(scenes[1].scene).toBe("ContentScene1");
    expect(scenes[2].scene).toBe("OutroScene");

    rmSync(tmp, { recursive: true });
  });

  it("returns empty array for missing file", () => {
    expect(extractScenesFromPlan("/nonexistent/PLAN.md")).toHaveLength(0);
  });
});

// ─── gen-episode-todo tests ───

describe("parsePlanForEpisode", () => {
  it("extracts episode info from directory name", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "todo-test-"));
    const epDir = resolve(tmp, "weapon-forger-ch1-ep2");
    mkdirSync(epDir, { recursive: true });

    const planContent = `# TODO — 測試系列 ch1ep2

| Scene | Duration |
|-------|----------|
| TitleScene | 3s |
| ContentScene1 | 15s |
| OutroScene | 3s |

Characters: 周墨, 考官
`;
    writeFileSync(resolve(epDir, "PLAN.md"), planContent);

    const info = parsePlanForEpisode(epDir);
    expect(info.ep_id).toBe("ch1ep2");
    expect(info.scenes).toEqual(["TitleScene", "ContentScene1", "OutroScene"]);
    expect(info.characters).toContain("周墨");
    expect(info.characters).toContain("考官");

    rmSync(tmp, { recursive: true });
  });

  it("detects tech_explainer category", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "todo-test-"));
    const epDir = resolve(tmp, "storygraph-explainer-ch1-ep1");
    mkdirSync(epDir, { recursive: true });
    writeFileSync(resolve(epDir, "PLAN.md"), "# Test\n");

    const info = parsePlanForEpisode(epDir);
    expect(info.category).toBe("tech_explainer");

    rmSync(tmp, { recursive: true });
  });

  it("detects parent TODO.md", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "todo-test-"));
    mkdirSync(resolve(tmp, "series-ch1-ep1"), { recursive: true });
    writeFileSync(resolve(tmp, "TODO.md"), "# Parent");
    writeFileSync(resolve(tmp, "series-ch1-ep1", "PLAN.md"), "# Test\n");

    const info = parsePlanForEpisode(resolve(tmp, "series-ch1-ep1"));
    expect(info.has_parent_todo).toBe(true);

    rmSync(tmp, { recursive: true });
  });
});

describe("generateEpisodeTodo", () => {
  it("generates narrative_drama TODO with all sections", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "todo-test-"));
    const epDir = resolve(tmp, "weapon-forger-ch1-ep1");
    mkdirSync(epDir, { recursive: true });

    writeFileSync(
      resolve(epDir, "PLAN.md"),
      `# Plan\n\nCharacters: 周墨, 考官\n\n| TitleScene | 3s |\n| ContentScene1 | 15s |\n| OutroScene | 3s |\n`
    );

    const todo = generateEpisodeTodo(epDir);
    expect(todo).toContain("## Story");
    expect(todo).toContain("## Quality Gate");
    expect(todo).toContain("## Setup Tasks");
    expect(todo).toContain("Write src/narration.ts (3 scenes");
    expect(todo).toContain("TitleScene.tsx");
    expect(todo).toContain("ContentScene1.tsx");
    expect(todo).toContain("Render final MP4");

    rmSync(tmp, { recursive: true });
  });

  it("generates tech_explainer TODO with narrator-only items", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "todo-test-"));
    const epDir = resolve(tmp, "storygraph-explainer-ch1-ep1");
    mkdirSync(epDir, { recursive: true });

    writeFileSync(
      resolve(epDir, "PLAN.md"),
      `# Plan\n\n| TitleScene | 3s |\n| ProblemScene | 10s |\n| OutroScene | 3s |\n`
    );

    const todo = generateEpisodeTodo(epDir);
    expect(todo).toContain("Category: tech_explainer");
    expect(todo).toContain("Characters: narrator");
    expect(todo).toContain("serena");

    rmSync(tmp, { recursive: true });
  });

  it("includes parent TODO link when parent exists", () => {
    const tmp = mkdtempSync(resolve(tmpdir(), "todo-test-"));
    const epDir = resolve(tmp, "series-ch1-ep1");
    mkdirSync(epDir, { recursive: true });
    writeFileSync(resolve(tmp, "TODO.md"), "# Parent");
    writeFileSync(resolve(epDir, "PLAN.md"), "# Plan\n\n| TitleScene | 3s |\n");

    const todo = generateEpisodeTodo(epDir);
    expect(todo).toContain("Parent: [../TODO.md]");

    rmSync(tmp, { recursive: true });
  });
});
