import { describe, test, expect, afterAll } from "bun:test";
import { ConfigStore } from "../server/services/config-store";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_DIR = resolve(import.meta.dir, "__test_config__");

// Unique temp dir per test run
const runId = Date.now();
const TEST_DIR = resolve(BASE_DIR, `run-${runId}`);

function filePath(name: string): string {
  return resolve(TEST_DIR, `${name}.json`);
}

afterAll(() => {
  if (existsSync(BASE_DIR)) rmSync(BASE_DIR, { recursive: true });
});

describe("ConfigStore", () => {
  test("returns defaults when no config file", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const store = new ConfigStore(filePath("defaults"));
    expect(store.get()).toEqual({ apiKeys: {}, defaults: {} });
  });

  test("reads config from file", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const file = filePath("read");
    writeFileSync(file, JSON.stringify({
      apiKeys: { glm: "test-key-123" },
      defaults: { model: "zai/glm-5-turbo" },
    }));
    const store = new ConfigStore(file);
    expect(store.getApiKey("glm")).toBe("test-key-123");
    expect(store.getDefaultModel()).toBe("zai/glm-5-turbo");
  });

  test("sets and persists API keys", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const file = filePath("persist-keys");
    const store = new ConfigStore(file);
    store.setApiKeys({ glm: "new-key", deepseek: "ds-key" });
    expect(store.getApiKey("glm")).toBe("new-key");
    expect(store.getApiKey("deepseek")).toBe("ds-key");
    expect(store.getApiKey("google")).toBeUndefined();

    const store2 = new ConfigStore(file);
    expect(store2.getApiKey("glm")).toBe("new-key");
  });

  test("sets and persists default model", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const file = filePath("persist-model");
    const store = new ConfigStore(file);
    store.setDefaultModel("deepseek/deepseek-v4-pro");
    expect(store.getDefaultModel()).toBe("deepseek/deepseek-v4-pro");

    const store2 = new ConfigStore(file);
    expect(store2.getDefaultModel()).toBe("deepseek/deepseek-v4-pro");
  });

  test("masks API keys for safe display", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const store = new ConfigStore(filePath("mask"));
    store.setApiKeys({ glm: "sk-1234567890abcdef" });
    const masked = store.getMaskedApiKeys();
    expect(masked.glm).toBe("sk-1••••cdef");
    expect(masked.deepseek).toBeUndefined();
  });

  test("masks short keys", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const store = new ConfigStore(filePath("mask-short"));
    store.setApiKeys({ glm: "short" });
    const masked = store.getMaskedApiKeys();
    expect(masked.glm).toBe("••••");
  });

  test("handles corrupted config file", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const file = filePath("corrupted");
    writeFileSync(file, "not json {{{");
    const store = new ConfigStore(file);
    expect(store.get()).toEqual({ apiKeys: {}, defaults: {} });
  });

  test("get() returns a deep copy", () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const store = new ConfigStore(filePath("copy"));
    const cfg1 = store.get();
    cfg1.apiKeys.glm = "mutated";
    cfg1.defaults.model = "changed";
    const cfg2 = store.get();
    expect(cfg2.apiKeys.glm).toBeUndefined();
    expect(cfg2.defaults.model).toBeUndefined();
  });
});
