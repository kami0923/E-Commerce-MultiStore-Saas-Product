import { Activity, AlertTriangle, CheckCircle2, Clock3, Database, HardDrive, Mail, MessageCircle, PlayCircle, RefreshCw, ShieldCheck, Store } from "lucide-react";
import { SectionPage } from "@/components/section-page";
import { requirePlatformAdmin } from "@/data/auth";
import { getPlatformOperationsSnapshot } from "@/lib/platform-operations";
import { runPlatformMaintenanceAction } from "./actions";

export default async function PlatformHealthPage({ searchParams }: { searchParams: Promise<{ maintained?: string }> }) {
  await requirePlatformAdmin();
  const [snapshot, query] = await Promise.all([getPlatformOperationsSnapshot(), searchParams]);
  const attention = snapshot.counts.failedNotifications + snapshot.counts.expiredSessions + snapshot.counts.expiredInvitations + snapshot.counts.overdueSubscriptions;

  return <SectionPage eyebrow="Production operations" title="Platform health" description="Monitor Meridian's shared infrastructure, tenant lifecycle and background delivery from one super-admin control centre." icon={Activity}>
    {query.maintained === "1" && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#cfe2bf] bg-[#eff8e8] px-4 py-3 text-sm font-bold text-[#37652d]"><CheckCircle2 className="size-5" />Maintenance completed and live status refreshed.</div>}

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={Database} label="Database" value={snapshot.database} note={`${snapshot.responseMs} ms response`} tone="good" />
      <Metric icon={Store} label="Live storefronts" value={`${snapshot.counts.activeStores}/${snapshot.counts.stores}`} note={`${snapshot.counts.tenants} tenant businesses`} tone="good" />
      <Metric icon={Clock3} label="Notification queue" value={String(snapshot.counts.pendingNotifications)} note={`${snapshot.counts.failedNotifications} need attention`} tone={snapshot.counts.failedNotifications ? "warn" : "good"} />
      <Metric icon={ShieldCheck} label="Maintenance items" value={String(attention)} note="Safe cleanup candidates" tone={attention ? "warn" : "good"} />
    </section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <article className="rounded-[28px] border border-[#dfe6df] bg-white p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#849189]">Integration readiness</p><h2 className="mt-2 text-xl font-black">Production connections</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66736b]">Unavailable optional services stay isolated. Orders and dashboards continue working while email, WhatsApp or payment credentials are added later.</p></div><span className="rounded-full bg-[#eef5e9] px-3 py-2 text-[10px] font-black text-[#46723c]">LIVE CHECK</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Integration icon={HardDrive} {...snapshot.integrations.media} />
          <Integration icon={Mail} {...snapshot.integrations.email} deferred={!snapshot.integrations.email.ready} />
          <Integration icon={MessageCircle} {...snapshot.integrations.whatsapp} deferred={!snapshot.integrations.whatsapp.ready} />
          <Integration icon={RefreshCw} {...snapshot.integrations.cron} />
        </div>
      </article>

      <article className="rounded-[28px] bg-[#0c2b1f] p-5 text-white sm:p-7">
        <PlayCircle className="size-6 text-[#c5f45b]" /><p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-[#91a99c]">Protected operation</p><h2 className="mt-2 text-2xl font-black">Run maintenance now</h2><p className="mt-3 text-sm leading-6 text-[#acc0b5]">Removes expired login sessions, closes expired invitations, applies overdue subscription status and safely processes queued notifications.</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-center"><Mini value={snapshot.counts.expiredSessions} label="Sessions" /><Mini value={snapshot.counts.expiredInvitations} label="Invites" /><Mini value={snapshot.counts.overdueSubscriptions} label="Plans" /></div>
        <form action={runPlatformMaintenanceAction}><button className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#c5f45b] text-sm font-black text-[#10231a] transition hover:-translate-y-0.5 hover:bg-white"><PlayCircle className="size-4" />Run safe maintenance</button></form>
      </article>
    </section>

    <section className="mt-5 overflow-hidden rounded-[28px] border border-[#dfe6df] bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-[#edf0ed] p-5 sm:px-7"><div><h2 className="text-lg font-black">Recent delivery failures</h2><p className="mt-1 text-xs text-[#748078]">Provider errors are retried with controlled backoff and never cross tenant boundaries.</p></div>{snapshot.recentFailures.length > 0 && <AlertTriangle className="size-5 text-[#d5794e]" />}</div>
      {snapshot.recentFailures.length ? <div className="divide-y divide-[#edf0ed]">{snapshot.recentFailures.map(item => <div key={item.id} className="grid gap-3 p-5 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-black">{item.store.name}</span><span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-[9px] font-black text-[#a75b39]">{item.channel}</span><span className="text-[10px] text-[#89958e]">{item.template.replaceAll("_", " ")}</span></div><p className="mt-2 truncate text-xs text-[#66736b]">{item.recipient} · {item.lastError || "Provider request failed"}</p></div><div className="text-left lg:text-right"><p className="text-xs font-black">Attempt {item.attempts}/{item.maxAttempts}</p><p className="mt-1 text-[10px] text-[#89958e]">{item.updatedAt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}</p></div></div>)}</div> : <div className="p-10 text-center"><CheckCircle2 className="mx-auto size-6 text-[#65914f]" /><p className="mt-3 text-sm font-black">No failed deliveries</p><p className="mt-1 text-xs text-[#748078]">The delivery queue is healthy.</p></div>}
    </section>

    <p className="mt-5 text-center text-[11px] text-[#8a958e]">Last checked {snapshot.checkedAt.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "medium" })}</p>
  </SectionPage>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: typeof Activity; label: string; value: string; note: string; tone: "good" | "warn" }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-start justify-between gap-3"><span className={`grid size-10 place-items-center rounded-xl ${tone === "good" ? "bg-[#edf5e8] text-[#47753c]" : "bg-[#fff0e8] text-[#b35f3a]"}`}><Icon className="size-4" /></span><span className={`mt-1 size-2 rounded-full ${tone === "good" ? "bg-[#8fbd55]" : "bg-[#ed875b]"}`} /></div><p className="mt-5 text-xs text-[#7c8981]">{label}</p><p className="mt-1 text-2xl font-black tracking-[-.04em]">{value}</p><p className="mt-1 text-[11px] text-[#8b968f]">{note}</p></article>; }
function Integration({ icon: Icon, label, ready, deferred = false }: { icon: typeof HardDrive; label: string; ready: boolean; deferred?: boolean }) { return <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8f5] p-4"><span className={`grid size-10 place-items-center rounded-xl ${ready ? "bg-[#e6f2de] text-[#4f7e42]" : "bg-[#ecefec] text-[#89938d]"}`}><Icon className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{label}</p><p className={`mt-1 text-[10px] font-bold ${ready ? "text-[#568048]" : "text-[#8c9690]"}`}>{ready ? "Connected" : deferred ? "Deferred safely" : "Action required"}</p></div>{ready && <CheckCircle2 className="size-4 text-[#65914f]" />}</div>; }
function Mini({ value, label }: { value: number; label: string }) { return <div className="rounded-xl border border-white/10 bg-white/[.06] px-2 py-3"><p className="text-lg font-black text-[#c5f45b]">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-[#91a99c]">{label}</p></div>; }
