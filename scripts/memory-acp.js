#!/usr/bin/env node
// scripts/memory-acp.js — Memory commands via ACP WebSocket protocol
// Sends natural-language instructions to the agent and streams the response.
// Called by run.sh / run.ps1 for: memory-read, memory-write, memory-list, memory-search

"use strict";

const WebSocket = require("ws");
const fs        = require("fs");
const path      = require("path");
const crypto    = require("crypto");

// ── CLI args ──────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const get  = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] ?? null : null; };
const has  = (f) => argv.includes(f);

const ACTION     = get("--action")  ?? "read";
const AGENT_NAME = get("--agent")   ?? "main";
const MESSAGE    = get("--message") ?? "";
const MEM_DATE   = get("--date")    ?? new Date().toISOString().slice(0, 10);
const LONG_TERM  = has("--long-term");
const SLUG       = get("--slug")    ?? "";
const PORT       = get("--port")    ?? "18789";
const GATEWAY_URL = `ws://127.0.0.1:${PORT}`;

// ── ACP constants ─────────────────────────────────────────────────────────────

const CLIENT_ID   = "memory-cli";
const CLIENT_MODE = "backend";
const ROLE        = "operator";
const SCOPES      = ["operator.admin", "operator.read", "operator.write"];
const PLATFORM    = process.platform === "win32" ? "win32" : "linux";

// ── Helpers: read gateway state ───────────────────────────────────────────────

function openclawDir() {
  const home = process.env.OPENCLAW_HOME ?? path.join(process.cwd(), ".openclaw_home");
  return path.join(home, ".openclaw");
}

function readGatewayToken() {
  const cfg = JSON.parse(fs.readFileSync(path.join(openclawDir(), "openclaw.json"), "utf8"));
  return cfg.gateway.auth.token;
}

function readDeviceIdentity() {
  return JSON.parse(fs.readFileSync(path.join(openclawDir(), "identity", "device.json"), "utf8"));
}

function readDeviceAuthToken() {
  try {
    const d = JSON.parse(fs.readFileSync(path.join(openclawDir(), "identity", "device-auth.json"), "utf8"));
    return d?.tokens?.operator?.token ?? null;
  } catch { return null; }
}

// ── Helpers: crypto ───────────────────────────────────────────────────────────

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function buildSignature(identity, gatewayToken, nonce, signedAtMs) {
  const parts = ["v3", identity.deviceId, CLIENT_ID, CLIENT_MODE, ROLE,
    SCOPES.join(","), String(signedAtMs), gatewayToken, nonce, PLATFORM, ""];
  return base64url(crypto.sign(null,
    Buffer.from(parts.join("|"), "utf8"),
    crypto.createPrivateKey(identity.privateKeyPem)));
}

function publicKeyRaw(identity) {
  const pub  = crypto.createPublicKey(identity.publicKeyPem);
  const spki = pub.export({ type: "spki", format: "der" });
  return base64url(spki.slice(-32));
}

// ── Gateway connection ────────────────────────────────────────────────────────

