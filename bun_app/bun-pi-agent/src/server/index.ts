import { getConfig } from "../config.js";
import { handleChat } from "./routes/chat.js";
import { handleHealth } from "./routes/health.js";
import {
  handlePing,
  handleAgentsList,
  handleAgentRead,
  handleRunCreate,
  handleRunRead,
  handleRunCancel,
  handleRunEvents,
} from "./routes/acp.js";

export async function startServer() {
  const config = getConfig();
  const origin = `http://${config.host}:${config.port}`;

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
  console.log("");

  Bun.serve({
    hostname: config.host,
    port: config.port,
    fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      // CORS preflight
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // ---- Legacy endpoints ----
      if (path === "/health" && req.method === "GET") {
        return handleHealth();
      }
      if (path === "/chat" && req.method === "POST") {
        return handleChat(req);
      }

      // ---- ACP endpoints ----
      if (path === "/ping" && req.method === "GET") {
        return handlePing();
      }
      if (path === "/agents" && req.method === "GET") {
        return handleAgentsList();
      }
      if (path === "/runs" && req.method === "POST") {
        return handleRunCreate(req);
      }

      // Parameterized routes: /agents/:name, /runs/:id[/...]
      const agentsMatch = path.match(/^\/agents\/([^/]+)$/);
      if (agentsMatch && req.method === "GET") {
        return handleAgentRead(decodeURIComponent(agentsMatch[1]));
      }

      const runsMatch = path.match(/^\/runs\/([^/]+)$/);
      if (runsMatch) {
        const runId = decodeURIComponent(runsMatch[1]);
        if (req.method === "GET") return handleRunRead(runId);
        // POST on /runs/:id = resume (not yet implemented)
        return Response.json({ error: "Not implemented" }, { status: 501 });
      }

      const runsCancelMatch = path.match(/^\/runs\/([^/]+)\/cancel$/);
      if (runsCancelMatch && req.method === "POST") {
        return handleRunCancel(decodeURIComponent(runsCancelMatch[1]));
      }

      const runsEventsMatch = path.match(/^\/runs\/([^/]+)\/events$/);
      if (runsEventsMatch && req.method === "GET") {
        return handleRunEvents(decodeURIComponent(runsEventsMatch[1]));
      }

      return Response.json({ error: "Not Found" }, { status: 404 });
    },
  });

  console.log("Server ready.");
}
