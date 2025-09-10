import type { AuditOutcome, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { computeEventHash, verifyChain } from "./hash";

export type AuditEventInput = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  outcome: AuditOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export async function recordAuditEvent(input: AuditEventInput) {
  return db().$transaction(async (tx) => {
    const previous = await tx.auditEvent.findFirst({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { eventHash: true },
    });

    const createdAt = new Date();
    const prevHash = previous?.eventHash ?? null;
    const eventHash = computeEventHash({
      actorId: input.actorId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      outcome: input.outcome,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? null,
      createdAt: createdAt.toISOString(),
      prevHash,
    });

    return tx.auditEvent.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        outcome: input.outcome,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        prevHash,
        eventHash,
        createdAt,
      },
    });
  });
}

export async function listAuditEvents(limit = 100) {
  return db().auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { name: true, email: true, role: true } },
    },
  });
}

export async function verifyAuditChain(limit = 500) {
  const rows = await db().auditEvent.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
    select: { id: true, prevHash: true, eventHash: true, createdAt: true },
  });

  const ordered = [...rows].reverse();
  const result = verifyChain(ordered);

  return {
    checked: ordered.length,
    latestAt: rows[0]?.createdAt ?? null,
    ...result,
  };
}
