import { describe, test, expect } from "bun:test";
import { PipelineError, isPipelineError } from "../server/pipeline-error";

describe("PipelineError", () => {
  test("creates error with code and default message", () => {
    const err = new PipelineError("TIMEOUT");
    expect(err.name).toBe("PipelineError");
    expect(err.code).toBe("TIMEOUT");
    expect(err.message).toBe("Pipeline operation timed out");
    expect(err.retryable).toBe(true);
  });

  test("creates error with custom message and context", () => {
    const err = new PipelineError("SCHEMA_VALIDATION", "gate.json missing score field", {
      seriesDir: "/path/to/series",
      field: "score",
    });
    expect(err.message).toBe("gate.json missing score field");
    expect(err.context.seriesDir).toBe("/path/to/series");
    expect(err.context.field).toBe("score");
    expect(err.retryable).toBe(false);
  });

  test("retryable codes: TIMEOUT and PIPELINE_FAILED", () => {
    expect(new PipelineError("TIMEOUT").retryable).toBe(true);
    expect(new PipelineError("PIPELINE_FAILED").retryable).toBe(true);
  });

  test("non-retryable codes", () => {
    expect(new PipelineError("SCHEMA_VALIDATION").retryable).toBe(false);
    expect(new PipelineError("RETRY_EXHAUSTED").retryable).toBe(false);
    expect(new PipelineError("MISSING_ARTIFACT").retryable).toBe(false);
    expect(new PipelineError("PARSE_ERROR").retryable).toBe(false);
  });

  test("toJSON includes all fields", () => {
    const err = new PipelineError("TIMEOUT", "timed out", { seriesDir: "/x" });
    const json = err.toJSON();
    expect(json).toEqual({
      name: "PipelineError",
      code: "TIMEOUT",
      message: "timed out",
      retryable: true,
      seriesDir: "/x",
    });
  });

  test("isPipelineError type guard", () => {
    const err = new PipelineError("TIMEOUT");
    expect(isPipelineError(err)).toBe(true);
    expect(isPipelineError(new Error("generic"))).toBe(false);
    expect(isPipelineError(null)).toBe(false);
    expect(isPipelineError("string")).toBe(false);
  });

  test("is instance of Error", () => {
    const err = new PipelineError("PIPELINE_FAILED");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PipelineError);
  });

  test("all error codes have default messages", () => {
    const codes: Array<"TIMEOUT" | "SCHEMA_VALIDATION" | "PIPELINE_FAILED" | "RETRY_EXHAUSTED" | "MISSING_ARTIFACT" | "PARSE_ERROR"> = [
      "TIMEOUT", "SCHEMA_VALIDATION", "PIPELINE_FAILED",
      "RETRY_EXHAUSTED", "MISSING_ARTIFACT", "PARSE_ERROR",
    ];
    for (const code of codes) {
      const err = new PipelineError(code);
      expect(err.message.length).toBeGreaterThan(0);
      expect(err.code).toBe(code);
    }
  });
});
