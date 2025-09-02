"use server";

import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/rbac";
import { requireSession, requestMeta } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { setUserActive, updateUserRole } from "@/lib/services/users";
import { toggleUserSchema, updateRoleSchema } from "@/lib/validation";

export async function updateRoleAction(formData: FormData) {
  const { user } = await requireSession();
  requirePermission(user.role, "user:manage");

  const parsed = updateRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return;
  }

  if (parsed.data.userId === user.id && parsed.data.role !== "ADMIN") {
    return;
  }

  const existing = await db().user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true, email: true },
  });

  if (!existing) {
    return;
  }

  const meta = await requestMeta();
  await updateUserRole(parsed.data.userId, parsed.data.role);

  await recordAuditEvent({
    actorId: user.id,
    action: "user.role.update",
    resourceType: "User",
    resourceId: parsed.data.userId,
    outcome: "SUCCESS",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    metadata: { from: existing.role, to: parsed.data.role },
  });

  revalidatePath("/admin/users");
}

export async function toggleUserAction(formData: FormData) {
  const { user } = await requireSession();
  requirePermission(user.role, "user:manage");

  const parsed = toggleUserSchema.safeParse({
    userId: formData.get("userId"),
    nextState: formData.get("nextState"),
  });

  if (!parsed.success) {
    return;
  }

  if (parsed.data.userId === user.id) {
    return;
  }

  const nextActive = parsed.data.nextState === "active";
  const meta = await requestMeta();
  await setUserActive(parsed.data.userId, nextActive);

  await recordAuditEvent({
    actorId: user.id,
    action: nextActive ? "user.activate" : "user.deactivate",
    resourceType: "User",
    resourceId: parsed.data.userId,
    outcome: "SUCCESS",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    metadata: { isActive: nextActive },
  });

  revalidatePath("/admin/users");
}
