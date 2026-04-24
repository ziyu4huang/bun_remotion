import { resolve } from "node:path";
import { evaluateTrigger, type TriggerPayload } from "./automation-rules";

const REPO_ROOT = resolve(import.meta.dir, "../../../../..");

const SERIES_DIR = resolve(REPO_ROOT, "bun_remotion_proj");
const COOLDOWN_MS = 30_000;

let watcher: ReturnType<typeof Bun.watch> | null = null;
const lastFired = new Map<string, number>();

export function startWatcher(): void {
  if (watcher) return;

  watcher = Bun.watch({
    path: SERIES_DIR,
    recursive: true,
  });

  watcher.addEventListener("change", (event) => {
    const filePath = event.path;
    if (!filePath) return;

    // Only react to PLAN.md changes
    if (!filePath.endsWith("PLAN.md")) return;

    const seriesId = extractSeriesId(filePath);
    if (!seriesId) return;

    // Debounce
    const now = Date.now();
    const last = lastFired.get(seriesId) ?? 0;
    if (now - last < COOLDOWN_MS) return;
    lastFired.set(seriesId, now);

    const payload: TriggerPayload = {
      trigger: "plan_changed",
      seriesId,
    };

    evaluateTrigger(payload);
  });
}

export function stopWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  lastFired.clear();
}

function extractSeriesId(filePath: string): string | null {
  // Path format: .../bun_remotion_proj/<seriesId>/PLAN.md
  // or .../bun_remotion_proj/<seriesId>/<episodeDir>/PLAN.md
  const parts = filePath.replace(/\\/g, "/").split("/");
  const projIdx = parts.lastIndexOf("bun_remotion_proj");
  if (projIdx === -1 || projIdx + 1 >= parts.length) return null;
  const seriesId = parts[projIdx + 1];
  return seriesId || null;
}

export function _testExtractSeriesId(path: string): string | null {
  return extractSeriesId(path);
}
