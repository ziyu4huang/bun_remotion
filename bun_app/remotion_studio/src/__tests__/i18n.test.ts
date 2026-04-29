import { describe, it, expect } from "bun:test";
import { en } from "../client/i18n/en.js";
import { zh_TW } from "../client/i18n/zh_TW.js";

/** Recursively collect all leaf key paths from a nested object */
function collectKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof val === "function") {
      keys.push(path);
    } else if (typeof val === "object" && val !== null) {
      keys.push(...collectKeys(val as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe("i18n", () => {
  it("en and zh_TW have identical key structure", () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>).sort();
    const zhKeys = collectKeys(zh_TW as unknown as Record<string, unknown>).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it("zh_TW does not contain any English-only strings from en", () => {
    const zh = zh_TW as unknown as Record<string, unknown>;
    // These are strings that should definitely be translated
    const spotChecks: [string[], string][] = [
      [["nav", "overview"], "總覽"],
      [["nav", "production"], "製作"],
      [["nav", "assets"], "素材"],
      [["pages", "dashboard"], "儀表板"],
      [["pages", "storyEditor"], "故事編輯器"],
      [["pages", "agentChat"], "AI 對話"],
      [["dashboard", "title"], "儀表板"],
      [["dashboard", "serverStatus"], "伺服器狀態"],
      [["dashboard", "noJobs"], "尚無工作"],
      [["monitoring", "title"], "監控"],
      [["pipelineProgress", "title"], "管線進度"],
      [["kanban", "title"], "看板"],
      [["projects", "title"], "專案"],
      [["storyEditor", "title"], "故事編輯器"],
      [["workflows", "title"], "工作流"],
      [["storygraph", "title"], "故事圖譜"],
      [["quality", "title"], "品質儀表板"],
      [["benchmark", "title"], "基準測試"],
      [["agentChat", "title"], "AI 對話"],
      [["assets", "title"], "素材庫"],
      [["tts", "title"], "語音合成"],
      [["render", "title"], "渲染"],
      [["imageGen", "title"], "圖片生成"],
      [["error", "title"], "發生錯誤"],
    ];

    for (const [path, expected] of spotChecks) {
      let obj: unknown = zh;
      for (const key of path) {
        obj = (obj as Record<string, unknown>)[key];
      }
      expect(obj).toBe(expected);
    }
  });

  it("en translations are non-empty strings", () => {
    const enObj = en as unknown as Record<string, unknown>;
    const stringValues = collectKeys(enObj)
      .filter((k) => {
        let val: unknown = enObj;
        for (const part of k.split(".")) val = (val as Record<string, unknown>)[part];
        return typeof val === "string";
      });
    expect(stringValues.length).toBeGreaterThan(100);
    for (const key of stringValues) {
      let val: unknown = enObj;
      for (const part of key.split(".")) val = (val as Record<string, unknown>)[part];
      expect(typeof val).toBe("string");
      expect((val as string).length).toBeGreaterThan(0);
    }
  });

  it("function translations produce non-empty strings", () => {
    // Test parameterized translations
    expect(en.dashboard.running(50)).toBe("Running... 50%");
    expect(en.dashboard.episodesInProgress(3)).toBe("3 episodes in progress");
    expect(en.dashboard.cleared(5)).toBe("Cleared 5 completed jobs");
    expect(en.dashboard.duration(90)).toBe("1m 30s");
    expect(en.dashboard.duration(30)).toBe("30s");
    expect(en.dashboard.treeDone(3, 7)).toBe("3/7 done");

    expect(zh_TW.dashboard.running(50)).toBe("執行中... 50%");
    expect(zh_TW.dashboard.episodesInProgress(3)).toBe("3 個集數進行中");
    expect(zh_TW.dashboard.duration(90)).toBe("1分 30秒");
    expect(zh_TW.dashboard.duration(30)).toBe("30秒");
    expect(zh_TW.dashboard.treeDone(3, 7)).toBe("3/7 完成");

    expect(en.agentChat.placeholder("story-advisor")).toBe("Message story-advisor...");
    expect(zh_TW.agentChat.placeholder("story-advisor")).toBe("發訊息給 story-advisor...");

    expect(en.assets.matchCount(3, 10)).toBe("3 of 10 match");
    expect(zh_TW.assets.matchCount(3, 10)).toBe("10 筆中符合 3 筆");
  });

  it("covers all major page sections", () => {
    const sections = [
      "dashboard", "monitoring", "pipelineProgress", "kanban",
      "projects", "storyEditor", "workflows", "storygraph",
      "quality", "benchmark", "agentChat", "assets",
      "tts", "render", "imageGen", "error",
    ] as const;

    for (const section of sections) {
      expect((en as Record<string, unknown>)[section]).toBeDefined();
      expect((zh_TW as Record<string, unknown>)[section]).toBeDefined();
    }
  });
});
