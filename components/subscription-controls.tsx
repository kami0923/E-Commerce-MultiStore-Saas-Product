"use client";

import { useActionState } from "react";
import { assignSubscriptionAction, setSubscriptionStatusAction, updateSubscriptionPlanAction, type SubscriptionActionState } from "@/app/dashboard/subscription/actions";

const initialState: SubscriptionActionState = { status: "idle" };
const control = "h-11 w-full rounded-xl border border-[#dce3dc] bg-white px-3 text-sm font-bold outline-none focus:border-[#7fa27d]";

type PlanChoice = { id: string; name: string; currency: string; monthlyMinor: number; storeLimit: number; staffLimit: number; productLimit: number; mediaStorageMb: number };

export function TenantSubscriptionControls({ tenantId, plans, currentPlanId, currentStatus }: { tenantId: string; plans: PlanChoice[]; currentPlanId?: string; currentStatus?: string }) {
  const [planState, planAction, planPending] = useActionState(assignSubscriptionAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(setSubscriptionStatusAction, initialState);
  return <div className="mt-5 border-t border-[#e8ede8] pt-5">
    <form action={planAction} className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <input type="hidden" name="tenantId" value={tenantId} />
      <select name="planId" defaultValue={currentPlanId ?? plans[0]?.id} className={control} aria-label="Subscription plan">
        {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {plan.currency} {(plan.monthlyMinor / 100).toLocaleString()}/month</option>)}
      </select>
      <button disabled={planPending || plans.length === 0} className="h-11 rounded-xl bg-[#123e2d] px-5 text-xs font-black text-white disabled:opacity-50">{planPending ? "Saving…" : "Assign & renew"}</button>
    </form>
    <ActionMessage state={planState} />
    {currentPlanId && <form action={statusAction} className="mt-3 flex flex-wrap gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />
      <button name="status" value="ACTIVE" disabled={statusPending || currentStatus === "ACTIVE"} className="rounded-lg border border-[#dce3dc] bg-white px-3 py-2 text-[11px] font-black disabled:opacity-40">Reactivate + 30 days</button>
      <button name="status" value="PAST_DUE" disabled={statusPending || currentStatus === "PAST_DUE"} className="rounded-lg border border-[#eadfcf] bg-[#fff9ef] px-3 py-2 text-[11px] font-black text-[#946226] disabled:opacity-40">Mark past due</button>
      <button name="status" value="CANCELLED" disabled={statusPending || currentStatus === "CANCELLED"} className="rounded-lg border border-[#ecd9d4] bg-[#fff7f5] px-3 py-2 text-[11px] font-black text-[#a14d3a] disabled:opacity-40">Cancel access</button>
    </form>}
    <ActionMessage state={statusState} />
  </div>;
}

export function SubscriptionPlanEditor({ plan }: { plan: PlanChoice & { market: string } }) {
  const [state, action, pending] = useActionState(updateSubscriptionPlanAction, initialState);
  return <form action={action} className="rounded-2xl border border-white/10 bg-white/[.055] p-4">
    <input type="hidden" name="planId" value={plan.id} />
    <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#9eb4a7]">{plan.market === "PK" ? "Pakistan · PKR" : "International · USD"}</p>
    <h3 className="mt-1 text-lg font-black">{plan.name}</h3>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <MiniField name="monthlyPrice" label={`Monthly (${plan.currency})`} defaultValue={plan.monthlyMinor / 100} />
      <MiniField name="storeLimit" label="Stores" defaultValue={plan.storeLimit} />
      <MiniField name="staffLimit" label="Team seats" defaultValue={plan.staffLimit} />
      <MiniField name="productLimit" label="Products" defaultValue={plan.productLimit} />
      <div className="col-span-2"><MiniField name="mediaStorageMb" label="Media storage (MB)" defaultValue={plan.mediaStorageMb} /></div>
    </div>
    <button disabled={pending} className="mt-3 h-10 w-full rounded-xl bg-[#c8f45a] text-xs font-black text-[#0c2b1f] disabled:opacity-50">{pending ? "Updating…" : "Update plan"}</button>
    <ActionMessage state={state} dark />
  </form>;
}

function MiniField({ name, label, defaultValue }: { name: string; label: string; defaultValue: number }) {
  return <label className="block text-[10px] font-bold text-white/60">{label}<input name={name} type="number" min="0" step={name === "monthlyPrice" ? "0.01" : "1"} defaultValue={defaultValue} className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-white/10 px-2 text-xs font-bold text-white outline-none focus:border-[#c8f45a]" /></label>;
}

function ActionMessage({ state, dark = false }: { state: SubscriptionActionState; dark?: boolean }) {
  if (state.status === "idle" || !state.message) return null;
  return <p role="status" className={`mt-2 rounded-lg px-3 py-2 text-[11px] font-bold ${state.status === "success" ? dark ? "bg-[#c8f45a]/15 text-[#d9ff86]" : "bg-[#edf7e5] text-[#47733d]" : dark ? "bg-[#ffb199]/10 text-[#ffc2af]" : "bg-[#fff0eb] text-[#a14d3a]"}`}>{state.message}</p>;
}
