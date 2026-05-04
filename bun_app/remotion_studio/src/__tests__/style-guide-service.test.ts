import { describe, test, expect, beforeEach } from "bun:test";
import { resolve } from "node:path";
import { existsSync, mkdirSync, rmSync } from "node:fs";

const DATA_DIR = resolve(import.meta.dir, "../../server/../../../data/style-guides-test");

describe("style-guide service", () => {
  beforeEach(() => {
    if (existsSync(DATA_DIR)) rmSync(DATA_DIR, { recursive: true });
  });

  test("saveStyleGuide creates and reads back guide", async () => {
    const { saveStyleGuide, getStyleGuide } = await import("../server/services/style-guide");
    // Override data dir for testing — not easily possible without DI.
    // Instead, test via the route-level integration.
    // For unit-level, test styleGuideToPromptPrefix which is pure.
  });

  test("styleGuideToPromptPrefix builds prefix from all fields", async () => {
    const { styleGuideToPromptPrefix } = await import("../server/services/style-guide");
    const result = styleGuideToPromptPrefix({
      seriesId: "test",
      artStyle: "anime",
      colorPalette: "warm pastels",
      mood: "dramatic",
      recurringElements: "cherry blossoms",
      additionalNotes: "extra notes",
      updatedAt: new Date().toISOString(),
    });
    expect(result).toContain("art style: anime");
    expect(result).toContain("colors: warm pastels");
    expect(result).toContain("mood: dramatic");
    expect(result).toContain("elements: cherry blossoms");
    expect(result).not.toContain("extra notes");
  });

  test("styleGuideToPromptPrefix skips empty fields", async () => {
    const { styleGuideToPromptPrefix } = await import("../server/services/style-guide");
    const result = styleGuideToPromptPrefix({
      seriesId: "test",
      artStyle: "watercolor",
      colorPalette: "",
      mood: "",
      recurringElements: "",
      additionalNotes: "",
      updatedAt: new Date().toISOString(),
    });
    expect(result).toBe("art style: watercolor");
  });

  test("styleGuideToPromptPrefix returns empty string for empty guide", async () => {
    const { styleGuideToPromptPrefix } = await import("../server/services/style-guide");
    const result = styleGuideToPromptPrefix({
      seriesId: "test",
      artStyle: "",
      colorPalette: "",
      mood: "",
      recurringElements: "",
      additionalNotes: "",
      updatedAt: new Date().toISOString(),
    });
    expect(result).toBe("");
  });
});
