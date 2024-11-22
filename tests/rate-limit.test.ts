import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";

const WINDOW_MS = 60_000;
const START = 1_800_000_000_000;

beforeEach(() => {
  resetRateLimits();
});

describe("fixed window rate limiter", () => {
  it("allows requests up to the limit", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = checkRateLimit("login:test", { limit: 3, windowMs: WINDOW_MS, now: START });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2 - attempt);
    }
  });

  it("rejects requests beyond the limit and reports a retry window", () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      checkRateLimit("login:test", { limit: 3, windowMs: WINDOW_MS, now: START });
    }

    const blocked = checkRateLimit("login:test", {
      limit: 3,
      windowMs: WINDOW_MS,
      now: START + 1_000,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBe(WINDOW_MS - 1_000);
  });

  it("resets after the window elapses", () => {
    checkRateLimit("login:test", { limit: 1, windowMs: WINDOW_MS, now: START });
    const blocked = checkRateLimit("login:test", { limit: 1, windowMs: WINDOW_MS, now: START + 500 });
    const afterReset = checkRateLimit("login:test", {
      limit: 1,
      windowMs: WINDOW_MS,
      now: START + WINDOW_MS,
    });

    expect(blocked.allowed).toBe(false);
    expect(afterReset.allowed).toBe(true);
  });

  it("keeps separate buckets per key", () => {
    checkRateLimit("login:one", { limit: 1, windowMs: WINDOW_MS, now: START });
    const other = checkRateLimit("login:two", { limit: 1, windowMs: WINDOW_MS, now: START });

    expect(other.allowed).toBe(true);
  });
});
