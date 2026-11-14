import { CalendarDays, CheckCircle2, Gauge, HardDrive, Package, Store, Users } from "lucide-react";
import { SectionPage } from "@/components/section-page";
import { SubscriptionPlanEditor, TenantSubscriptionControls } from "@/components/subscription-controls";
import { getSubscriptionWorkspace } from "@/data/subscriptions";
import { formatStorage } from "@/data/subscription-limits";
import { formatMoney } from "@/lib/utils";

export default async function SubscriptionPage() {
  const { tenants, plans, platformAccess } = await getSubscriptionWorkspace();
  return <SectionPage eyebrow="Commercial controls" title="Plans & usage" description="Monitor every business allowance, renew access and prevent platform costs from growing beyond the assigned monthly plan." icon={Gauge}>
    <section className="grid gap-3 sm:grid-cols-3">
      <Metric label="Businesses in view" value={String(tenants.length)} icon={Store} />
      <Metric label="Active or trial" value={String(tenants.filter(item => item.subscription && ["ACTIVE", "TRIALING"].includes(item.subscription.status)).length)} icon={CheckCircle2} />
      <Metric label="Markets" value="PKR + USD" icon={CalendarDays} />
    </section>

    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      {tenants.map(tenant => {
        const plan = tenant.subscription?.plan;
        const marketPlans = plans.filter(item => item.market === (tenant.countryCode === "PK" ? "PK" : "INTL"));
        return <article key={tenant.id} className="rounded-[28px] border border-[#dfe6df] bg-white p-5 shadow-[0_18px_50px_rgba(21,52,37,.06)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#87938b]">{tenant.countryCode === "PK" ? "Pakistan market" : "International market"}</p><h2 className="mt-1 text-xl font-black">{tenant.name}</h2></div>
            <span className={`rounded-full px-3 py-1.5 text-[10px] font-black ${statusTone(tenant.subscription?.status)}`}>{plan ? `${plan.name} · ${tenant.subscription!.status}` : "NO PLAN"}</span>
          </div>
          {plan ? <>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Usage icon={Store} label="Stores" value={tenant.usage.stores} limit={plan.storeLimit} />
              <Usage icon={Users} label="Team seats" value={tenant.usage.staff} limit={plan.staffLimit} />
              <Usage icon={Package} label="Products" value={tenant.usage.products} limit={plan.productLimit} />
              <Usage icon={HardDrive} label="Media" value={tenant.usage.mediaBytes} limit={plan.mediaStorageMb * 1024 * 1024} storage />
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#f5f8f3] px-4 py-3 text-xs">
              <span className="font-bold text-[#526158]">{formatMoney(plan.monthlyMinor, plan.currency)} / month</span>
              <span className="text-[#7d8981]">Current period ends {tenant.subscription!.currentPeriodEnd.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </> : <div className="mt-5 rounded-2xl border border-dashed border-[#d8e0d7] bg-[#fafcf9] p-6 text-center text-sm text-[#6f7b73]">Assign a market plan before this business can add stores, staff, products or media.</div>}
          {platformAccess && <TenantSubscriptionControls tenantId={tenant.id} plans={marketPlans} currentPlanId={plan?.id} currentStatus={tenant.subscription?.status} />}
        </article>;
      })}
    </div>

    {platformAccess && <section className="mt-6 rounded-[30px] bg-[#0c2b1f] p-6 text-white sm:p-8">
      <div className="max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#a4b8ac]">Super admin only</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Plan catalogue</h2><p className="mt-2 text-sm leading-6 text-[#b7c9bf]">Control country-specific monthly pricing and hard platform allowances. Existing businesses keep their assigned plan and immediately use the updated limits.</p></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{plans.map(plan => <SubscriptionPlanEditor key={plan.id} plan={plan} />)}</div>
    </section>}
  </SectionPage>;
}

function Usage({ icon: Icon, label, value, limit, storage = false }: { icon: typeof Store; label: string; value: number; limit: number; storage?: boolean }) {
  const percentage = limit > 0 ? Math.min(100, Math.round(value / limit * 100)) : 100;
  const warning = percentage >= 85;
  return <div className="rounded-2xl border border-[#e5eae4] p-3.5"><div className="flex items-center gap-2 text-[#5f6d64]"><Icon className="size-3.5" /><p className="text-[10px] font-black uppercase tracking-[.12em]">{label}</p></div><p className="mt-3 text-sm font-black">{storage ? formatStorage(value) : value.toLocaleString()} <span className="font-medium text-[#9aa49d]">/ {storage ? formatStorage(limit) : limit.toLocaleString()}</span></p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9eee7]"><span className={`block h-full rounded-full ${warning ? "bg-[#ef8a62]" : "bg-[#80a94f]"}`} style={{ width: `${percentage}%` }} /></div></div>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Store }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]"><Icon className="size-4" /></span><div><p className="text-xs text-[#7c8981]">{label}</p><p className="text-lg font-black">{value}</p></div></div></article>; }
function statusTone(status?: string) { return status === "ACTIVE" ? "bg-[#e9f4df] text-[#47733d]" : status === "TRIALING" ? "bg-[#eef2ff] text-[#4f5da1]" : status === "PAST_DUE" ? "bg-[#fff1dc] text-[#9b6721]" : "bg-[#f4e9e6] text-[#9a4f3c]"; }
