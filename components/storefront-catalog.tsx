"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { AddToCartButton } from "@/components/storefront-cart";
import { formatMoney } from "@/lib/utils";

type CatalogProduct = {
  id: string; name: string; slug: string; brand: string | null; productType: string | null;
  categories: { category: { id: string; name: string } }[];
  media: { isPrimary: boolean; mediaAsset: { id: string; url: string; altText: string | null } }[];
  variants: { id: string; title: string; priceMinor: number; compareAtMinor: number | null; inventory: { onHand: number; reserved: number }[] }[];
};

export function StorefrontCatalog({ storeSlug, currency, products, categories, images, fallback, filters = false }: { storeSlug: string; currency: string; products: CatalogProduct[]; categories: { id: string; name: string }[]; images: readonly string[]; fallback: string; filters?: boolean }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const filtered = useMemo(() => products.filter(product => {
    const matchesQuery = `${product.name} ${product.brand || ""} ${product.productType || ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "all" || product.categories.some(item => item.category.id === category);
    return matchesQuery && matchesCategory;
  }), [products, query, category]);

  if (products.length === 0) return <div className="mx-auto max-w-2xl rounded-[2rem] border border-dashed border-black/20 bg-white/55 p-12 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-black/5"><SlidersHorizontal className="size-5 text-black/45" /></span><h3 className="mt-5 font-serif text-3xl">The collection is being curated.</h3><p className="mt-3 text-sm leading-6 text-black/55">Products marked active in the merchant dashboard will appear here automatically.</p></div>;

  return <div>
    {filters && <div className="mb-10 flex flex-col gap-4 border-y border-black/10 py-5 lg:flex-row lg:items-center"><div className="relative min-w-0 flex-1"><Search className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-black/35" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search the collection" className="h-11 w-full bg-transparent pl-7 text-sm outline-none placeholder:text-black/35" /></div><div className="flex flex-wrap gap-2"><button onClick={() => setCategory("all")} className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === "all" ? "bg-[var(--store-accent)] text-white" : "border border-black/15 bg-white/50"}`}>All pieces</button>{categories.map(item => <button key={item.id} onClick={() => setCategory(item.id)} className={`rounded-full px-4 py-2 text-xs font-bold transition ${category === item.id ? "bg-[var(--store-accent)] text-white" : "border border-black/15 bg-white/50"}`}>{item.name}</button>)}</div></div>}
    {filtered.length > 0 ? <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">{filtered.map((product, index) => { const variant = product.variants[0]; const available = variant?.inventory.reduce((sum, item) => sum + item.onHand - item.reserved, 0) ?? 0; const image = product.media[0]?.mediaAsset.url || images[(index % 3) + 1]; return <article key={product.id} className="group rounded-[var(--store-radius)] p-2 transition duration-500 hover:-translate-y-1 hover:bg-white/65 hover:shadow-[0_22px_55px_rgba(20,35,25,.1)]"><div className="relative aspect-[.76] overflow-hidden rounded-[calc(var(--store-radius)-.35rem)] bg-[#e5ded3]"><Link href={`/store/${storeSlug}/product/${product.slug}` as never} aria-label={`View ${product.name}`} className="absolute inset-0 bg-cover bg-center transition duration-1000 group-hover:scale-[1.055]" style={{ backgroundImage: `url('${image}')` }} /><div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition group-hover:opacity-100" /><span className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-black tabular-nums backdrop-blur">{String(index + 1).padStart(2, "0")}</span><div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">{variant && <AddToCartButton compact item={{ variantId: variant.id, productSlug: product.slug, name: product.name, variantTitle: variant.title, priceMinor: variant.priceMinor, currency, image, maxQuantity: available }} />}</div>{variant?.compareAtMinor && variant.compareAtMinor > variant.priceMinor && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider">Special price</span>}</div><div className="flex items-start justify-between gap-4 px-1 pb-2 pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-black/40">{product.brand || product.productType || fallback}</p><Link href={`/store/${storeSlug}/product/${product.slug}` as never} className="mt-1 block font-serif text-lg leading-tight transition group-hover:text-[var(--store-accent)]">{product.name}</Link><p className="mt-1 text-xs text-black/45">{available > 0 ? `${available} available` : "Currently unavailable"}</p></div>{variant && <div className="shrink-0 text-right"><p className="text-sm font-bold">{formatMoney(variant.priceMinor, currency)}</p>{variant.compareAtMinor && variant.compareAtMinor > variant.priceMinor && <p className="mt-1 text-[11px] text-black/35 line-through">{formatMoney(variant.compareAtMinor, currency)}</p>}</div>}</div></article>; })}</div> : <div className="py-20 text-center"><h3 className="font-serif text-3xl">No pieces match your search.</h3><button onClick={() => { setQuery(""); setCategory("all"); }} className="mt-5 inline-flex items-center gap-2 text-sm font-bold">Reset collection <ArrowRight className="size-4" /></button></div>}
  </div>;
}
