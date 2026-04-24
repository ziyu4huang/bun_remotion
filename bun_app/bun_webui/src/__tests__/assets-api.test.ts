import { describe, test, expect } from "bun:test";
import { scanSeriesAssets, scanAllAssets } from "../server/services/asset-scanner";
import { app } from "../server/index";

describe("asset-scanner", () => {
  test("scanAllAssets returns series with assets", () => {
    const summaries = scanAllAssets();
    expect(summaries.length).toBeGreaterThanOrEqual(3);

    const ids = summaries.map((s) => s.seriesId);
    expect(ids).toContain("my-core-is-boss");
    expect(ids).toContain("weapon-forger");
    expect(ids).toContain("galgame-meme-theater");
  });

  test("scanAllAssets includes shared-fixture", () => {
    const summaries = scanAllAssets();
    const shared = summaries.find((s) => s.seriesId === "_shared");
    expect(shared).toBeDefined();
    expect(shared!.backgrounds).toBeGreaterThanOrEqual(7);
    expect(shared!.characters).toBe(0);
  });

  test("my-core-is-boss has characters and backgrounds", () => {
    const assets = scanSeriesAssets("my-core-is-boss");
    expect(assets.characters.length).toBeGreaterThanOrEqual(10);
    expect(assets.backgrounds.length).toBeGreaterThanOrEqual(5);
  });

  test("my-core-is-boss has audio per episode", () => {
    const assets = scanSeriesAssets("my-core-is-boss");
    expect(assets.audio.length).toBeGreaterThan(0);

    const episodeIds = new Set(assets.audio.map((a) => a.episodeId).filter(Boolean));
    expect(episodeIds.size).toBeGreaterThanOrEqual(1);
  });

  test("weapon-forger has characters", () => {
    const assets = scanSeriesAssets("weapon-forger");
    expect(assets.characters.length).toBeGreaterThanOrEqual(4);
  });

  test("galgame-meme-theater has backgrounds", () => {
    const assets = scanSeriesAssets("galgame-meme-theater");
    expect(assets.backgrounds.length).toBeGreaterThanOrEqual(4);
  });

  test("series with no assets returns empty arrays", () => {
    const assets = scanSeriesAssets("storygraph-explainer");
    expect(assets.characters).toEqual([]);
    expect(assets.backgrounds).toEqual([]);
    expect(assets.audio).toEqual([]);
  });

  test("nonexistent series returns empty", () => {
    const assets = scanSeriesAssets("nonexistent-xyz");
    expect(assets.characters).toEqual([]);
    expect(assets.backgrounds).toEqual([]);
    expect(assets.audio).toEqual([]);
  });

  test("_shared returns shared-fixture backgrounds", () => {
    const assets = scanSeriesAssets("_shared");
    expect(assets.backgrounds.length).toBeGreaterThanOrEqual(7);
    expect(assets.characters).toEqual([]);
    expect(assets.audio).toEqual([]);
  });

  test("every asset has required fields", () => {
    const assets = scanSeriesAssets("my-core-is-boss");
    const all = [...assets.characters, ...assets.backgrounds, ...assets.audio];
    for (const a of all) {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.type).toBeTruthy();
      expect(a.format).toBeTruthy();
      expect(a.seriesId).toBe("my-core-is-boss");
      expect(a.path).toBeTruthy();
      expect(a.size).toBeGreaterThan(0);
    }
  });

  test("audio assets have episodeId", () => {
    const assets = scanSeriesAssets("my-core-is-boss");
    for (const a of assets.audio) {
      expect(a.episodeId).toBeTruthy();
      expect(a.type).toBe("audio");
    }
  });

  test("summaries have positive counts", () => {
    const summaries = scanAllAssets();
    for (const s of summaries) {
      expect(s.seriesId).toBeTruthy();
      expect(s.seriesName).toBeTruthy();
      const total = s.characters + s.backgrounds + s.audio;
      expect(total).toBeGreaterThan(0);
    }
  });
});

describe("assets API", () => {
  test("GET /api/assets returns all series summaries", async () => {
    const res = await app.fetch(new Request("http://localhost/api/assets"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(3);
  });

  test("GET /api/assets/my-core-is-boss returns full assets", async () => {
    const res = await app.fetch(new Request("http://localhost/api/assets/my-core-is-boss"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.characters.length).toBeGreaterThan(0);
    expect(data.data.backgrounds.length).toBeGreaterThan(0);
    expect(data.data.seriesId).toBe("my-core-is-boss");
  });

  test("GET /api/assets/my-core-is-boss/characters returns characters only", async () => {
    const res = await app.fetch(new Request("http://localhost/api/assets/my-core-is-boss/characters"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    for (const a of data.data) {
      expect(a.type).toBe("character");
    }
  });

  test("GET /api/assets/my-core-is-boss/backgrounds returns backgrounds only", async () => {
    const res = await app.fetch(new Request("http://localhost/api/assets/my-core-is-boss/backgrounds"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    for (const a of data.data) {
      expect(a.type).toBe("background");
    }
  });

  test("GET /api/assets/my-core-is-boss/audio returns audio only", async () => {
    const res = await app.fetch(new Request("http://localhost/api/assets/my-core-is-boss/audio"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    if (data.data.length > 0) {
      for (const a of data.data) {
        expect(a.type).toBe("audio");
      }
    }
  });

  test("GET /api/assets/_shared returns shared backgrounds", async () => {
    const res = await app.fetch(new Request("http://localhost/api/assets/_shared"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.backgrounds.length).toBeGreaterThanOrEqual(7);
    expect(data.data.characters).toEqual([]);
  });

  test("GET /api/assets/file/ serves actual file", async () => {
    const listRes = await app.fetch(new Request("http://localhost/api/assets/my-core-is-boss/backgrounds"));
    const listData = await listRes.json();
    if (listData.data.length > 0) {
      const asset = listData.data[0];
      // path is absolute; construct relative path from bun_remotion_proj/
      const relFromProj = asset.path.split("bun_remotion_proj/")[1];
      expect(relFromProj).toBeTruthy();
      const fileRes = await app.fetch(new Request(`http://localhost/api/assets/file/${relFromProj}`));
      expect(fileRes.status).toBe(200);
    }
  });

  test("GET /api/assets/file/ rejects paths outside PROJ_DIR", async () => {
    // Hono normalizes path, so ../ is stripped. Test with URL-encoded traversal
    const res = await app.fetch(new Request("http://localhost/api/assets/file/%2e%2e%2f%2e%2e%2fetc/passwd"));
    // Either 403 (path resolves outside) or 404 (file not found) is acceptable
    expect(res.status === 403 || res.status === 404).toBe(true);
  });

  test("GET /api/assets/file/ returns 404 for missing file", async () => {
    const res = await app.fetch(new Request("http://localhost/api/assets/file/nonexistent/missing.png"));
    expect(res.status).toBe(404);
  });
});
