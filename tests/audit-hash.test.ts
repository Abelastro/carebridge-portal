import { describe, expect, it } from "vitest";
import { computeEventHash, stableStringify, verifyChain } from "@/lib/audit/hash";

describe("audit hash helpers", () => {
  it("serializes objects with stable key ordering", () => {
    const left = stableStringify({ b: 2, a: 1, nested: { z: true, y: false } });
    const right = stableStringify({ nested: { y: false, z: true }, a: 1, b: 2 });

    expect(left).toBe(right);
    expect(left).toBe('{"a":1,"b":2,"nested":{"y":false,"z":true}}');
  });

  it("produces the same digest for equivalent payloads", () => {
    const first = computeEventHash({ action: "auth.login", actorId: "user-1", metadata: { role: "ADMIN" } });
    const second = computeEventHash({ metadata: { role: "ADMIN" }, actorId: "user-1", action: "auth.login" });

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes the digest when a field changes", () => {
    const first = computeEventHash({ action: "auth.login", outcome: "SUCCESS" });
    const second = computeEventHash({ action: "auth.login", outcome: "DENIED" });

    expect(first).not.toBe(second);
  });

  it("accepts a correctly linked chain", () => {
    const links = [
      { prevHash: null, eventHash: "a".repeat(64) },
      { prevHash: "a".repeat(64), eventHash: "b".repeat(64) },
      { prevHash: "b".repeat(64), eventHash: "c".repeat(64) },
    ];

    expect(verifyChain(links)).toEqual({ valid: true, brokenAt: null });
  });

  it("reports the first broken link", () => {
    const links = [
      { prevHash: null, eventHash: "a".repeat(64) },
      { prevHash: "b".repeat(64), eventHash: "c".repeat(64) },
    ];

    expect(verifyChain(links)).toEqual({ valid: false, brokenAt: 1 });
  });
});
