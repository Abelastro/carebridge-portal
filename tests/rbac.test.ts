import { describe, expect, it } from "vitest";
import {
  ForbiddenError,
  assignableRoles,
  can,
  requirePermission,
  type Permission,
} from "@/lib/auth/rbac";

const ALL_PERMISSIONS: Permission[] = [
  "dashboard:read",
  "patient:read",
  "patient:write",
  "note:summarize",
  "user:manage",
  "audit:read",
];

describe("role based access control", () => {
  it("grants administrators every permission", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can("ADMIN", permission)).toBe(true);
    }
  });

  it("limits clinicians to patient work", () => {
    expect(can("CLINICIAN", "patient:read")).toBe(true);
    expect(can("CLINICIAN", "patient:write")).toBe(true);
    expect(can("CLINICIAN", "note:summarize")).toBe(true);
    expect(can("CLINICIAN", "user:manage")).toBe(false);
    expect(can("CLINICIAN", "audit:read")).toBe(false);
  });

  it("gives auditors read-only access plus the audit log", () => {
    expect(can("AUDITOR", "patient:read")).toBe(true);
    expect(can("AUDITOR", "audit:read")).toBe(true);
    expect(can("AUDITOR", "patient:write")).toBe(false);
    expect(can("AUDITOR", "note:summarize")).toBe(false);
  });

  it("throws a typed error when a permission is missing", () => {
    expect(() => requirePermission("AUDITOR", "user:manage")).toThrow(ForbiddenError);
    expect(() => requirePermission("ADMIN", "user:manage")).not.toThrow();
  });

  it("only allows administrators to assign roles", () => {
    expect(assignableRoles("ADMIN")).toEqual(["CLINICIAN", "AUDITOR", "ADMIN"]);
    expect(assignableRoles("CLINICIAN")).toEqual([]);
    expect(assignableRoles("AUDITOR")).toEqual([]);
  });
});
