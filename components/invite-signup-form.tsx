"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { createInvitedAccountAction, type InviteActionState } from "@/app/invite/[token]/actions";

const initialState: InviteActionState = { status: "idle" };

export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(createInvitedAccountAction, initialState);
  return <form action={action} className="mt-7 space-y-4"><input type="hidden" name="token" value={token} /><label className="block"><span className="text-xs font-bold text-[#536259]">Invited email</span><input disabled value={email} className="mt-2 h-12 w-full rounded-xl border border-[#dce3dc] bg-[#f5f7f4] px-4 text-sm text-[#6f7b73]" /></label><Field label="Full name" name="name" placeholder="Your name" error={state.errors?.name?.[0]} /><Field label="Create password" name="password" type="password" placeholder="At least 12 characters" error={state.errors?.password?.[0]} />{state.message && <p className="rounded-xl bg-[#fff0e9] px-4 py-3 text-sm font-semibold text-[#a64f33]">{state.message}</p>}<button disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#164b36] text-sm font-black text-white disabled:opacity-60">{pending ? "Creating account…" : "Create account and join"}<ArrowRight className="size-4" /></button></form>;
}

function Field({label,error,...props}:{label:string;error?:string;name:string;placeholder:string;type?:string}) { return <label className="block"><span className="text-xs font-bold text-[#536259]">{label}</span><input {...props} required className="mt-2 h-12 w-full rounded-xl border border-[#dce3dc] px-4 text-sm outline-none focus:border-[#7d9e7d] focus:ring-4 focus:ring-[#c9f269]/20" />{error && <span className="mt-1.5 block text-xs font-semibold text-[#b6573a]">{error}</span>}</label>; }
