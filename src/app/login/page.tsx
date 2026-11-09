import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { DEMO_PASSWORD, DEMO_USERS } from "@/lib/demo";
import { getCurrentUser } from "@/server/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/documents");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            A
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Ajaia Docs</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in with one of the demo accounts.</p>
        </div>
        <LoginForm demoUsers={DEMO_USERS.map((u) => ({ ...u }))} demoPassword={DEMO_PASSWORD} />
      </div>
    </main>
  );
}
