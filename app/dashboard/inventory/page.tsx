import { AlertTriangle, Boxes, PackageCheck, Warehouse } from "lucide-react";
import { InventoryAdjustmentForm } from "@/components/commerce-forms";
import { SectionPage } from "@/components/section-page";
import { getCurrentPermissions } from "@/data/auth";
import { getInventoryWorkspace } from "@/data/commerce";

export default async function InventoryPage() {
  const [{ items }, capabilities] = await Promise.all([getInventoryWorkspace(), getCurrentPermissions()]);
  const canAdjust = capabilities.includes("inventory.adjust");
  const onHand = items.reduce((sum, item) => sum + item.onHand, 0);
  const reserved = items.reduce((sum, item) => sum + item.reserved, 0);
  const lowStock = items.filter(item => item.onHand - item.reserved <= item.reorderPoint).length;

  return <SectionPage eyebrow="Stock control" title="Inventory" description="Track available, reserved, incoming, and reorder quantities. Every stock correction requires a reason and creates an audit event." icon={Warehouse}>
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={PackageCheck} label="Units on hand" value={onHand} /><Metric icon={Boxes} label="Reserved by orders" value={reserved} /><Metric icon={AlertTriangle} label="At or below reorder" value={lowStock} alert={lowStock > 0} /></section>
    <section className="mt-5 overflow-hidden rounded-[24px] border border-[#e1e6e1] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[1040px] text-left"><thead><tr className="text-[10px] font-bold uppercase tracking-[.13em] text-[#929c95]"><th className="px-5 py-4">Product / SKU</th><th className="px-4 py-4">Store</th><th className="px-4 py-4">On hand</th><th className="px-4 py-4">Reserved</th><th className="px-4 py-4">Available</th><th className="px-4 py-4">Incoming</th><th className="px-4 py-4">Reorder</th><th className="px-5 py-4">Adjustment</th></tr></thead><tbody>{items.map(item => { const available = item.onHand - item.reserved; const low = available <= item.reorderPoint; return <tr key={item.id} className="border-t border-[#edf0ed] align-top text-sm"><td className="px-5 py-4"><p className="font-black">{item.variant.product.name}</p><p className="mt-1 text-[11px] text-[#7c8981]">{item.variant.sku} · {item.variant.title} · {item.locationKey}</p></td><td className="px-4 py-4 text-[#607067]">{item.store.name}</td><td className="px-4 py-4 font-black">{item.onHand}</td><td className="px-4 py-4">{item.reserved}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-black ${low ? "bg-[#fff0e9] text-[#ae573f]" : "bg-[#edf5df] text-[#4e7841]"}`}>{available}</span></td><td className="px-4 py-4">{item.incoming}</td><td className="px-4 py-4">{item.reorderPoint}</td><td className="px-5 py-4">{canAdjust ? <InventoryAdjustmentForm item={item} /> : <span className="text-xs text-[#8a958e]">View only</span>}</td></tr>; })}</tbody></table>{items.length === 0 && <p className="p-12 text-center text-sm text-[#7c8981]">Inventory appears automatically when the first product variant is created.</p>}</div></section>
  </SectionPage>;
}

function Metric({ icon: Icon, label, value, alert = false }: { icon: typeof Boxes; label: string; value: number; alert?: boolean }) { return <article className="rounded-2xl border border-[#e1e6e1] bg-white p-4"><div className="flex items-center gap-3"><span className={`grid size-9 place-items-center rounded-xl ${alert ? "bg-[#fff0e9] text-[#b25940]" : "bg-[#edf3e9] text-[#164b36]"}`}><Icon className="size-4" /></span><div><p className="text-xs text-[#7c8981]">{label}</p><p className="text-xl font-black">{value}</p></div></div></article>; }
