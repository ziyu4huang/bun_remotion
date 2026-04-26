import { describe, test, expect } from "bun:test";
import { app } from "../server/index";
import { listPlans, readPlanRaw, writePlanRaw, readEpisodePlan, readPlan } from "../server/services/plan-editor";

const WEAPON_FORGER = "weapon-forger";

describe("plan-editor service", () => {
  test("listPlans returns series with PLAN.md", () => {
    const plans = listPlans();
    expect(plans.length).toBeGreaterThan(0);
    const wf = plans.find((p) => p.seriesId === WEAPON_FORGER);
    expect(wf).toBeDefined();
    expect(wf!.hasPlan).toBe(true);
    expect(wf!.seriesName).toBeTruthy();
  });

  test("readPlanRaw returns markdown for existing series", () => {
    const raw = readPlanRaw(WEAPON_FORGER);
    expect(raw).not.toBeNull();
    expect(raw!.startsWith("# ")).toBe(true);
    expect(raw!).toContain("Characters");
  });

  test("readPlanRaw returns null for non-existent series", () => {
    expect(readPlanRaw("nonexistent-series-xyz")).toBeNull();
  });

  test("readPlan returns parsed data", async () => {
    const result = await readPlan(WEAPON_FORGER);
    expect(result).not.toBeNull();
    expect(result!.seriesId).toBe(WEAPON_FORGER);
    expect(result!.raw.length).toBeGreaterThan(0);
    expect(result!.sections.length).toBeGreaterThan(0);
    expect(result!.parsed.characters).not.toBeNull();
    expect(result!.parsed.characters!.length).toBeGreaterThan(0);
    expect(result!.parsed.episodeGuide).not.toBeNull();
    expect(result!.parsed.episodeGuide!.length).toBeGreaterThan(0);
  });

  test("readPlan returns null for non-existent series", async () => {
    expect(await readPlan("nonexistent-series-xyz")).toBeNull();
  });

  test("readEpisodePlan returns null for non-existent episode", () => {
    expect(readEpisodePlan(WEAPON_FORGER, "nonexistent-ep")).toBeNull();
  });
});

describe("plan-editor API routes", () => {
  test("GET /api/plans — list all plans", async () => {
    const res = await app.request("/api/plans");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    const wf = body.data.find((p: any) => p.seriesId === WEAPON_FORGER);
    expect(wf).toBeDefined();
    expect(wf.hasPlan).toBe(true);
  });

  test("GET /api/plans/:seriesId — parsed plan", async () => {
    const res = await app.request(`/api/plans/${WEAPON_FORGER}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.seriesId).toBe(WEAPON_FORGER);
    expect(body.data.raw.length).toBeGreaterThan(0);
    expect(body.data.sections.length).toBeGreaterThan(0);
    expect(body.data.parsed.characters).not.toBeNull();
  });

  test("GET /api/plans/:seriesId — 404 for non-existent", async () => {
    const res = await app.request("/api/plans/nonexistent-series-xyz");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("GET /api/plans/:seriesId/raw — raw markdown", async () => {
    const res = await app.request(`/api/plans/${WEAPON_FORGER}/raw`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.startsWith("# ")).toBe(true);
  });

  test("PUT /api/plans/:seriesId/raw — write requires content", async () => {
    const res = await app.request(`/api/plans/${WEAPON_FORGER}/raw`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  test("PUT /api/plans/:seriesId/raw — 404 for non-existent series", async () => {
    const res = await app.request("/api/plans/nonexistent-series-xyz/raw", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "test" }),
    });
    expect(res.status).toBe(404);
  });

  test("GET /api/plans/:seriesId/episodes/:epDir — episode plan 404", async () => {
    const res = await app.request(`/api/plans/${WEAPON_FORGER}/episodes/nonexistent-ep`);
    expect(res.status).toBe(404);
  });
});
