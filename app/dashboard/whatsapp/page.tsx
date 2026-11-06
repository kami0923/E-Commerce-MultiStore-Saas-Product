import { Activity, KeyRound, MessageCircle, RefreshCw, ShieldCheck, Smartphone, Unplug, Zap } from "lucide-react";
import { SectionPage } from "@/components/section-page";
import { WhatsAppConnect } from "@/components/whatsapp-connect";
import { getWhatsAppWorkspace } from "@/data/whatsapp";
import { disconnectWhatsAppAction, verifyWhatsAppConnectionAction } from "./actions";

export default async function WhatsAppPage() {
  const { stores } = await getWhatsAppWorkspace();
  const connected = stores.filter(store => store.whatsappConnection?.status === "CONNECTED").length;
  const needsAttention = stores.filter(store => store.whatsappConnection?.status === "ERROR").length;
  const platformConfigured = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_WHATSAPP_CONFIG_ID && process.env.APP_ENCRYPTION_KEY);
  const publicAppId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID;
  const publicConfigId = process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID || process.env.META_WHATSAPP_CONFIG_ID;

  return <SectionPage eyebrow="Merchant messaging" title="WhatsApp Business" description="Let every store securely link its own WhatsApp Business account, then send order and service updates from the correct brand number." icon={MessageCircle}>
    <section className="grid gap-3 sm:grid-cols-3">
      <Metric icon={Smartphone} label="Store accounts linked" value={`${connected}/${stores.length}`} />
      <Metric icon={Activity} label="Needs attention" value={String(needsAttention)} />
      <Metric icon={ShieldCheck} label="Credential protection" value="AES-256" />
    </section>

    <section className="mt-5 overflow-hidden rounded-[30px] bg-[#092e20] text-white shadow-[0_30px_80px_rgba(9,46,32,.16)]">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_.85fr] lg:p-10">
        <div><span className="inline-flex items-center gap-2 rounded-full border border-[#79ed9d]/20 bg-[#25D366]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] text-[#92f2ad]"><Zap className="size-3" /> Official account connection</span><h2 className="mt-5 max-w-2xl text-3xl font-black tracking-[-.045em] sm:text-4xl">One platform. Every merchant speaks in their own voice.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#acd0bf]">A store owner signs in to Meta, selects their business and phone number, and grants permission. Meridian stores the resulting credential encrypted and only uses it for that store&apos;s customer notifications.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <SecurityLine icon={KeyRound} title="No passwords collected" text="Authentication happens inside Meta's secure signup window." />
          <SecurityLine icon={ShieldCheck} title="Tenant-isolated" text="Every link, verification and disconnect is permission checked and audited." />
          <SecurityLine icon={MessageCircle} title="Store-specific sending" text="Order messages use the account linked to the order's store." />
        </div>
      </div>
      <div className={`border-t border-white/10 px-6 py-4 text-xs font-bold sm:px-8 lg:px-10 ${platformConfigured ? "bg-[#25D366]/10 text-[#9af2b2]" : "bg-[#ffb85c]/10 text-[#ffd39a]"}`}>{platformConfigured ? "Platform Meta configuration is ready for merchant onboarding." : "Platform setup is waiting for Meta app credentials and the encryption key. Store data is ready; no account can be linked until those secrets are configured."}</div>
    </section>

    <div className="mt-5 space-y-4">{stores.map(store => {
      const connection = store.whatsappConnection;
      const isConnected = connection?.status === "CONNECTED";
      return <article key={store.id} className="overflow-hidden rounded-[28px] border border-[#dfe6df] bg-white">
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4"><span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${isConnected ? "bg-[#dcf8e5] text-[#128c4c]" : "bg-[#eef2ed] text-[#6d7971]"}`}><MessageCircle className="size-5" /></span><div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#89958d]">{store.tenant.name}</p><h2 className="mt-1 truncate text-xl font-black">{store.name}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={connection?.status || "NOT_LINKED"} />{connection?.qualityRating && <span className="rounded-full bg-[#f1f5ef] px-2.5 py-1 text-[9px] font-black text-[#5f6e64]">QUALITY {connection.qualityRating}</span>}</div></div></div>
          <div className="lg:text-right">{isConnected ? <><p className="text-sm font-black">{connection.verifiedName || "WhatsApp Business"}</p><p className="mt-1 text-xs text-[#748078]">{connection.displayPhoneNumber || "Linked phone number"}</p></> : <><p className="text-sm font-black">No active sender</p><p className="mt-1 text-xs text-[#748078]">Link the number customers recognize.</p></>}</div>
        </div>
        {connection?.lastError && <div className="mx-5 mb-4 rounded-2xl bg-[#fff0e9] px-4 py-3 text-xs font-bold text-[#a4472b] sm:mx-7">{connection.lastError}</div>}
        <div className="grid gap-5 border-t border-[#edf0ed] bg-[#fafcf9] p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><h3 className="text-sm font-black">{isConnected ? "Manage connection" : "Connect this store"}</h3><p className="mt-1 max-w-2xl text-xs leading-5 text-[#748078]">{isConnected ? `Last verified ${connection.lastVerifiedAt?.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) || "during signup"}. You can re-check Meta access or replace this number.` : "The merchant completes Meta's Embedded Signup. Their token is exchanged on the server and never reaches the browser or dashboard."}</p><div className="mt-4"><WhatsAppConnect tenantId={store.tenantId} storeId={store.id} appId={publicAppId} configId={publicConfigId} connected={isConnected} /></div></div>
          {connection && <div className="flex flex-wrap gap-2">{connection.status !== "DISCONNECTED" && <form action={verifyWhatsAppConnectionAction}><input type="hidden" name="tenantId" value={store.tenantId} /><input type="hidden" name="storeId" value={store.id} /><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#d9e0d9] bg-white px-3.5 text-xs font-black text-[#405048]"><RefreshCw className="size-3.5" /> Verify</button></form>}<form action={disconnectWhatsAppAction}><input type="hidden" name="tenantId" value={store.tenantId} /><input type="hidden" name="storeId" value={store.id} /><button className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#f0d7cf] bg-white px-3.5 text-xs font-black text-[#a44b34]"><Unplug className="size-3.5" /> Disconnect</button></form></div>}
        </div>
      </article>;
    })}{stores.length === 0 && <div className="rounded-[28px] border border-dashed border-[#ced9ce] bg-white p-10 text-center"><Smartphone className="mx-auto size-6 text-[#91a097]" /><h2 className="mt-4 font-black">No manageable stores found</h2><p className="mt-2 text-xs text-[#748078]">Create a store or ask an owner to grant store management permission.</p></div>}</div>

    <section className="mt-5 grid gap-4 lg:grid-cols-3"><Step number="01" title="Merchant authorizes" text="The owner uses their Facebook login and chooses the WhatsApp Business account and phone number." /><Step number="02" title="Meridian verifies" text="The server confirms the phone number with Meta, encrypts the token and records an audit event." /><Step number="03" title="Messages stay branded" text="Approved templates for orders, returns and support are sent from that specific store's number." /></section>
  </SectionPage>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof MessageCircle; label: string; value: string }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#e6f6e7] text-[#167848]"><Icon className="size-4" /></span><div><p className="text-xs text-[#7c8981]">{label}</p><p className="text-lg font-black">{value}</p></div></div></article>; }
function SecurityLine({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#25D366]/15 text-[#75e896]"><Icon className="size-4" /></span><div><p className="text-xs font-black">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#9fc1b1]">{text}</p></div></div></div>; }
function StatusBadge({ status }: { status: string }) { const colors = status === "CONNECTED" ? "bg-[#dcf8e5] text-[#177344]" : status === "ERROR" ? "bg-[#fff0e9] text-[#a4472b]" : status === "PENDING" ? "bg-[#fff3dd] text-[#97611d]" : "bg-[#eef1ee] text-[#68746c]"; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black ${colors}`}>{status.replaceAll("_", " ")}</span>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <article className="rounded-[24px] border border-[#dfe6df] bg-white p-5"><span className="font-serif text-2xl text-[#6e9562]">{number}</span><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-[#748078]">{text}</p></article>; }
