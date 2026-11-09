"use server";

import { redirect } from "next/navigation";
import { firstIssue, loginSchema } from "@/lib/validation";
import { db } from "@/server/db";
import { verifyPassword } from "@/server/password";
import { createSession, destroySession } from "@/server/session";

export type LoginState = { error?: string; email?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const email = String(formData.get("email") ?? "");
  if (!parsed.success) return { error: firstIssue(parsed.error), email };

  let userId: string | null = null;
  try {
    const user = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (user && (await verifyPassword(parsed.data.password, user.passwordHash))) userId = user.id;
  } catch (error) {
    console.error("[login] failed", error);
    return { error: "Couldn't reach the database. Please try again.", email };
  }
  // Same message for unknown email and wrong password (no account enumeration).
  if (!userId) return { error: "Incorrect email or password.", email };

  await createSession(userId);
  redirect("/documents");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
