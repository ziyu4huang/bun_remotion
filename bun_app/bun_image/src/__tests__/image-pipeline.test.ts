import { describe, test, expect, beforeEach } from "bun:test";
import { generateImageBatch, type ImageBatchItem, type EngineLike } from "../image-pipeline";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

function createMockEngine(): EngineLike {
  return {
    generateSingle: async (opts) => ({
      downloadUrl: `https://cdn.example.com/${opts.prompt.slice(0, 8).replace(/\s/g, "-")}.png`,
      prompt: opts.prompt,
    }),
    downloadImage: async (_url, path) => {
      await Bun.write(path, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    },
    close: async () => {},
  };
}

describe("generateImageBatch", () => {
  const testDir = resolve(tmpdir(), `bun-image-test-${Date.now()}`);

  beforeEach(() => {
    try { rmSync(testDir, { recursive: true }); } catch {}
  });

  const cleanup = () => { try { rmSync(testDir, { recursive: true }); } catch {} };

  test("generates images via engine", async () => {
    mkdirSync(testDir, { recursive: true });
    const engine = createMockEngine();

    const result = await generateImageBatch({
      images: [
        { filename: "hero.png", prompt: "a hero character" },
        { filename: "villain.png", prompt: "a villain character" },
      ],
      outputDir: testDir,
      engine,
    });

    expect(result.generated).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(2);
    expect(existsSync(resolve(testDir, "hero.png"))).toBe(true);
    expect(existsSync(resolve(testDir, "villain.png"))).toBe(true);
    cleanup();
  });

  test("skips files that already exist", async () => {
    mkdirSync(testDir, { recursive: true });
    await Bun.write(resolve(testDir, "existing.png"), "fake");
    const engine = createMockEngine();

    const messages: string[] = [];
    const result = await generateImageBatch({
      images: [
        { filename: "existing.png", prompt: "a test image" },
        { filename: "new.png", prompt: "another test image" },
      ],
      outputDir: testDir,
      skipExisting: true,
      engine,
      onProgress: (msg) => messages.push(msg),
    });

    expect(result.skipped).toBe(1);
    expect(result.generated).toBe(1);
    expect(messages[0]).toContain("Skipped");
    expect(messages[1]).toContain("Generating");
    cleanup();
  });

  test("does not skip when skipExisting is false", async () => {
    mkdirSync(testDir, { recursive: true });
    await Bun.write(resolve(testDir, "existing.png"), "fake");
    const engine = createMockEngine();

    const result = await generateImageBatch({
      images: [{ filename: "existing.png", prompt: "a test image" }],
      outputDir: testDir,
      skipExisting: false,
      engine,
    });

    expect(result.skipped).toBe(0);
    expect(result.generated).toBe(1);
    cleanup();
  });

  test("reports all skipped when all files exist", async () => {
    mkdirSync(testDir, { recursive: true });
    await Bun.write(resolve(testDir, "a.png"), "fake");
    await Bun.write(resolve(testDir, "b.png"), "fake");

    const result = await generateImageBatch({
      images: [
        { filename: "a.png", prompt: "image a" },
        { filename: "b.png", prompt: "image b" },
      ],
      outputDir: testDir,
      skipExisting: true,
      engine: createMockEngine(),
    });

    expect(result.skipped).toBe(2);
    expect(result.generated).toBe(0);
    expect(result.failed).toBe(0);
    cleanup();
  });

  test("progress messages include index", async () => {
    mkdirSync(testDir, { recursive: true });

    const messages: string[] = [];
    await generateImageBatch({
      images: [
        { filename: "a.png", prompt: "image a" },
        { filename: "b.png", prompt: "image b" },
      ],
      outputDir: testDir,
      skipExisting: true,
      engine: createMockEngine(),
      onProgress: (msg) => messages.push(msg),
    });

    expect(messages.some((m) => m.includes("[1/2]"))).toBe(true);
    expect(messages.some((m) => m.includes("[2/2]"))).toBe(true);
    cleanup();
  });

  test("writes metadata companion file", async () => {
    mkdirSync(testDir, { recursive: true });

    await generateImageBatch({
      images: [{
        filename: "meta-test.png",
        prompt: "a test",
        metadata: { character: "hero", facing: "LEFT" },
      }],
      outputDir: testDir,
      engine: createMockEngine(),
    });

    const metaPath = resolve(testDir, "meta-test.json");
    expect(existsSync(metaPath)).toBe(true);
    const content = await Bun.file(metaPath).json();
    expect(content.character).toBe("hero");
    expect(content.facing).toBe("LEFT");
    expect(content.file).toBe("meta-test.png");
    cleanup();
  });

  test("counts failed images", async () => {
    mkdirSync(testDir, { recursive: true });
    const failingEngine: EngineLike = {
      generateSingle: async () => { throw new Error("Browser crashed"); },
      downloadImage: async () => {},
      close: async () => {},
    };

    const result = await generateImageBatch({
      images: [{ filename: "fail.png", prompt: "test" }],
      outputDir: testDir,
      engine: failingEngine,
    });

    expect(result.failed).toBe(1);
    expect(result.generated).toBe(0);
    cleanup();
  });

  test("calls onImageComplete for each generated image", async () => {
    mkdirSync(testDir, { recursive: true });
    const completed: number[] = [];

    await generateImageBatch({
      images: [
        { filename: "a.png", prompt: "image a" },
        { filename: "b.png", prompt: "image b" },
      ],
      outputDir: testDir,
      engine: createMockEngine(),
      onImageComplete: (_result, index, total) => {
        completed.push(index);
        expect(total).toBe(2);
      },
    });

    expect(completed).toEqual([0, 1]);
    cleanup();
  });
});
