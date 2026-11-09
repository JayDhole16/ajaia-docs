"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/actions/auth";

type DemoUser = { name: string; email: string };

export function LoginForm({ demoUsers, demoPassword }: { demoUsers: DemoUser[]; demoPassword: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [email, setEmail] = useState(state.email ?? "");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>
        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <section aria-labelledby="demo-heading" className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <h2 id="demo-heading" className="text-sm font-semibold text-blue-900">
          Demo accounts
        </h2>
        <p className="mt-0.5 text-xs text-blue-800">
          Password for all: <code className="rounded bg-white px-1 py-0.5 font-mono">{demoPassword}</code>. Click
          one to fill the form.
        </p>
        <ul className="mt-3 space-y-2">
          {demoUsers.map((user) => (
            <li key={user.email}>
              <button
                type="button"
                onClick={() => {
                  setEmail(user.email);
                  setPassword(demoPassword);
                }}
                className="flex w-full items-center justify-between rounded-lg border border-blue-100 bg-white px-3 py-2 text-left text-sm hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
              >
                <span className="font-medium text-gray-900">{user.name}</span>
                <span className="text-gray-500">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
