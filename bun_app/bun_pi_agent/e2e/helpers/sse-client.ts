/**
 * SSE stream reader for e2e test assertions.
 *
 * Reads the full response body from an SSE endpoint and parses
 * `data: {...}` lines into typed event objects.
 */

export interface SSEEvent {
  /** The event type field (from `event: xxx` line), if present. */
  event?: string;
  /** Parsed JSON data from `data: {...}` line. */
  data: Record<string, unknown>;
}

/**
 * Fetch an SSE endpoint and collect all events.
 * Returns the parsed events + the raw response for header assertions.
 */
export async function readSSE(
  url: string,
  body: Record<string, unknown>,
  options?: { signal?: AbortSignal },
): Promise<{ events: SSEEvent[]; response: Response }> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!resp.ok || !resp.body) {
    return { events: [], response: resp };
  }

  const text = await resp.text();
  const events: SSEEvent[] = [];

  // SSE format: blocks separated by blank lines (\n\n)
  // Each block has optional "event: xxx" and "data: {...}" lines
  const blocks = text.split("\n\n").filter((b) => b.trim().length > 0);
  for (const block of blocks) {
    let eventType: string | undefined;
    let dataStr: string | undefined;

    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        dataStr = line.slice(6);
      } else if (line.startsWith("data:")) {
        dataStr = line.slice(5).trim();
      }
    }

    if (dataStr) {
      try {
        events.push({ event: eventType, data: JSON.parse(dataStr) });
      } catch {
        // Non-JSON data line — skip
      }
    }
  }

  return { events, response: resp };
}

/**
 * Fetch a non-streaming endpoint and return parsed JSON.
 */
export async function fetchJSON<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit,
): Promise<{ data: T; response: Response }> {
  const resp = await fetch(url, options);
  let data: any = null;
  try {
    data = await resp.json();
  } catch {
    // Non-JSON response
  }
  return { data: data as T, response: resp };
}
