/**
 * Retry + timeout utilities for pipeline operations.
 */

import { PipelineError } from "./pipeline-error";

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>,
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (err instanceof PipelineError && !err.retryable) {
        throw err;
      }

      if (attempt < opts.maxAttempts) {
        const delay = Math.min(opts.baseDelayMs * 2 ** (attempt - 1), opts.maxDelayMs);
        await sleep(delay);
      }
    }
  }

  throw new PipelineError(
    "RETRY_EXHAUSTED",
    `Failed after ${opts.maxAttempts} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    { attempts: opts.maxAttempts, lastError: String(lastError) },
  );
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  context: Record<string, unknown> = {},
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const result = await Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new PipelineError("TIMEOUT", `Operation timed out after ${timeoutMs}ms`, { timeoutMs, ...context }));
      }, timeoutMs);
    }),
  ]);

  clearTimeout(timer!);
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
