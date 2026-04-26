import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app } from "../server/index";
import {
  listSecrets,
  createSecret,
  deleteSecret,
  verifySignature,
  triggerWebhook,
  setWebhookExecutor,
  listDeliveries,
} from "../server/services/webhook-service";
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  evaluateSchedules,
  setScheduleExecutor,
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
  listScheduleLog,
} from "../server/services/scheduler-service";
import { createHmac } from "node:crypto";

// ── Shared test state ──

const webhookExecuted: Array<{ templateId: string; seriesId: string }> = [];
const scheduleExecuted: Array<{ templateId: string; seriesId: string }> = [];

beforeAll(() => {
  setWebhookExecutor((templateId, _options, seriesId) => {
    webhookExecuted.push({ templateId, seriesId });
  });
  setScheduleExecutor((templateId, _options, seriesId) => {
    scheduleExecuted.push({ templateId, seriesId });
  });
});

afterAll(() => {
  setWebhookExecutor(null);
  setScheduleExecutor(null);
  stopScheduler();
});

// ── Webhook service unit tests ──

describe("webhook-service — secret CRUD", () => {
  test("createSecret generates valid webhook", () => {
    const wh = createSecret("Test webhook");
    expect(wh.id).toMatch(/^wh-\d+$/);
    expect(wh.label).toBe("Test webhook");
    expect(wh.secret).toHaveLength(64); // 32 bytes hex
    expect(wh.createdAt).toBeGreaterThan(0);
    deleteSecret(wh.id);
  });

  test("createSecret requires label", () => {
    expect(() => createSecret("")).toThrow("label is required");
    expect(() => createSecret("  ")).toThrow("label is required");
  });

  test("listSecrets returns all secrets", () => {
    const wh1 = createSecret("WH 1");
    const wh2 = createSecret("WH 2");
    const all = listSecrets();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(all.find((s) => s.id === wh1.id)).toBeDefined();
    expect(all.find((s) => s.id === wh2.id)).toBeDefined();
    deleteSecret(wh1.id);
    deleteSecret(wh2.id);
  });

  test("deleteSecret removes secret", () => {
    const wh = createSecret("Delete me");
    expect(deleteSecret(wh.id)).toBe(true);
    expect(deleteSecret(wh.id)).toBe(false);
  });
});

describe("webhook-service — signature verification", () => {
  test("verifySignature accepts correct HMAC", () => {
    const secret = "test-secret-key";
    const payload = JSON.stringify({ seriesId: "weapon-forger", templateId: "quality-gate" });
    const sig = createHmac("sha256", secret).update(payload).digest("hex");
    expect(verifySignature(secret, payload, sig)).toBe(true);
  });

  test("verifySignature rejects wrong signature", () => {
    expect(verifySignature("secret", "payload", "badsignature")).toBe(false);
  });

  test("verifySignature rejects wrong secret", () => {
    const payload = "test";
    const sig = createHmac("sha256", "correct-secret").update(payload).digest("hex");
    expect(verifySignature("wrong-secret", payload, sig)).toBe(false);
  });
});

describe("webhook-service — trigger", () => {
  test("triggerWebhook succeeds with valid signature", () => {
    const wh = createSecret("Trigger test");
    const body = JSON.stringify({ seriesId: "weapon-forger", templateId: "quality-gate" });
    const sig = createHmac("sha256", wh.secret).update(body).digest("hex");

    const beforeLen = webhookExecuted.length;
    const delivery = triggerWebhook({
      webhookId: wh.id,
      signature: sig,
      seriesId: "weapon-forger",
      templateId: "quality-gate",
    });

    expect(delivery.status).toBe("success");
    expect(delivery.webhookId).toBe(wh.id);
    expect(webhookExecuted.length).toBe(beforeLen + 1);
    expect(webhookExecuted[webhookExecuted.length - 1].templateId).toBe("quality-gate");

    deleteSecret(wh.id);
  });

  test("triggerWebhook fails with invalid signature", () => {
    const wh = createSecret("Bad sig test");
    const delivery = triggerWebhook({
      webhookId: wh.id,
      signature: "invalid-signature",
      seriesId: "weapon-forger",
      templateId: "quality-gate",
    });

    expect(delivery.status).toBe("auth_failed");
    deleteSecret(wh.id);
  });

  test("triggerWebhook fails with unknown webhook ID", () => {
    const delivery = triggerWebhook({
      webhookId: "wh-99999",
      signature: "anything",
      seriesId: "weapon-forger",
      templateId: "quality-gate",
    });

    expect(delivery.status).toBe("auth_failed");
    expect(delivery.error).toContain("Unknown webhook ID");
  });

  test("triggerWebhook fails with unknown template", () => {
    const wh = createSecret("Bad template test");
    const body = JSON.stringify({ seriesId: "weapon-forger", templateId: "nonexistent" });
    const sig = createHmac("sha256", wh.secret).update(body).digest("hex");

    const delivery = triggerWebhook({
      webhookId: wh.id,
      signature: sig,
      seriesId: "weapon-forger",
      templateId: "nonexistent",
    });

    expect(delivery.status).toBe("template_not_found");
    deleteSecret(wh.id);
  });

  test("listDeliveries returns recent deliveries", () => {
    // We've made deliveries above
    const deliveries = listDeliveries();
    expect(deliveries).toBeInstanceOf(Array);
    expect(deliveries.length).toBeGreaterThan(0);
  });
});

