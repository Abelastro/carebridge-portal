"use server";

import { redirect } from "next/navigation";
import { recordAuditEvent } from "@/lib/audit";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, requestMeta } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { findUserForLogin } from "@/lib/services/users";
import { loginSchema } from "@/lib/validation";
import { log } from "@/lib/logger";

export type LoginState = {
  error: string | null;
};

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    passphrase: formData.get("passphrase"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const meta = await requestMeta();
  const limitKey = `login:${meta.ipAddress ?? "unknown"}`;
  const limit = checkRateLimit(limitKey, { limit: MAX_ATTEMPTS, windowMs: WINDOW_MS });

  if (!limit.allowed) {
    await recordAuditEvent({
      action: "auth.login.rate_limited",
      resourceType: "User",
      outcome: "DENIED",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000) },
    });

    return { error: "Too many attempts. Wait a few minutes before trying again." };
  }

  const user = await findUserForLogin(parsed.data.email);

  if (!user || !user.isActive) {
    await recordAuditEvent({
      action: "auth.login",
      resourceType: "User",
      outcome: "DENIED",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { reason: "invalid_credentials" },
    });

    return { error: "Email or passphrase is incorrect." };
  }

  const valid = await verifyPassword(parsed.data.passphrase, user.passwordHash);

  if (!valid) {
    await recordAuditEvent({
      actorId: user.id,
      action: "auth.login",
      resourceType: "User",
      resourceId: user.id,
      outcome: "DENIED",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { reason: "invalid_credentials" },
    });

    log().warn({ userId: user.id, ipAddress: meta.ipAddress }, "failed login attempt");
    return { error: "Email or passphrase is incorrect." };
  }

  await createSession(user.id);

  await recordAuditEvent({
    actorId: user.id,
    action: "auth.login",
    resourceType: "User",
    resourceId: user.id,
    outcome: "SUCCESS",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    metadata: { role: user.role },
  });

  const requested = formData.get("next");
  const destination =
    typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  redirect(destination);
}
