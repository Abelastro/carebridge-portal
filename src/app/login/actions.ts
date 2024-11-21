"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { findUserForLogin } from "@/lib/services/users";
import { loginSchema } from "@/lib/validation";

export type LoginState = {
  error: string | null;
};

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    passphrase: formData.get("passphrase"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const user = await findUserForLogin(parsed.data.email);

  if (!user || !user.isActive) {
    return { error: "Email or passphrase is incorrect." };
  }

  const valid = await verifyPassword(parsed.data.passphrase, user.passwordHash);

  if (!valid) {
    return { error: "Email or passphrase is incorrect." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}
