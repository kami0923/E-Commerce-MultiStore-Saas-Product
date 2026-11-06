import { ArchiveRestore, Boxes, ExternalLink, Eye, Pause, Play, Plus, ShoppingBag, Store } from "lucide-react";
import Link from "next/link";
import { restoreArchivedStoreAction, setStoreStatusAction } from "@/app/dashboard/actions";
import { StoreArchiveControl } from "@/components/store-archive-control";
import { getCurrentPermissions, getDashboardWorkspace } from "@/data/auth";
import { listStores } from "@/data/platform";
import { cn } from "@/lib/utils";

const statusStyle = {
  DRAFT: "bg-[#fff1db] text-[#9b6721]",
  ACTIVE: "bg-[#e4f3dc] text-[#326b28]",
  PAUSED: "bg-[#eef0ee] text-[#657169]",
  ARCHIVED: "bg-[#f8e4e1] text-[#9d463a]",
};

export default async function StoresPage() {
  const [stores, capabilities, workspace] = await Promise.all([listStores(), getCurrentPermissions(), getDashboardWorkspace()]);
  const canCreate = capabilities.includes("stores.create");
  const canManage = capabilities.includes("stores.manage");
  const activeStores = stores.filter(store => store.status !== "ARCHIVED");
  const archivedStores = stores.filter(store => store.status === "ARCHIVED");

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div className="flex items-start gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#e8f1e3] text-[#164b36]"><Store className="size-5" /></span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#87938b]">{workspace.platformAccess ? "Store portfolio" : `${workspace.name} storefronts`}</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-.05em]">Stores</h1>
            <p className="mt-2 text-sm text-[#6f7b73]">Manage the business dashboard here, then preview or publish the customer-facing website separately.</p>
          </div>
        </div>
        {canCreate && <Link href="/dashboard/stores/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#164b36] px-4 py-3 text-sm font-bold text-white"><Plus className="size-4" /> Add store</Link>}
      </div>

      {!workspace.platformAccess && <div className="mt-7 grid gap-4 rounded-[24px] border border-[#dce7d8] bg-[#edf5e9] p-5 sm:grid-cols-2">
        <div><p className="text-xs font-black uppercase tracking-[.15em] text-[#66805f]">Merchant dashboard</p><p className="mt-2 text-sm leading-6 text-[#536850]">Only you and your authorized team use this area to manage products, stock, orders and settings.</p></div>
        <div><p className="text-xs font-black uppercase tracking-[.15em] text-[#66805f]">Customer storefront</p><p className="mt-2 text-sm leading-6 text-[#536850]">This is the branded clothing website your customers visit. Preview it privately, then publish it when ready.</p></div>
      </div>}

      <div className="mt-8 overflow-hidden rounded-[24px] border border-[#e1e6e1] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left">
            <thead><tr className="text-[10px] font-bold uppercase tracking-[.13em] text-[#929c95]"><th className="px-6 py-4">Store</th><th className="px-4 py-4">Business</th><th className="px-4 py-4">Vertical</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Catalog</th><th className="px-4 py-4">Orders</th><th className="px-6 py-4 text-right">Storefront</th></tr></thead>
            <tbody>{activeStores.map((store) => <tr key={store.id} className="border-t border-[#edf0ed] text-sm">
              <td className="px-6 py-4 font-bold">{store.name}<span className="mt-0.5 block text-[11px] font-normal text-[#8a958e]">/{store.slug}</span></td>
              <td className="px-4 py-4 text-[#617067]">{store.tenant.name}</td>
              <td className="px-4 py-4 text-[#617067]">{store.vertical.replaceAll("_", " ")}</td>
              <td className="px-4 py-4"><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", statusStyle[store.status])}>{store.status}</span></td>
              <td className="px-4 py-4"><span className="flex items-center gap-1.5"><Boxes className="size-3.5" />{store._count.products}</span></td>
              <td className="px-4 py-4"><span className="flex items-center gap-1.5"><ShoppingBag className="size-3.5" />{store._count.orders}</span></td>
              <td className="px-6 py-4"><div className="flex items-center justify-end gap-2">
                <Link href={`/preview/${store.id}` as never} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe5df] px-3 py-2 text-xs font-bold text-[#42534a]"><Eye className="size-3.5" /> Preview</Link>
                {store.status === "ACTIVE" && <Link href={`/store/${store.slug}` as never} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg border border-[#dfe5df] px-3 py-2 text-xs font-bold text-[#42534a]"><ExternalLink className="size-3.5" /> Open</Link>}
                {canManage && store.status !== "ARCHIVED" && <form action={setStoreStatusAction}><input type="hidden" name="tenantId" value={store.tenantId} /><input type="hidden" name="storeId" value={store.id} /><input type="hidden" name="status" value={store.status === "ACTIVE" ? "PAUSED" : "ACTIVE"} /><button className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold", store.status === "ACTIVE" ? "bg-[#f0f2ef] text-[#59665e]" : "bg-[#164b36] text-white")}>{store.status === "ACTIVE" ? <><Pause className="size-3.5" /> Pause</> : <><Play className="size-3.5" /> Publish</>}</button></form>}
                {workspace.platformAccess && <StoreArchiveControl store={{ id: store.id, tenantId: store.tenantId, name: store.name, products: store._count.products, orders: store._count.orders }} />}
              </div></td>
            </tr>)}</tbody>
          </table>
          {activeStores.length === 0 && <p className="p-10 text-center text-sm text-[#7c8981]">No active or paused stores are available.</p>}
        </div>
      </div>

      {workspace.platformAccess && archivedStores.length > 0 && <section className="mt-6 overflow-hidden rounded-[24px] border border-[#eadfda] bg-[#fffaf7]">
        <div className="flex items-start gap-3 border-b border-[#efe4df] p-5 sm:p-6"><span className="grid size-10 place-items-center rounded-xl bg-[#f4e6e0] text-[#92503f]"><ArchiveRestore className="size-4" /></span><div><h2 className="font-black">Archived stores</h2><p className="mt-1 text-xs leading-5 text-[#7c706b]">Public websites are closed, while products, orders, customers and audit history remain preserved.</p></div></div>
        <div className="divide-y divide-[#efe4df]">{archivedStores.map(store => <article key={store.id} className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-black">{store.name}</h3><span className="rounded-full bg-[#f4e4df] px-2.5 py-1 text-[9px] font-black text-[#914b3a]">ARCHIVED</span></div><p className="mt-1 text-xs text-[#81766f]">{store.tenant.name} · {store._count.products} products · {store._count.orders} orders</p></div><div className="flex gap-2"><Link href={`/preview/${store.id}` as never} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e4d8d2] bg-white px-3.5 text-xs font-black text-[#5e645f]"><Eye className="size-3.5" /> Preview history</Link><form action={restoreArchivedStoreAction}><input type="hidden" name="tenantId" value={store.tenantId} /><input type="hidden" name="storeId" value={store.id} /><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#164b36] px-3.5 text-xs font-black text-white"><ArchiveRestore className="size-3.5" /> Restore as paused</button></form></div></article>)}</div>
      </section>}
    </div>
  );
}
