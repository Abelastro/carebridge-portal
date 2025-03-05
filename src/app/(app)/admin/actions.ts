"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/rbac";
import { requireSession } from "@/lib/auth/session";
import { recordAuditEvent } from "@/lib/audit";
import { db } from "@/lib/db";
import { updateRoleSchema } from "@/lib/validation";

export async function updateRoleAction(formData: FormData): Promise<void> {
  const { user } = await requireSession();
  requirePermission(user.role, "user:manage");
  const parsed = updateRoleSchema.parse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  const target = await db().user.findUnique({ where: { id: parsed.userId } });
  if (!target) throw new Error("User not found");
  await db().user.update({ where: { id: target.id }, data: { role: parsed.role } });
  await recordAuditEvent({
    actorId: user.id,
    action: "user.role.update",
    resourceType: "User",
    resourceId: target.id,
    outcome: "SUCCESS",
    metadata: { from: target.role, to: parsed.role },
  });
  revalidatePath("/admin/users");
}
