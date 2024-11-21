import type { Role } from "@prisma/client";

export type Permission =
  | "dashboard:read"
  | "patient:read"
  | "patient:write"
  | "note:summarize"
  | "user:manage"
  | "audit:read";

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  ADMIN: new Set<Permission>([
    "dashboard:read",
    "patient:read",
    "patient:write",
    "note:summarize",
    "user:manage",
    "audit:read",
  ]),
  CLINICIAN: new Set<Permission>([
    "dashboard:read",
    "patient:read",
    "patient:write",
    "note:summarize",
  ]),
  AUDITOR: new Set<Permission>(["dashboard:read", "patient:read", "audit:read"]),
};

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  CLINICIAN: "Clinician",
  AUDITOR: "Auditor",
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

export class ForbiddenError extends Error {
  constructor(permission: Permission) {
    super(`Role is not permitted to perform ${permission}`);
    this.name = "ForbiddenError";
  }
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!can(role, permission)) {
    throw new ForbiddenError(permission);
  }
}

export function assignableRoles(currentRole: Role): Role[] {
  if (currentRole !== "ADMIN") {
    return [];
  }

  return ["CLINICIAN", "AUDITOR", "ADMIN"];
}
