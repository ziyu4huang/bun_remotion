import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { initStore } from "../../src/store.js";
import { setMockAgent } from "../../src/agent.js";
import { createRouter } from "../../src/server/routes.js";
import { cors } from "../../src/server/middleware/cors.js";
import type { MockAgentOptions } from "./mock-agent.js";
import { createMockAgent } from "./mock-agent.js";

export interface TestServer {
  url: string;
  stop: () => void;
  /** Set a new mock agent (e.g. different script per test). */
  setMock: (options: MockAgentOptions) => void;
}

export function startTestServer(agentOptions?: MockAgentOptions): TestServer {
  const tmpDir = mkdtempSync(join(tmpdir(), "pi-agent-e2e-"));

  initStore(tmpDir, { maxAge: 60, maxCount: 10 });

  // Inject mock agent
  const defaultOptions: MockAgentOptions = agentOptions ?? {
    script: [],
    delayMs: 5,
  };
  const mock = createMockAgent(defaultOptions);
  setMockAgent(mock as any);

  const router = createRouter();
  router.use(cors());
  // No rate-limit in test server

  const server = Bun.serve({
    port: 0,
    fetch: (req) => router.fetch(req),
  });

  const url = `http://127.0.0.1:${server.port}`;

  return {
    url,
    stop: () => {
      server.stop(true);
      setMockAgent(undefined);
      try {
        rmSync(tmpDir, { recursive: true });
      } catch {}
    },
    setMock: (options: MockAgentOptions) => {
      const newMock = createMockAgent(options);
      setMockAgent(newMock as any);
    },
  };
}
