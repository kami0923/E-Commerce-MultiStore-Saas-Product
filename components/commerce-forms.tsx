"use client";

import { Minus, Plus, Save, SlidersHorizontal } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import {
  adjustInventoryAction,
  addVariantAction,
  createCategoryAction,
  createOrderAction,
  createProductAction,
  type CommerceModuleState,
} from "@/app/dashboard/commerce-actions";

const initialState: CommerceModuleState = { status: "idle" };
const input = "h-11 w-full rounded-xl border border-[#dfe5df] bg-white px-3.5 text-sm outline-none transition focus:border-[#7fa27d] focus:ring-4 focus:ring-[#c9f269]/20";
const label = "space-y-1.5 text-xs font-bold text-[#526158]";

function ActionMessage({ state }: { state: CommerceModuleState }) {
  if (state.status === "idle" && !state.errors) return null;
  const errors = state.errors ? Object.values(state.errors).flat() : [];
  return <div aria-live="polite" className={`rounded-xl px-3.5 py-3 text-xs font-semibold ${state.status === "success" ? "bg-[#edf5df] text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{state.message}{errors.map(error => <p key={error}>{error}</p>)}</div>;
}

type StoreOption = { id: string; tenantId: string; name: string; currency: string; tenant: { name: string } };
type CategoryOption = { id: string; storeId: string; name: string; store: { name: string } };
type MediaOption = { id: string; storeId: string; url: string; originalName: string; altText: string | null };

export function ProductForm({ stores, categories, mediaAssets }: { stores: StoreOption[]; categories: CategoryOption[]; mediaAssets: MediaOption[] }) {
  const [state, action, pending] = useActionState(createProductAction, initialState);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const selectedStore = stores.find(store => store.id === storeId);
  const storeCategories = categories.filter(category => category.storeId === storeId);
  const storeMedia = mediaAssets.filter(asset => asset.storeId === storeId);

  return <form action={action} className="space-y-4">
    <input type="hidden" name="tenantId" value={selectedStore?.tenantId ?? ""} />
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={label}>Store<select className={input} name="storeId" value={storeId} onChange={event => setStoreId(event.target.value)} required>{stores.map(store => <option key={store.id} value={store.id}>{store.tenant.name} · {store.name}</option>)}</select></label>
      <label className={label}>Status<select className={input} name="status" defaultValue="ACTIVE"><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option></select></label>
      <label className={label}>Product name<input className={input} name="name" placeholder="Essential linen shirt" required /></label>
      <label className={label}>Brand<input className={input} name="brand" placeholder="Brand or collection" /></label>
      <label className={label}>Product type<input className={input} name="productType" placeholder="Shirt, sneaker, serum…" /></label>
      <label className={label}>Category<select className={input} name="categoryId" defaultValue=""><option value="">Uncategorised</option>{storeCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className={`${label} sm:col-span-2`}>Description<textarea className={`${input} min-h-24 py-3`} name="description" placeholder="Material, fit, care, ingredients or product details" /></label>
    </div>
    <div className="rounded-2xl border border-[#e4e9e3] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#7e8b82]">Product gallery</p><p className="mt-1 text-[11px] text-[#8a958e]">Select up to 8 images. The first selected image becomes the cover.</p></div></div>{storeMedia.length > 0 ? <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">{storeMedia.map(asset => <label key={asset.id} className="group relative cursor-pointer"><input className="peer sr-only" type="checkbox" name="mediaId" value={asset.id} /><span className="block aspect-square overflow-hidden rounded-xl border-2 border-transparent bg-[#edf1ec] peer-checked:border-[#164b36] peer-checked:ring-4 peer-checked:ring-[#c9f269]/30"><span className="block size-full bg-cover bg-center transition group-hover:scale-105" style={{ backgroundImage: `url('${asset.url}')` }} /></span><span className="mt-1 block truncate text-[9px] text-[#7c8981]">{asset.originalName}</span></label>)}</div> : <p className="mt-4 rounded-xl bg-[#f5f7f4] p-4 text-xs text-[#7c8981]">Upload images in the Media library, then return here to build the product gallery.</p>}</div>
    <div className="rounded-2xl bg-[#f6f8f5] p-4"><p className="mb-3 text-xs font-black uppercase tracking-[.14em] text-[#7e8b82]">First variant</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className={label}>Variant title<input className={input} name="variantTitle" defaultValue="Default" required /></label>
      <label className={label}>SKU<input className={input} name="sku" placeholder="SHIRT-BLK-M" required /></label>
      <label className={label}>Selling price ({selectedStore?.currency ?? "PKR"})<input className={input} name="price" type="number" min="0" step="0.01" required /></label>
      <label className={label}>Cost price<input className={input} name="cost" type="number" min="0" step="0.01" /></label>
      <label className={label}>Opening stock<input className={input} name="initialStock" type="number" min="0" defaultValue="0" required /></label>
      <label className={label}>Reorder point<input className={input} name="reorderPoint" type="number" min="0" defaultValue="5" required /></label>
    </div></div>
    <ActionMessage state={state} />
    <button disabled={pending || stores.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white disabled:opacity-50"><Save className="size-4" />{pending ? "Adding product…" : "Add product"}</button>
  </form>;
}

export function CategoryForm({ stores, categories }: { stores: StoreOption[]; categories: CategoryOption[] }) {
  const [state, action, pending] = useActionState(createCategoryAction, initialState);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const selectedStore = stores.find(store => store.id === storeId);
  return <form action={action} className="space-y-4">
    <input type="hidden" name="tenantId" value={selectedStore?.tenantId ?? ""} />
    <label className={label}>Store<select className={input} name="storeId" value={storeId} onChange={event => setStoreId(event.target.value)} required>{stores.map(store => <option key={store.id} value={store.id}>{store.tenant.name} · {store.name}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Category name<input className={input} name="name" placeholder="Summer essentials" required /></label><label className={label}>Parent category<select className={input} name="parentId" defaultValue=""><option value="">Top level</option>{categories.filter(category => category.storeId === storeId).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
    <label className={label}>Description<textarea className={`${input} min-h-20 py-3`} name="description" placeholder="Optional internal category note" /></label>
    <ActionMessage state={state} />
    <button disabled={pending || stores.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cad5ca] bg-white px-5 text-sm font-black text-[#164b36] disabled:opacity-50"><Plus className="size-4" />{pending ? "Adding…" : "Add category"}</button>
  </form>;
}

export function VariantForm({ products }: { products: { id: string; tenantId: string; storeId: string; name: string; store: { name: string; currency: string } }[] }) {
  const [state, action, pending] = useActionState(addVariantAction, initialState);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const product = products.find(item => item.id === productId);
  return <form action={action} className="space-y-4">
    <input type="hidden" name="tenantId" value={product?.tenantId ?? ""} /><input type="hidden" name="storeId" value={product?.storeId ?? ""} />
    <label className={label}>Product<select className={input} name="productId" value={productId} onChange={event => setProductId(event.target.value)} required>{products.map(item => <option key={item.id} value={item.id}>{item.store.name} · {item.name}</option>)}</select></label>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className={label}>Variant title<input className={input} name="title" placeholder="Black / Medium" required /></label><label className={label}>SKU<input className={input} name="sku" placeholder="ITEM-BLK-M" required /></label><label className={label}>Price ({product?.store.currency ?? "PKR"})<input className={input} name="price" type="number" min="0" step="0.01" required /></label><label className={label}>Cost price<input className={input} name="cost" type="number" min="0" step="0.01" /></label><label className={label}>Opening stock<input className={input} name="initialStock" type="number" min="0" defaultValue="0" required /></label><label className={label}>Reorder point<input className={input} name="reorderPoint" type="number" min="0" defaultValue="5" required /></label></div>
    <ActionMessage state={state} />
    <button disabled={pending || products.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cad5ca] bg-white px-5 text-sm font-black text-[#164b36] disabled:opacity-50"><Plus className="size-4" />{pending ? "Adding variant…" : "Add variant"}</button>
  </form>;
}

export function InventoryAdjustmentForm({ item }: { item: { id: string; tenantId: string; storeId: string } }) {
  const [state, action, pending] = useActionState(adjustInventoryAction, initialState);
  return <form action={action} className="grid min-w-[360px] grid-cols-[90px_1fr_auto] gap-2">
    <input type="hidden" name="inventoryId" value={item.id} /><input type="hidden" name="tenantId" value={item.tenantId} /><input type="hidden" name="storeId" value={item.storeId} />
    <input aria-label="Stock adjustment" className={input} name="delta" type="number" placeholder="+ / −" required />
    <input aria-label="Adjustment reason" className={input} name="reason" placeholder="Reason: received, correction…" required />
    <button disabled={pending} aria-label="Save stock adjustment" className="grid size-11 place-items-center rounded-xl bg-[#164b36] text-white disabled:opacity-50"><SlidersHorizontal className="size-4" /></button>
    {(state.message || state.errors) && <div className="col-span-3"><ActionMessage state={state} /></div>}
  </form>;
}

type OrderStore = StoreOption & { products: { name: string; variants: { id: string; sku: string; title: string; priceMinor: number; inventory: { onHand: number; reserved: number }[] }[] }[] };

export function OrderForm({ stores }: { stores: OrderStore[] }) {
  const [state, action, pending] = useActionState(createOrderAction, initialState);
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [rows, setRows] = useState([0]);
  const selectedStore = stores.find(store => store.id === storeId);
  const variants = useMemo(() => selectedStore?.products.flatMap(product => product.variants.map(variant => ({ ...variant, productName: product.name }))) ?? [], [selectedStore]);

  return <form action={action} className="space-y-5">
    <input type="hidden" name="tenantId" value={selectedStore?.tenantId ?? ""} />
    <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Store<select className={input} name="storeId" value={storeId} onChange={event => setStoreId(event.target.value)} required>{stores.map(store => <option key={store.id} value={store.id}>{store.tenant.name} · {store.name}</option>)}</select></label><label className={label}>Customer email<input className={input} name="customerEmail" type="email" placeholder="customer@example.com" required /></label><label className={label}>Customer name<input className={input} name="customerName" placeholder="Optional" /></label><label className={label}>Delivery address<input className={input} name="shippingAddress" placeholder="Street, city, country" required /></label></div>
    <div className="rounded-2xl bg-[#f6f8f5] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-black uppercase tracking-[.14em] text-[#7e8b82]">Order items</p><button type="button" onClick={() => setRows(current => [...current, (current.at(-1) ?? 0) + 1])} className="inline-flex items-center gap-1 text-xs font-black text-[#164b36]"><Plus className="size-3.5" /> Add line</button></div><div className="space-y-2">{rows.map((row, index) => <div key={row} className="grid grid-cols-[1fr_90px_auto] gap-2"><select aria-label={`Item ${index + 1}`} className={input} name="variantId" required defaultValue=""><option value="" disabled>Select product variant</option>{variants.map(variant => { const available = variant.inventory.reduce((sum, stock) => sum + stock.onHand - stock.reserved, 0); return <option key={variant.id} value={variant.id} disabled={available < 1}>{variant.productName} · {variant.title} · {variant.sku} ({available} available)</option>; })}</select><input aria-label={`Quantity ${index + 1}`} className={input} name="quantity" type="number" min="1" defaultValue="1" required /><button type="button" aria-label="Remove order line" disabled={rows.length === 1} onClick={() => setRows(current => current.filter(value => value !== row))} className="grid size-11 place-items-center rounded-xl border border-[#dfe5df] bg-white text-[#8c5d50] disabled:opacity-30"><Minus className="size-4" /></button></div>)}</div></div>
    <div className="grid gap-4 sm:grid-cols-3"><label className={label}>Discount<input className={input} name="discount" type="number" min="0" step="0.01" defaultValue="0" /></label><label className={label}>Shipping<input className={input} name="shipping" type="number" min="0" step="0.01" defaultValue="0" /></label><label className={label}>Tax<input className={input} name="tax" type="number" min="0" step="0.01" defaultValue="0" /></label></div>
    <ActionMessage state={state} />
    <button disabled={pending || variants.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white disabled:opacity-50"><Save className="size-4" />{pending ? "Creating order…" : "Create and reserve stock"}</button>
  </form>;
}
