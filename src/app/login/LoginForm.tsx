"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/auth-actions";

const FIELD =
  "w-full rounded-xl border border-transparent bg-slate-100 px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:bg-[#332720] dark:text-[#f1e7da] dark:focus:border-[#9c6b43] dark:focus:bg-[#3a2d24] dark:focus:ring-[#9c6b43]/20";

export default function LoginForm({ urlError }: { urlError?: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm dark:bg-[#271d16]">
      <div className="mb-4 flex rounded-2xl bg-slate-100 p-1 dark:bg-[#241c16]">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === m
                ? "bg-white text-slate-900 shadow-sm dark:bg-[#332720] dark:text-[#f1e7da]"
                : "text-slate-500 dark:text-[#c4ac95]"
            }`}
          >
            {m === "signin" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-500 dark:text-[#c4ac95]">
            Email
          </span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-500 dark:text-[#c4ac95]">
            Password
          </span>
          <input
            type="password"
            name="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            required
            minLength={8}
            placeholder="At least 8 characters"
            className={FIELD}
          />
        </label>

        {(state?.error || urlError) && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            {state?.error || urlError}
          </p>
        )}
        {state?.message && (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 active:scale-[0.99] disabled:opacity-60 dark:bg-[#9c6b43] dark:shadow-[#9c6b43]/20 dark:hover:bg-[#b07c4f]"
        >
          {pending
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}
