"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

export function StorefrontMobileMenu({
  base,
  brand,
  descriptor,
  navigation,
}: {
  base: string;
  brand: string;
  descriptor: string;
  navigation: readonly (readonly [string, string])[];
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <>
    <button
      type="button"
      aria-label="Open store menu"
      aria-expanded={open}
      aria-controls={menuId}
      onClick={() => setOpen(true)}
      className="storefront-menu-trigger mr-3 grid size-11 shrink-0 place-items-center rounded-full border border-current/15 transition active:scale-95 lg:hidden"
    >
      <Menu className="size-5" />
    </button>
    {open && <div id={menuId} role="dialog" aria-modal="true" aria-label="Store navigation" className="storefront-mobile-menu fixed left-0 top-0 z-[70] h-dvh w-screen lg:hidden">
      <button type="button" aria-label="Close store menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#0b1712]/55 backdrop-blur-sm" />
      <div className="storefront-mobile-menu-panel relative z-[1] flex h-dvh w-[min(88vw,360px)] flex-col overflow-y-auto bg-[var(--store-soft)] p-5 text-[var(--store-ink)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-current/10 pb-6">
          <Link href={base as never} onClick={() => setOpen(false)} className="min-w-0 pr-4">
            <p className="truncate font-serif text-2xl font-semibold">{brand}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[.2em] opacity-50">{descriptor}</p>
          </Link>
          <button type="button" aria-label="Close store menu" onClick={() => setOpen(false)} className="grid size-11 shrink-0 place-items-center rounded-full border border-current/15 transition active:scale-95"><X className="size-5" /></button>
        </div>
        <nav className="mt-8 grid gap-2">
          {navigation.map(([label, page], index) => <Link
            key={page}
            href={`${base}/${page}` as never}
            onClick={() => setOpen(false)}
            className="group flex min-h-14 items-center justify-between rounded-2xl border border-current/10 bg-white/55 px-5 text-sm font-black uppercase tracking-[.12em] transition active:scale-[.98]"
          >
            <span><span className="mr-3 text-[10px] opacity-35">0{index + 1}</span>{label}</span>
            <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </Link>)}
        </nav>
        <div className="mt-auto rounded-2xl bg-[var(--store-accent)] p-5 text-white">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/55">Independent storefront</p>
          <p className="mt-2 text-sm leading-6 text-white/80">Secure shopping, order tracking and direct access to {brand}.</p>
        </div>
      </div>
    </div>}
  </>;
}
