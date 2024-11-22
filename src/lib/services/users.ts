import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

export async function findUserForLogin(email: string) {
  return db().user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      passwordHash: true,
    },
  });
}

export async function listUsers() {
  return db().user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { primaryPatients: true, encounters: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
}

export async function updateUserRole(userId: string, role: Role) {
  return db().user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function setUserActive(userId: string, isActive: boolean) {
  return db().user.update({
    where: { id: userId },
    data: { isActive },
  });
}

export async function countActiveUsers() {
  return db().user.count({ where: { isActive: true } });
}
