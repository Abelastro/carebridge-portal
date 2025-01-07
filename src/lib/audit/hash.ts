import { createHash } from "node:crypto";

function normalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries.map(([key, entry]) => [key, normalize(entry)]));
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function computeEventHash(payload: Record<string, unknown>): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

export type ChainLink = {
  eventHash: string;
  prevHash: string | null;
};

export function verifyChain(links: ChainLink[]): { valid: boolean; brokenAt: number | null } {
  let previousHash: string | null = null;

  for (const [index, link] of links.entries()) {
    if (link.prevHash !== previousHash) {
      return { valid: false, brokenAt: index };
    }
    previousHash = link.eventHash;
  }

  return { valid: true, brokenAt: null };
}
