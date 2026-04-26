import { resolve } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getTemplate, type WorkflowTriggerOptions } from "./workflow-engine";

// ── Action executor (injectable for testing) ──

export type ScheduleActionExecutor = (templateId: string, options: WorkflowTriggerOptions, seriesId: string) => void;

let _executor: ScheduleActionExecutor | null = null;

export function setScheduleExecutor(executor: ScheduleActionExecutor | null): void {
  _executor = executor;
}

function getDefaultExecutor(): ScheduleActionExecutor {
  return (templateId, options, seriesId) => {
    const { createJob } = require("../middleware/job-queue");
    const { runWorkflow } = require("./workflow-engine");
    const template = getTemplate(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);
    createJob("scheduled", async (progress: (p: number, msg?: string) => void) => {
      return runWorkflow(template, { ...options, seriesId }, progress);
    });
  };
}

// ── Types ──

export interface Schedule {
  id: string;
  label: string;
  enabled: boolean;
  seriesId: string;
  templateId: string;
  options: Partial<WorkflowTriggerOptions>;
  /** Interval in milliseconds between runs */
  intervalMs: number;
  lastRun?: number;
  nextRun: number;
  runCount: number;
  createdAt: number;
}

export interface ScheduleLogEntry {
  id: string;
  scheduleId: string;
  seriesId: string;
  templateId: string;
  status: "triggered" | "skipped_disabled" | "skipped_not_due" | "template_not_found" | "error";
  error?: string;
  timestamp: number;
}

// ── Persistence ──

const SCHEDULES_FILE = resolve(import.meta.dir, "../../../data/schedules.json");
const MAX_LOG = 100;

let schedules: Schedule[] = [];
let logEntries: ScheduleLogEntry[] = [];
let nextScheduleId = 1;
let nextLogId = 1;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;
  loadFromDisk();
}

function loadFromDisk() {
  if (existsSync(SCHEDULES_FILE)) {
    try {
      const data = JSON.parse(readFileSync(SCHEDULES_FILE, "utf-8"));
      if (data.schedules) schedules = data.schedules;
      if (data.nextScheduleId) nextScheduleId = data.nextScheduleId;
    } catch {
      // Corrupted — start fresh
    }
  }
}

function saveToDisk() {
  const dir = resolve(SCHEDULES_FILE, "..");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(SCHEDULES_FILE, JSON.stringify({ schedules, nextScheduleId }, null, 2));
}

// ── CRUD ──

export function listSchedules(): Schedule[] {
  init();
  return [...schedules];
}

export function getSchedule(id: string): Schedule | undefined {
  init();
  return schedules.find((s) => s.id === id);
}

export interface CreateScheduleInput {
  label: string;
  seriesId: string;
  templateId: string;
  options?: Partial<WorkflowTriggerOptions>;
  intervalMs: number;
  enabled?: boolean;
}

export function createSchedule(input: CreateScheduleInput): Schedule {
  init();

  if (!input.label?.trim()) throw new Error("label is required");
  if (!input.seriesId) throw new Error("seriesId is required");
  if (!input.templateId) throw new Error("templateId is required");
  if (!input.intervalMs || input.intervalMs < 60000) throw new Error("intervalMs must be >= 60000 (1 minute)");

  const template = getTemplate(input.templateId);
  if (!template) throw new Error(`Unknown template: ${input.templateId}`);

  const now = Date.now();
  const schedule: Schedule = {
    id: `sch-${nextScheduleId++}`,
    label: input.label.trim(),
    enabled: input.enabled ?? true,
    seriesId: input.seriesId,
    templateId: input.templateId,
    options: input.options ?? {},
    intervalMs: input.intervalMs,
    nextRun: now + input.intervalMs,
    runCount: 0,
    createdAt: now,
  };

  schedules.push(schedule);
  saveToDisk();
  return schedule;
}

