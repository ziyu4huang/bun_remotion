import { describe, test, expect } from "bun:test";
import {
  CATEGORY_TEMPLATE_MAP,
  CATEGORY_LABELS,
  WORKFLOW_TEMPLATES,
  getAllCategories,
  getTemplatesForCategory,
} from "../server/services/workflow/templates.js";

const TEMPLATE_IDS = new Set(WORKFLOW_TEMPLATES.map((t) => t.id));

describe("CATEGORY_TEMPLATE_MAP", () => {
  test("every category has at least one template", () => {
    for (const [cat, suggestions] of Object.entries(CATEGORY_TEMPLATE_MAP)) {
      expect(suggestions.length, `Category "${cat}" should have at least 1 template`).toBeGreaterThan(0);
    }
  });

  test("all referenced templates exist in WORKFLOW_TEMPLATES", () => {
    for (const [cat, suggestions] of Object.entries(CATEGORY_TEMPLATE_MAP)) {
      for (const s of suggestions) {
        expect(TEMPLATE_IDS.has(s.templateId), `Template "${s.templateId}" in category "${cat}" not found in WORKFLOW_TEMPLATES`).toBe(true);
      }
    }
  });

  test("no duplicate template references within a category", () => {
    for (const [cat, suggestions] of Object.entries(CATEGORY_TEMPLATE_MAP)) {
      const ids = suggestions.map((s) => s.templateId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size, `Category "${cat}" has duplicate template references`).toBe(ids.length);
    }
  });

  test("every suggestion has a reason", () => {
    for (const [cat, suggestions] of Object.entries(CATEGORY_TEMPLATE_MAP)) {
      for (const s of suggestions) {
        expect(s.reason.length, `Template "${s.templateId}" in category "${cat}" missing reason`).toBeGreaterThan(0);
      }
    }
  });

  test("CATEGORY_LABELS has entry for every category", () => {
    const categories = Object.keys(CATEGORY_TEMPLATE_MAP);
    for (const cat of categories) {
      expect(CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS], `Missing label for "${cat}"`).toBeDefined();
    }
  });

  test("CATEGORY_LABELS has both en and zh_TW", () => {
    for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
      expect(label.en.length, `Missing en label for "${cat}"`).toBeGreaterThan(0);
      expect(label.zh_TW.length, `Missing zh_TW label for "${cat}"`).toBeGreaterThan(0);
    }
  });
});

describe("getTemplatesForCategory", () => {
  test("returns suggestions for valid category", () => {
    const suggestions = getTemplatesForCategory("narrative_drama");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].templateId).toBe("full-pipeline");
  });

  test("returns empty array for unknown category", () => {
    const suggestions = getTemplatesForCategory("nonexistent" as any);
    expect(suggestions).toHaveLength(0);
  });
});

describe("getAllCategories", () => {
  test("returns all 7 categories", () => {
    const cats = getAllCategories();
    expect(cats).toHaveLength(7);
    expect(cats).toContain("narrative_drama");
    expect(cats).toContain("tech_explainer");
    expect(cats).toContain("shorts_meme");
  });
});

describe("defaults consistency", () => {
  test("mode defaults are valid values", () => {
    const validModes = new Set(["regex", "ai", "hybrid"]);
    for (const suggestions of Object.values(CATEGORY_TEMPLATE_MAP)) {
      for (const s of suggestions) {
        if (s.defaults?.mode) {
          expect(validModes.has(s.defaults.mode as string), `Invalid mode "${s.defaults.mode}"`).toBe(true);
        }
      }
    }
  });

  test("ttsEngine defaults are valid values", () => {
    const validEngines = new Set(["mlx", "gemini"]);
    for (const suggestions of Object.values(CATEGORY_TEMPLATE_MAP)) {
      for (const s of suggestions) {
        if (s.defaults?.ttsEngine) {
          expect(validEngines.has(s.defaults.ttsEngine as string), `Invalid ttsEngine "${s.defaults.ttsEngine}"`).toBe(true);
        }
      }
    }
  });
});