// ── Scheduler service unit tests ──

describe("scheduler-service — CRUD", () => {
  test("createSchedule with valid input", () => {
    const sch = createSchedule({
      label: "Weekly pipeline",
      seriesId: "weapon-forger",
      templateId: "quality-gate",
      intervalMs: 3600000,
    });
    expect(sch.id).toMatch(/^sch-\d+$/);
    expect(sch.label).toBe("Weekly pipeline");
    expect(sch.seriesId).toBe("weapon-forger");
    expect(sch.templateId).toBe("quality-gate");
    expect(sch.intervalMs).toBe(3600000);
    expect(sch.enabled).toBe(true);
    expect(sch.runCount).toBe(0);
    expect(sch.nextRun).toBeGreaterThan(0);
    deleteSchedule(sch.id);
  });

  test("createSchedule requires label", () => {
    expect(() => createSchedule({
      label: "",
      seriesId: "weapon-forger",
      templateId: "quality-gate",
      intervalMs: 3600000,
    })).toThrow("label is required");
  });

  test("createSchedule requires valid template", () => {
    expect(() => createSchedule({
      label: "Bad template",
      seriesId: "weapon-forger",
      templateId: "nonexistent",
      intervalMs: 3600000,
    })).toThrow("Unknown template");
  });

  test("createSchedule enforces minimum interval", () => {
    expect(() => createSchedule({
      label: "Too fast",
      seriesId: "weapon-forger",
      templateId: "quality-gate",
      intervalMs: 30000,
    })).toThrow("intervalMs must be >= 60000");
  });

  test("listSchedules returns all schedules", () => {
    const s1 = createSchedule({ label: "S1", seriesId: "weapon-forger", templateId: "quality-gate", intervalMs: 3600000 });
    const s2 = createSchedule({ label: "S2", seriesId: "my-core-is-boss", templateId: "full-pipeline", intervalMs: 7200000 });
    const all = listSchedules();
    expect(all.length).toBeGreaterThanOrEqual(2);
    deleteSchedule(s1.id);
    deleteSchedule(s2.id);
  });

  test("updateSchedule toggles enabled", () => {
    const sch = createSchedule({ label: "Toggle", seriesId: "weapon-forger", templateId: "quality-gate", intervalMs: 3600000 });
    const updated = updateSchedule(sch.id, { enabled: false });
    expect(updated.enabled).toBe(false);
    deleteSchedule(sch.id);
  });

  test("updateSchedule throws for unknown id", () => {
    expect(() => updateSchedule("sch-99999", { enabled: false })).toThrow("Schedule not found");
  });

  test("deleteSchedule removes schedule", () => {
    const sch = createSchedule({ label: "Delete", seriesId: "weapon-forger", templateId: "quality-gate", intervalMs: 3600000 });
    expect(deleteSchedule(sch.id)).toBe(true);
    expect(deleteSchedule(sch.id)).toBe(false);
  });
});

