import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getTemplate, type WorkflowTriggerOptions } from "./workflow-engine";

// ── Action executor (injectable for testing) ──

export type WebhookActionExecutor = (templateId: string, options: WorkflowTriggerOptions, seriesId: string) => void;

let _executor: WebhookActionExecutor | null = null;

export function setWebhookExecutor(executor: WebhookActionExecutor | null): void {
  _executor = executor;
}

function getDefaultExecutor(): WebhookActionExecutor {
  return (templateId, options, seriesId) => {
    const { createJob } = require("../middleware/job-queue");
    const { runWorkflow } = require("./workflow-engine");
    const template = getTemplate(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);
    createJob("webhook", async (progress: (p: number, msg?: string) => void) => {
      return runWorkflow(template, { ...options, seriesId }, progress);
    });
  };
}

// ── Types ──

export interface WebhookSecret {
  id: string;
  label: string;
  secret: string;
  createdAt: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  seriesId: string;
  templateId: string;
  status: "success" | "auth_failed" | "template_not_found" | "error";
  error?: string;
  timestamp: number;
}

// ── Persistence ──

const SECRETS_FILE = resolve(import.meta.dir, "../../../data/webhook-secrets.json");
const MAX_DELIVERIES = 100;

let secrets: WebhookSecret[] = [];
let deliveries: WebhookDelivery[] = [];
let nextSecretId = 1;
let nextDeliveryId = 1;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  loadFromDisk();
}

function loadFromDisk() {
  if (existsSync(SECRETS_FILE)) {
    try {
      const data = JSON.parse(readFileSync(SECRETS_FILE, "utf-8"));
      if (data.secrets) secrets = data.secrets;
      if (data.nextSecretId) nextSecretId = data.nextSecretId;
    } catch {
      // Corrupted — start fresh
    }
  }
}

function saveToDisk() {
  const dir = resolve(SECRETS_FILE, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(SECRETS_FILE, JSON.stringify({ secrets, nextSecretId }, null, 2));
}

// ── Secret CRUD ──

export function listSecrets(): WebhookSecret[] {
  init();
  return [...secrets];
}

export function getSecret(id: string): WebhookSecret | undefined {
  init();
  return secrets.find((s) => s.id === id);
}

export function createSecret(label: string): WebhookSecret {
  init();
  if (!label.trim()) throw new Error("label is required");
  const secret: WebhookSecret = {
    id: `wh-${nextSecretId++}`,
    label: label.trim(),
    secret: randomBytes(32).toString("hex"),
    createdAt: Date.now(),
  };
  secrets.push(secret);
  saveToDisk();
  return secret;
}

export function deleteSecret(id: string): boolean {
  init();
  const before = secrets.length;
  secrets = secrets.filter((s) => s.id !== id);
  if (secrets.length < before) {
    saveToDisk();
    return true;
  }
  return false;
}

// ── Auth ──

export function verifySignature(secret: string, payload: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function findSecretById(id: string): WebhookSecret | undefined {
  init();
  return secrets.find((s) => s.id === id);
}

// ── Deliveries ──

export function listDeliveries(limit = 50): WebhookDelivery[] {
  return deliveries.slice(-limit);
}

function recordDelivery(delivery: WebhookDelivery) {
  deliveries.push(delivery);
  if (deliveries.length > MAX_DELIVERIES) {
    deliveries = deliveries.slice(-MAX_DELIVERIES);
  }
}

// ── Trigger ──

export interface WebhookTriggerPayload {
  webhookId: string;
  signature: string;
  seriesId: string;
  templateId: string;
  options?: Partial<WorkflowTriggerOptions>;
}

export function triggerWebhook(payload: WebhookTriggerPayload): WebhookDelivery {
  const deliveryBase = {
    id: `del-${nextDeliveryId++}`,
    webhookId: payload.webhookId,
    seriesId: payload.seriesId,
    templateId: payload.templateId,
    timestamp: Date.now(),
  };

  // Find webhook secret
  const wh = findSecretById(payload.webhookId);
  if (!wh) {
    const delivery: WebhookDelivery = { ...deliveryBase, status: "auth_failed", error: "Unknown webhook ID" };
    recordDelivery(delivery);
    return delivery;
  }

  // Verify signature
  const body = JSON.stringify({ seriesId: payload.seriesId, templateId: payload.templateId, options: payload.options });
  if (!verifySignature(wh.secret, body, payload.signature)) {
    const delivery: WebhookDelivery = { ...deliveryBase, status: "auth_failed", error: "Invalid signature" };
    recordDelivery(delivery);
    return delivery;
  }

  // Validate template
  const template = getTemplate(payload.templateId);
  if (!template) {
    const delivery: WebhookDelivery = { ...deliveryBase, status: "template_not_found", error: `Template not found: ${payload.templateId}` };
    recordDelivery(delivery);
    return delivery;
  }

  // Execute
  try {
    const executor = _executor ?? getDefaultExecutor();
    executor(payload.templateId, (payload.options ?? {}) as WorkflowTriggerOptions, payload.seriesId);
    const delivery: WebhookDelivery = { ...deliveryBase, status: "success" };
    recordDelivery(delivery);
    return delivery;
  } catch (err) {
    const delivery: WebhookDelivery = { ...deliveryBase, status: "error", error: err instanceof Error ? err.message : String(err) };
    recordDelivery(delivery);
    return delivery;
  }
}
