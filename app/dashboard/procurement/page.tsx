import { ArrowDownToLine, Clock3, PackageCheck, Truck } from "lucide-react";
import { cancelPurchaseOrderAction, receivePurchaseOrderLineAction, submitPurchaseOrderAction } from "@/app/dashboard/procurement-actions";
import { ProcurementEmptyState, PurchaseOrderForm, SupplierForm } from "@/components/procurement-forms";
import { SectionPage } from "@/components/section-page";
import { getCurrentPermissions } from "@/data/auth";
import { getProcurementWorkspace } from "@/data/procurement";
import { purchaseOrderTotal, remainingQuantity } from "@/lib/procurement";

export default async function ProcurementPage() {
  const [{ stores, suppliers, purchaseOrders, movements }, permissions] = await Promise.all([getProcurementWorkspace(), getCurrentPermissions()]);
  const canAdjust = permissions.includes("inventory.adjust");
  const incomingUnits = purchaseOrders.filter(order => order.status === "ORDERED" || order.status === "PARTIALLY_RECEIVED").flatMap(order => order.lines).reduce((sum, line) => sum + remainingQuantity(line), 0);
  const openOrders = purchaseOrders.filter(order => order.status === "DRAFT" || order.status === "ORDERED" || order.status === "PARTIALLY_RECEIVED").length;

  return <SectionPage eyebrow="Supply chain" title="Suppliers & purchasing" description="Create purchase orders, track incoming stock, receive deliveries, and preserve a permanent stock-movement trail." icon={Truck}>
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={Truck} label="Active suppliers" value={suppliers.length} /><Metric icon={Clock3} label="Open purchase orders" value={openOrders} /><Metric icon={ArrowDownToLine} label="Units still incoming" value={incomingUnits} /></section>

    {canAdjust && <section className="mt-5 grid gap-5 xl:grid-cols-[.75fr_1.25fr]"><Card title="Add supplier" description="Suppliers are isolated to one store and business."><SupplierForm stores={stores} /></Card><Card title="Create purchase order" description="Save a draft first. Incoming stock starts only after submission."><PurchaseOrderForm stores={stores} suppliers={suppliers} /></Card></section>}

    <section className="mt-5 rounded-[24px] border border-[#e1e6e1] bg-white p-5 sm:p-6"><div className="mb-5"><p className="text-lg font-black">Purchase orders</p><p className="text-xs text-[#7c8981]">Partial receipts are supported. Costs update the product variant when stock is received.</p></div>
      {purchaseOrders.length === 0 ? <ProcurementEmptyState /> : <div className="space-y-4">{purchaseOrders.map(order => {
        const total = purchaseOrderTotal(order.lines);
        const active = order.status === "ORDERED" || order.status === "PARTIALLY_RECEIVED";
        return <article key={order.id} className="overflow-hidden rounded-2xl border border-[#e3e8e3]"><div className="flex flex-wrap items-start justify-between gap-3 bg-[#f8faf7] px-4 py-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-black">{order.number}</p><Status value={order.status} /></div><p className="mt-1 text-xs text-[#748078]">{order.store.name} · {order.supplier.name} · {date(order.createdAt)}{order.expectedAt ? ` · expected ${date(order.expectedAt)}` : ""}</p></div><div className="text-right"><p className="font-black">{money(total, order.currency)}</p><p className="text-[11px] text-[#7c8981]">{order.lines.length} line{order.lines.length === 1 ? "" : "s"}</p></div></div>
          <div className="divide-y divide-[#edf0ed]">{order.lines.map(line => { const remaining = remainingQuantity(line); return <div key={line.id} className="grid gap-3 px-4 py-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="text-sm font-black">{line.variant.product.name} · {line.variant.title}</p><p className="mt-1 text-xs text-[#7c8981]">{line.variant.sku} · ordered {line.orderedQuantity} · received {line.receivedQuantity} · {remaining} remaining</p></div><p className="text-sm font-bold">{money(line.unitCostMinor, order.currency)} / unit</p>{canAdjust && active && remaining > 0 ? <form action={receivePurchaseOrderLineAction} className="flex gap-2"><Hidden order={order} /><input type="hidden" name="lineId" value={line.id} /><input aria-label={`Receive quantity for ${line.variant.sku}`} className="h-10 w-24 rounded-xl border border-[#dfe5df] px-3 text-sm" name="quantity" type="number" min="1" max={remaining} defaultValue={remaining} required /><button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#164b36] px-4 text-xs font-black text-white"><PackageCheck className="size-4" /> Receive</button></form> : <span />}</div>; })}</div>
          {canAdjust && (order.status === "DRAFT" || active) && <div className="flex flex-wrap justify-end gap-2 border-t border-[#edf0ed] px-4 py-3">{order.status === "DRAFT" && <form action={submitPurchaseOrderAction}><Hidden order={order} /><button className="rounded-xl bg-[#164b36] px-4 py-2.5 text-xs font-black text-white">Submit to supplier</button></form>}<form action={cancelPurchaseOrderAction}><Hidden order={order} /><button className="rounded-xl border border-[#efcfc4] bg-white px-4 py-2.5 text-xs font-black text-[#a95139]">Cancel order</button></form></div>}
        </article>;
      })}</div>}
    </section>

    <section className="mt-5 rounded-[24px] border border-[#e1e6e1] bg-white p-5 sm:p-6"><p className="text-lg font-black">Stock movement trail</p><p className="mb-4 text-xs text-[#7c8981]">Newest movements first. These records cannot be edited from the dashboard.</p>{movements.length === 0 ? <p className="rounded-xl bg-[#f7f9f6] p-5 text-sm text-[#7c8981]">Movements will appear after a manual adjustment or purchase receipt.</p> : <div className="divide-y divide-[#edf0ed]">{movements.map(movement => <div key={movement.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]"><div><p className="font-black">{movement.quantity > 0 ? "+" : ""}{movement.quantity} · {movement.variant.product.name} · {movement.variant.sku}</p><p className="text-xs text-[#7c8981]">{movement.store.name} · {movement.type.replaceAll("_", " ").toLowerCase()} · {movement.note ?? "No note"}</p></div><p className="text-xs text-[#7c8981]">{dateTime(movement.createdAt)} · {movement.actor?.name ?? "System"}</p></div>)}</div>}</section>
  </SectionPage>;
}

function Hidden({ order }: { order: { id: string; tenantId: string; storeId: string } }) { return <><input type="hidden" name="purchaseOrderId" value={order.id} /><input type="hidden" name="tenantId" value={order.tenantId} /><input type="hidden" name="storeId" value={order.storeId} /></>; }
function Card({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <article className="rounded-[24px] border border-[#e1e6e1] bg-white p-5 sm:p-6"><p className="text-lg font-black">{title}</p><p className="mb-5 text-xs text-[#7c8981]">{description}</p>{children}</article>; }
function Metric({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: number }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#edf3e9] text-[#164b36]"><Icon className="size-4" /></span><div><p className="text-xs text-[#7c8981]">{label}</p><p className="text-xl font-black">{value}</p></div></div></article>; }
function Status({ value }: { value: string }) { const tone = value === "RECEIVED" ? "bg-[#edf5df] text-[#4e7841]" : value === "CANCELLED" ? "bg-[#fff0e9] text-[#a95139]" : value === "DRAFT" ? "bg-[#eef1ef] text-[#667169]" : "bg-[#fff8df] text-[#806b2c]"; return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${tone}`}>{value.replaceAll("_", " ")}</span>; }
function money(value: number, currency: string) { return new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 2 }).format(value / 100); }
function date(value: Date) { return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(value); }
function dateTime(value: Date) { return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeStyle: "short" }).format(value); }