describe("scheduler-service — evaluation", () => {
  test("evaluateSchedules skips disabled schedules", () => {
    const sch = createSchedule({ label: "Disabled", seriesId: "weapon-forger", templateId: "quality-gate", intervalMs: 60000, enabled: false });
    // Force nextRun to past so it would be due
    const schedules = listSchedules();
    const target = schedules.find((s) => s.id === sch.id);
    if (target) target.nextRun = Date.now() - 1000;

    const results = evaluateSchedules();
    const entry = results.find((e) => e.scheduleId === sch.id);
    expect(entry).toBeDefined();
    expect(entry!.status).toBe("skipped_disabled");
    deleteSchedule(sch.id);
  });

  test("evaluateSchedules triggers due schedules", () => {
    const sch = createSchedule({ label: "Due", seriesId: "weapon-forger", templateId: "quality-gate", intervalMs: 60000 });
    // Force nextRun to past
    const schedules = listSchedules();
    const target = schedules.find((s) => s.id === sch.id);
    if (target) target.nextRun = Date.now() - 1000;

    const beforeLen = scheduleExecuted.length;
    const results = evaluateSchedules();
    const entry = results.find((e) => e.scheduleId === sch.id);
    expect(entry).toBeDefined();
    expect(entry!.status).toBe("triggered");
    expect(scheduleExecuted.length).toBe(beforeLen + 1);
    expect(scheduleExecuted[scheduleExecuted.length - 1].templateId).toBe("quality-gate");

    deleteSchedule(sch.id);
  });

  test("evaluateSchedules skips not-due schedules", () => {
    const sch = createSchedule({ label: "Future", seriesId: "weapon-forger", templateId: "quality-gate", intervalMs: 86400000 });
    // nextRun is in the future by default
    const results = evaluateSchedules();
    const entry = results.find((e) => e.scheduleId === sch.id);
    expect(entry).toBeDefined();
    expect(entry!.status).toBe("skipped_not_due");
    deleteSchedule(sch.id);
  });

  test("evaluateSchedules updates runCount and lastRun after trigger", () => {
    const sch = createSchedule({ label: "Counter", seriesId: "weapon-forger", templateId: "quality-gate", intervalMs: 60000 });
    // Force due
    const schedules = listSchedules();
    const target = schedules.find((s) => s.id === sch.id);
    if (target) target.nextRun = Date.now() - 1000;

    evaluateSchedules();
    const updated = listSchedules().find((s) => s.id === sch.id);
    expect(updated!.runCount).toBe(1);
    expect(updated!.lastRun).toBeGreaterThan(0);
    expect(updated!.nextRun).toBeGreaterThan(Date.now() - 1000);

    deleteSchedule(sch.id);
  });

  test("listScheduleLog returns log entries", () => {
    const log = listScheduleLog();
    expect(log).toBeInstanceOf(Array);
  });
});

describe("scheduler-service — tick loop", () => {
  test("startScheduler/stopScheduler controls running state", () => {
    expect(isSchedulerRunning()).toBe(false);
    startScheduler();
    expect(isSchedulerRunning()).toBe(true);
    stopScheduler();
    expect(isSchedulerRunning()).toBe(false);
  });

  test("startScheduler is idempotent", () => {
    startScheduler();
    startScheduler();
    expect(isSchedulerRunning()).toBe(true);
    stopScheduler();
  });
});

// ── API route tests ──

describe("webhook API", () => {
  test("GET /api/webhooks returns masked secrets", async () => {
    const res = await app.fetch(new Request("http://localhost/api/webhooks"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    // If any secrets, they should be masked
    if (data.data.length > 0) {
      expect(data.data[0].secret).not.toHaveLength(64);
    }
  });

  test("POST /api/webhooks creates secret", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "API test webhook" }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.label).toBe("API test webhook");
    expect(data.data.secret).toHaveLength(64);
    deleteSecret(data.data.id);
  });

  test("POST /api/webhooks rejects empty label", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "" }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test("GET /api/webhooks/deliveries returns array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/webhooks/deliveries"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });
});

describe("schedule API", () => {
  test("GET /api/schedules returns array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/schedules"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  test("POST /api/schedules creates schedule", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "API test schedule",
          seriesId: "weapon-forger",
          templateId: "quality-gate",
          intervalMs: 3600000,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data.label).toBe("API test schedule");
    deleteSchedule(data.data.id);
  });

  test("POST /api/schedules rejects invalid input", async () => {
    const res = await app.fetch(
      new Request("http://localhost/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "", seriesId: "", templateId: "", intervalMs: 0 }),
      }),
    );
    expect(res.status).toBe(400);
  });

  test("GET /api/schedules/status returns running state", async () => {
    const res = await app.fetch(new Request("http://localhost/api/schedules/status"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(typeof data.data.running).toBe("boolean");
  });

  test("POST /api/schedules/start starts scheduler", async () => {
    const res = await app.fetch(new Request("http://localhost/api/schedules/start", { method: "POST" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.running).toBe(true);
    stopScheduler();
  });

  test("POST /api/schedules/stop stops scheduler", async () => {
    startScheduler();
    const res = await app.fetch(new Request("http://localhost/api/schedules/stop", { method: "POST" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.running).toBe(false);
  });

  test("POST /api/schedules/evaluate triggers evaluation", async () => {
    const res = await app.fetch(new Request("http://localhost/api/schedules/evaluate", { method: "POST" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  test("GET /api/schedules/log returns array", async () => {
    const res = await app.fetch(new Request("http://localhost/api/schedules/log"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });
});
