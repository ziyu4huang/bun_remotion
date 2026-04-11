import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { getConfig } from "../config.js";

describe("getConfig", () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Save original env vars
    for (const key of [
      "PI_AGENT_MODEL",
      "PI_AGENT_HOST",
      "PI_AGENT_PORT",
      "PI_AGENT_WORKDIR",
    ]) {
      originalEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    // Restore original env vars
    for (const [key, val] of Object.entries(originalEnv)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  });

  test("returns defaults when no env vars set", () => {
    delete process.env.PI_AGENT_MODEL;
    delete process.env.PI_AGENT_HOST;
    delete process.env.PI_AGENT_PORT;
    delete process.env.PI_AGENT_WORKDIR;

    const config = getConfig();
    expect(config.modelProvider).toBe("zai");
    expect(config.modelName).toBe("glm-5-turbo");
    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(3456);
    expect(config.workDir).toBe(process.cwd());
  });

  test("parses PI_AGENT_MODEL with simple provider/model", () => {
    process.env.PI_AGENT_MODEL = "anthropic/claude-sonnet-4-5";
    const config = getConfig();
    expect(config.modelProvider).toBe("anthropic");
    expect(config.modelName).toBe("claude-sonnet-4-5");
  });

  test("parses PI_AGENT_MODEL with slashes in model name", () => {
    process.env.PI_AGENT_MODEL = "openai/gpt-4o-mini-2024-07-18";
    const config = getConfig();
    expect(config.modelProvider).toBe("openai");
    expect(config.modelName).toBe("gpt-4o-mini-2024-07-18");
  });

  test("parses zai provider", () => {
    process.env.PI_AGENT_MODEL = "zai/glm-4.5";
    const config = getConfig();
    expect(config.modelProvider).toBe("zai");
    expect(config.modelName).toBe("glm-4.5");
  });

  test("throws on missing slash in model string", () => {
    process.env.PI_AGENT_MODEL = "invalid-no-slash";
    expect(() => getConfig()).toThrow("Invalid PI_AGENT_MODEL format");
  });

  test("throws on empty model string", () => {
    process.env.PI_AGENT_MODEL = "provider/";
    expect(() => getConfig()).toThrow("Invalid PI_AGENT_MODEL format");
  });

  test("uses PI_AGENT_HOST and PI_AGENT_PORT from env", () => {
    delete process.env.PI_AGENT_MODEL;
    process.env.PI_AGENT_HOST = "0.0.0.0";
    process.env.PI_AGENT_PORT = "8080";

    const config = getConfig();
    expect(config.host).toBe("0.0.0.0");
    expect(config.port).toBe(8080);
  });

  test("uses PI_AGENT_WORKDIR from env", () => {
    delete process.env.PI_AGENT_MODEL;
    process.env.PI_AGENT_WORKDIR = "/tmp/test-workdir";

    const config = getConfig();
    expect(config.workDir).toBe("/tmp/test-workdir");
  });

  test("falls back to cwd when PI_AGENT_WORKDIR is not set", () => {
    delete process.env.PI_AGENT_WORKDIR;
    const config = getConfig();
    expect(config.workDir).toBe(process.cwd());
  });

  test("handles google provider", () => {
    process.env.PI_AGENT_MODEL = "google/gemini-2.0-flash";
    const config = getConfig();
    expect(config.modelProvider).toBe("google");
    expect(config.modelName).toBe("gemini-2.0-flash");
  });
});
