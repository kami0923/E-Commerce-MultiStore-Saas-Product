"use client";

import { Mail } from "lucide-react";
import { useActionState } from "react";
import { sendMemberPasswordResetAction, type MemberResetState } from "@/app/dashboard/team/actions";

const initial: MemberResetState = { status: "idle" };

export function MemberPasswordReset({ tenantId, userId }: { tenantId: string; userId: string }) {
  const [state, action, pending] = useActionState(sendMemberPasswordResetAction, initial);
  return <div className="flex flex-col items-end gap-1"><form action={action}><input type="hidden" name="tenantId" value={tenantId} /><input type="hidden" name="userId" value={userId} /><button disabled={pending} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dce4dc] bg-white px-4 text-xs font-black text-[#164b36] transition hover:bg-[#edf5e8] disabled:cursor-wait disabled:opacity-60"><Mail className="size-3.5" />{pending ? "Sending…" : "Email password reset"}</button></form>{state.message && <p role="status" className={`max-w-64 text-right text-[10px] font-semibold ${state.status === "success" ? "text-[#4e7841]" : "text-[#a44f38]"}`}>{state.message}</p>}</div>;
}
