"use client";

import type { CSSProperties } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/utils";

export type CartItem = {
  variantId: string;
  productSlug: string;
  name: string;
  variantTitle: string;
  priceMinor: number;
  currency: string;
  image: string;
  quantity: number;
  maxQuantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (value: boolean) => void;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function StorefrontCartProvider({ storeId, storeSlug, accent, children }: { storeId: string; storeSlug: string; accent: string; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = `meridian-cart:${storeId}`;

  useEffect(() => {
    let storedItems: CartItem[] = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) storedItems = JSON.parse(stored) as CartItem[];
    } catch { localStorage.removeItem(storageKey); }
    const timer = window.setTimeout(() => { setItems(storedItems); setHydrated(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => { if (hydrated) localStorage.setItem(storageKey, JSON.stringify(items)); }, [hydrated, items, storageKey]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems(current => {
      const existing = current.find(entry => entry.variantId === item.variantId);
      if (existing) return current.map(entry => entry.variantId === item.variantId ? { ...entry, quantity: Math.min(entry.quantity + quantity, item.maxQuantity) } : entry);
      return [...current, { ...item, quantity: Math.min(quantity, item.maxQuantity) }];
    });
    setOpen(true);
  }, []);
  const update = useCallback((variantId: string, quantity: number) => setItems(current => current.map(item => item.variantId === variantId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) } : item)), []);
  const remove = useCallback((variantId: string) => setItems(current => current.filter(item => item.variantId !== variantId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0),
    open,
    setOpen,
    add, update, remove, clear,
  }), [add, clear, items, open, remove, update]);

  return <CartContext.Provider value={value}>{children}<CartDrawer storeSlug={storeSlug} accent={accent} /></CartContext.Provider>;
}

export function useStorefrontCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Storefront cart is unavailable outside its provider.");
  return value;
}

export function CartTrigger() {
  const { count, setOpen } = useStorefrontCart();
  return <button onClick={() => setOpen(true)} aria-label={`Shopping bag with ${count} items`} className="relative grid size-11 place-items-center rounded-full transition hover:bg-white active:scale-95"><ShoppingBag className="size-[18px]" /><span className="absolute right-0 top-0 grid size-4 place-items-center rounded-full bg-[var(--store-accent)] text-[9px] text-white">{count}</span></button>;
}

export function AddToCartButton({ item, compact = false }: { item: Omit<CartItem, "quantity">; compact?: boolean }) {
  const { add } = useStorefrontCart();
  const [added, setAdded] = useState(false);
  const unavailable = item.maxQuantity < 1;
  return <button aria-label={compact ? `${unavailable ? "Unavailable" : "Add"} ${item.name} to shopping bag` : undefined} disabled={unavailable} onClick={() => { add(item); setAdded(true); window.setTimeout(() => setAdded(false), 1400); }} className={compact ? "grid size-11 place-items-center rounded-full bg-[var(--store-accent)] text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35" : "inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[var(--store-accent)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"}>
    {added ? <Check className="size-4" /> : <ShoppingBag className="size-4" />}{!compact && (unavailable ? "Out of stock" : added ? "Added to bag" : "Add to bag")}
  </button>;
}

