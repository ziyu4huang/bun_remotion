import { getConfig } from "../config.js";
import { initStore } from "../store.js";
import { initSessionStore } from "../acp/session-store.js";
import { createRouter } from "./routes.js";
import { cors } from "./middleware/cors.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { startSkillsWatcher } from "../skills/index.js";

export async function startServer() {
  const config = getConfig();
  const origin = `http://${config.host}:${config.port}`;

  // Initialize run store with persistence and cleanup
  initStore(config.runsDir, { maxAge: config.maxRunAge, maxCount: config.maxRunCount });

  // Initialize conversation store for session history persistence
  initSessionStore(config.convDir, { maxAge: config.maxConvAge, maxCount: config.maxConvCount });
  startSkillsWatcher();

  const router = createRouter();
  router.use(cors());
  router.use(
    rateLimit({
      maxRequests: config.rateLimitMax,
      windowMs: config.rateLimitWindowMs,
      exemptPaths: ["/health", "/ping"],
    }),
  );

  console.log(`Pi Agent server starting on ${origin}`);
  console.log("");
  console.log("  Legacy endpoints:");
  console.log(`    POST ${origin}/chat    — SSE streaming chat`);
  console.log(`    GET  ${origin}/health  — health check`);
  console.log("");
  console.log("  ACP (Agent Communication Protocol) endpoints:");
  console.log(`    GET  ${origin}/ping              — health check`);
  console.log(`    GET  ${origin}/agents             — list agents`);
  console.log(`    GET  ${origin}/agents/:name       — agent manifest`);
  console.log(`    POST ${origin}/runs               — create run (sync/async/stream)`);
  console.log(`    GET  ${origin}/runs/:id            — run status`);
  console.log(`    POST ${origin}/runs/:id/cancel     — cancel run`);
  console.log(`    GET  ${origin}/runs/:id/events     — run events`);
  console.log("");
  console.log(`  Working directory: ${config.workDir}`);
  console.log(`  Runs directory: ${config.runsDir}`);
  console.log(`  Rate limit: ${config.rateLimitMax} req/min per IP`);
  console.log("");

  Bun.serve({
    hostname: config.host,
    port: config.port,
    fetch: (req) => router.fetch(req),
  });

  console.log("Server ready.");
}
