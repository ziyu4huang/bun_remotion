import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

describe("scaffold API", () => {
  test("POST /api/scaffold requires series", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("series is required");
  });

  test("POST /api/scaffold creates job for valid request", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          series: "weapon-forger",
          chapter: 99,
          episode: 99,
          dryRun: true,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.type).toBe("scaffold");
    expect(data.data.id).toBeTruthy();
  });
});