function connectGateway() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(GATEWAY_URL);
    const pending       = new Map();   // reqId → {resolve}
    const eventWaiters  = new Map();   // eventName → [resolver, ...]
    const streamHandlers = [];

    ws.on("message", (raw) => {
      let frame;
      try { frame = JSON.parse(raw.toString()); } catch { return; }
      if (frame.type === "res") {
        pending.get(frame.id)?.resolve(frame);
        pending.delete(frame.id);
      } else if (frame.type === "event") {
        eventWaiters.get(frame.event)?.shift()?.(frame);
        for (const h of streamHandlers) h(frame);
      }
    });

    ws.on("error", reject);

    function request(method, params) {
      const id = `m${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return new Promise((res) => {
        pending.set(id, { resolve: res });
        ws.send(JSON.stringify({ type: "req", id, method, params }));
      });
    }

    function waitEvent(name) {
      return new Promise((res) => {
        const arr = eventWaiters.get(name) ?? [];
        arr.push(res);
        eventWaiters.set(name, arr);
      });
    }

    function addStreamHandler(handler) {
      streamHandlers.push(handler);
      return () => {
        const i = streamHandlers.indexOf(handler);
        if (i >= 0) streamHandlers.splice(i, 1);
      };
    }

    ws.on("open", () => resolve({ ws, request, waitEvent, addStreamHandler }));
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function authenticate(conn) {
  const gatewayToken    = readGatewayToken();
  const identity        = readDeviceIdentity();
  const deviceAuthToken = readDeviceAuthToken();

  const challenge  = await conn.waitEvent("connect.challenge");
  const nonce      = challenge.payload.nonce;
  const signedAtMs = Date.now();

  const res = await conn.request("connect", {
    minProtocol: 3, maxProtocol: 3,
    client: { id: CLIENT_ID, version: "0.1.0", platform: PLATFORM, mode: CLIENT_MODE },
    auth:   { token: gatewayToken, deviceToken: deviceAuthToken },
    role: ROLE, scopes: SCOPES,
    device: {
      id:        identity.deviceId,
      publicKey: publicKeyRaw(identity),
      signature: buildSignature(identity, gatewayToken, nonce, signedAtMs),
      signedAt:  signedAtMs,
      nonce,
    },
  });

  if (!res.ok) throw new Error(`Auth failed: ${JSON.stringify(res.error)}`);
  return res;
}

// ── Build the message for the agent ──────────────────────────────────────────

function buildMessage() {
  switch (ACTION) {
    case "read":
      if (LONG_TERM)
        return "Read your MEMORY.md file (long-term memory) and output its full contents verbatim. Do not summarize or add commentary.";
      return `Read your memory file \`memory/${MEM_DATE}.md\` and output its full contents verbatim. If the file doesn't exist, say so clearly.`;

    case "write":
      if (!MESSAGE) { console.error("--message is required for memory-write"); process.exit(1); }
      return `Append this note to your daily memory file \`memory/${MEM_DATE}.md\`:\n\n"${MESSAGE}"\n\nUse the format: \`- **HH:MM** — <note>\` (current time). Create the file with a \`# ${MEM_DATE}\` heading if it doesn't already exist. Confirm with the exact line you appended.`;

    case "list":
      return "List all files inside your `memory/` directory (show filename and line count for each). Also tell me if `MEMORY.md` exists in your workspace root. Be concise.";

    case "search":
      if (!SLUG) { console.error("--slug is required for memory-search"); process.exit(1); }
      return `Search all your memory files (\`memory/*.md\` and \`MEMORY.md\` if it exists) for the text "${SLUG}" (case-insensitive). For each match, show the filename, line number, and the matching line. If no matches found, say so.`;

    default:
      console.error(`Unknown action: ${ACTION}`); process.exit(1);
  }
}

// ── Send message and stream response to stdout ────────────────────────────────

async function sendAndStream(conn, sessionKey, message) {
  const sendRes = await conn.request("sessions.send", { key: sessionKey, message });
  if (!sendRes.ok) throw new Error(`sessions.send failed: ${JSON.stringify(sendRes.error)}`);

  return new Promise((resolve, reject) => {
    const remove = conn.addStreamHandler((frame) => {
      if (frame.event !== "agent") return;
      if (frame.payload?.sessionKey !== sessionKey) return;

      const { stream, data } = frame.payload ?? {};
      if (stream === "assistant" && data?.delta) {
        process.stdout.write(data.delta);
      } else if (stream === "lifecycle") {
        if (data?.phase === "end") {
          process.stdout.write("\n");
          remove(); resolve();
        } else if (data?.phase === "error") {
          process.stderr.write(`\n[memory-acp] agent error: ${data.error}\n`);
          remove(); resolve();
        }
      }
    });
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write(`>>> memory-${ACTION} via ACP → agent:${AGENT_NAME}\n`);

  const conn = await connectGateway();
  await authenticate(conn);

  // Always use a fresh session so we don't inherit unrelated context
  const sessionKey = `agent:${AGENT_NAME}:memory-cli-${Date.now()}`;
  const createRes  = await conn.request("sessions.create", { key: sessionKey });
  if (!createRes.ok) throw new Error(`sessions.create failed: ${JSON.stringify(createRes.error)}`);
  const actualKey = createRes.payload?.key ?? sessionKey;

  await conn.request("sessions.messages.subscribe", { key: actualKey });

  const msg = buildMessage();
  await sendAndStream(conn, actualKey, msg);

  conn.ws.close();
}

main().catch((err) => {
  process.stderr.write(`[memory-acp] fatal: ${err.message}\n`);
  process.exit(1);
});
