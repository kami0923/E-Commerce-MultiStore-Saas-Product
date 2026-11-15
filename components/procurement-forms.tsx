"use client";

import { Minus, Plus, Save, Truck } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { createPurchaseOrderAction, createSupplierAction } from "@/app/dashboard/procurement-actions";
import type { CommerceModuleState } from "@/app/dashboard/commerce-actions";

const initialState: CommerceModuleState = { status: "idle" };
const input = "h-11 w-full rounded-xl border border-[#dfe5df] bg-white px-3.5 text-sm outline-none transition focus:border-[#7fa27d] focus:ring-4 focus:ring-[#c9f269]/20";
const label = "space-y-1.5 text-xs font-bold text-[#526158]";

function Message({ state }: { state: CommerceModuleState }) {
  const errors = state.errors ? Object.values(state.errors).flat() : [];
  if (!state.message && errors.length === 0) return null;
  return <div className={`rounded-xl px-3.5 py-3 text-xs font-semibold ${state.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{state.message}{errors.map(error => <p key={error}>{error}</p>)}</div>;
}

type StoreOption = { id: string; tenantId: string; name: string; currency: string; tenant: { name: string }; products: { name: string; variants: { id: string; sku: string; title: string; costMinor: number | null }[] }[] };
type SupplierOption = { id: string; storeId: string; name: string };

export function SupplierForm({ stores }: { stores: StoreOption[] }) {
  const [state, action, pending] = useActionState(createSupplierAction, initialState);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const store = stores.find(item => item.id === storeId);
  return <form action={action} className="space-y-4">
    <input type="hidden" name="tenantId" value={store?.tenantId ?? ""} />
    <label className={label}>Store<select className={input} name="storeId" value={storeId} onChange={event => setStoreId(event.target.value)} required>{stores.map(item => <option key={item.id} value={item.id}>{item.tenant.name} · {item.name}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Supplier name<input className={input} name="name" placeholder="Northstar Wholesale" required /></label><label className={label}>Email<input className={input} name="email" type="email" placeholder="orders@supplier.com" /></label><label className={label}>Phone<input className={input} name="phone" placeholder="+92 300 0000000" /></label><label className={label}>Internal note<input className={input} name="notes" placeholder="Account or delivery notes" /></label></div>
    <Message state={state} /><button disabled={pending || !store} className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#cad5ca] bg-white px-5 text-sm font-black text-[#164b36] disabled:opacity-50"><Plus className="size-4" />{pending ? "Adding…" : "Add supplier"}</button>
  </form>;
}

export function PurchaseOrderForm({ stores, suppliers }: { stores: StoreOption[]; suppliers: SupplierOption[] }) {
  const [state, action, pending] = useActionState(createPurchaseOrderAction, initialState);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [rows, setRows] = useState([0]);
  const store = stores.find(item => item.id === storeId);
  const variants = useMemo(() => store?.products.flatMap(product => product.variants.map(variant => ({ ...variant, productName: product.name }))) ?? [], [store]);
  const storeSuppliers = suppliers.filter(supplier => supplier.storeId === storeId);
  return <form action={action} className="space-y-5">
    <input type="hidden" name="tenantId" value={store?.tenantId ?? ""} />
    <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Store<select className={input} name="storeId" value={storeId} onChange={event => setStoreId(event.target.value)} required>{stores.map(item => <option key={item.id} value={item.id}>{item.tenant.name} · {item.name}</option>)}</select></label><label className={label}>Supplier<select className={input} name="supplierId" required defaultValue=""><option value="" disabled>Select supplier</option>{storeSuppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></label><label className={label}>Expected date<input className={input} name="expectedAt" type="date" /></label><label className={label}>Internal note<input className={input} name="notes" placeholder="Delivery or purchasing instructions" /></label></div>
    <div className="rounded-2xl bg-[#f6f8f5] p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#7e8b82]">Purchase lines</p><p className="mt-1 text-[11px] text-[#8a958e]">Costs are entered in {store?.currency ?? "store currency"}.</p></div><button type="button" onClick={() => setRows(current => [...current, (current.at(-1) ?? 0) + 1])} className="inline-flex items-center gap-1 text-xs font-black text-[#164b36]"><Plus className="size-3.5" /> Add line</button></div>
      <div className="space-y-2">{rows.map((row, index) => <div key={row} className="grid gap-2 sm:grid-cols-[1fr_110px_130px_auto]"><select aria-label={`Product ${index + 1}`} className={input} name="variantId" required defaultValue=""><option value="" disabled>Select product variant</option>{variants.map(variant => <option key={variant.id} value={variant.id}>{variant.productName} · {variant.title} · {variant.sku}</option>)}</select><input aria-label={`Quantity ${index + 1}`} className={input} name="quantity" type="number" min="1" defaultValue="1" required /><input aria-label={`Unit cost ${index + 1}`} className={input} name="unitCost" type="number" min="0" step="0.01" placeholder="Unit cost" required /><button type="button" aria-label="Remove line" disabled={rows.length === 1} onClick={() => setRows(current => current.filter(value => value !== row))} className="grid size-11 place-items-center rounded-xl border border-[#dfe5df] bg-white text-[#8c5d50] disabled:opacity-30"><Minus className="size-4" /></button></div>)}</div>
    </div>
    {storeSuppliers.length === 0 && <p className="rounded-xl bg-[#fff8df] px-4 py-3 text-xs font-semibold text-[#806b2c]">Add a supplier for this store before creating a purchase order.</p>}
    <Message state={state} /><button disabled={pending || !store || storeSuppliers.length === 0 || variants.length === 0} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white disabled:opacity-50"><Save className="size-4" />{pending ? "Saving…" : "Save purchase order draft"}</button>
  </form>;
}

export function ProcurementEmptyState() {
  return <div className="rounded-2xl border border-dashed border-[#cdd7cd] bg-[#f8faf7] p-8 text-center"><Truck className="mx-auto size-6 text-[#63816f]" /><p className="mt-3 text-sm font-black">No purchase orders yet</p><p className="mt-1 text-xs text-[#7c8981]">Add a supplier, create a draft, then submit it to record incoming stock.</p></div>;
}
