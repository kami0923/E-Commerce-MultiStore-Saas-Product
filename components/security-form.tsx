"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";
import { changePasswordAction, type SecurityState } from "@/app/dashboard/security/actions";
import { PasswordInput } from "@/components/password-input";

const initial: SecurityState = { status: "idle" };
const input = "mt-2 h-11 w-full rounded-xl border border-[#dfe5df] bg-white px-3.5 text-sm outline-none focus:border-[#7fa27d] focus:ring-4 focus:ring-[#c9f269]/20";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  const errors = state.errors ? Object.values(state.errors).flat() : [];
  return <form action={action} className="space-y-4"><PasswordField label="Current password" name="currentPassword" autoComplete="current-password" /><div className="grid gap-4 sm:grid-cols-2"><PasswordField label="New password" name="newPassword" autoComplete="new-password" /><PasswordField label="Confirm password" name="confirmPassword" autoComplete="new-password" /></div><p className="text-[11px] leading-5 text-[#7c8981]">At least 12 characters including uppercase, lowercase, a number and a symbol.</p><label className="flex items-center gap-2 text-xs font-bold text-[#526158]"><input type="checkbox" name="revokeOtherSessions" defaultChecked className="size-4 accent-[#164b36]" />Sign out every other device</label>{(state.message || errors.length > 0) && <div className={`rounded-xl px-4 py-3 text-xs font-semibold ${state.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{state.message}{errors.map(error => <p key={error}>{error}</p>)}</div>}<button disabled={pending} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white disabled:opacity-60"><KeyRound className="size-4" />{pending ? "Changing…" : "Change password"}</button></form>;
}

function PasswordField({ label, name, autoComplete }: { label: string; name: string; autoComplete: string }) { return <label className="block text-xs font-bold text-[#526158]">{label}<PasswordInput containerClassName="mt-2" className={input.replace("mt-2 ", "")} name={name} autoComplete={autoComplete} required /></label>; }
