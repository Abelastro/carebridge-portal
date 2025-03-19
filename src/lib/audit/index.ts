import "server-only";

import { db } from "@/lib/db";
import { computeEventHash } from "./hash";

type AuditInput = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: "SUCCESS" | "DENIED" | "ERROR";
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordAuditEvent(input: AuditInput): Promise<void> {
  await db().$transaction(async (tx) => {
    const previous = await tx.auditEvent.findFirst({
      orderBy: { createdAt: "desc" },
      select: { eventHash: true },
    });
    const createdAt = new Date();
    const eventHash = computeEventHash({
      ...input,
      createdAt,
      prevHash: previous?.eventHash ?? null,
    });
    await tx.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        outcome: input.outcome,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? undefined,
        prevHash: previous?.eventHash ?? null,
        eventHash,
        createdAt,
      },
    });
  });
}
