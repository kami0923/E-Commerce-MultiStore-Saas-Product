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
    <form action={formAction} className="space-y-5">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      {setup && <Field icon={UserRound} label="Full name" name="name" placeholder="Your name" error={state.errors?.name?.[0]} />}
      <Field icon={Mail} label="Email address" name="email" type="email" placeholder="you@company.com" error={state.errors?.email?.[0]} />
      <Field icon={LockKeyhole} label="Password" name="password" type="password" placeholder="At least 12 characters" error={state.errors?.password?.[0]} />
      {state.message && <p role="alert" className="rounded-2xl border border-[#f2d5c9] bg-[#fff4ef] px-4 py-3 text-sm font-semibold text-[#a64f33]">{state.message}</p>}
      <button disabled={pending} className="group flex h-14 w-full items-center justify-between rounded-2xl bg-[#163d2d] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(22,61,45,.2)] transition hover:-translate-y-0.5 hover:bg-[#102f23] disabled:cursor-wait disabled:opacity-60">
        <span>{pending ? "Please wait…" : setup ? "Create platform owner" : "Enter your workspace"}</span><span className="grid size-8 place-items-center rounded-full bg-white/10"><ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span>
      </button>
    </form>
  );
}

function Field({ icon: Icon, label, error, ...props }: { icon: typeof Mail; label: string; error?: string; name: string; type?: string; placeholder: string }) {
  return <label className="block"><span className="text-[11px] font-black uppercase tracking-[.08em] text-[#526158]">{label}</span><span className="relative mt-2.5 block"><Icon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#829087]" /><input {...props} autoComplete={props.name === "email" ? "email" : props.name === "password" ? "current-password" : "name"} required className="h-14 w-full rounded-2xl border border-[#d9e0d9] bg-[#f9faf7] pl-11 pr-4 text-sm font-semibold outline-none transition placeholder:font-normal placeholder:text-[#9da69f] hover:border-[#bdc9bd] focus:border-[#6e9278] focus:bg-white focus:ring-4 focus:ring-[#c9f269]/20" /></span>{error && <span className="mt-1.5 block text-xs font-semibold text-[#b6573a]">{error}</span>}</label>;
}
