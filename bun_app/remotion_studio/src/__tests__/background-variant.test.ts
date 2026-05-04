import { describe, test, expect } from "bun:test";
import {
  TIME_OF_DAY,
  TIME_OF_DAY_MODIFIERS,
  timeOfDayFilename,
} from "../client/components/BackgroundVariantSheet";
import type { TimeOfDay } from "../client/components/BackgroundVariantSheet";

describe("BackgroundVariantSheet — TIME_OF_DAY_MODIFIERS", () => {
  test("has exactly 4 time-of-day entries", () => {
    expect(Object.keys(TIME_OF_DAY_MODIFIERS)).toHaveLength(4);
  });

  test("contains dawn, day, dusk, night keys", () => {
    const keys = Object.keys(TIME_OF_DAY_MODIFIERS);
    expect(keys).toContain("dawn");
    expect(keys).toContain("day");
    expect(keys).toContain("dusk");
    expect(keys).toContain("night");
  });

  test("each modifier is a non-empty string", () => {
    for (const time of TIME_OF_DAY) {
      expect(typeof TIME_OF_DAY_MODIFIERS[time]).toBe("string");
      expect(TIME_OF_DAY_MODIFIERS[time].length).toBeGreaterThan(0);
    }
  });

  test("dawn modifier contains warm/golden keywords", () => {
    expect(TIME_OF_DAY_MODIFIERS.dawn).toContain("warm");
    expect(TIME_OF_DAY_MODIFIERS.dawn).toContain("golden");
  });

  test("night modifier contains moonlit/blue keywords", () => {
    expect(TIME_OF_DAY_MODIFIERS.night).toContain("moonlit");
    expect(TIME_OF_DAY_MODIFIERS.night).toContain("blue");
  });
});

describe("timeOfDayFilename", () => {
  test("appends time suffix before .png extension", () => {
    expect(timeOfDayFilename("temple.png", "dawn")).toBe("temple-dawn.png");
  });

  test("handles filename without extension", () => {
    expect(timeOfDayFilename("mountain", "day")).toBe("mountain-day.png");
  });

  test("handles all four times", () => {
    const base = "scene.png";
    const results = TIME_OF_DAY.map((t) => timeOfDayFilename(base, t));
    expect(results).toEqual([
      "scene-dawn.png",
      "scene-day.png",
      "scene-dusk.png",
      "scene-night.png",
    ]);
  });

  test("handles uppercase .PNG extension", () => {
    expect(timeOfDayFilename("castle.PNG", "dusk")).toBe("castle-dusk.png");
  });

  test("handles filenames with hyphens", () => {
    expect(timeOfDayFilename("dark-forest.png", "night")).toBe(
      "dark-forest-night.png"
    );
  });

  test("produces unique filenames for each time", () => {
    const base = "test.png";
    const names = new Set(TIME_OF_DAY.map((t) => timeOfDayFilename(base, t)));
    expect(names.size).toBe(4);
  });
});

describe("TIME_OF_DAY const", () => {
  test("is a readonly tuple of 4 entries", () => {
    expect(TIME_OF_DAY).toHaveLength(4);
    expect(TIME_OF_DAY).toEqual(["dawn", "day", "dusk", "night"]);
  });
});
