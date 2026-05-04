import { describe, test, expect } from "bun:test";
import { app } from "../server/index";

function parseStructuredError(error: string | undefined): object | null {
  if (!error) return null;
  try {
    const parsed = JSON.parse(error);
    if (parsed && typeof parsed === "object" && (parsed.code || parsed.name === "PipelineError")) return parsed;
  } catch { /* not JSON */ }
  return null;
}

describe("Quality Dashboard API", () => {
  test("GET /api/quality/compare returns ok with array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/compare"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /api/quality/:seriesId returns response", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/nonexistent-series"));
    expect([200, 404]).toContain(res.status);
    const data = await res.json();
    expect(data.ok).toBeDefined();
  });

  test("GET /api/quality/regression returns ok with array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/regression"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test("GET /api/quality/history/:seriesId returns ok", async () => {
    const res = await app.fetch(new Request("http://localhost/api/quality/history/test-series"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});

describe("Monitoring Pipeline History", () => {
  test("GET /api/jobs/history returns jobs for pipeline table", async () => {
    const res = await app.fetch(new Request("http://localhost/api/jobs/history?olderThan=30d"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});

describe("Structured Error Parsing", () => {
  test("returns null for plain string", () => {
    expect(parseStructuredError("Something went wrong")).toBeNull();
  });

  test("returns null for undefined", () => {
    expect(parseStructuredError(undefined)).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(parseStructuredError("")).toBeNull();
  });

  test("returns null for non-JSON string", () => {
    expect(parseStructuredError("Error: file not found")).toBeNull();
  });

  test("parses PipelineError JSON with code", () => {
    const errorJson = JSON.stringify({ name: "PipelineError", code: "TIMEOUT", message: "Timed out", retryable: true });
    const result = parseStructuredError(errorJson);
    expect(result).not.toBeNull();
    expect((result as any).code).toBe("TIMEOUT");
    expect((result as any).retryable).toBe(true);
  });

  test("parses PipelineError JSON with SCHEMA_VALIDATION", () => {
    const errorJson = JSON.stringify({ name: "PipelineError", code: "SCHEMA_VALIDATION", message: "Invalid schema" });
    const result = parseStructuredError(errorJson);
    expect(result).not.toBeNull();
    expect((result as any).code).toBe("SCHEMA_VALIDATION");
  });

  test("parses PipelineError JSON with MISSING_ARTIFACT", () => {
    const errorJson = JSON.stringify({ name: "PipelineError", code: "MISSING_ARTIFACT", message: "File not found" });
    const result = parseStructuredError(errorJson);
    expect(result).not.toBeNull();
    expect((result as any).code).toBe("MISSING_ARTIFACT");
  });

  test("parses JSON with PipelineError name but no code", () => {
    const errorJson = JSON.stringify({ name: "PipelineError", message: "Unknown" });
    const result = parseStructuredError(errorJson);
    expect(result).not.toBeNull();
  });

  test("returns null for non-PipelineError JSON", () => {
    const errorJson = JSON.stringify({ foo: "bar" });
    expect(parseStructuredError(errorJson)).toBeNull();
  });
});

describe("i18n quality dashboard strings", () => {
  test("en has new quality keys", async () => {
    const { en } = await import("../client/i18n/en");
    expect(en.quality.kgQualitySummary).toBeDefined();
    expect(en.quality.gateScore).toBeDefined();
    expect(en.quality.blendedScore).toBeDefined();
    expect(en.quality.sparklines).toBeDefined();
    expect(en.quality.consistency).toBeDefined();
    expect(en.quality.arcStructure).toBeDefined();
    expect(en.quality.pacing).toBeDefined();
    expect(en.quality.noTrendData).toBeDefined();
  });

  test("zh_TW has new quality keys", async () => {
    const { zh_TW } = await import("../client/i18n/zh_TW");
    expect(zh_TW.quality.kgQualitySummary).toBeDefined();
    expect(zh_TW.quality.gateScore).toBeDefined();
    expect(zh_TW.quality.blendedScore).toBeDefined();
    expect(zh_TW.quality.sparklines).toBeDefined();
  });

  test("en has new monitoring keys", async () => {
    const { en } = await import("../client/i18n/en");
    expect(en.monitoring.pipelineHistory).toBeDefined();
    expect(en.monitoring.noPipelineHistory).toBeDefined();
    expect(en.monitoring.jobId).toBeDefined();
    expect(en.monitoring.duration).toBeDefined();
    expect(en.monitoring.timestamp).toBeDefined();
  });

  test("zh_TW has new monitoring keys", async () => {
    const { zh_TW } = await import("../client/i18n/zh_TW");
    expect(zh_TW.monitoring.pipelineHistory).toBeDefined();
    expect(zh_TW.monitoring.noPipelineHistory).toBeDefined();
  });

  test("en has new storygraph error keys", async () => {
    const { en } = await import("../client/i18n/en");
    expect(en.storygraph.errorCode).toBeDefined();
    expect(en.storygraph.failedStep).toBeDefined();
    expect(en.storygraph.retryable).toBeDefined();
    expect(en.storygraph.suggestedFix).toBeDefined();
  });

  test("zh_TW has new storygraph error keys", async () => {
    const { zh_TW } = await import("../client/i18n/zh_TW");
    expect(zh_TW.storygraph.errorCode).toBeDefined();
    expect(zh_TW.storygraph.failedStep).toBeDefined();
    expect(zh_TW.storygraph.retryable).toBeDefined();
    expect(zh_TW.storygraph.suggestedFix).toBeDefined();
  });
});
