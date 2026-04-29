import { describe, test, expect, beforeEach } from "bun:test";
import { RateLimiter } from "../rate-limit.js";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    // 3 requests per 1000ms window for testing
    limiter = new RateLimiter(3, 1000);
  });

  test("allows requests within limit", () => {
    expect(limiter.allow("ip1")).toBe(true);
    expect(limiter.allow("ip1")).toBe(true);
    expect(limiter.allow("ip1")).toBe(true);
  });

  test("rejects requests over limit", () => {
    limiter.allow("ip1");
    limiter.allow("ip1");
    limiter.allow("ip1");
    expect(limiter.allow("ip1")).toBe(false);
  });

  test("tracks IPs independently", () => {
    limiter.allow("ip1");
    limiter.allow("ip1");
    limiter.allow("ip1");
    expect(limiter.allow("ip1")).toBe(false);
    expect(limiter.allow("ip2")).toBe(true);
  });

  test("remaining() reports correct count", () => {
    expect(limiter.remaining("ip1")).toBe(3);
    limiter.allow("ip1");
    expect(limiter.remaining("ip1")).toBe(2);
    limiter.allow("ip1");
    limiter.allow("ip1");
    expect(limiter.remaining("ip1")).toBe(0);
  });

  test("remaining() is max for unknown key", () => {
    expect(limiter.remaining("unknown")).toBe(3);
  });

  test("reset() clears all state", () => {
    limiter.allow("ip1");
    limiter.allow("ip1");
    limiter.allow("ip1");
    limiter.reset();
    expect(limiter.allow("ip1")).toBe(true);
    expect(limiter.remaining("ip1")).toBe(2);
  });

  test("window slides — old entries expire", async () => {
    // Use a short window
    const shortLimiter = new RateLimiter(1, 50);
    expect(shortLimiter.allow("ip1")).toBe(true);
    expect(shortLimiter.allow("ip1")).toBe(false);

    // Wait for window to expire
    await new Promise(r => setTimeout(r, 60));
    expect(shortLimiter.allow("ip1")).toBe(true);
  });
});
