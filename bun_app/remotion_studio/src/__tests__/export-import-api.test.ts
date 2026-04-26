import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { rmSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { app } from "../server/index";
import {
  exportProjectConfig,
  listExportableSeries,
  importProjectConfig,
  validateExport,
} from "../server/services/export-import-service";
import type { ProjectExport } from "../shared/types";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const PROJ_DIR = resolve(REPO_ROOT, "bun_remotion_proj");
const TEST_DIRS = ["weapon-forger-test-import", "test-round-trip"];

beforeAll(() => {
  for (const d of TEST_DIRS) {
    const p = resolve(PROJ_DIR, d);
    if (existsSync(p)) rmSync(p, { recursive: true });
  }
});

afterAll(() => {
  for (const d of TEST_DIRS) {
    const p = resolve(PROJ_DIR, d);
    if (existsSync(p)) rmSync(p, { recursive: true });
  }
});

// ── Unit tests: validation ──

describe("export-import — validateExport", () => {
  test("rejects null", () => {
    expect(() => validateExport(null)).toThrow("expected an object");
  });

  test("rejects wrong version", () => {
    expect(() => validateExport({ version: 2, series: {}, episodes: [] })).toThrow("Unsupported export version");
  });

  test("rejects missing series", () => {
    expect(() => validateExport({ version: 1, episodes: [] })).toThrow("missing series object");
  });

  test("rejects missing series.id", () => {
    expect(() => validateExport({ version: 1, series: { category: "narrative_drama" }, episodes: [] })).toThrow("missing series.id");
  });

  test("rejects missing series.category", () => {
    expect(() => validateExport({ version: 1, series: { id: "test" }, episodes: [] })).toThrow("missing series.category");
  });

  test("rejects missing episodes", () => {
    expect(() => validateExport({ version: 1, series: { id: "test", category: "narrative_drama" } })).toThrow("missing episodes array");
  });

  test("rejects episode without id", () => {
    expect(() => validateExport({ version: 1, series: { id: "test", category: "narrative_drama" }, episodes: [{}] })).toThrow("episode missing id");
  });

  test("accepts valid export", () => {
    const result = validateExport({
      version: 1,
      series: { id: "test", category: "narrative_drama" },
      episodes: [{ id: "test-ch1-ep1" }],
    });
    expect(result.version).toBe(1);
    expect(result.series.id).toBe("test");
  });
});

// ── Unit tests: export ──

describe("export-import — exportProjectConfig", () => {
  test("returns null for nonexistent series", () => {
    expect(exportProjectConfig("nonexistent-series-xyz")).toBeNull();
  });

  test("exports weapon-forger with episodes", () => {
    const config = exportProjectConfig("weapon-forger");
    expect(config).not.toBeNull();
    expect(config!.version).toBe(1);
    expect(config!.series.id).toBe("weapon-forger");
    expect(config!.series.category).toBe("narrative_drama");
    expect(config!.series.genre).toBe("xianxia_comedy");
    expect(config!.episodes.length).toBeGreaterThan(0);
    expect(config!.planMd).toBeDefined();
    expect(config!.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("exports include episode planMd when available", () => {
    const config = exportProjectConfig("weapon-forger");
    const withPlan = config!.episodes.filter((ep) => ep.planMd);
    // At least some weapon-forger episodes have PLAN.md
    expect(withPlan.length).toBeGreaterThan(0);
  });

  test("exports quality data when gate.json exists", () => {
    const config = exportProjectConfig("weapon-forger");
    // weapon-forger has storygraph_out/gate.json
    if (config!.quality) {
      expect(config!.quality.gateScore).toBeDefined();
    }
  });
});

// ── Unit tests: listExportableSeries ──

describe("export-import — listExportableSeries", () => {
  test("returns all series", () => {
    const series = listExportableSeries();
    expect(series.length).toBeGreaterThan(0);
    const ids = series.map((s) => s.id);
    expect(ids).toContain("weapon-forger");
  });
});

// ── Unit tests: import ──

describe("export-import — importProjectConfig", () => {
  test("round-trip: export then import to temp id", () => {
    const config = exportProjectConfig("weapon-forger");
    expect(config).not.toBeNull();

    // Create a modified copy with a different series ID to avoid collision
    const importData: ProjectExport = {
      ...config!,
      series: {
        ...config!.series,
        id: "weapon-forger-test-import",
      },
      episodes: config!.episodes.slice(0, 1).map((ep) => ({
        ...ep,
        id: ep.id.replace("weapon-forger", "weapon-forger-test-import"),
      })),
    };

    const result = importProjectConfig(importData);
    expect(result.seriesId).toBe("weapon-forger-test-import");
    expect(result.filesWritten.length).toBeGreaterThan(0);
    expect(result.warnings).toEqual([]);
  });

  test("import warns when files already exist", () => {
    const config = exportProjectConfig("weapon-forger");
    expect(config).not.toBeNull();

    // Import with same ID — should warn about existing files
    const importData: ProjectExport = {
      ...config!,
      series: { ...config!.series },
    };

    const result = importProjectConfig(importData);
    expect(result.seriesId).toBe("weapon-forger");
    // PLAN.md should already exist, so we get a warning
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("PLAN.md already exists");
  });

  test("import rejects invalid data", () => {
    expect(() => importProjectConfig(null)).toThrow("expected an object");
    expect(() => importProjectConfig({ version: 99 })).toThrow("Unsupported export version");
  });
});

// ── API route tests ──

describe("export-import — API routes", () => {
  test("GET /api/export lists exportable series", async () => {
    const res = await app.request("/api/export");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  test("GET /api/export/:seriesId returns config", async () => {
    const res = await app.request("/api/export/weapon-forger");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.series.id).toBe("weapon-forger");
    expect(body.data.version).toBe(1);
  });

  test("GET /api/export/:seriesId returns 404 for missing series", async () => {
    const res = await app.request("/api/export/nonexistent-xyz");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("GET /api/export/:seriesId/download returns JSON file", async () => {
    const res = await app.request("/api/export/weapon-forger/download");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json");
    expect(res.headers.get("Content-Disposition")).toContain("weapon-forger-config.json");
    const body = await res.json();
    expect(body.version).toBe(1);
  });

  test("POST /api/export/import rejects invalid JSON", async () => {
    const res = await app.request("/api/export/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bad: "data" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  test("POST /api/export/import round-trip", async () => {
    // Get export first
    const exportRes = await app.request("/api/export/weapon-forger");
    const exportBody = await exportRes.json();

    // Modify series ID for import
    const importData = {
      ...exportBody.data,
      series: { ...exportBody.data.series, id: "test-round-trip" },
      episodes: [],
    };

    const res = await app.request("/api/export/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(importData),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.data.seriesId).toBe("test-round-trip");
    expect(body.data.filesWritten).toContain("PLAN.md");
  });
});
