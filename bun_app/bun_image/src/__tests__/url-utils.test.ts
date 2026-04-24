import { describe, test, expect } from "bun:test";
import { extractImageUrl, sanitizeFilename, buildCharacterPrompt, buildBackgroundPrompt } from "../url-utils";

describe("extractImageUrl", () => {
  test("decodes Next.js proxy URL", () => {
    const proxy = "/_next/image?url=https%3A%2F%2Fcdn.example.com%2Fimg%2Fabc123.png&w=2048&q=75";
    expect(extractImageUrl(proxy)).toBe("https://cdn.example.com/img/abc123.png");
  });

  test("decodes complex URL with special characters", () => {
    const proxy = "/_next/image?url=https%3A%2F%2Foss.z.ai%2Fimages%2Fgen-2026%2Fmy-image.png%3Ftoken%3Dabc123&w=1920&q=80";
    expect(extractImageUrl(proxy)).toBe("https://oss.z.ai/images/gen-2026/my-image.png?token=abc123");
  });

  test("throws when no url= parameter", () => {
    expect(() => extractImageUrl("https://example.com/image.png")).toThrow("No url= parameter");
  });
});

describe("sanitizeFilename", () => {
  test("appends .png when no extension", () => {
    expect(sanitizeFilename("my-character")).toBe("my-character.png");
  });

  test("preserves .png extension", () => {
    expect(sanitizeFilename("my-character.png")).toBe("my-character.png");
  });

  test("preserves .jpg extension", () => {
    expect(sanitizeFilename("bg.jpg")).toBe("bg.jpg");
  });

  test("replaces unsafe characters", () => {
    expect(sanitizeFilename('my/file:name?test')).toBe("my-file-name-test.png");
  });

  test("collapses multiple dashes", () => {
    expect(sanitizeFilename("hello   world")).toBe("hello-world.png");
  });
});

describe("buildCharacterPrompt", () => {
  test("includes facing LEFT 3x by default", () => {
    const prompt = buildCharacterPrompt("a warrior with a sword");
    const leftCount = (prompt.match(/LEFT/g) || []).length;
    expect(leftCount).toBeGreaterThanOrEqual(3);
    expect(prompt).toContain("magenta #FF00FF");
  });

  test("supports facing RIGHT", () => {
    const prompt = buildCharacterPrompt("a mage", { facing: "RIGHT" });
    const rightCount = (prompt.match(/RIGHT/g) || []).length;
    expect(rightCount).toBeGreaterThanOrEqual(3);
  });

  test("includes style when provided", () => {
    const prompt = buildCharacterPrompt("a hero", { style: "watercolor" });
    expect(prompt).toContain("watercolor");
  });

  test("includes description", () => {
    const prompt = buildCharacterPrompt("a young swordsman with blue hair");
    expect(prompt).toContain("a young swordsman with blue hair");
  });
});

describe("buildBackgroundPrompt", () => {
  test("includes no-text directive", () => {
    const prompt = buildBackgroundPrompt("a mountain temple at sunset");
    expect(prompt).toContain("no text, no watermark, no characters");
  });

  test("includes cinematic wide shot", () => {
    const prompt = buildBackgroundPrompt("a forest");
    expect(prompt).toContain("cinematic wide shot");
  });

  test("includes style when provided", () => {
    const prompt = buildBackgroundPrompt("a castle", { style: "oil painting" });
    expect(prompt).toContain("oil painting");
  });
});
