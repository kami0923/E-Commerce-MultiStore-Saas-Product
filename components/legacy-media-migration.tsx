"use client";

import { useActionState } from "react";
import { Check, CloudUpload, X } from "lucide-react";
import { migrateLegacyMediaAction, type MediaActionState } from "@/app/dashboard/media/actions";

const initialState: MediaActionState = { status: "idle" };

export function LegacyMediaMigration({ count }: { count: number }) {
  const [state, action, pending] = useActionState(migrateLegacyMediaAction, initialState);

  return <section className="mt-5 rounded-[28px] border border-[#dce5d8] bg-[#f2f7ed] p-5 sm:p-7">
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
      <div className="flex gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#164b36] text-[#c5f45b]"><CloudUpload className="size-5" /></span>
        <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#54705f]">Phase 1 cleanup</p><h2 className="mt-1 text-xl font-black">Move {count} legacy image{count === 1 ? "" : "s"} to cloud storage</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68776d]">Products and galleries keep their existing assignments. Original files remain available as a rollback copy while database URLs move to permanent storage.</p></div>
      </div>
      <form action={action}><button disabled={pending} className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#164b36] px-5 text-sm font-black text-white transition hover:bg-[#0e3828] disabled:opacity-50"><CloudUpload className="size-4" />{pending ? "Migrating images…" : "Migrate legacy images"}</button></form>
    </div>
    {state.message && <p aria-live="polite" className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${state.status === "success" ? "bg-white text-[#4e7841]" : "bg-[#fff0e9] text-[#a95139]"}`}>{state.status === "success" ? <Check className="size-4" /> : <X className="size-4" />}{state.message}</p>}
  </section>;
}
