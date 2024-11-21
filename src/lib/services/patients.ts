import type { PatientStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type PatientListFilters = {
  query?: string;
  status?: PatientStatus;
  take?: number;
};

export async function listPatients(filters: PatientListFilters = {}) {
  const where: Prisma.PatientWhereInput = {};
  const query = filters.query?.trim();

  if (filters.status) {
    where.status = filters.status;
  }

  if (query) {
    where.OR = [
      { firstName: { contains: query, mode: "insensitive" } },
      { lastName: { contains: query, mode: "insensitive" } },
      { mrn: { contains: query, mode: "insensitive" } },
    ];
  }

  return db().patient.findMany({
    where,
    include: {
      primaryClinician: { select: { id: true, name: true } },
      _count: { select: { encounters: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: filters.take ?? 50,
  });
}

export async function getPatientDetail(patientId: string) {
  return db().patient.findUnique({
    where: { id: patientId },
    include: {
      primaryClinician: { select: { id: true, name: true, email: true } },
      encounters: {
        orderBy: { occurredAt: "desc" },
        include: {
          clinician: { select: { id: true, name: true } },
        },
      },
    },
  });
}

export async function updatePatientStatus(patientId: string, status: PatientStatus) {
  return db().patient.update({
    where: { id: patientId },
    data: { status },
  });
}

export async function countPatientsByStatus() {
  const rows = await db().patient.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const counts: Record<PatientStatus, number> = {
    ACTIVE: 0,
    DISCHARGED: 0,
    PENDING_REVIEW: 0,
  };

  for (const row of rows) {
    counts[row.status] = row._count._all;
  }

  return counts;
}
