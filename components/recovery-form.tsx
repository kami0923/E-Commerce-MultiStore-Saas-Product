"use client";

import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useActionState } from "react";
import { requestPasswordResetAction, resetPasswordAction, type RecoveryState } from "@/app/(auth)/security-actions";

const initial: RecoveryState = { status: "idle" };
const input = "mt-2 h-14 w-full rounded-2xl border border-[#d9e0d9] bg-[#f9faf7] px-4 text-sm font-semibold outline-none focus:border-[#6e9278] focus:bg-white focus:ring-4 focus:ring-[#c9f269]/20";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);
  return <form action={action} className="space-y-5"><label className="block text-[11px] font-black uppercase tracking-[.08em] text-[#526158]"><span className="flex items-center gap-2"><Mail className="size-4" />Email address</span><input className={input} name="email" type="email" autoComplete="email" required /></label><Feedback state={state} /><Button pending={pending} label="Request secure reset" /></form>;
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initial);
  return <form action={action} className="space-y-5"><input type="hidden" name="token" value={token} /><Password name="password" label="New password" /><Password name="confirmPassword" label="Confirm new password" /><p className="text-[11px] leading-5 text-[#7c8981]">Use at least 12 characters with uppercase, lowercase, a number and a symbol.</p><Feedback state={state} /><Button pending={pending} label="Set new password" /></form>;
}

function Password({ name, label }: { name: string; label: string }) { return <label className="block text-[11px] font-black uppercase tracking-[.08em] text-[#526158]"><span className="flex items-center gap-2"><LockKeyhole className="size-4" />{label}</span><input className={input} name={name} type="password" autoComplete="new-password" required /></label>; }
function Feedback({ state }: { state: RecoveryState }) { const errors = state.errors ? Object.values(state.errors).flat() : []; if (!state.message && errors.length === 0) return null; return <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${state.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{state.message}{errors.map(error => <p key={error}>{error}</p>)}</div>; }
function Button({ pending, label }: { pending: boolean; label: string }) { return <button disabled={pending} className="flex h-14 w-full items-center justify-between rounded-2xl bg-[#163d2d] px-5 text-sm font-black text-white disabled:opacity-60"><span>{pending ? "Please wait…" : label}</span><ArrowRight className="size-4" /></button>; }
