import { CheckCircle2, CircleDollarSign, ClipboardList, PackageCheck, Plus, Truck } from "lucide-react";
import { transitionOrderAction } from "@/app/dashboard/commerce-actions";
import { OrderForm } from "@/components/commerce-forms";
import { SectionPage } from "@/components/section-page";
import { getCurrentPermissions } from "@/data/auth";
import { getOrdersWorkspace } from "@/data/commerce";
import { formatMoney } from "@/lib/utils";

const nextStatuses = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
} as const;

export default async function OrdersPage() {
  const [{ stores, orders }, capabilities] = await Promise.all([getOrdersWorkspace(), getCurrentPermissions()]);
  const canManage = capabilities.includes("orders.manage");
  const open = orders.filter(order => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)).length;
  const shipped = orders.filter(order => order.status === "SHIPPED").length;
  const value = orders.filter(order => order.status !== "CANCELLED").reduce((sum, order) => sum + order.totalMinor, 0);

  return <SectionPage eyebrow="Tenant-scoped fulfilment" title="Orders" description="Create manual orders, reserve stock, and move each order through a controlled fulfilment workflow. Every transition is authorised and audited." icon={ClipboardList}>
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={PackageCheck} label="Open orders" value={String(open)} /><Metric icon={Truck} label="Awaiting delivery" value={String(shipped)} /><Metric icon={CircleDollarSign} label="Recorded order value" value={formatMoney(value, orders[0]?.currency ?? "PKR")} /></section>
    {canManage && <details open className="mt-5 rounded-[24px] border border-[#e1e6e1] bg-white p-5 shadow-[0_10px_35px_rgba(16,35,26,.035)] sm:p-6"><summary className="flex cursor-pointer list-none items-center gap-3 font-black"><span className="grid size-9 place-items-center rounded-xl bg-[#e8f1e3] text-[#164b36]"><Plus className="size-4" /></span>Create a manual order</summary><div className="mt-5"><OrderForm stores={stores} /></div></details>}
    <section className="mt-5 space-y-3">{orders.map(order => <article key={order.id} className="rounded-[22px] border border-[#e1e6e1] bg-white p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black">{order.orderNumber}</h2><Status status={order.status} /><span className="text-xs text-[#87938b]">{order.store.name}</span></div><p className="mt-2 text-sm text-[#526158]">{order.customerName || "Customer"} · {order.customerEmail}</p><div className="mt-4 flex flex-wrap gap-2">{order.items.map(item => <span key={item.id} className="rounded-lg bg-[#f3f6f2] px-2.5 py-1.5 text-xs text-[#607067]"><b>{item.quantity}×</b> {item.productName} · {item.variantName}</span>)}</div></div><div className="flex shrink-0 flex-col gap-1 lg:items-end"><p className="text-xl font-black">{formatMoney(order.totalMinor, order.currency)}</p><p className="text-[11px] text-[#87938b]">{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(order.placedAt)}</p></div></div>{canManage && nextStatuses[order.status].length > 0 && <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf0ed] pt-4">{nextStatuses[order.status].map(status => <form action={transitionOrderAction} key={status}><input type="hidden" name="orderId" value={order.id} /><input type="hidden" name="tenantId" value={order.tenantId} /><input type="hidden" name="storeId" value={order.storeId} /><input type="hidden" name="nextStatus" value={status} /><button className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black ${status === "CANCELLED" || status === "REFUNDED" ? "border border-[#eadbd6] bg-white text-[#9b5643]" : "bg-[#164b36] text-white"}`}><CheckCircle2 className="size-3.5" />{status.replace("ED", "ed").replace("ING", "ing")}</button></form>)}</div>}</article>)}{orders.length === 0 && <div className="rounded-[24px] border border-dashed border-[#ccd6cc] bg-white/60 p-12 text-center"><p className="font-bold">No orders yet</p><p className="mt-2 text-sm text-[#7c8981]">Create an active product with stock, then place the first manual order.</p></div>}</section>
  </SectionPage>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]"><Icon className="size-4" /></span><div><p className="text-xs text-[#7c8981]">{label}</p><p className="text-xl font-black">{value}</p></div></div></article>; }
function Status({ status }: { status: string }) { const tone = status === "DELIVERED" ? "bg-[#edf5df] text-[#4e7841]" : status === "CANCELLED" || status === "REFUNDED" ? "bg-[#fff0e9] text-[#a95139]" : status === "SHIPPED" ? "bg-[#e8eff9] text-[#46678d]" : "bg-[#fff1db] text-[#9b6721]"; return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>{status}</span>; }
