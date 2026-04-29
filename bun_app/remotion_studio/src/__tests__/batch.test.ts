import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

describe("batch API", () => {
  test("POST /api/batch rejects missing operation", async () => {
    const res = await app.fetch(new Request("http://localhost/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seriesId: "weapon-forger" }),
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("operation");
  });

  test("POST /api/batch rejects invalid operation", async () => {
    const res = await app.fetch(new Request("http://localhost/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "unknown", seriesId: "weapon-forger" }),
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
  });

  test("POST /api/batch rejects missing filter", async () => {
    const res = await app.fetch(new Request("http://localhost/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "tts" }),
    }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("episodeIds");
  });

  test("POST /api/batch returns 404 for no matching episodes", async () => {
    const res = await app.fetch(new Request("http://localhost/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "tts", seriesId: "nonexistent-series" }),
    }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("No matching");
  });

  test("POST /api/batch creates a job for valid tts request", async () => {
    const res = await app.fetch(new Request("http://localhost/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "tts", episodeIds: ["nonexistent"] }),
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.type).toBe("batch-tts");
    expect(data.data.id).toBeTruthy();
    expect(data.data.status).toBeDefined();
  });

  test("POST /api/batch creates a job for valid render request", async () => {
    const res = await app.fetch(new Request("http://localhost/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "render", episodeIds: ["nonexistent"] }),
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.type).toBe("batch-render");
  });

  test("batch job result has correct shape after completion", async () => {
    const res = await app.fetch(new Request("http://localhost/api/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "tts", episodeIds: ["nonexistent"] }),
    }));
    const data = await res.json();
    const jobId = data.data.id;

    // Wait for job to complete (episode doesn't exist, will be skipped)
    await new Promise((r) => setTimeout(r, 500));

    const jobRes = await app.fetch(new Request(`http://localhost/api/jobs/${jobId}`));
    const jobData = await jobRes.json();
    expect(jobData.ok).toBe(true);

    const result = jobData.data.result;
    expect(result).toBeDefined();
    expect(result.operation).toBe("tts");
    expect(result.total).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.episodes).toHaveLength(1);
    expect(result.episodes[0].episodeId).toBe("nonexistent");
    expect(result.episodes[0].status).toBe("skipped");
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});
