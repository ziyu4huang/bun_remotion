import { describe, test, expect } from "bun:test";
import { app } from "../server/index";
import { deriveCompositionId, findEpisodePath, getRenderStatus } from "../server/services/remotion-renderer";

describe("TTS API", () => {
  test("GET /api/tts/status for existing episode returns status", async () => {
    const res = await app.fetch(new Request("http://localhost/api/tts/status?episodeId=weapon-forger/weapon-forger-ch1-ep1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.episodeId).toBeTruthy();
    expect(typeof data.data.hasNarration).toBe("boolean");
    expect(typeof data.data.hasAudio).toBe("boolean");
  });

  test("GET /api/tts/status for non-existent episode", async () => {
    const res = await app.fetch(new Request("http://localhost/api/tts/status?episodeId=nonexistent/xyz"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.hasNarration).toBe(false);
    expect(data.data.hasAudio).toBe(false);
  });

  test("POST /api/tts/generate requires episodeId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("episodeId");
  });
});

describe("Render API", () => {
  test("GET /api/render/status for existing episode", async () => {
    const res = await app.fetch(new Request("http://localhost/api/render/status?episodeId=weapon-forger/weapon-forger-ch1-ep1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(typeof data.data.hasRender).toBe("boolean");
  });

  test("GET /api/render/status for non-existent episode", async () => {
    const res = await app.fetch(new Request("http://localhost/api/render/status?episodeId=nonexistent/xyz"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.hasRender).toBe(false);
  });

  test("POST /api/render/trigger requires episodeId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/render/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("remotion-renderer service", () => {
  test("deriveCompositionId converts directory names", () => {
    expect(deriveCompositionId("weapon-forger-ch1-ep1")).toBe("WeaponForgerCh1Ep1");
    expect(deriveCompositionId("my-core-is-boss-ch1-ep1")).toBe("MyCoreIsBossCh1Ep1");
    expect(deriveCompositionId("galgame-meme-theater-ep1")).toBe("GalgameMemeTheaterEp1");
  });

  test("findEpisodePath resolves known episodes", () => {
    const path = findEpisodePath("weapon-forger/weapon-forger-ch1-ep1");
    expect(path).not.toBeNull();
    expect(path).toContain("weapon-forger-ch1-ep1");
  });

  test("findEpisodePath returns null for unknown", () => {
    expect(findEpisodePath("nonexistent/xyz")).toBeNull();
  });

  test("getRenderStatus returns status object", () => {
    const status = getRenderStatus("weapon-forger/weapon-forger-ch1-ep1");
    expect(status.episodeId).toBeTruthy();
    expect(typeof status.hasRender).toBe("boolean");
  });
});
