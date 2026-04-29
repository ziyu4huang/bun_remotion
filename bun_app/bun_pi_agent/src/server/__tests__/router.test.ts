import { describe, test, expect } from "bun:test";
import { Router } from "../router.js";
import { cors } from "../middleware/cors.js";
import { rateLimit } from "../middleware/rate-limit.js";

function makeReq(path: string, method = "GET", headers?: Record<string, string>): Request {
  return new Request(`http://localhost${path}`, { method, headers });
}

describe("Router", () => {
  test("matches exact path", async () => {
    const router = new Router();
    router.get("/health", () => Response.json({ ok: true }));

    const res = await router.fetch(makeReq("/health"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("extracts path params", async () => {
    const router = new Router();
    router.get("/agents/:name", (_req, ctx) => Response.json({ name: ctx.params.name }));

    const res = await router.fetch(makeReq("/agents/bun_pi_agent"));
    expect(await res.json()).toEqual({ name: "bun_pi_agent" });
  });

  test("extracts multiple path params", async () => {
    const router = new Router();
    router.get("/runs/:id/events/:type", (_req, ctx) =>
      Response.json({ id: ctx.params.id, type: ctx.params.type }),
    );

    const res = await router.fetch(makeReq("/runs/abc123/events/sse"));
    expect(await res.json()).toEqual({ id: "abc123", type: "sse" });
  });

  test("decodes URI-encoded params", async () => {
    const router = new Router();
    router.get("/agents/:name", (_req, ctx) => Response.json({ name: ctx.params.name }));

    const res = await router.fetch(makeReq("/agents/bun%20agent"));
    expect(await res.json()).toEqual({ name: "bun agent" });
  });

  test("returns 404 for unknown path", async () => {
    const router = new Router();
    router.get("/health", () => Response.json({ ok: true }));

    const res = await router.fetch(makeReq("/unknown"));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Not Found" });
  });

  test("returns 404 for wrong method", async () => {
    const router = new Router();
    router.get("/health", () => Response.json({ ok: true }));

    const res = await router.fetch(makeReq("/health", "POST"));
    expect(res.status).toBe(404);
  });

  test("matches routes with sub-paths", async () => {
    const router = new Router();
    router.post("/runs/:id/cancel", (_req, ctx) =>
      Response.json({ cancelled: ctx.params.id }),
    );
    router.get("/runs/:id", (_req, ctx) =>
      Response.json({ id: ctx.params.id }),
    );

    const res1 = await router.fetch(makeReq("/runs/abc", "GET"));
    expect(await res1.json()).toEqual({ id: "abc" });

    const res2 = await router.fetch(makeReq("/runs/abc/cancel", "POST"));
    expect(await res2.json()).toEqual({ cancelled: "abc" });
  });

  test("supports async handlers", async () => {
    const router = new Router();
    router.get("/slow", async () => {
      await new Promise((r) => setTimeout(r, 5));
      return Response.json({ done: true });
    });

    const res = await router.fetch(makeReq("/slow"));
    expect(await res.json()).toEqual({ done: true });
  });
});

describe("CORS middleware", () => {
  test("short-circuits OPTIONS with 204", async () => {
    const router = new Router();
    router.use(cors());
    router.get("/health", () => Response.json({ ok: true }));

    const res = await router.fetch(makeReq("/health", "OPTIONS"));
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, OPTIONS");
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type");
  });

  test("adds CORS headers to responses", async () => {
    const router = new Router();
    router.use(cors());
    router.get("/health", () => Response.json({ ok: true }));

    const res = await router.fetch(makeReq("/health"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  test("adds CORS headers to 404", async () => {
    const router = new Router();
    router.use(cors());

    const res = await router.fetch(makeReq("/unknown"));
    expect(res.status).toBe(404);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("Rate-limit middleware", () => {
  test("allows requests under limit", async () => {
    const router = new Router();
    router.use(rateLimit({ maxRequests: 2, windowMs: 60000 }));
    router.get("/test", () => Response.json({ ok: true }));

    const res1 = await router.fetch(makeReq("/test"));
    expect(res1.status).toBe(200);

    const res2 = await router.fetch(makeReq("/test"));
    expect(res2.status).toBe(200);
  });

  test("blocks requests over limit", async () => {
    const router = new Router();
    router.use(rateLimit({ maxRequests: 1, windowMs: 60000 }));
    router.get("/test", () => Response.json({ ok: true }));

    await router.fetch(makeReq("/test"));
    const res = await router.fetch(makeReq("/test"));
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Too Many Requests" });
  });

  test("exempts specified paths", async () => {
    const router = new Router();
    router.use(rateLimit({ maxRequests: 1, windowMs: 60000, exemptPaths: ["/ping"] }));
    router.get("/ping", () => Response.json({}));
    router.get("/test", () => Response.json({ ok: true }));

    // Exhaust limit on /test
    await router.fetch(makeReq("/test"));
    const blocked = await router.fetch(makeReq("/test"));
    expect(blocked.status).toBe(429);

    // /ping still works
    const ping = await router.fetch(makeReq("/ping"));
    expect(ping.status).toBe(200);
  });
});

describe("Middleware ordering", () => {
  test("CORS runs before rate-limit", async () => {
    const router = new Router();
    router.use(cors());
    router.use(rateLimit({ maxRequests: 1, windowMs: 60000 }));
    router.get("/test", () => Response.json({ ok: true }));

    // OPTIONS should get CORS 204 without hitting rate-limit
    const opt1 = await router.fetch(makeReq("/test", "OPTIONS"));
    expect(opt1.status).toBe(204);
    expect(opt1.headers.get("Access-Control-Allow-Origin")).toBe("*");

    // Second OPTIONS still works (never counted)
    const opt2 = await router.fetch(makeReq("/test", "OPTIONS"));
    expect(opt2.status).toBe(204);
  });

  test("middleware can pass data via ctx.state", async () => {
    const router = new Router();
    router.use(async (_req, ctx, next) => {
      ctx.state.set("timestamp", Date.now());
      return next();
    });
    router.get("/test", (_req, ctx) =>
      Response.json({ ts: ctx.state.get("timestamp") }),
    );

    const res = await router.fetch(makeReq("/test"));
    const body = (await res.json()) as { ts: number };
    expect(typeof body.ts).toBe("number");
    expect(body.ts).toBeGreaterThan(0);
  });
});
