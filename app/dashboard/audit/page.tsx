import { Activity, ShieldCheck } from "lucide-react";
import { SectionPage } from "@/components/section-page";
import { getAuditWorkspace } from "@/data/commerce";

export default async function AuditPage() {
  const events = await getAuditWorkspace();
  return <SectionPage eyebrow="Security and accountability" title="Audit logs" description="Immutable business events for product creation, archival, stock adjustments, order creation, fulfilment, invitations, and store administration." icon={ShieldCheck}>
    <section className="overflow-hidden rounded-[24px] border border-[#e1e6e1] bg-white"><div className="border-b border-[#edf0ed] px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]"><Activity className="size-4" /></span><div><h2 className="font-black">Recent security trail</h2><p className="mt-0.5 text-xs text-[#7c8981]">Latest {events.length} events inside your permitted tenants</p></div></div></div><div className="divide-y divide-[#edf0ed]">{events.map(event => <article key={event.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[170px_1fr_auto] sm:items-center"><div><p className="text-xs font-black text-[#164b36]">{event.action}</p><p className="mt-1 text-[11px] text-[#87938b]">{event.entityType}</p></div><div><p className="text-sm font-bold">{event.summary}</p><p className="mt-1 text-xs text-[#7c8981]">{event.tenant.name}{event.store ? ` · ${event.store.name}` : ""} · {event.actor?.name || event.actor?.email || "System"}</p></div><time className="text-xs text-[#87938b]">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(event.createdAt)}</time></article>)}{events.length === 0 && <p className="p-12 text-center text-sm text-[#7c8981]">Audit events will appear as the team works.</p>}</div></section>
  </SectionPage>;
}
