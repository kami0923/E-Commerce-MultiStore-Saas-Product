"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import type { AuthActionState } from "@/app/(auth)/actions";

const initialState: AuthActionState = { status: "idle" };

export function AuthForm({
  action,
  mode,
  redirectTo,
}: {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  mode: "setup" | "sign-in";
  redirectTo?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const setup = mode === "setup";

  return (
    <form action={formAction} className="mt-8 space-y-5">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      {setup && <Field icon={UserRound} label="Full name" name="name" placeholder="Your name" error={state.errors?.name?.[0]} />}
      <Field icon={Mail} label="Email address" name="email" type="email" placeholder="you@company.com" error={state.errors?.email?.[0]} />
      <Field icon={LockKeyhole} label="Password" name="password" type="password" placeholder="At least 12 characters" error={state.errors?.password?.[0]} />
      {state.message && <p role="alert" className="rounded-xl bg-[#fff0e9] px-4 py-3 text-sm font-semibold text-[#a64f33]">{state.message}</p>}
      <button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#164b36] text-sm font-black text-white shadow-[0_10px_26px_rgba(22,75,54,.2)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
        {pending ? "Please wait…" : setup ? "Create platform owner" : "Sign in securely"}<ArrowRight className="size-4" />
      </button>
    </form>
  );
}

function Field({ icon: Icon, label, error, ...props }: { icon: typeof Mail; label: string; error?: string; name: string; type?: string; placeholder: string }) {
  return <label className="block"><span className="text-xs font-bold text-[#526158]">{label}</span><span className="relative mt-2 block"><Icon className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8b968f]" /><input {...props} required className="h-12 w-full rounded-xl border border-[#dbe2db] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#7c9d7b] focus:ring-4 focus:ring-[#c9f269]/20" /></span>{error && <span className="mt-1.5 block text-xs font-semibold text-[#b6573a]">{error}</span>}</label>;
}
