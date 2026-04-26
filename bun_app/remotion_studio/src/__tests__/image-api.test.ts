import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

describe("Image API", () => {
  test("GET /api/image/status requires seriesId", async () => {
    const res = await app.fetch(new Request("http://localhost/api/image/status"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("seriesId");
  });

  test("GET /api/image/status for non-existent series returns 404", async () => {
    const res = await app.fetch(new Request("http://localhost/api/image/status?seriesId=nonexistent-series"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("not found");
  });

  test("GET /api/image/status for existing series", async () => {
    const res = await app.fetch(new Request("http://localhost/api/image/status?seriesId=weapon-forger"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.seriesId).toBe("weapon-forger");
    expect(typeof data.data.characters).toBe("number");
    expect(typeof data.data.backgrounds).toBe("number");
  });

  test("POST /api/image/generate requires seriesId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: [{ filename: "test.png", prompt: "test" }] }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("seriesId");
  });

  test("POST /api/image/generate requires images array", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId: "weapon-forger" }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("images");
  });

  test("POST /api/image/generate creates a job", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seriesId: "weapon-forger",
          images: [{ filename: "test-hero.png", prompt: "a test hero character" }],
          skipExisting: true,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.id).toBeTruthy();
    expect(data.data.type).toBe("image-generate");
  });
});
