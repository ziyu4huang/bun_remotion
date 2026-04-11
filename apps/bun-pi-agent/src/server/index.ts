import { getConfig } from "../config.js";
import { handleChat } from "./routes/chat.js";
import { handleHealth } from "./routes/health.js";

export async function startServer() {
  const config = getConfig();
  const origin = `http://${config.host}:${config.port}`;

  console.log(`Pi Agent server starting on ${origin}`);
  console.log(`  POST ${origin}/chat  — SSE streaming chat`);
  console.log(`  GET  ${origin}/health — health check`);
  console.log(`  Working directory: ${config.workDir}`);
  console.log("");

  Bun.serve({
    hostname: config.host,
    port: config.port,
    fetch(req) {
      const url = new URL(req.url);

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

      if (url.pathname === "/health" && req.method === "GET") {
        return handleHealth();
      }

      if (url.pathname === "/chat" && req.method === "POST") {
        return handleChat(req);
      }

      return Response.json({ error: "Not Found" }, { status: 404 });
    },
  });

  console.log("Server ready.");
}
