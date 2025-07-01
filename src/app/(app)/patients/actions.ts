"use server";

import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/rbac";
import { requireSession, requestMeta } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { updatePatientStatus } from "@/lib/services/patients";
import { updatePatientStatusSchema } from "@/lib/validation";

export async function updatePatientStatusAction(formData: FormData) {
  const { user } = await requireSession();
  requirePermission(user.role, "patient:write");

  const parsed = updatePatientStatusSchema.safeParse({
    patientId: formData.get("patientId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return;
  }

  const existing = await db().patient.findUnique({
    where: { id: parsed.data.patientId },
    select: { status: true },
  });

  if (!existing) {
    return;
  }

  const meta = await requestMeta();
  await updatePatientStatus(parsed.data.patientId, parsed.data.status);

  await recordAuditEvent({
    actorId: user.id,
    action: "patient.status.update",
    resourceType: "Patient",
    resourceId: parsed.data.patientId,
    outcome: "SUCCESS",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    metadata: { from: existing.status, to: parsed.data.status },
  });

  revalidatePath(`/patients/${parsed.data.patientId}`);
  revalidatePath("/patients");
  revalidatePath("/dashboard");
}
