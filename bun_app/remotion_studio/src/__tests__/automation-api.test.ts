import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app } from "../server/index";
import {
  listRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  listEvents,
  evaluateTrigger,
  setActionExecutor,
} from "../server/services/automation-rules";
import { _testExtractSeriesId } from "../server/services/file-watcher";

// ── Test setup: use no-op executor to avoid running real workflows ──

const executedActions: Array<{ templateId: string; seriesId: string }> = [];

beforeAll(() => {
  setActionExecutor((templateId, options) => {
    executedActions.push({ templateId, seriesId: options.seriesId ?? "" });
  });
});

afterAll(() => {
  setActionExecutor(null);
});

// ── Unit tests: automation-rules service ──

describe("automation-rules — CRUD", () => {
  test("createRule requires name", () => {
    expect(() => createRule({ name: "", trigger: "plan_changed", action: { type: "run_workflow", templateId: "quality-gate", options: {} }, enabled: true, cooldownMs: 60000 })).toThrow("name is required");
  });

  test("createRule requires valid templateId", () => {
    expect(() => createRule({ name: "test", trigger: "plan_changed", action: { type: "run_workflow", templateId: "nonexistent", options: {} }, enabled: true, cooldownMs: 60000 })).toThrow("Unknown template");
  });

  test("createRule creates with valid input", () => {
    const rule = createRule({
      name: "Auto Pipeline on Plan Change",
      trigger: "plan_changed",
      action: { type: "run_workflow", templateId: "quality-gate", options: {} },
      enabled: true,
      cooldownMs: 60000,
    });
    expect(rule.id).toMatch(/^rule-\d+$/);
    expect(rule.name).toBe("Auto Pipeline on Plan Change");
    expect(rule.trigger).toBe("plan_changed");
    expect(rule.enabled).toBe(true);
    expect(rule.createdAt).toBeGreaterThan(0);

    // Cleanup
    deleteRule(rule.id);
  });

  test("listRules returns all rules", () => {
    const rule1 = createRule({ name: "Rule 1", trigger: "plan_changed", action: { type: "run_workflow", templateId: "quality-gate", options: {} }, enabled: true, cooldownMs: 60000 });
    const rule2 = createRule({ name: "Rule 2", trigger: "quality_passed", triggerCondition: { threshold: 70 }, action: { type: "run_workflow", templateId: "tts-and-render", options: {} }, enabled: true, cooldownMs: 60000 });

    const rules = listRules();
    expect(rules.length).toBeGreaterThanOrEqual(2);
    expect(rules.find((r) => r.id === rule1.id)).toBeDefined();
    expect(rules.find((r) => r.id === rule2.id)).toBeDefined();

    deleteRule(rule1.id);
    deleteRule(rule2.id);
  });

  test("getRule finds by id", () => {
    const rule = createRule({ name: "Find me", trigger: "plan_changed", action: { type: "run_workflow", templateId: "quality-gate", options: {} }, enabled: true, cooldownMs: 60000 });
    expect(getRule(rule.id)).toBeDefined();
    expect(getRule("nonexistent")).toBeUndefined();
    deleteRule(rule.id);
  });

  test("updateRule toggles enabled", () => {
    const rule = createRule({ name: "Toggle test", trigger: "plan_changed", action: { type: "run_workflow", templateId: "quality-gate", options: {} }, enabled: true, cooldownMs: 60000 });
    const updated = updateRule(rule.id, { enabled: false });
    expect(updated.enabled).toBe(false);
    deleteRule(rule.id);
  });

  test("updateRule throws for unknown id", () => {
    expect(() => updateRule("rule-99999", { enabled: false })).toThrow("Rule not found");
  });

  test("deleteRule removes rule", () => {
    const rule = createRule({ name: "Delete me", trigger: "plan_changed", action: { type: "run_workflow", templateId: "quality-gate", options: {} }, enabled: true, cooldownMs: 60000 });
    expect(deleteRule(rule.id)).toBe(true);
    expect(deleteRule(rule.id)).toBe(false);
    expect(getRule(rule.id)).toBeUndefined();
  });
});

