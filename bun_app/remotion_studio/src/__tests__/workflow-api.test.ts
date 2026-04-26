import { describe, test, expect } from "bun:test";
import { app } from "../server/index";
import { listTemplates, getTemplate, stepProgress, WORKFLOW_TEMPLATES } from "../server/services/workflow-engine";

describe("workflow API — validation", () => {
  test("GET /api/workflows returns template list", async () => {
    const res = await app.fetch(new Request("http://localhost/api/workflows"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.data.length).toBeGreaterThanOrEqual(5);
    const full = data.data.find((t: any) => t.id === "full-pipeline");
    expect(full).toBeDefined();
    expect(full.steps.length).toBe(6);
  });

  test("POST /api/workflows/trigger requires templateId", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("templateId");
  });

  test("POST /api/workflows/trigger rejects unknown template", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "nonexistent", seriesId: "test" }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Unknown template");
  });

  test("POST /api/workflows/trigger requires seriesId for full-pipeline", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "full-pipeline" }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("seriesId");
  });

  test("tts-and-render template does not require seriesId", async () => {
    // tts-and-render only has tts + render steps, no seriesId needed if episodePath provided
    const res = await app.fetch(
      new Request("http://localhost/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "tts-and-render",
          episodePath: "/some/fake/path",
        }),
      }),
    );
    // Should not get 400 for missing seriesId
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.type).toBe("workflow");
  });

  test("GET /api/workflows/:id returns 404 for missing job", async () => {
    const res = await app.fetch(new Request("http://localhost/api/workflows/nonexistent"));
    expect(res.status).toBe(404);
  });
});

describe("workflow engine — unit", () => {
  test("listTemplates returns all templates", () => {
    const tpls = listTemplates();
    expect(tpls.length).toBe(5);
    expect(tpls.map((t) => t.id).sort()).toEqual([
      "full-pipeline",
      "image-tts-render",
      "quality-gate",
      "scaffold-and-pipeline",
      "tts-and-render",
    ]);
  });

  test("getTemplate finds by id", () => {
    expect(getTemplate("full-pipeline")).toBeDefined();
    expect(getTemplate("quality-gate")!.steps.length).toBe(3);
    expect(getTemplate("nonexistent")).toBeUndefined();
  });

  test("stepProgress maps correctly for 6 steps", () => {
    expect(stepProgress(0, 6, 0)).toBe(0);
    expect(stepProgress(0, 6, 50)).toBe(8);
    expect(stepProgress(0, 6, 100)).toBe(16);
    expect(stepProgress(2, 6, 0)).toBe(33);
    expect(stepProgress(5, 6, 100)).toBe(100);
  });

  test("stepProgress maps correctly for 2 steps", () => {
    expect(stepProgress(0, 2, 0)).toBe(0);
    expect(stepProgress(0, 2, 100)).toBe(50);
    expect(stepProgress(1, 2, 50)).toBe(75);
    expect(stepProgress(1, 2, 100)).toBe(100);
  });

  test("stepProgress maps correctly for 3 steps", () => {
    expect(stepProgress(0, 3, 0)).toBe(0);
    expect(stepProgress(0, 3, 100)).toBe(33);
    expect(stepProgress(1, 3, 100)).toBe(66);
    expect(stepProgress(2, 3, 100)).toBe(100);
  });

  test("templates have valid structure", () => {
    for (const tpl of WORKFLOW_TEMPLATES) {
      expect(tpl.id).toBeTruthy();
      expect(tpl.label).toBeTruthy();
      expect(tpl.description).toBeTruthy();
      expect(tpl.steps.length).toBeGreaterThanOrEqual(2);
      for (const step of tpl.steps) {
        expect(step.kind).toMatch(/^(scaffold|pipeline|check|score|tts|render|image)$/);
        expect(step.label).toBeTruthy();
      }
    }
  });

  test("image-tts-render template has 3 steps starting with image", () => {
    const tpl = getTemplate("image-tts-render");
    expect(tpl).toBeDefined();
    expect(tpl!.steps.length).toBe(3);
    expect(tpl!.steps[0].kind).toBe("image");
    expect(tpl!.steps[1].kind).toBe("tts");
    expect(tpl!.steps[2].kind).toBe("render");
  });
});

describe("workflow API — image template", () => {
  test("POST /api/workflows/trigger requires seriesId for image-tts-render", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "image-tts-render" }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("seriesId");
  });

  test("image-tts-render accepts seriesId and creates job", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/workflows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "image-tts-render",
          seriesId: "test-series",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.type).toBe("workflow");
  });
});
