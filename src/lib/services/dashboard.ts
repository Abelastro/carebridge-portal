import { db } from "@/lib/db";

export type DashboardStats = {
  activePatients: number;
  pendingReview: number;
  encountersToday: number;
  pendingSummaries: number;
  eventsToday: number;
};

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getDashboardStats(now = new Date()): Promise<DashboardStats> {
  const dayStart = startOfUtcDay(now);

  const [activePatients, pendingReview, encountersToday, pendingSummaries, eventsToday] =
    await Promise.all([
      db().patient.count({ where: { status: "ACTIVE" } }),
      db().patient.count({ where: { status: "PENDING_REVIEW" } }),
      db().encounter.count({ where: { occurredAt: { gte: dayStart } } }),
      db().encounter.count({ where: { summary: null } }),
      db().auditEvent.count({ where: { createdAt: { gte: dayStart } } }),
    ]);

  return {
    activePatients,
    pendingReview,
    encountersToday,
    pendingSummaries,
    eventsToday,
  };
}

export async function getRecentEncounters(limit = 8) {
  return db().encounter.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
      clinician: { select: { name: true } },
    },
  });
}

export async function getRecentAuditEvents(limit = 6) {
  return db().auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { name: true } } },
  });
}