export function updateSchedule(id: string, updates: Partial<Pick<Schedule, "label" | "enabled" | "intervalMs" | "templateId" | "options">>): Schedule {
  init();
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`Schedule not found: ${id}`);

  const schedule = schedules[idx];
  if (updates.label !== undefined) schedule.label = updates.label;
  if (updates.enabled !== undefined) schedule.enabled = updates.enabled;
  if (updates.intervalMs !== undefined) {
    if (updates.intervalMs < 60000) throw new Error("intervalMs must be >= 60000");
    schedule.intervalMs = updates.intervalMs;
    // Recalculate nextRun if not yet run
    if (!schedule.lastRun) schedule.nextRun = Date.now() + updates.intervalMs;
  }
  if (updates.templateId !== undefined) {
    if (!getTemplate(updates.templateId)) throw new Error(`Unknown template: ${updates.templateId}`);
    schedule.templateId = updates.templateId;
  }
  if (updates.options !== undefined) schedule.options = updates.options;

  schedules[idx] = schedule;
  saveToDisk();
  return schedule;
}

export function deleteSchedule(id: string): boolean {
  init();
  const before = schedules.length;
  schedules = schedules.filter((s) => s.id !== id);
  if (schedules.length < before) {
    saveToDisk();
    return true;
  }
  return false;
}

// ── Log ──

export function listScheduleLog(limit = 50): ScheduleLogEntry[] {
  return logEntries.slice(-limit);
}

function recordLog(entry: ScheduleLogEntry) {
  logEntries.push(entry);
  if (logEntries.length > MAX_LOG) {
    logEntries = logEntries.slice(-MAX_LOG);
  }
}

// ── Evaluation ──

export function evaluateSchedules(): ScheduleLogEntry[] {
  init();
  const now = Date.now();
  const results: ScheduleLogEntry[] = [];

  for (const schedule of schedules) {
    if (!schedule.enabled) {
      const entry = makeLogEntry(schedule, "skipped_disabled", "Schedule is disabled");
      recordLog(entry);
      results.push(entry);
      continue;
    }

    if (schedule.nextRun > now) {
      const entry = makeLogEntry(schedule, "skipped_not_due", `Next run at ${new Date(schedule.nextRun).toISOString()}`);
      recordLog(entry);
      results.push(entry);
      continue;
    }

    const template = getTemplate(schedule.templateId);
    if (!template) {
      const entry = makeLogEntry(schedule, "template_not_found", `Template not found: ${schedule.templateId}`);
      recordLog(entry);
      results.push(entry);
      continue;
    }

    try {
      const executor = _executor ?? getDefaultExecutor();
      executor(schedule.templateId, schedule.options as WorkflowTriggerOptions, schedule.seriesId);

      schedule.lastRun = now;
      schedule.nextRun = now + schedule.intervalMs;
      schedule.runCount++;
      saveToDisk();

      const entry = makeLogEntry(schedule, "triggered", `Triggered workflow: ${schedule.templateId}`);
      recordLog(entry);
      results.push(entry);
    } catch (err) {
      const entry = makeLogEntry(schedule, "error", err instanceof Error ? err.message : String(err));
      recordLog(entry);
      results.push(entry);
    }
  }

  return results;
}

function makeLogEntry(schedule: Schedule, status: ScheduleLogEntry["status"], message: string): ScheduleLogEntry {
  const entry: ScheduleLogEntry = {
    id: `slog-${nextLogId++}`,
    scheduleId: schedule.id,
    seriesId: schedule.seriesId,
    templateId: schedule.templateId,
    status,
    timestamp: Date.now(),
  };
  if (status !== "triggered" && status !== "skipped_not_due") {
    entry.error = message;
  }
  return entry;
}

// ── Tick loop (60s interval) ──

let tickInterval: ReturnType<typeof setInterval> | null = null;

export function startScheduler(): void {
  if (tickInterval) return;
  tickInterval = setInterval(() => {
    evaluateSchedules();
  }, 60_000);
}

export function stopScheduler(): void {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

export function isSchedulerRunning(): boolean {
  return tickInterval !== null;
}
