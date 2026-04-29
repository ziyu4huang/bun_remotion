/**
 * Simple sliding-window rate limiter per client IP.
 *
 * Tracks request timestamps in a fixed time window. When the window overflows,
 * rejects with 429 Too Many Requests.
 */

interface WindowState {
  timestamps: number[];
}

export class RateLimiter {
  private windows = new Map<string, WindowState>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** Check if a request is allowed. Returns true if allowed, false if rate-limited. */
  allow(key: string): boolean {
    const now = Date.now();
    let state = this.windows.get(key);

    if (!state) {
      state = { timestamps: [now] };
      this.windows.set(key, state);
      return true;
    }

    // Prune timestamps outside the window
    const cutoff = now - this.windowMs;
    state.timestamps = state.timestamps.filter(t => t > cutoff);

    if (state.timestamps.length >= this.maxRequests) {
      return false;
    }

    state.timestamps.push(now);
    return true;
  }

  /** Get remaining requests for a key. */
  remaining(key: string): number {
    const now = Date.now();
    const state = this.windows.get(key);
    if (!state) return this.maxRequests;
    const cutoff = now - this.windowMs;
    const active = state.timestamps.filter(t => t > cutoff).length;
    return Math.max(0, this.maxRequests - active);
  }

  /** Reset all state (for testing). */
  reset(): void {
    this.windows.clear();
  }
}
