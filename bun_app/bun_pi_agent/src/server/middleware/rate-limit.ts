import type { Middleware, RouteContext } from "../router.js";
import { RateLimiter } from "../rate-limit.js";

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  exemptPaths?: string[];
}

export function rateLimit(options: RateLimitOptions): Middleware {
  const limiter = new RateLimiter(options.maxRequests, options.windowMs);
  const exempt = new Set(options.exemptPaths ?? []);

  return async (req: Request, _ctx: RouteContext, next: () => Promise<Response>) => {
    const url = new URL(req.url);
    if (exempt.has(url.pathname)) {
      return next();
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req.headers.get("x-real-ip")
      ?? "unknown";

    if (!limiter.allow(clientIp)) {
      return Response.json({ error: "Too Many Requests" }, { status: 429 });
    }

    return next();
  };
}
