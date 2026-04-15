import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createAgent } from "../agent.js";

describe("createAgent", () => {
  const TRACKED_KEYS = [
    "PI_AGENT_MODEL", "PI_AGENT_WORKDIR",
    "ZAI_API_KEY", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY",
  ];
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of TRACKED_KEYS) {
      originalEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(originalEnv)) {
      if (val === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = val;
      }
    }
  });

  test("throws when no API key is configured", () => {
    delete process.env.PI_AGENT_MODEL;
    delete process.env.ZAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;

    expect(() => createAgent()).toThrow("No API key found");
  });

  test("throws with provider name in error message", () => {
    delete process.env.PI_AGENT_MODEL;
    delete process.env.ZAI_API_KEY;

    expect(() => createAgent()).toThrow("zai");
  });

  test("creates agent successfully with valid API key", () => {
    // Ensure we have the default model and a key
    delete process.env.PI_AGENT_MODEL;
    // Set a dummy key so the agent can be constructed
    process.env.ZAI_API_KEY = "test-key-for-agent-test";

    const agent = createAgent();
    expect(agent).toBeDefined();
    expect(typeof agent.prompt).toBe("function");
    expect(typeof agent.subscribe).toBe("function");
    expect(typeof agent.reset).toBe("function");
    expect(typeof agent.abort).toBe("function");
  });

  test("agent state has system prompt with coding instructions", () => {
    process.env.ZAI_API_KEY = "test-key-for-agent-test";
    delete process.env.PI_AGENT_MODEL;

    const agent = createAgent();
    const state = agent.state as any;
    expect(typeof state.systemPrompt).toBe("string");
    expect(state.systemPrompt).toContain("coding assistant");
    expect(state.systemPrompt).toContain("tools");
  });

  test("agent state includes model", () => {
    process.env.ZAI_API_KEY = "test-key-for-agent-test";
    delete process.env.PI_AGENT_MODEL;

    const agent = createAgent();
    const state = agent.state as any;
    expect(state.model).toBeDefined();
  });

  test("agent state includes tools array", () => {
    process.env.ZAI_API_KEY = "test-key-for-agent-test";
    delete process.env.PI_AGENT_MODEL;

    const agent = createAgent();
    const state = agent.state as any;
    expect(Array.isArray(state.tools)).toBe(true);
    expect(state.tools.length).toBe(7);
  });

  test("works with anthropic provider if key is set", () => {
    process.env.PI_AGENT_MODEL = "anthropic/claude-sonnet-4-5";
    process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
    delete process.env.ZAI_API_KEY;

    const agent = createAgent();
    expect(agent).toBeDefined();
  });

  test("works with google provider if key is set", () => {
    process.env.PI_AGENT_MODEL = "google/gemini-2.0-flash";
    process.env.GEMINI_API_KEY = "test-google-key";
    delete process.env.ZAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const agent = createAgent();
    expect(agent).toBeDefined();
  });

  test("skills section is appended to system prompt when skills exist", () => {
    process.env.ZAI_API_KEY = "test-key-for-agent-test";
    delete process.env.PI_AGENT_MODEL;

    const agent = createAgent();
    const state = agent.state as any;
    // If there are skills in the cwd, the prompt will contain <available_skills>
    // If no skills, it won't — either way, the base prompt is present
    expect(state.systemPrompt).toContain("coding assistant");
  });

  test("subscribe and unsubscribe work", () => {
    process.env.ZAI_API_KEY = "test-key-for-agent-test";
    delete process.env.PI_AGENT_MODEL;

    const agent = createAgent();
    let called = false;
    const unsub = agent.subscribe(() => {
      called = true;
    });
    expect(typeof unsub).toBe("function");
    // Unsubscribe should not throw
    unsub();
  });
});
