import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getTemplate, type WorkflowTriggerOptions } from "./workflow-engine";

// ── Action executor (injectable for testing) ──

export type ActionExecutor = (templateId: string, options: WorkflowTriggerOptions) => void;

let _executor: ActionExecutor | null = null;

export function setActionExecutor(executor: ActionExecutor | null): void {
  _executor = executor;
}

function getDefaultExecutor(): ActionExecutor {
  // Lazy import to avoid circular deps and allow test overrides
  return (templateId, options) => {
    const { createJob } = require("../middleware/job-queue");
    const { runWorkflow } = require("./workflow-engine");
    const template = getTemplate(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);
    createJob("automation", async (progress: (p: number, msg?: string) => void) => {
      return runWorkflow(template, options, progress);
    });
  };
}

// ── Types ──

export type RuleTrigger = "plan_changed" | "quality_passed" | "scaffold_complete";

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: RuleTrigger;
  triggerCondition?: {
    /** For quality_passed: minimum blended score (0-100) */
    threshold?: number;
  };
  action: {
    type: "run_workflow";
    templateId: string;
    options: WorkflowTriggerOptions;
  };
  cooldownMs: number;
  lastTriggered?: number;
  createdAt: number;
}

export interface AutomationEvent {
  id: string;
  ruleId: string;
  trigger: RuleTrigger;
  seriesId: string;
  action: string;
  status: "triggered" | "skipped_cooldown" | "skipped_disabled" | "failed" | "completed";
  timestamp: number;
  message?: string;
}

// ── Persistence ──

const RULES_FILE = resolve(import.meta.dir, "../../../data/automation-rules.json");
const MAX_EVENTS = 100;

// ── In-memory store ──

let rules: AutomationRule[] = [];
let events: AutomationEvent[] = [];
let nextRuleId = 1;
let nextEventId = 1;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  loadFromDisk();
}

function loadFromDisk() {
  if (existsSync(RULES_FILE)) {
    try {
      const data = JSON.parse(readFileSync(RULES_FILE, "utf-8"));
      if (data.rules) rules = data.rules;
      if (data.nextRuleId) nextRuleId = data.nextRuleId;
    } catch {
      // Corrupted file — start fresh
    }
  }
}

function saveToDisk() {
  const dir = resolve(RULES_FILE, "..");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(RULES_FILE, JSON.stringify({ rules, nextRuleId }, null, 2));
}

// ── CRUD ──

export function listRules(): AutomationRule[] {
  init();
  return [...rules];
}

export function getRule(id: string): AutomationRule | undefined {
  init();
  return rules.find((r) => r.id === id);
}

export function createRule(input: Omit<AutomationRule, "id" | "createdAt">): AutomationRule {
  init();

  if (!input.name?.trim()) throw new Error("name is required");
  if (!input.trigger) throw new Error("trigger is required");
  if (!input.action?.templateId) throw new Error("action.templateId is required");
  if (!getTemplate(input.action.templateId)) throw new Error(`Unknown template: ${input.action.templateId}`);

  const rule: AutomationRule = {
    ...input,
    id: `rule-${nextRuleId++}`,
    createdAt: Date.now(),
  };
  rules.push(rule);
  saveToDisk();
  return rule;
}

export function updateRule(id: string, updates: Partial<Pick<AutomationRule, "name" | "enabled" | "triggerCondition" | "cooldownMs" | "action">>): AutomationRule {
  init();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`Rule not found: ${id}`);

  const rule = rules[idx];
  if (updates.name !== undefined) rule.name = updates.name;
  if (updates.enabled !== undefined) rule.enabled = updates.enabled;
  if (updates.triggerCondition !== undefined) rule.triggerCondition = updates.triggerCondition;
  if (updates.cooldownMs !== undefined) rule.cooldownMs = updates.cooldownMs;
  if (updates.action !== undefined) {
    if (updates.action.templateId && !getTemplate(updates.action.templateId)) {
      throw new Error(`Unknown template: ${updates.action.templateId}`);
    }
    rule.action = updates.action;
  }

  rules[idx] = rule;
  saveToDisk();
  return rule;
}

export function deleteRule(id: string): boolean {
  init();
  const before = rules.length;
  rules = rules.filter((r) => r.id !== id);
  if (rules.length < before) {
    saveToDisk();
    return true;
  }
  return false;
}

// ── Events ──

export function listEvents(limit = 50): AutomationEvent[] {
  return events.slice(-limit);
}

function recordEvent(event: AutomationEvent) {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }
}

// ── Trigger evaluation ──

export interface TriggerPayload {
  trigger: RuleTrigger;
  seriesId: string;
  blendedScore?: number;
}

export function evaluateTrigger(payload: TriggerPayload): AutomationEvent[] {
  init();
  const fired: AutomationEvent[] = [];
  const now = Date.now();

  for (const rule of rules) {
    if (!rule.enabled) {
      fired.push(makeEvent(rule, payload, "skipped_disabled", "Rule is disabled"));
      continue;
    }
    if (rule.trigger !== payload.trigger) continue;

    // Check trigger-specific conditions
    if (payload.trigger === "quality_passed" && rule.triggerCondition?.threshold !== undefined) {
      const score = payload.blendedScore ?? 0;
      if (score < rule.triggerCondition.threshold) {
        fired.push(makeEvent(rule, payload, "skipped_disabled", `Score ${score} < threshold ${rule.triggerCondition.threshold}`));
        continue;
      }
    }

    // Cooldown check
    if (rule.lastTriggered && now - rule.lastTriggered < rule.cooldownMs) {
      fired.push(makeEvent(rule, payload, "skipped_cooldown", `Cooldown active (${Math.ceil((rule.cooldownMs - (now - rule.lastTriggered)) / 1000)}s remaining)`));
      continue;
    }

    // Fire action
    rule.lastTriggered = now;
    saveToDisk();

    try {
      const template = getTemplate(rule.action.templateId);
      if (!template) {
        fired.push(makeEvent(rule, payload, "failed", `Template not found: ${rule.action.templateId}`));
        continue;
      }

      const options: WorkflowTriggerOptions = {
        ...rule.action.options,
        seriesId: payload.seriesId,
      };

      const executor = _executor ?? getDefaultExecutor();
      executor(rule.action.templateId, options);

      const event = makeEvent(rule, payload, "triggered", `Triggered workflow: ${rule.action.templateId}`);
      fired.push(event);
    } catch (err) {
      fired.push(makeEvent(rule, payload, "failed", err instanceof Error ? err.message : String(err)));
    }
  }

  return fired;
}

function makeEvent(
  rule: AutomationRule,
  payload: TriggerPayload,
  status: AutomationEvent["status"],
  message?: string,
): AutomationEvent {
  const event: AutomationEvent = {
    id: `evt-${nextEventId++}`,
    ruleId: rule.id,
    trigger: payload.trigger,
    seriesId: payload.seriesId,
    action: rule.action.templateId,
    status,
    timestamp: Date.now(),
    message,
  };
  recordEvent(event);
  return event;
}
