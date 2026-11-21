import { ArrowRight, ArrowUpRight, Boxes, Building2, CircleAlert, Plus, ShoppingBag, Sparkles, Store, Users } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { formatMoney } from "@/lib/utils";
import { getPlatformStats, listStores } from "@/data/platform";
import { getDashboardWorkspace, requireUser } from "@/data/auth";

const verticalImages: Record<string, string> = {
  CLOTHING: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=82",
  SHOES: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82",
  JEWELLERY: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=82",
  COSMETICS: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=82",
  MULTI_CATEGORY: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=82",
};

export default async function DashboardPage() {
  const [platform, user, accessibleStores, workspace] = await Promise.all([getPlatformStats(), requireUser(), listStores(), getDashboardWorkspace()]);
  const recentStores = accessibleStores.slice(0, 4);
  const productCount = accessibleStores.reduce((total, store) => total + store._count.products, 0);
  const orderCount = accessibleStores.reduce((total, store) => total + store._count.orders, 0);
  const activeStores = accessibleStores.filter(store => store.status === "ACTIVE").length;
  const networkHealth = accessibleStores.length ? Math.round((activeStores / accessibleStores.length) * 100) : 0;
  const peakActivity = Math.max(1, ...recentStores.map(store => store._count.products + store._count.orders));
  const dateLabel = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "2-digit", month: "long", timeZone: "Asia/Karachi" }).format(new Date()).toUpperCase();
  const stats = [
    { label: platform.platformAccess ? "Monthly recurring revenue" : "Recorded sales", value: formatMoney(platform.platformAccess ? 0 : platform.totalSalesMinor), change: platform.platformAccess ? "Billing begins after launch" : `${platform.orderCount} orders recorded`, icon: ArrowUpRight, positive: true },
    { label: platform.platformAccess ? "Active businesses" : "Your business", value: String(platform.businesses), change: platform.platformAccess ? "Database verified" : workspace.name, icon: Building2, positive: true },
    { label: "Live and draft stores", value: String(platform.stores), change: platform.platformAccess ? "Across all tenants" : `Owned by ${workspace.name}`, icon: Store, positive: true },
    { label: platform.platformAccess ? "Pending invitations" : "Active products", value: String(platform.platformAccess ? platform.pendingInvitations : platform.productCount), change: platform.platformAccess ? `${platform.users} platform users` : `${platform.users} business members`, icon: CircleAlert, positive: platform.pendingInvitations === 0 },
  ];
  return (
    <div className="dashboard-overview mx-auto max-w-[1560px]">
      <section className="dashboard-overview-hero">
        <div className="dashboard-overview-orb" aria-hidden="true"><span /><span /><span /></div>
        <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="dashboard-eyebrow"><Sparkles className="size-3.5" /> {dateLabel}</p><h1>Good evening, <em>{user.name.split(" ")[0]}.</em></h1><p>{platform.platformAccess ? "Your entire commerce network, composed into one live operating picture." : `The live operating picture for ${workspace.name}.`}</p></div>
          {platform.platformAccess ? <Link href="/dashboard/businesses/new" className="dashboard-primary-action"><Plus className="size-4" /> Create business <ArrowUpRight className="size-4" /></Link> : workspace.storefront && <Link href={(workspace.storefront.status === "ACTIVE" ? `/store/${workspace.storefront.slug}` : `/preview/${workspace.storefront.id}`) as never} target="_blank" className="dashboard-primary-action">View public website <ArrowUpRight className="size-4" /></Link>}
        </div>
      </section>

      <section className="dashboard-kpi-grid mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({label, value, change, icon: Icon, positive}, i) => (
          <article key={label} className={`dashboard-kpi animate-enter delay-${i} rounded-[22px] border border-[#e1e6e1] bg-white p-5 shadow-[0_10px_35px_rgba(16,35,26,.035)]`} style={{ "--card-delay": `${i * 85}ms` } as CSSProperties}>
            <div className="flex items-start justify-between"><p className="text-xs font-semibold text-[#7c8880]">{label}</p><span className={`grid size-8 place-items-center rounded-xl ${positive ? 'bg-[#edf5df] text-[#4b7739]' : 'bg-[#fff0e9] text-[#c15d3c]'}`}><Icon className="size-4" /></span></div>
            <p className="mt-6 text-[28px] font-black tracking-[-.05em]">{value}</p>
            <p className={`mt-2 text-xs font-bold ${positive ? 'text-[#4f7b43]' : 'text-[#bd6244]'}`}>{change}</p>
            <div className="dashboard-kpi-signal" aria-hidden="true">{[32, 48, 38, 67, 54, 82, 64].map((height, signal) => <i key={signal} style={{ height: `${height}%` }} />)}</div>
          </article>
        ))}
      </section>

      <section className="dashboard-intelligence-grid mt-4 grid gap-4 xl:grid-cols-[1.55fr_.8fr]">
        <article className="dashboard-intelligence-card rounded-[24px] border border-[#e1e6e1] bg-white p-5 shadow-[0_10px_35px_rgba(16,35,26,.035)] sm:p-6">
          <div className="flex items-start justify-between"><div><h2 className="font-black tracking-[-.025em]">{platform.platformAccess ? "Platform revenue" : `${workspace.name} sales`}</h2><p className="mt-1 text-xs text-[#87928b]">{platform.platformAccess ? "Subscription revenue · Last 12 months" : "Order value recorded across your stores"}</p></div><span className="rounded-xl border border-[#e1e6e1] px-3 py-2 text-xs font-bold text-[#69756e]">{platform.platformAccess ? "All plans" : `${platform.orderCount} orders`}</span></div>
          <div className="mt-7 flex items-end gap-3"><p className="text-3xl font-black tracking-[-.05em]">{formatMoney(platform.platformAccess ? 0 : platform.totalSalesMinor)}</p><span className="mb-1.5 rounded-full bg-[#fff1db] px-2 py-1 text-[10px] font-bold text-[#9b6721]">{platform.platformAccess ? "Billing not connected" : "Live database"}</span></div>
          <div className="dashboard-activity-chart mt-8" aria-label="Products and orders across recent stores">
            <div className="dashboard-chart-grid" aria-hidden="true"><i /><i /><i /><i /></div>
            {recentStores.map((store, index) => { const products = Math.max(4, (store._count.products / peakActivity) * 88); const orders = Math.max(3, (store._count.orders / peakActivity) * 88); return <div className="dashboard-chart-cluster" key={store.id} style={{ "--bar-delay": `${index * 90}ms` } as CSSProperties}><div><span style={{ height: `${products}%` }} /><span style={{ height: `${orders}%` }} /></div><small>{store.name.split(" ")[0]}</small></div>; })}
            {recentStores.length === 0 && <div className="dashboard-chart-empty">Activity will appear when the first store is created.</div>}
          </div>
          <div className="dashboard-chart-legend"><span><i className="products" /> Products</span><span><i className="orders" /> Orders</span></div>
        </article>

        <article className="dashboard-health-card rounded-[24px] bg-[#10231a] p-6 text-white shadow-[0_16px_45px_rgba(16,35,26,.14)]">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-white/45">{platform.platformAccess ? "Network health" : "Store health"}</p><h2 className="mt-2 text-xl font-black">Everything is steady.</h2></div><span className="mt-1 size-2.5 rounded-full bg-[#c9f269] shadow-[0_0_0_5px_rgba(201,242,105,.12)]" /></div>
          <div className="dashboard-health-ring" style={{ "--health": `${networkHealth * 3.6}deg` } as CSSProperties}><div><strong>{networkHealth}%</strong><small>stores active</small></div></div>
          <div className="dashboard-health-list mt-8 space-y-5">
            {[{icon:ShoppingBag,label:'Orders processed',value:String(orderCount)},{icon:Boxes,label:'Products indexed',value:String(productCount)},{icon:Users,label: platform.platformAccess ? 'Platform users' : 'Business members',value:String(platform.users)}].map(({icon:Icon,label,value}) => <div key={label} className="flex items-center gap-4 border-b border-white/10 pb-5 last:border-0"><span className="grid size-10 place-items-center rounded-xl bg-white/8 text-[#c9f269]"><Icon className="size-[18px]" /></span><span className="flex-1 text-sm text-white/60">{label}</span><span className="text-sm font-black">{value}</span></div>)}
          </div>
          <div className="mt-5 rounded-2xl bg-white/[.06] p-4"><div className="flex justify-between text-xs"><span className="text-white/55">Active storefront coverage</span><span className="font-bold text-[#c9f269]">{networkHealth}%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#c9f269]" style={{ width: `${networkHealth}%` }} /></div></div>
        </article>
      </section>

      {recentStores.length > 0 && <section className="dashboard-store-gallery">
        <div className="dashboard-section-title"><div><p>VISUAL STORE NETWORK</p><h2>Brands in motion.</h2></div><Link href="/dashboard/stores">Explore every store <ArrowRight /></Link></div>
        <div className="dashboard-store-track">{recentStores.map((store, index) => <Link href={`/store/${store.slug}` as never} target="_blank" className="dashboard-store-visual" key={store.id} style={{ "--store-image": `url('${verticalImages[store.vertical] ?? verticalImages.MULTI_CATEGORY}')`, "--store-delay": `${index * 110}ms` } as CSSProperties}><span className="dashboard-store-index">0{index + 1}</span><span className="dashboard-store-shade" /><span className="dashboard-store-copy"><small>{store.vertical.replace("_", " ")}</small><strong>{store.name}</strong><em>{store._count.products} products · {store._count.orders} orders</em></span><span className="dashboard-store-open"><ArrowUpRight /></span></Link>)}</div>
      </section>}

      <section className="dashboard-activity-table mt-4 overflow-hidden rounded-[24px] border border-[#e1e6e1] bg-white shadow-[0_10px_35px_rgba(16,35,26,.035)]">
        <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-5 sm:px-6"><div><h2 className="font-black tracking-[-.025em]">Store activity</h2><p className="mt-1 text-xs text-[#87928b]">Your most recently created accessible storefronts</p></div><Link href="/dashboard/stores" className="flex items-center gap-1.5 text-xs font-bold text-[#164b36]">View all <ArrowRight className="size-3.5" /></Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left"><thead><tr className="text-[10px] font-bold uppercase tracking-[.13em] text-[#929c95]"><th className="px-6 py-4">Store</th><th className="px-4 py-4">Vertical</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Products</th><th className="px-4 py-4">Orders</th><th className="px-6 py-4 text-right">Currency</th></tr></thead><tbody>{recentStores.map((store) => <tr key={store.id} className="border-t border-[#edf0ed] text-sm"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#2f493e] text-xs font-black text-white">{store.name.slice(0,2).toUpperCase()}</span><span><span className="block font-bold">{store.name}</span><span className="mt-0.5 block text-[11px] text-[#8a958e]">{store.tenant.name}</span></span></div></td><td className="px-4 py-4 text-[#617067]">{store.vertical.replace('_',' ')}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${store.status === 'ACTIVE' ? 'bg-[#edf5df] text-[#4e7841]' : 'bg-[#fff1db] text-[#9b6721]'}`}>{store.status}</span></td><td className="px-4 py-4 font-bold">{store._count.products}</td><td className="px-4 py-4 text-[#617067]">{store._count.orders}</td><td className="px-6 py-4 text-right text-xs font-bold text-[#4e7841]">{store.currency}</td></tr>)}</tbody></table>
          {recentStores.length === 0 && <p className="border-t border-[#edf0ed] p-8 text-center text-sm text-[#7c8981]">No accessible stores yet.</p>}
        </div>
      </section>
    </div>
  );
}
