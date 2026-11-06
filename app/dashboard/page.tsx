import { ArrowRight, ArrowUpRight, Boxes, Building2, CircleAlert, Plus, ShoppingBag, Store, Users } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";
import { getPlatformStats, listStores } from "@/data/platform";
import { getDashboardWorkspace, requireUser } from "@/data/auth";

export default async function DashboardPage() {
  const [platform, user, accessibleStores, workspace] = await Promise.all([getPlatformStats(), requireUser(), listStores(), getDashboardWorkspace()]);
  const recentStores = accessibleStores.slice(0, 4);
  const productCount = accessibleStores.reduce((total, store) => total + store._count.products, 0);
  const orderCount = accessibleStores.reduce((total, store) => total + store._count.orders, 0);
  const stats = [
    { label: platform.platformAccess ? "Monthly recurring revenue" : "Recorded sales", value: formatMoney(platform.platformAccess ? 0 : platform.totalSalesMinor), change: platform.platformAccess ? "Billing begins after launch" : `${platform.orderCount} orders recorded`, icon: ArrowUpRight, positive: true },
    { label: platform.platformAccess ? "Active businesses" : "Your business", value: String(platform.businesses), change: platform.platformAccess ? "Database verified" : workspace.name, icon: Building2, positive: true },
    { label: "Live and draft stores", value: String(platform.stores), change: platform.platformAccess ? "Across all tenants" : `Owned by ${workspace.name}`, icon: Store, positive: true },
    { label: platform.platformAccess ? "Pending invitations" : "Active products", value: String(platform.platformAccess ? platform.pendingInvitations : platform.productCount), change: platform.platformAccess ? `${platform.users} platform users` : `${platform.users} business members`, icon: CircleAlert, positive: platform.pendingInvitations === 0 },
  ];
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#87938b]">Wednesday, 29 October</p><h1 className="mt-2 text-3xl font-black tracking-[-.05em] text-[#10231a] sm:text-4xl">Good morning, {user.name.split(" ")[0]}.</h1><p className="mt-2 text-sm text-[#6f7b73]">{platform.platformAccess ? "Here is what is happening across your commerce network." : `Here is what is happening inside ${workspace.name}.`}</p></div>
        {platform.platformAccess ? <Link href="/dashboard/businesses/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#164b36] px-4 py-3 text-sm font-bold text-white shadow-[0_9px_24px_rgba(22,75,54,.18)] transition hover:-translate-y-0.5"><Plus className="size-4" /> Create business</Link> : workspace.storefront && <Link href={(workspace.storefront.status === "ACTIVE" ? `/store/${workspace.storefront.slug}` : `/preview/${workspace.storefront.id}`) as never} target="_blank" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#164b36] px-4 py-3 text-sm font-bold text-white shadow-[0_9px_24px_rgba(22,75,54,.18)] transition hover:-translate-y-0.5">View public website <ArrowUpRight className="size-4" /></Link>}
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({label, value, change, icon: Icon, positive}, i) => (
          <article key={label} className={`animate-enter delay-${i} rounded-[22px] border border-[#e1e6e1] bg-white p-5 shadow-[0_10px_35px_rgba(16,35,26,.035)]`}>
            <div className="flex items-start justify-between"><p className="text-xs font-semibold text-[#7c8880]">{label}</p><span className={`grid size-8 place-items-center rounded-xl ${positive ? 'bg-[#edf5df] text-[#4b7739]' : 'bg-[#fff0e9] text-[#c15d3c]'}`}><Icon className="size-4" /></span></div>
            <p className="mt-6 text-[28px] font-black tracking-[-.05em]">{value}</p>
            <p className={`mt-2 text-xs font-bold ${positive ? 'text-[#4f7b43]' : 'text-[#bd6244]'}`}>{change}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.8fr]">
        <article className="rounded-[24px] border border-[#e1e6e1] bg-white p-5 shadow-[0_10px_35px_rgba(16,35,26,.035)] sm:p-6">
          <div className="flex items-start justify-between"><div><h2 className="font-black tracking-[-.025em]">{platform.platformAccess ? "Platform revenue" : `${workspace.name} sales`}</h2><p className="mt-1 text-xs text-[#87928b]">{platform.platformAccess ? "Subscription revenue · Last 12 months" : "Order value recorded across your stores"}</p></div><span className="rounded-xl border border-[#e1e6e1] px-3 py-2 text-xs font-bold text-[#69756e]">{platform.platformAccess ? "All plans" : `${platform.orderCount} orders`}</span></div>
          <div className="mt-7 flex items-end gap-3"><p className="text-3xl font-black tracking-[-.05em]">{formatMoney(platform.platformAccess ? 0 : platform.totalSalesMinor)}</p><span className="mb-1.5 rounded-full bg-[#fff1db] px-2 py-1 text-[10px] font-bold text-[#9b6721]">{platform.platformAccess ? "Billing not connected" : "Live database"}</span></div>
          <div className="mt-8 flex h-48 items-end gap-2 sm:gap-3">
            {[6,6,6,6,6,6,6,6,6,6,6,6].map((height, i) => <div key={i} className="group relative flex h-full flex-1 items-end"><div className={`w-full rounded-t-md transition group-hover:bg-[#c9f269] ${i === 11 ? 'bg-[#164b36]' : 'bg-[#dce8d6]'}`} style={{height: `${height}%`}} /></div>)}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-semibold text-[#929c95]"><span>Nov</span><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Oct</span></div>
        </article>

        <article className="rounded-[24px] bg-[#10231a] p-6 text-white shadow-[0_16px_45px_rgba(16,35,26,.14)]">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-white/45">{platform.platformAccess ? "Network health" : "Store health"}</p><h2 className="mt-2 text-xl font-black">Everything is steady.</h2></div><span className="mt-1 size-2.5 rounded-full bg-[#c9f269] shadow-[0_0_0_5px_rgba(201,242,105,.12)]" /></div>
          <div className="mt-8 space-y-5">
            {[{icon:ShoppingBag,label:'Orders processed',value:String(orderCount)},{icon:Boxes,label:'Products indexed',value:String(productCount)},{icon:Users,label: platform.platformAccess ? 'Platform users' : 'Business members',value:String(platform.users)}].map(({icon:Icon,label,value}) => <div key={label} className="flex items-center gap-4 border-b border-white/10 pb-5 last:border-0"><span className="grid size-10 place-items-center rounded-xl bg-white/8 text-[#c9f269]"><Icon className="size-[18px]" /></span><span className="flex-1 text-sm text-white/60">{label}</span><span className="text-sm font-black">{value}</span></div>)}
          </div>
          <div className="mt-5 rounded-2xl bg-white/[.06] p-4"><div className="flex justify-between text-xs"><span className="text-white/55">Platform capacity</span><span className="font-bold text-[#c9f269]">28%</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[28%] rounded-full bg-[#c9f269]" /></div></div>
        </article>
      </section>

      <section className="mt-4 overflow-hidden rounded-[24px] border border-[#e1e6e1] bg-white shadow-[0_10px_35px_rgba(16,35,26,.035)]">
        <div className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-5 sm:px-6"><div><h2 className="font-black tracking-[-.025em]">Store activity</h2><p className="mt-1 text-xs text-[#87928b]">Your most recently created accessible storefronts</p></div><Link href="/dashboard/stores" className="flex items-center gap-1.5 text-xs font-bold text-[#164b36]">View all <ArrowRight className="size-3.5" /></Link></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left"><thead><tr className="text-[10px] font-bold uppercase tracking-[.13em] text-[#929c95]"><th className="px-6 py-4">Store</th><th className="px-4 py-4">Vertical</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Products</th><th className="px-4 py-4">Orders</th><th className="px-6 py-4 text-right">Currency</th></tr></thead><tbody>{recentStores.map((store) => <tr key={store.id} className="border-t border-[#edf0ed] text-sm"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#2f493e] text-xs font-black text-white">{store.name.slice(0,2).toUpperCase()}</span><span><span className="block font-bold">{store.name}</span><span className="mt-0.5 block text-[11px] text-[#8a958e]">{store.tenant.name}</span></span></div></td><td className="px-4 py-4 text-[#617067]">{store.vertical.replace('_',' ')}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${store.status === 'ACTIVE' ? 'bg-[#edf5df] text-[#4e7841]' : 'bg-[#fff1db] text-[#9b6721]'}`}>{store.status}</span></td><td className="px-4 py-4 font-bold">{store._count.products}</td><td className="px-4 py-4 text-[#617067]">{store._count.orders}</td><td className="px-6 py-4 text-right text-xs font-bold text-[#4e7841]">{store.currency}</td></tr>)}</tbody></table>
          {recentStores.length === 0 && <p className="border-t border-[#edf0ed] p-8 text-center text-sm text-[#7c8981]">No accessible stores yet.</p>}
        </div>
      </section>
    </div>
  );
}
