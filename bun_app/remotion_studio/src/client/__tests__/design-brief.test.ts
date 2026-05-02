import { describe, test, expect } from "bun:test";
import { briefToPrompt, EMPTY_BRIEF, type DesignBrief } from "../components/ImageDesignBrief";

// EMPTY_BRIEF has artStyle: "anime" and expression: "neutral" — tests must account for this

describe("briefToPrompt", () => {
  test("returns empty string for fully empty brief", () => {
    const empty: DesignBrief = {
      name: "", artStyle: "", gender: "", hairColor: "", hairStyle: "",
      eyeColor: "", outfit: "", accessories: "", expression: "", extra: "",
    };
    expect(briefToPrompt(empty)).toBe("");
  });

  test("returns expression only when just expression is set", () => {
    const brief: DesignBrief = {
      name: "", artStyle: "", gender: "", hairColor: "", hairStyle: "",
      eyeColor: "", outfit: "", accessories: "", expression: "happy", extra: "",
    };
    expect(briefToPrompt(brief)).toBe("happy expression");
  });

  test("includes character name", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, name: "Luna" });
    expect(result).toContain("character named Luna");
  });

  test("combines hairStyle and hairColor", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, hairStyle: "long", hairColor: "silver" });
    expect(result).toContain("long silver hair");
  });

  test("uses hairColor alone when no hairStyle", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, hairColor: "blue", hairStyle: "" });
    expect(result).toContain("blue hair");
  });

  test("uses hairStyle alone when no hairColor", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, hairStyle: "twin-tails", hairColor: "" });
    expect(result).toContain("twin-tails hair");
  });

  test("includes eye color", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, eyeColor: "red" });
    expect(result).toContain("red eyes");
  });

  test("includes outfit with 'wearing' prefix", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, outfit: "school uniform" });
    expect(result).toContain("wearing school uniform");
  });

  test("includes accessories directly", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, accessories: "glasses" });
    expect(result).toContain("glasses");
  });

  test("includes expression with suffix", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, expression: "happy" });
    expect(result).toContain("happy expression");
  });

  test("includes extra details", () => {
    const result = briefToPrompt({ ...EMPTY_BRIEF, extra: "scar on left cheek" });
    expect(result).toContain("scar on left cheek");
  });

  test("full brief produces all parts", () => {
    const brief: DesignBrief = {
      name: "Sakura",
      artStyle: "anime",
      gender: "girl",
      hairColor: "pink",
      hairStyle: "short",
      eyeColor: "green",
      outfit: "armor",
      accessories: "sword",
      expression: "determined",
      extra: "cherry blossom petals",
    };
    const result = briefToPrompt(brief);
    expect(result).toContain("anime");
    expect(result).toContain("girl");
    expect(result).toContain("character named Sakura");
    expect(result).toContain("short pink hair");
    expect(result).toContain("green eyes");
    expect(result).toContain("wearing armor");
    expect(result).toContain("sword");
    expect(result).toContain("determined expression");
    expect(result).toContain("cherry blossom petals");
  });

  test("parts are comma-separated", () => {
    const brief: DesignBrief = {
      name: "", artStyle: "watercolor", gender: "boy", hairColor: "", hairStyle: "",
      eyeColor: "", outfit: "", accessories: "", expression: "", extra: "",
    };
    expect(briefToPrompt(brief)).toBe("watercolor, boy");
  });

  test("default EMPTY_BRIEF has anime art style and neutral expression", () => {
    expect(EMPTY_BRIEF.artStyle).toBe("anime");
    expect(EMPTY_BRIEF.expression).toBe("neutral");
  });

  test("default EMPTY_BRIEF produces 'anime, neutral expression'", () => {
    expect(briefToPrompt(EMPTY_BRIEF)).toBe("anime, neutral expression");
  });
});
