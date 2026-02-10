import "server-only";

import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";

const COOKIE_NAME = "carebridge_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthenticatedSession = {
  user: SessionUser;
  sessionId: string;
};

export function hashToken(sessionValue: string): string {
  return createHash("sha256").update(sessionValue).digest("hex");
}

export const getSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionValue) {
    return null;
  }

  const session = await db().session.findUnique({
    where: { tokenHash: hashToken(sessionValue) },
    include: { user: true },
  });

  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= Date.now() ||
    !session.user.isActive
  ) {
    return null;
  }

  return {
    sessionId: session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
    },
  };
});

export async function requireSession(): Promise<AuthenticatedSession> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requestMeta(): Promise<{ ipAddress: string | null; userAgent: string | null }> {
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip");

  return {
    ipAddress: ipAddress ? ipAddress.slice(0, 64) : null,
    userAgent: headerStore.get("user-agent")?.slice(0, 256) ?? null,
  };
}

export async function createSession(userId: string): Promise<void> {
  const sessionValue = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const meta = await requestMeta();

  await db().session.create({
    data: {
      userId,
      tokenHash: hashToken(sessionValue),
      expiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionValue) {
    await db().session.updateMany({
      where: { tokenHash: hashToken(sessionValue), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  cookieStore.delete(COOKIE_NAME);
}
