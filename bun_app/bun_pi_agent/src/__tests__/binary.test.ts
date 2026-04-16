import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const APP_DIR = join(import.meta.dir, "..", "..");
const DIST_DIR = join(APP_DIR, "dist");
const BINARY = join(DIST_DIR, "agent-cli");
const ISOLATED_DIR = join(DIST_DIR, "__test_isolated__");

// Skip entire suite if binary hasn't been built
const binaryExists = existsSync(BINARY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function run(args: string[], cwd?: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`"${BINARY}" ${args.join(" ")}`, {
      encoding: "utf-8",
      timeout: 10_000,
      cwd,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (e: any) {
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: e.status ?? 1,
    };
  }
}

/** Start server in background, returns { pid, stop() } */
function startServer(port: number): Promise<{ pid: number; stop: () => void }> {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PI_AGENT_PORT: String(port) };
    const proc = spawn(BINARY, ["--server"], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let started = false;
    const timer = setTimeout(() => {
      if (!started) {
        proc.kill();
        reject(new Error("Server did not start within 5s"));
      }
    }, 5_000);

    proc.stdout!.on("data", (data: Buffer) => {
      if (data.includes("Server ready")) {
        started = true;
        clearTimeout(timer);
        resolve({
          pid: proc.pid!,
          stop: () => proc.kill(),
        });
      }
    });

    proc.stderr!.on("data", () => {}); // drain stderr
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(!binaryExists)("dist/agent-cli (packaged binary)", () => {
  // -------------------------------------------------------------------------
  // --help
  // -------------------------------------------------------------------------
  describe("--help", () => {
    test("exits with code 0", () => {
      const result = run(["--help"]);
      expect(result.exitCode).toBe(0);
    });

    test("shows usage header", () => {
      const result = run(["--help"]);
      expect(result.stdout).toContain("Usage:");
      expect(result.stdout).toContain("bun_pi_agent");
    });

    test("lists all options", () => {
      const result = run(["--help"]);
      expect(result.stdout).toContain("--mode=cli");
      expect(result.stdout).toContain("--mode=server");
      expect(result.stdout).toContain("--server");
      expect(result.stdout).toContain("--cli");
      expect(result.stdout).toContain("--version");
      expect(result.stdout).toContain("--help");
    });

    test("lists environment variables", () => {
      const result = run(["--help"]);
      expect(result.stdout).toContain("PI_AGENT_MODEL");
      expect(result.stdout).toContain("PI_AGENT_HOST");
      expect(result.stdout).toContain("PI_AGENT_PORT");
      expect(result.stdout).toContain("PI_AGENT_WORKDIR");
      expect(result.stdout).toContain("PI_AGENT_RUNS_DIR");
      expect(result.stdout).toContain("ZAI_API_KEY");
    });

    test("shows examples", () => {
      const result = run(["--help"]);
      expect(result.stdout).toContain("Examples:");
    });

    test("-h is same as --help", () => {
      const result = run(["-h"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });
  });

  // -------------------------------------------------------------------------
  // --version
  // -------------------------------------------------------------------------
  describe("--version", () => {
    test("exits with code 0", () => {
      const result = run(["--version"]);
      expect(result.exitCode).toBe(0);
    });

    test("prints version string", () => {
      const result = run(["--version"]);
      expect(result.stdout).toMatch(/bun_pi_agent v\d+\.\d+\.\d+/);
    });

    test("-v is same as --version", () => {
      const result = run(["-v"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/bun_pi_agent v\d+/);
    });
  });

  // -------------------------------------------------------------------------
  // Self-contained binary (creates package.json on first run)
  // -------------------------------------------------------------------------
  describe("self-contained", () => {
    beforeAll(() => {
      // Create isolated directory with only the binary
      rmSync(ISOLATED_DIR, { recursive: true, force: true });
      mkdirSync(ISOLATED_DIR, { recursive: true });
      // Copy ONLY the binary — no package.json, no theme, no assets
      execSync(`cp "${BINARY}" "${ISOLATED_DIR}/agent-cli"`);
    });

    afterAll(() => {
      rmSync(ISOLATED_DIR, { recursive: true, force: true });
    });

    test("--help works without companion files", () => {
      const result = run(["--help"], ISOLATED_DIR);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("Usage:");
    });

    test("--version works without companion files", () => {
      const result = run(["--version"], ISOLATED_DIR);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/bun_pi_agent v\d+/);
    });

    test("creates package.json on first agent run", () => {
      const pkgPath = join(ISOLATED_DIR, "package.json");
      // Should not exist yet
      expect(existsSync(pkgPath)).toBe(false);

      // Running --server triggers ensurePackageJson before dynamic imports
      // Use --help first (doesn't trigger imports), then --version (also doesn't)
      // We need to trigger an actual mode. Use --server in background.
      // Actually, just check that running the binary in server mode creates the file
      // But server mode needs network — let's use a quick trick: run with invalid env
      // that will trigger the import chain but fail after package.json is written

      // Start server briefly on a unique port
      const port = 13499;
      const env = { ...process.env, PI_AGENT_PORT: String(port) };

      try {
        // This will start server, which triggers ensurePackageJson
        const proc = spawn(`${ISOLATED_DIR}/agent-cli`, ["--server"], {
          env,
          stdio: ["ignore", "pipe", "pipe"],
        });

        // Wait for server to start or timeout
        return new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            proc.kill();
            // Even if server didn't fully start, check if package.json was created
            try {
              const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
              expect(pkg.name).toBe("bun_pi_agent");
              expect(pkg.version).toBeDefined();
              resolve();
            } catch {
              reject(new Error("package.json was not created"));
            }
          }, 3_000);

          proc.stdout!.on("data", (data: Buffer) => {
            if (data.includes("Server ready")) {
              clearTimeout(timer);
              proc.kill();
              // Check package.json was created
              try {
                const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
                expect(pkg.name).toBe("bun_pi_agent");
                resolve();
              } catch {
                reject(new Error("package.json was not created"));
              }
            }
          });

          proc.stderr!.on("data", () => {});
        });
      } finally {
        // cleanup
      }
    });
  });

  // -------------------------------------------------------------------------
  // Server mode
  // -------------------------------------------------------------------------
  describe("server mode", () => {
    const port = 13498;
    let server: { pid: number; stop: () => void };

    beforeAll(async () => {
      server = await startServer(port);
    });

    afterAll(() => {
      server?.stop();
    });

    test("GET /health returns ok", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.status).toBe("ok");
      expect(typeof body.timestamp).toBe("string");
    });

    test("GET /ping returns empty object", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/ping`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({});
    });

    test("GET /agents returns bun_pi_agent", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/agents`);
      expect(res.status).toBe(200);
      const body = await res.json() as any;
      expect(body.agents).toHaveLength(1);
      expect(body.agents[0].name).toBe("bun_pi_agent");
    });

    test("unknown path returns 404", async () => {
      const res = await fetch(`http://127.0.0.1:${port}/nonexistent`);
      expect(res.status).toBe(404);
    });
  });
});