export function ProductPurchase({ productSlug, name, currency, image, variants }: { productSlug: string; name: string; currency: string; image: string; variants: { id: string; title: string; priceMinor: number; compareAtMinor: number | null; inventory: { onHand: number; reserved: number }[] }[] }) {
  const availableVariants = variants.map(variant => ({ ...variant, available: variant.inventory.reduce((sum, item) => sum + item.onHand - item.reserved, 0) }));
  const [selectedId, setSelectedId] = useState(availableVariants.find(item => item.available > 0)?.id || availableVariants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const { add } = useStorefrontCart();
  const selected = availableVariants.find(item => item.id === selectedId);
  if (!selected) return <p className="rounded-2xl bg-black/5 p-4 text-sm text-black/55">This product has no available variants.</p>;
  return <div><div className="flex flex-wrap gap-2">{availableVariants.map(variant => <button key={variant.id} onClick={() => { setSelectedId(variant.id); setQuantity(1); }} disabled={variant.available < 1} className={`rounded-full border px-4 py-2.5 text-xs font-bold transition ${selectedId === variant.id ? "border-[var(--store-accent)] bg-[var(--store-accent)] text-white" : "border-black/15 bg-white/50"} disabled:cursor-not-allowed disabled:opacity-35`}>{variant.title}</button>)}</div><div className="mt-6 flex gap-3"><div className="flex h-13 items-center rounded-full border border-black/15 bg-white"><button aria-label="Reduce quantity" onClick={() => setQuantity(value => Math.max(1, value - 1))} className="grid size-11 place-items-center"><Minus className="size-3.5" /></button><span className="w-8 text-center text-sm font-bold">{quantity}</span><button aria-label="Increase quantity" onClick={() => setQuantity(value => Math.min(selected.available, value + 1))} className="grid size-11 place-items-center"><Plus className="size-3.5" /></button></div><button disabled={selected.available < 1} onClick={() => add({ variantId: selected.id, productSlug, name, variantTitle: selected.title, priceMinor: selected.priceMinor, currency, image, maxQuantity: selected.available }, quantity)} className="flex h-13 flex-1 items-center justify-center gap-3 rounded-full bg-[var(--store-accent)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"><ShoppingBag className="size-4" />{selected.available > 0 ? "Add to bag" : "Out of stock"}</button></div><p className="mt-3 text-xs text-black/45">{selected.available > 0 ? `${selected.available} ready to order` : "Notify the merchant for availability"}</p></div>;
}

function CartDrawer({ storeSlug, accent }: { storeSlug: string; accent: string }) {
  const { items, count, subtotal, open, setOpen, update, remove } = useStorefrontCart();
  const theme = { "--store-accent": accent } as CSSProperties;
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [open, setOpen]);
  return <>{open && <button aria-label="Close shopping bag" onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-[#101815]/45 backdrop-blur-sm" />}<aside style={theme} role="dialog" aria-modal="true" aria-label="Shopping bag" aria-hidden={!open} className={`storefront-cart-drawer fixed inset-y-0 right-0 z-50 flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#faf8f3] shadow-2xl transition duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
    <div className="flex shrink-0 items-center justify-between border-b border-black/10 px-4 py-4 sm:px-6 sm:py-5"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-black/45">Your selection</p><h2 className="mt-1 font-serif text-2xl">Shopping bag <span className="text-base text-black/35">({count})</span></h2></div><button aria-label="Close shopping bag" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border border-black/10 transition active:scale-95"><X className="size-4" /></button></div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{items.length === 0 ? <div className="grid h-full place-items-center text-center"><div><span className="mx-auto grid size-16 place-items-center rounded-full bg-black/5"><ShoppingBag className="size-6 text-black/35" /></span><h3 className="mt-5 font-serif text-2xl">Your bag is beautifully empty.</h3><p className="mt-2 text-sm text-black/50">Discover something made for you.</p><button onClick={() => setOpen(false)} className="mt-6 text-sm font-bold underline underline-offset-4">Continue shopping</button></div></div> : <div className="space-y-5">{items.map(item => <article key={item.variantId} className="grid grid-cols-[76px_1fr] gap-3 border-b border-black/10 pb-5 sm:grid-cols-[92px_1fr] sm:gap-4"><Link onClick={() => setOpen(false)} href={`/store/${storeSlug}/product/${item.productSlug}` as never} aria-label={`View ${item.name}`} className="aspect-[.78] rounded-xl bg-[#e8e2d8] bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} /><div className="min-w-0"><div className="flex justify-between gap-3"><div className="min-w-0"><Link onClick={() => setOpen(false)} href={`/store/${storeSlug}/product/${item.productSlug}` as never} className="line-clamp-2 font-serif text-base leading-tight sm:text-lg">{item.name}</Link><p className="mt-1 text-xs text-black/45">{item.variantTitle}</p></div><button aria-label={`Remove ${item.name}`} onClick={() => remove(item.variantId)} className="grid size-9 shrink-0 place-items-center rounded-full text-black/35 transition hover:bg-black/5 hover:text-black active:scale-95"><Trash2 className="size-4" /></button></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-5"><div className="flex items-center rounded-full border border-black/15"><button aria-label="Reduce quantity" onClick={() => item.quantity === 1 ? remove(item.variantId) : update(item.variantId, item.quantity - 1)} className="grid size-9 place-items-center active:bg-black/5"><Minus className="size-3" /></button><span className="w-7 text-center text-xs font-bold">{item.quantity}</span><button aria-label="Increase quantity" onClick={() => update(item.variantId, item.quantity + 1)} className="grid size-9 place-items-center active:bg-black/5"><Plus className="size-3" /></button></div><p className="text-sm font-bold">{formatMoney(item.priceMinor * item.quantity, item.currency)}</p></div></div></article>)}</div>}</div>
    {items.length > 0 && <div className="shrink-0 border-t border-black/10 bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:py-5"><div className="flex items-center justify-between"><span className="text-sm text-black/55">Subtotal</span><span className="font-serif text-2xl">{formatMoney(subtotal, items[0].currency)}</span></div><p className="mt-2 text-xs text-black/40">Delivery charges are confirmed at checkout.</p><Link onClick={() => setOpen(false)} href={`/store/${storeSlug}/checkout` as never} className="mt-4 flex min-h-13 items-center justify-center gap-3 rounded-full bg-[var(--store-accent)] px-4 text-center text-sm font-bold text-white transition active:scale-[.98] sm:mt-5">Proceed to checkout <ArrowRight className="size-4" /></Link></div>}
  </aside></>;
}
