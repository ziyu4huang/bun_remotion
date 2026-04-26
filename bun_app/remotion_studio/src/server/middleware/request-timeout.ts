import type { MiddlewareHandler } from "hono";

const DEFAULT_TIMEOUT_MS = 30_000;

export function requestTimeout(ms = DEFAULT_TIMEOUT_MS): MiddlewareHandler {
  return async (c, next) => {
    // Skip timeout for SSE streams and long-lived agent connections
    if (c.req.path.includes("/stream") || c.req.path.includes("/chat")) {
      return next();
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms),
    );

    await Promise.race([next(), timeout]);
  };
}