describe("automation-rules — trigger evaluation", () => {
  test("evaluateTrigger skips disabled rules", () => {
    const rule = createRule({
      name: "Disabled rule",
      trigger: "plan_changed",
      action: { type: "run_workflow", templateId: "quality-gate", options: {} },
      enabled: false,
      cooldownMs: 60000,
    });

    const events = evaluateTrigger({ trigger: "plan_changed", seriesId: "weapon-forger" });
    const evt = events.find((e) => e.ruleId === rule.id);
    expect(evt).toBeDefined();
    expect(evt!.status).toBe("skipped_disabled");

    deleteRule(rule.id);
  });

  test("evaluateTrigger respects quality_passed threshold", () => {
    const before = executedActions.length;
    const rule = createRule({
      name: "High quality auto-render",
      trigger: "quality_passed",
      triggerCondition: { threshold: 80 },
      action: { type: "run_workflow", templateId: "tts-and-render", options: {} },
      enabled: true,
      cooldownMs: 0,
    });

    // Score below threshold — should skip
    const lowEvents = evaluateTrigger({ trigger: "quality_passed", seriesId: "weapon-forger", blendedScore: 50 });
    const lowEvt = lowEvents.find((e) => e.ruleId === rule.id);
    expect(lowEvt).toBeDefined();
    expect(lowEvt!.status).toBe("skipped_disabled");

    // Score above threshold — should trigger and call executor
    const highEvents = evaluateTrigger({ trigger: "quality_passed", seriesId: "weapon-forger", blendedScore: 85 });
    const highEvt = highEvents.find((e) => e.ruleId === rule.id);
    expect(highEvt).toBeDefined();
    expect(highEvt!.status).toBe("triggered");
    expect(executedActions.length).toBe(before + 1);
    expect(executedActions[executedActions.length - 1].templateId).toBe("tts-and-render");
    expect(executedActions[executedActions.length - 1].seriesId).toBe("weapon-forger");

    deleteRule(rule.id);
  });

  test("evaluateTrigger respects cooldown", () => {
    const rule = createRule({
      name: "Cooldown test",
      trigger: "plan_changed",
      action: { type: "run_workflow", templateId: "quality-gate", options: {} },
      enabled: true,
      cooldownMs: 60000,
    });

    // First trigger should fire
    const events1 = evaluateTrigger({ trigger: "plan_changed", seriesId: "weapon-forger" });
    const evt1 = events1.find((e) => e.ruleId === rule.id);
    expect(evt1!.status).toBe("triggered");

    // Immediate second trigger should be cooldown-blocked
    const events2 = evaluateTrigger({ trigger: "plan_changed", seriesId: "weapon-forger" });
    const evt2 = events2.find((e) => e.ruleId === rule.id);
    expect(evt2!.status).toBe("skipped_cooldown");

    deleteRule(rule.id);
  });

  test("evaluateTrigger ignores mismatched trigger type", () => {
    const rule = createRule({
      name: "Plan watcher",
      trigger: "plan_changed",
      action: { type: "run_workflow", templateId: "quality-gate", options: {} },
      enabled: true,
      cooldownMs: 0,
    });

    // quality_passed event should not match plan_changed rule
    const events = evaluateTrigger({ trigger: "quality_passed", seriesId: "weapon-forger" });
    const evt = events.find((e) => e.ruleId === rule.id);
    expect(evt).toBeUndefined();

    deleteRule(rule.id);
  });

  test("listEvents records trigger history", () => {
    const rule = createRule({
      name: "Event test",
      trigger: "scaffold_complete",
      action: { type: "run_workflow", templateId: "quality-gate", options: {} },
      enabled: true,
      cooldownMs: 0,
    });

    evaluateTrigger({ trigger: "scaffold_complete", seriesId: "weapon-forger" });
    evaluateTrigger({ trigger: "scaffold_complete", seriesId: "my-core-is-boss" });

    const events = listEvents();
    const ruleEvents = events.filter((e) => e.ruleId === rule.id);
    expect(ruleEvents.length).toBeGreaterThanOrEqual(2);
    expect(ruleEvents[0].seriesId).toBe("weapon-forger");
    expect(ruleEvents[1].seriesId).toBe("my-core-is-boss");

    deleteRule(rule.id);
  });
});

// ── API tests ──

describe("automation API", () => {
  test("GET /api/automation/rules returns array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/automation/rules"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  test("POST /api/automation/rules creates a rule", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "API Test Rule",
          trigger: "plan_changed",
          action: { type: "run_workflow", templateId: "quality-gate" },
          enabled: true,
          cooldownMs: 30000,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.name).toBe("API Test Rule");

    // Cleanup
    await app.fetch(new Request(`http://localhost/api/automation/rules/${data.data.id}`, { method: "DELETE" }));
  });

  test("POST /api/automation/rules rejects invalid template", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Bad template",
          trigger: "plan_changed",
          action: { type: "run_workflow", templateId: "nonexistent" },
          enabled: true,
          cooldownMs: 30000,
        }),
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain("Unknown template");
  });

  test("PUT /api/automation/rules/:id toggles enabled", async () => {
    // Create first
    const createRes = await app.fetch(
      new Request("http://localhost/api/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Toggle API test",
          trigger: "plan_changed",
          action: { type: "run_workflow", templateId: "quality-gate" },
          enabled: true,
          cooldownMs: 30000,
        }),
      }),
    );
    const { data: created } = await createRes.json();

    const updateRes = await app.fetch(
      new Request(`http://localhost/api/automation/rules/${created.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      }),
    );
    expect(updateRes.status).toBe(200);
    const { data: updated } = await updateRes.json();
    expect(updated.enabled).toBe(false);

    // Cleanup
    await app.fetch(new Request(`http://localhost/api/automation/rules/${created.id}`, { method: "DELETE" }));
  });

  test("DELETE /api/automation/rules/:id returns 404 for missing", async () => {
    const res = await app.fetch(new Request("http://localhost/api/automation/rules/rule-99999", { method: "DELETE" }));
    expect(res.status).toBe(404);
  });

  test("GET /api/automation/events returns array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/automation/events"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });
});

// ── File watcher unit tests ──

describe("file-watcher — series ID extraction", () => {
  test("extracts seriesId from series PLAN.md", () => {
    expect(_testExtractSeriesId("/path/to/bun_remotion_proj/weapon-forger/PLAN.md")).toBe("weapon-forger");
  });

  test("extracts seriesId from episode PLAN.md", () => {
    expect(_testExtractSeriesId("/path/to/bun_remotion_proj/weapon-forger/weapon-forger-ch2-ep3/PLAN.md")).toBe("weapon-forger");
  });

  test("returns null for non-bun_remotion_proj path", () => {
    expect(_testExtractSeriesId("/some/other/path/PLAN.md")).toBeNull();
  });

  test("returns null for non-PLAN.md file", () => {
    // This function is called with PLAN.md paths, but test it handles edge cases
    expect(_testExtractSeriesId("/path/to/bun_remotion_proj/")).toBeNull();
  });

  test("handles Windows-style paths", () => {
    expect(_testExtractSeriesId("C:\\Users\\proj\\bun_remotion_proj\\my-core-is-boss\\PLAN.md")).toBe("my-core-is-boss");
  });
});
