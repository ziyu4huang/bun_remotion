/**
 * Test worker for WorkerPool unit tests.
 *
 * Supported data options:
 *   delay?: number   — ms to wait before completing (default 10)
 *   fail?: boolean   — complete with "failed" status
 *   events?: any[]   — emit these as event messages before waiting
 *   crash?: boolean  — exit the worker immediately (simulates crash)
 */

let abortResolve: (() => void) | null = null;
let currentId: string | null = null;
let aborted = false;

self.onmessage = async (event: MessageEvent) => {
  const msg = event.data;

  if (msg.type === "abort") {
    if (currentId === msg.id) {
      aborted = true;
      abortResolve?.();
      abortResolve = null;
      self.postMessage({ type: "done", id: msg.id, status: "aborted" });
    }
    return;
  }

  if (msg.type !== "execute") return;

  aborted = false;
  currentId = msg.id;
  const { id, data } = msg;
  const opts = (data ?? {}) as Record<string, unknown>;

  if (opts.crash) {
    process.exit(1);
  }

  const sendEvents = (opts.events as unknown[]) ?? [];
  for (const evt of sendEvents) {
    self.postMessage({ type: "event", id, data: evt });
  }

  const delay = (opts.delay as number) ?? 10;

  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, delay);
    abortResolve = () => {
      clearTimeout(timer);
      resolve();
    };
  });

  abortResolve = null;
  currentId = null;

  if (aborted) return;

  if (opts.fail) {
    self.postMessage({ type: "done", id, status: "failed", error: "Task failed" });
  } else {
    self.postMessage({ type: "done", id, status: "completed" });
  }
};
