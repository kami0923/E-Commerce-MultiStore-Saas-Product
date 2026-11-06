"use client";

import { Archive, LoaderCircle, ShieldAlert, X } from "lucide-react";
import { useActionState, useState } from "react";
import { archiveStoreAction, type StoreArchiveState } from "@/app/dashboard/actions";

const initialState: StoreArchiveState = { status: "idle" };

export function StoreArchiveControl({ store }: { store: { id: string; tenantId: string; name: string; products: number; orders: number } }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(archiveStoreAction, initialState);

  return <>
    <button type="button" onClick={() => { setConfirmation(""); setOpen(true); }} className="inline-flex items-center gap-1.5 rounded-lg border border-[#efd8d2] bg-white px-3 py-2 text-xs font-bold text-[#a34d39]"><Archive className="size-3.5" /> Archive</button>
    {open && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#0b2118]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`archive-${store.id}`}>
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_30px_90px_rgba(6,28,19,.32)]">
        <div className="flex items-start justify-between gap-4 bg-[#fff7f3] p-6 sm:p-7"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f9dfd7] text-[#a54e38]"><ShieldAlert className="size-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#a76a59]">Protected action</p><h2 id={`archive-${store.id}`} className="mt-1 text-xl font-black">Archive {store.name}?</h2></div></div><button type="button" onClick={() => setOpen(false)} aria-label="Close archive confirmation" className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#eadfd9] bg-white text-[#6c7770]"><X className="size-4" /></button></div>
        <form action={action} className="p-6 sm:p-7">
          <input type="hidden" name="tenantId" value={store.tenantId} /><input type="hidden" name="storeId" value={store.id} />
          <p className="text-sm leading-6 text-[#5f6d64]">The public website will close immediately. Products, customers, completed orders, inventory and audit history will remain preserved and the store can be restored later.</p>
          <div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#f6f8f5] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a958e]">Products preserved</p><p className="mt-1 text-xl font-black">{store.products}</p></div><div className="rounded-2xl bg-[#f6f8f5] p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-[#8a958e]">Orders preserved</p><p className="mt-1 text-xl font-black">{store.orders}</p></div></div>
          <label className="mt-5 block text-xs font-bold text-[#526158]">Type <span className="font-black text-[#172b21]">{store.name}</span> to confirm<input autoFocus name="confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 h-11 w-full rounded-xl border border-[#dfe5df] px-3.5 text-sm outline-none focus:border-[#a75a45] focus:ring-4 focus:ring-[#f0c9bd]/25" /></label>
          {state.status === "error" && <p role="alert" className="mt-3 rounded-xl bg-[#fff0e9] px-3.5 py-3 text-xs font-bold text-[#a4472b]">{state.message}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl border border-[#dfe5df] px-5 text-xs font-black text-[#59665e]">Keep store</button><button disabled={pending || confirmation !== store.name} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#a84d38] px-5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45">{pending ? <LoaderCircle className="size-4 animate-spin" /> : <Archive className="size-4" />}{pending ? "Checking store…" : "Archive safely"}</button></div>
        </form>
      </div>
    </div>}
  </>;
}
