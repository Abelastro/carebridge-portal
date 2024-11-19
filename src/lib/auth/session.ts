import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
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

function hashToken(sessionValue: string): string {
  return createHash("sha256").update(sessionValue).digest("hex");
}

export const getSession = cache(async (): Promise<AuthenticatedSession | null> => {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionValue) return null;
  const session = await db().session.findUnique({
    where: { tokenHash: hashToken(sessionValue) },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() <= Date.now()) return null;
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
  if (!session) redirect("/login");
  return session;
}

export async function createSession(userId: string): Promise<void> {
  const sessionValue = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db().session.create({
    data: { userId, tokenHash: hashToken(sessionValue), expiresAt },
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
    await db().session.deleteMany({ where: { tokenHash: hashToken(sessionValue) } });
  }
  cookieStore.delete(COOKIE_NAME);
}
