"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useActionState } from "react";
import { approveMerchantApplicationAction, rejectMerchantApplicationAction, type OnboardingState } from "@/app/dashboard/onboarding/actions";

const initial: OnboardingState = { status: "idle" };
export function MerchantReviewControls({ applicationId }: { applicationId: string }) {
  const [approved, approveAction, approving] = useActionState(approveMerchantApplicationAction, initial); const [rejected, rejectAction, rejecting] = useActionState(rejectMerchantApplicationAction, initial); const feedback = approved.message ? approved : rejected;
  return <div className="mt-5 border-t border-[#edf0ed] pt-5"><div className="grid gap-4 lg:grid-cols-[auto_1fr]"><form action={approveAction}><input type="hidden" name="applicationId" value={applicationId} /><button disabled={approving || rejecting} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#164b36] px-5 text-xs font-black text-white disabled:opacity-50 lg:w-auto"><CheckCircle2 className="size-4" />{approving ? "Provisioning…" : "Approve and create workspace"}</button></form><form action={rejectAction} className="flex flex-col gap-2 sm:flex-row"><input type="hidden" name="applicationId" value={applicationId} /><input name="reviewNotes" required minLength={10} placeholder="Reason or information needed before reapplying" className="h-11 min-w-0 flex-1 rounded-xl border border-[#dfe5df] px-3 text-xs outline-none focus:border-[#9f765f]" /><button disabled={approving || rejecting} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#ead6ce] px-4 text-xs font-black text-[#a44f38] disabled:opacity-50"><XCircle className="size-4" />{rejecting ? "Rejecting…" : "Reject"}</button></form></div>{feedback.message && <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${feedback.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{feedback.message}</p>}</div>;
}
