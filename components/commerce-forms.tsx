"use client";

import { Minus, Plus, Save, SlidersHorizontal } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import {
  adjustInventoryAction,
  addVariantAction,
  createCategoryAction,
  createOrderAction,
  createProductAction,
  updateProductAction,
  updateVariantAction,
  type CommerceModuleState,
} from "@/app/dashboard/commerce-actions";
import { attributesToSpecificationLines } from "@/lib/catalog-options";

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
      <label className={`${label} sm:col-span-2`}>Description<textarea className={`${input} min-h-24 py-3`} name="description" placeholder="Material, fit, care, ingredients or product details" /></label>
    </div>
    <ChoiceGrid title="Categories" hint="Choose up to 5." options={storeCategories.map(category => ({ id: category.id, label: category.name }))} name="categoryId" />
    <div className="grid gap-4 rounded-2xl border border-[#e4e9e3] p-4 sm:grid-cols-2"><label className={label}>Storefront specifications<textarea className={`${input} min-h-28 py-3`} name="specifications" placeholder={"Material: Linen\nCare: Cold wash\nOrigin: Pakistan"} /></label><div className="space-y-4"><label className={label}>SEO page title<input className={input} name="seoTitle" maxLength={70} placeholder="Search-friendly product title" /></label><label className={label}>SEO description<textarea className={`${input} min-h-20 py-3`} name="seoDescription" maxLength={160} placeholder="Short search result description" /></label></div></div>
    <div className="rounded-2xl border border-[#e4e9e3] p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[#7e8b82]">Product gallery</p><p className="mt-1 text-[11px] text-[#8a958e]">Select up to 8 images. The first selected image becomes the cover.</p></div></div>{storeMedia.length > 0 ? <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">{storeMedia.map(asset => <label key={asset.id} className="group relative cursor-pointer"><input className="peer sr-only" type="checkbox" name="mediaId" value={asset.id} /><span className="block aspect-square overflow-hidden rounded-xl border-2 border-transparent bg-[#edf1ec] peer-checked:border-[#164b36] peer-checked:ring-4 peer-checked:ring-[#c9f269]/30"><span className="block size-full bg-cover bg-center transition group-hover:scale-105" style={{ backgroundImage: `url('${asset.url}')` }} /></span><span className="mt-1 block truncate text-[9px] text-[#7c8981]">{asset.originalName}</span></label>)}</div> : <p className="mt-4 rounded-xl bg-[#f5f7f4] p-4 text-xs text-[#7c8981]">Upload images in the Media library, then return here to build the product gallery.</p>}</div>
    <div className="rounded-2xl bg-[#f6f8f5] p-4"><p className="mb-3 text-xs font-black uppercase tracking-[.14em] text-[#7e8b82]">First variant</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className={label}>Variant title<input className={input} name="variantTitle" defaultValue="Default" required /></label>
      <label className={label}>SKU<input className={input} name="sku" placeholder="SHIRT-BLK-M" required /></label>
      <label className={label}>Selling price ({selectedStore?.currency ?? "PKR"})<input className={input} name="price" type="number" min="0" step="0.01" required /></label>
      <label className={label}>Original price <span className="font-normal">(optional sale)</span><input className={input} name="compareAt" type="number" min="0" step="0.01" /></label>
      <label className={label}>Cost price<input className={input} name="cost" type="number" min="0" step="0.01" /></label>
      <label className={label}>Color<input className={input} name="color" placeholder="Black" /></label>
      <label className={label}>Size<input className={input} name="size" placeholder="Medium / 42" /></label>
      <label className={label}>Material<input className={input} name="material" placeholder="Leather, cotton…" /></label>
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className={label}>Variant title<input className={input} name="title" placeholder="Black / Medium" required /></label><label className={label}>SKU<input className={input} name="sku" placeholder="ITEM-BLK-M" required /></label><label className={label}>Price ({product?.store.currency ?? "PKR"})<input className={input} name="price" type="number" min="0" step="0.01" required /></label><label className={label}>Original price <span className="font-normal">(optional sale)</span><input className={input} name="compareAt" type="number" min="0" step="0.01" /></label><label className={label}>Cost price<input className={input} name="cost" type="number" min="0" step="0.01" /></label><label className={label}>Color<input className={input} name="color" placeholder="Black" /></label><label className={label}>Size<input className={input} name="size" placeholder="Medium / 42" /></label><label className={label}>Material<input className={input} name="material" placeholder="Leather, cotton…" /></label><label className={label}>Opening stock<input className={input} name="initialStock" type="number" min="0" defaultValue="0" required /></label><label className={label}>Reorder point<input className={input} name="reorderPoint" type="number" min="0" defaultValue="5" required /></label></div>
    <ActionMessage state={state} />
    <button disabled={pending || products.length === 0} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#cad5ca] bg-white px-5 text-sm font-black text-[#164b36] disabled:opacity-50"><Plus className="size-4" />{pending ? "Adding variant…" : "Add variant"}</button>
  </form>;
}

type EditableProduct = {
  id: string; tenantId: string; storeId: string; name: string; description: string | null; brand: string | null; productType: string | null;
  status: string; attributes: unknown; seoTitle: string | null; seoDescription: string | null; store: { name: string; currency: string };
  categories: { category: { id: string; name: string } }[]; media: { mediaAsset: { id: string; url: string; altText: string | null } }[];
  variants: { id: string; title: string; sku: string; priceMinor: number; compareAtMinor: number | null; costMinor: number | null; attributes: unknown; active: boolean }[];
};

export function ProductEditor({ products, categories, mediaAssets }: { products: EditableProduct[]; categories: CategoryOption[]; mediaAssets: MediaOption[] }) {
  const [state, action, pending] = useActionState(updateProductAction, initialState);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const product = products.find(item => item.id === productId);
  if (!product) return <p className="text-sm text-[#7c8981]">Add a product before using the advanced editor.</p>;
  const selectedCategories = new Set(product.categories.map(item => item.category.id));
  const selectedMedia = new Set(product.media.map(item => item.mediaAsset.id));
  const storeCategories = categories.filter(item => item.storeId === product.storeId);
  const storeMedia = mediaAssets.filter(item => item.storeId === product.storeId);
  return <div className="space-y-4"><label className={label}>Product<select className={input} value={productId} onChange={event => setProductId(event.target.value)}>{products.map(item => <option key={item.id} value={item.id}>{item.store.name} · {item.name}</option>)}</select></label><form key={product.id} action={action} className="space-y-4">
    <input type="hidden" name="productId" value={product.id} /><input type="hidden" name="tenantId" value={product.tenantId} /><input type="hidden" name="storeId" value={product.storeId} />
    <div className="grid gap-4 sm:grid-cols-2"><label className={label}>Product name<input className={input} name="name" defaultValue={product.name} required /></label><label className={label}>Status<select className={input} name="status" defaultValue={product.status}><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option></select></label><label className={label}>Brand<input className={input} name="brand" defaultValue={product.brand ?? ""} /></label><label className={label}>Product type<input className={input} name="productType" defaultValue={product.productType ?? ""} /></label><label className={`${label} sm:col-span-2`}>Description<textarea className={`${input} min-h-24 py-3`} name="description" defaultValue={product.description ?? ""} /></label></div>
    <ChoiceGrid title="Categories" hint="Choose up to 5." options={storeCategories.map(category => ({ id: category.id, label: category.name }))} name="categoryId" selected={selectedCategories} />
    <div className="grid gap-4 rounded-2xl border border-[#e4e9e3] p-4 sm:grid-cols-2"><label className={label}>Storefront specifications<textarea className={`${input} min-h-28 py-3`} name="specifications" defaultValue={attributesToSpecificationLines(product.attributes)} /></label><div className="space-y-4"><label className={label}>SEO page title<input className={input} name="seoTitle" maxLength={70} defaultValue={product.seoTitle ?? ""} /></label><label className={label}>SEO description<textarea className={`${input} min-h-20 py-3`} name="seoDescription" maxLength={160} defaultValue={product.seoDescription ?? ""} /></label></div></div>
    <ChoiceGrid title="Product gallery" hint="Choose up to 8. The first checked image shown here becomes the cover." options={storeMedia.map(asset => ({ id: asset.id, label: asset.originalName, image: asset.url }))} name="mediaId" selected={selectedMedia} />
    <ActionMessage state={state} /><button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white disabled:opacity-50"><Save className="size-4" />{pending ? "Saving…" : "Save product details"}</button>
  </form></div>;
}

export function VariantEditor({ products }: { products: EditableProduct[] }) {
  const variants = products.flatMap(product => product.variants.map(variant => ({ ...variant, productId: product.id, tenantId: product.tenantId, storeId: product.storeId, productName: product.name, store: product.store })));
  const [state, action, pending] = useActionState(updateVariantAction, initialState);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const variant = variants.find(item => item.id === variantId);
  if (!variant) return <p className="text-sm text-[#7c8981]">No editable variants are available.</p>;
  const values = variant.attributes && typeof variant.attributes === "object" && !Array.isArray(variant.attributes) ? variant.attributes as Record<string, unknown> : {};
  return <div className="space-y-4"><label className={label}>Variant<select className={input} value={variantId} onChange={event => setVariantId(event.target.value)}>{variants.map(item => <option key={item.id} value={item.id}>{item.store.name} · {item.productName} · {item.title}</option>)}</select></label><form key={variant.id} action={action} className="space-y-4">
    <input type="hidden" name="variantId" value={variant.id} /><input type="hidden" name="productId" value={variant.productId} /><input type="hidden" name="tenantId" value={variant.tenantId} /><input type="hidden" name="storeId" value={variant.storeId} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><label className={label}>Variant title<input className={input} name="title" defaultValue={variant.title} required /></label><label className={label}>SKU<input className={input} name="sku" defaultValue={variant.sku} required /></label><label className={label}>Price ({variant.store.currency})<input className={input} name="price" type="number" min="0" step="0.01" defaultValue={variant.priceMinor / 100} required /></label><label className={label}>Original price<input className={input} name="compareAt" type="number" min="0" step="0.01" defaultValue={variant.compareAtMinor === null ? "" : variant.compareAtMinor / 100} /></label><label className={label}>Cost price<input className={input} name="cost" type="number" min="0" step="0.01" defaultValue={variant.costMinor === null ? "" : variant.costMinor / 100} /></label><label className={label}>Color<input className={input} name="color" defaultValue={typeof values.color === "string" ? values.color : ""} /></label><label className={label}>Size<input className={input} name="size" defaultValue={typeof values.size === "string" ? values.size : ""} /></label><label className={label}>Material<input className={input} name="material" defaultValue={typeof values.material === "string" ? values.material : ""} /></label><label className="flex items-center gap-3 self-end rounded-xl border border-[#dfe5df] px-4 py-3 text-sm font-bold"><input name="active" type="checkbox" defaultChecked={variant.active} className="size-4 accent-[#164b36]" /> Available for sale</label></div>
    <ActionMessage state={state} /><button disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white disabled:opacity-50"><Save className="size-4" />{pending ? "Saving…" : "Save variant"}</button>
  </form></div>;
}

function ChoiceGrid({ title, hint, options, name, selected = new Set<string>() }: { title: string; hint: string; options: { id: string; label: string; image?: string }[]; name: string; selected?: Set<string> }) {
  return <div className="rounded-2xl border border-[#e4e9e3] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[#7e8b82]">{title}</p><p className="mt-1 text-[11px] text-[#8a958e]">{hint}</p>{options.length ? <div className="mt-3 flex flex-wrap gap-2">{options.map(option => <label key={option.id} className="cursor-pointer"><input className="peer sr-only" type="checkbox" name={name} value={option.id} defaultChecked={selected.has(option.id)} /><span className="flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe5df] bg-white px-3 text-xs font-bold transition peer-checked:border-[#164b36] peer-checked:bg-[#edf5df] peer-checked:text-[#164b36]">{option.image && <span className="size-7 rounded-md bg-cover bg-center" style={{ backgroundImage: `url('${option.image}')` }} />}{option.label}</span></label>)}</div> : <p className="mt-3 text-xs text-[#8a958e]">No choices are available for this store.</p>}</div>;
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
