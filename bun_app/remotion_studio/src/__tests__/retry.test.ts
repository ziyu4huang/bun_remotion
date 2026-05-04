import { describe, test, expect } from "bun:test";
import { withRetry, withTimeout } from "../server/retry";
import { PipelineError } from "../server/pipeline-error";

describe("withRetry", () => {
  test("returns result on first successful attempt", async () => {
    const result = await withRetry(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  test("retries on retryable PipelineError and succeeds", async () => {
    let attempt = 0;
    const result = await withRetry(
      () => {
        attempt++;
        if (attempt < 3) throw new PipelineError("TIMEOUT");
        return Promise.resolve("recovered");
      },
      { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 50 },
    );
    expect(result).toBe("recovered");
    expect(attempt).toBe(3);
  });

  test("retries on generic errors", async () => {
    let attempt = 0;
    const result = await withRetry(
      () => {
        attempt++;
        if (attempt < 2) throw new Error("transient");
        return Promise.resolve(42);
      },
      { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 50 },
    );
    expect(result).toBe(42);
    expect(attempt).toBe(2);
  });

  test("throws immediately on non-retryable PipelineError", async () => {
    let attempt = 0;
    try {
      await withRetry(
        () => {
          attempt++;
          throw new PipelineError("SCHEMA_VALIDATION", "bad schema");
        },
        { maxAttempts: 3, baseDelayMs: 10, maxDelayMs: 50 },
      );
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(isPipelineError(err) && err.code === "SCHEMA_VALIDATION").toBe(true);
      expect(attempt).toBe(1);
    }
  });

  test("throws RETRY_EXHAUSTED after max attempts", async () => {
    try {
      await withRetry(
        () => { throw new PipelineError("TIMEOUT"); },
        { maxAttempts: 2, baseDelayMs: 10, maxDelayMs: 50 },
      );
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(isPipelineError(err) && err.code === "RETRY_EXHAUSTED").toBe(true);
    }
  });

  test("respects maxDelayMs cap", async () => {
    let attempt = 0;
    const start = Date.now();
    await withRetry(
      () => {
        attempt++;
        if (attempt < 2) throw new PipelineError("PIPELINE_FAILED");
        return Promise.resolve("done");
      },
      { maxAttempts: 2, baseDelayMs: 1000, maxDelayMs: 50 },
    );
    const elapsed = Date.now() - start;
    // Should take at most ~100ms (capped at 50ms delay + overhead), not 1000ms
    expect(elapsed).toBeLessThan(200);
  });
});

describe("withTimeout", () => {
  test("returns result when fn completes within timeout", async () => {
    const result = await withTimeout(
      () => Promise.resolve("fast"),
      1000,
    );
    expect(result).toBe("fast");
  });

  test("throws TIMEOUT when fn exceeds timeout", async () => {
    try {
      await withTimeout(
        () => new Promise((resolve) => setTimeout(resolve, 5000)),
        50,
      );
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(isPipelineError(err) && err.code === "TIMEOUT").toBe(true);
    }
  });

  test("includes context in timeout error", async () => {
    try {
      await withTimeout(
        () => new Promise((resolve) => setTimeout(resolve, 5000)),
        50,
        { seriesId: "test-series" },
      );
      expect.unreachable("Should have thrown");
    } catch (err) {
      expect(isPipelineError(err) && (err as PipelineError).context.seriesId === "test-series").toBe(true);
    }
  });
});

function isPipelineError(err: unknown): err is PipelineError {
  return err instanceof PipelineError;
}
