import { ArrowLeft, Building2, Check } from "lucide-react";
import Link from "next/link";
import { BusinessForm } from "@/components/business-form";
import { requirePlatformAdmin } from "@/data/auth";

export default async function NewBusinessPage() {
  await requirePlatformAdmin();
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard/businesses" className="inline-flex items-center gap-2 text-sm font-bold text-[#607067]"><ArrowLeft className="size-4" /> Businesses</Link>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-[28px] border border-[#e0e6e0] bg-white p-6 shadow-[0_12px_40px_rgba(16,35,26,.05)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#87938b]">Step 1 of 4</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-.05em]">Create a merchant business</h1>
          <p className="mt-2 text-sm text-[#748078]">Set the tenant boundary first. Stores, staff and data will remain isolated inside this business.</p>
          <BusinessForm />
        </section>
        <aside className="h-fit rounded-[24px] bg-[#10231a] p-5 text-white">
          <span className="grid size-10 place-items-center rounded-xl bg-[#c9f269] text-[#10231a]"><Building2 className="size-5" /></span>
          <h2 className="mt-5 font-black">Tenant boundary</h2><p className="mt-2 text-sm leading-6 text-white/55">Every store, member, product and order created next will inherit this verified business scope.</p>
          <div className="mt-6 space-y-3 text-xs text-white/70">{["Isolated merchant data", "Country-aware subscription", "English and Urdu ready", "Multiple stores supported"].map(item => <p key={item} className="flex items-center gap-2"><Check className="size-3.5 text-[#c9f269]" />{item}</p>)}</div>
        </aside>
      </div>
    </div>
  );
}
