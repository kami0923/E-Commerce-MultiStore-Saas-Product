"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Building2, ChevronDown, Store } from "lucide-react";
import { useRouter } from "next/navigation";

type AccessStore = {
  id: string;
  name: string;
  slug: string;
  vertical: string;
  themeKey: string;
  tenant: { name: string };
};

const labels: Record<string, string> = {
  CLOTHING: "Clothing & fashion",
  SHOES: "Shoes & footwear",
  JEWELLERY: "Jewellery & accessories",
  COSMETICS: "Beauty & cosmetics",
  MULTI_CATEGORY: "Multi-category store",
};

export function MerchantAccessSelector({ stores }: { stores: AccessStore[] }) {
  const router = useRouter();
  const categories = useMemo(() => [...new Set(stores.map(store => store.vertical))], [stores]);
  const [category, setCategory] = useState(categories[0] ?? "");
  const available = stores.filter(store => store.vertical === category);
  const [storeSlug, setStoreSlug] = useState(available[0]?.slug ?? "");
  const selectedStore = stores.find(store => store.slug === storeSlug);

  function changeCategory(value: string) {
    setCategory(value);
    setStoreSlug(stores.find(store => store.vertical === value)?.slug ?? "");
  }

  return (
    <div className="rounded-[28px] border border-[#dce3dc] bg-white p-5 shadow-[0_24px_70px_rgba(16,35,26,.09)] sm:p-7">
      <div className="flex items-center gap-3 border-b border-[#e8ece7] pb-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-[#e9f2e2] text-[#174632]"><Building2 className="size-5" /></span>
        <div><p className="text-sm font-black">Find your merchant workspace</p><p className="mt-1 text-xs text-[#7a877f]">Choose the business type first, then your store.</p></div>
      </div>

      {stores.length > 0 ? <div className="mt-6 space-y-5">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[.15em] text-[#617068]">Store category</span>
          <span className="relative mt-2 block"><Store className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#708078]" /><select value={category} onChange={event => changeCategory(event.target.value)} className="h-14 w-full appearance-none rounded-2xl border border-[#d8e0d8] bg-[#f8faf6] pl-11 pr-11 text-sm font-bold outline-none transition focus:border-[#73937a] focus:ring-4 focus:ring-[#c9f269]/20">{categories.map(item => <option key={item} value={item}>{labels[item] ?? item.toLowerCase().replaceAll("_", " ")}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#708078]" /></span>
        </label>
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[.15em] text-[#617068]">Business or store</span>
          <span className="relative mt-2 block"><Building2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#708078]" /><select value={storeSlug} onChange={event => setStoreSlug(event.target.value)} className="h-14 w-full appearance-none rounded-2xl border border-[#d8e0d8] bg-[#f8faf6] pl-11 pr-11 text-sm font-bold outline-none transition focus:border-[#73937a] focus:ring-4 focus:ring-[#c9f269]/20">{available.map(store => <option key={store.id} value={store.slug}>{store.tenant.name} · {store.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#708078]" /></span>
        </label>
        {selectedStore && <div className="flex items-center justify-between rounded-2xl bg-[#f0f5eb] px-4 py-3"><div><p className="text-xs font-black text-[#234c37]">{selectedStore.tenant.name}</p><p className="mt-1 text-[10px] text-[#738078]">{labels[selectedStore.vertical] ?? selectedStore.vertical} · {selectedStore.themeKey} design</p></div><span className="size-2 rounded-full bg-[#8dbd50] shadow-[0_0_0_5px_rgba(141,189,80,.15)]" /></div>}
        <button type="button" disabled={!storeSlug} onClick={() => router.push(`/sign-in/${storeSlug}` as never)} className="group flex h-14 w-full items-center justify-between rounded-2xl bg-[#153d2c] px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(21,61,44,.18)] transition hover:-translate-y-0.5 hover:bg-[#0f3022] disabled:opacity-50"><span>Continue to branded login</span><span className="grid size-8 place-items-center rounded-full bg-white/10"><ArrowRight className="size-4 transition group-hover:translate-x-0.5" /></span></button>
      </div> : <div className="py-10 text-center"><p className="text-sm font-black">No merchant stores are available yet.</p><p className="mt-2 text-xs leading-5 text-[#7a877f]">A super administrator can create the first business and storefront.</p></div>}
    </div>
  );
}
