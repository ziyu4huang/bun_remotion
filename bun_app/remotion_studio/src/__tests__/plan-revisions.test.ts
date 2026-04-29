import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

describe("plan revisions API", () => {
  test("GET /api/plans/:seriesId/revisions returns array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/plans/weapon-forger/revisions"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /api/plans/:seriesId/revisions/:revId returns 404 for missing revision", async () => {
    const res = await app.fetch(new Request("http://localhost/api/plans/weapon-forger/revisions/nonexistent"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("not found");
  });

  test("revision entries have expected shape", async () => {
    const res = await app.fetch(new Request("http://localhost/api/plans/weapon-forger/revisions"));
    const data = await res.json();
    if (data.data.length > 0) {
      const rev = data.data[0];
      expect(rev).toHaveProperty("id");
      expect(rev).toHaveProperty("timestamp");
      expect(rev).toHaveProperty("size");
      expect(typeof rev.size).toBe("number");
    }
  });
});
