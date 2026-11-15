import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, BarChart3, Boxes, CircleDollarSign, Download, PackageCheck, ReceiptText, ShoppingBag, TrendingUp } from "lucide-react";
import { SectionPage } from "@/components/section-page";
import { getAnalyticsWorkspace } from "@/data/analytics";
import { getCurrentPermissions } from "@/data/auth";
import { parseReportRange, reportRanges, type ReportRange } from "@/lib/reporting";

const rangeLabels: Record<ReportRange, string> = { "30d": "30 days", "90d": "90 days", "12m": "12 months", all: "All time" };
const exportOptions = [
  { resource: "orders", label: "Orders" },
  { resource: "customers", label: "Customers" },
  { resource: "catalog", label: "Catalog" },
  { resource: "inventory", label: "Inventory" },
] as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseReportRange((await searchParams).range);
  const [data, capabilities] = await Promise.all([getAnalyticsWorkspace(range), getCurrentPermissions()]);
  const canExport = capabilities.includes("customers.export");
  const money = (minor: number) => new Intl.NumberFormat(data.currency === "PKR" ? "en-PK" : "en-US", { style: "currency", currency: data.currency, maximumFractionDigits: 0 }).format(minor / 100);
  const maxTrend = Math.max(...data.trend.map(item => item.valueMinor), 1);
  const maxStatus = Math.max(...data.statuses.map(item => item.count), 1);

  return <SectionPage eyebrow="Commerce intelligence" title="Analytics" description="Measure revenue, estimated profit, order flow and inventory health without crossing merchant boundaries." icon={BarChart3}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dfe6df] bg-white p-3">
      <div className="flex flex-wrap gap-1.5">{reportRanges.map(item => <Link key={item} href={`/dashboard/analytics?range=${item}` as never} className={`rounded-xl px-4 py-2.5 text-xs font-black transition ${range === item ? "bg-[#123d2d] text-white shadow-sm" : "text-[#65736a] hover:bg-[#f1f5ef]"}`}>{rangeLabels[item]}</Link>)}</div>
      <p className="px-2 text-[11px] font-bold text-[#829087]">Reporting period · {rangeLabels[range]}</p>
    </div>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric icon={CircleDollarSign} label="Net merchandise sales" value={money(data.netMerchandiseMinor)} note={`${data.growth >= 0 ? "+" : ""}${data.growth}% in the latest period`} positive={data.growth >= 0} />
      <Metric icon={TrendingUp} label="Estimated gross profit" value={money(data.profitMinor)} note={`${data.marginPercent}% margin · ${data.costCoveragePercent}% cost coverage`} positive={data.profitMinor >= 0} />
      <Metric icon={ReceiptText} label="Orders" value={String(data.orderCount)} note={`${data.delivered} delivered · ${money(data.averageOrderMinor)} average`} />
      <Metric icon={Boxes} label="Available units" value={data.availableStock.toLocaleString()} note={`${data.lowStock} low-stock SKU${data.lowStock === 1 ? "" : "s"}`} positive={data.lowStock === 0} />
    </section>

    {data.costCoveragePercent < 100 && <div className="mt-4 rounded-2xl border border-[#ead9bd] bg-[#fff8e9] px-5 py-4 text-xs leading-5 text-[#785b2c]"><strong>Profit is an estimate.</strong> Add a cost price to every sold product variant for complete margin reporting. Current cost coverage is {data.costCoveragePercent}%.</div>}

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_1fr]">
      <article className="rounded-[28px] border border-[#dfe6df] bg-white p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#87938b]">{rangeLabels[range]} performance</p><h2 className="mt-2 text-xl font-black">Revenue momentum</h2></div><span className="rounded-full bg-[#edf5df] px-3 py-2 text-xs font-black text-[#426b38]">{data.currency}</span></div>
        <div className="mt-8 flex h-64 items-end gap-2 sm:gap-4">{data.trend.map(period => <div key={period.key} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex flex-1 items-end"><div className="w-full rounded-t-xl bg-gradient-to-t from-[#164b36] to-[#92bd67] transition hover:brightness-110" style={{ height: `${Math.max(period.valueMinor ? 6 : 1, period.valueMinor / maxTrend * 100)}%` }}><span className="absolute bottom-[calc(100%+8px)] left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0c2b1f] px-2 py-1 text-[9px] font-bold text-white group-hover:block">{money(period.valueMinor)} · {period.orders} orders</span></div></div><p className="mt-3 truncate text-center text-[10px] font-bold text-[#7e8a82]">{period.label}</p></div>)}</div>
      </article>
      <article className="rounded-[28px] bg-[#0c2b1f] p-5 text-white sm:p-7"><PackageCheck className="size-6 text-[#c5f45b]" /><p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-[#8da69a]">Order pipeline</p><h2 className="mt-2 text-xl font-black">Fulfilment pulse</h2><div className="mt-6 space-y-4">{data.statuses.map(item => <div key={item.status}><div className="mb-2 flex justify-between text-xs"><span className="font-bold capitalize">{item.status.toLowerCase()}</span><span className="text-[#b7cabf]">{item.count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#c5f45b]" style={{ width: `${item.count / maxStatus * 100}%` }} /></div></div>)}</div></article>
    </section>

    <section className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
      <article className="rounded-[28px] border border-[#dfe6df] bg-white p-5 sm:p-7"><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#87938b]">Product performance</p><h2 className="mt-2 text-xl font-black">Top-selling products</h2>{data.topProducts.length ? <div className="mt-6 divide-y divide-[#edf0ed]">{data.topProducts.map((product, index) => <div key={product.name} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 py-4"><span className="grid size-8 place-items-center rounded-xl bg-[#edf3e9] text-xs font-black text-[#164b36]">{index + 1}</span><div><p className="font-black">{product.name}</p><p className="mt-1 text-xs text-[#7b877f]">{product.quantity} unit{product.quantity === 1 ? "" : "s"} sold</p></div><p className="text-sm font-black">{money(product.revenueMinor)}</p></div>)}</div> : <Empty />}</article>
      <article className="rounded-[28px] border border-[#dfe6df] bg-[#f7faf5] p-5 sm:p-7"><Boxes className="size-6 text-[#164b36]" /><p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-[#87938b]">Stock signal</p><p className="mt-2 text-4xl font-black tracking-[-.05em]">{data.lowStock}</p><p className="mt-2 text-sm font-bold">SKUs at or below reorder level</p><p className="mt-4 text-xs leading-5 text-[#718078]">Inventory uses available stock after reservations, so merchants can replenish before orders are affected.</p></article>
    </section>

    {canExport && <section className="mt-5 rounded-[28px] border border-[#dfe6df] bg-white p-5 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#87938b]">Data ownership</p><h2 className="mt-2 text-xl font-black">Download business records</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-[#718078]">Exports contain only the stores your account is allowed to access. Order exports follow the selected reporting period.</p></div><span className="rounded-full bg-[#edf5df] px-3 py-2 text-[10px] font-black text-[#426b38]">CSV · spreadsheet ready</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{exportOptions.map(item => <a key={item.resource} href={`/api/exports/${item.resource}?range=${range}`} className="group flex items-center justify-between rounded-2xl border border-[#dfe6df] bg-[#f8faf7] p-4 text-sm font-black transition hover:-translate-y-0.5 hover:border-[#a9c49a] hover:bg-[#eff5eb]"><span>{item.label}</span><Download className="size-4 text-[#567a4b] transition group-hover:translate-y-0.5" /></a>)}</div></section>}
  </SectionPage>;
}

function Metric({ icon: Icon, label, value, note, positive }: { icon: typeof BarChart3; label: string; value: string; note: string; positive?: boolean }) { const Trend = positive === false ? ArrowDownRight : ArrowUpRight; return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-5"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]"><Icon className="size-4" /></span>{positive !== undefined && <Trend className={`size-4 ${positive ? "text-[#5c8d4d]" : "text-[#b65a45]"}`} />}</div><p className="mt-5 text-xs font-bold text-[#7c8981]">{label}</p><p className="mt-2 truncate text-2xl font-black tracking-[-.04em]">{value}</p><p className="mt-2 text-[11px] text-[#718078]">{note}</p></article>; }
function Empty() { return <div className="mt-6 rounded-2xl border border-dashed border-[#d5ddd5] p-10 text-center"><ShoppingBag className="mx-auto size-5 text-[#99a39c]" /><p className="mt-3 text-sm font-bold">Sales insights will appear after the first order.</p></div>; }
