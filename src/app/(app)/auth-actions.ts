"use server";

import { redirect } from "next/navigation";
import { recordAuditEvent } from "@/lib/audit";
import { destroySession, getSession, requestMeta } from "@/lib/auth/session";

export async function signOutAction() {
  const session = await getSession();
  const meta = await requestMeta();

  if (session) {
    await recordAuditEvent({
      actorId: session.user.id,
      action: "auth.logout",
      resourceType: "User",
      resourceId: session.user.id,
      outcome: "SUCCESS",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  await destroySession();
  redirect("/login");
}
