import Link from "next/link";
import { ArrowLeft, Check, Layers3, LockKeyhole, ShieldCheck, Store } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export function AuthLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#10231a] px-4 py-4 text-[#10231a] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute -left-40 -top-52 size-[38rem] rounded-full bg-[#3d7657]/35 blur-[110px]" />
      <div className="pointer-events-none absolute -bottom-56 -right-36 size-[42rem] rounded-full bg-[#c9f269]/14 blur-[120px]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1500px] overflow-hidden rounded-[30px] border border-white/10 bg-[#f6f7f2] shadow-[0_45px_120px_rgba(0,0,0,.32)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[.96fr_1.04fr]">
        <section className="relative hidden overflow-hidden bg-[#163426] p-10 text-white lg:flex lg:flex-col xl:p-14">
          <div className="pointer-events-none absolute right-[-12rem] top-[-14rem] size-[38rem] rounded-full border-[90px] border-[#c9f269]/7" />
          <div className="pointer-events-none absolute bottom-[-17rem] left-[-13rem] size-[36rem] rounded-full border-[80px] border-white/3" />
          <div className="relative flex items-center justify-between">
            <BrandMark />
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-white"><ArrowLeft className="size-3.5" /> Back to platform</Link>
          </div>

          <div className="relative my-auto max-w-2xl py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#c9f269]/20 bg-[#c9f269]/8 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.17em] text-[#d8f799]"><ShieldCheck className="size-3.5" /> Protected workspace access</span>
            <h2 className="mt-8 text-5xl font-black leading-[.93] tracking-[-.065em] xl:text-7xl">Your entire<br />commerce network,<br /><span className="font-serif font-normal italic text-[#c9f269]">within reach.</span></h2>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/55">Move securely between platform governance, merchant businesses, and assigned stores from one carefully permissioned account.</p>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[{ icon: Store, value: "Multi-store", label: "One account" }, { icon: Layers3, value: "Tenant-safe", label: "Private data" }, { icon: LockKeyhole, value: "Role-aware", label: "Exact access" }].map(({ icon: Icon, value, label }) => <div key={value} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><Icon className="size-4 text-[#c9f269]" /><p className="mt-5 text-sm font-black">{value}</p><p className="mt-1 text-[10px] text-white/40">{label}</p></div>)}
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-[10px] font-bold text-white/45">
            {["Encrypted sessions", "Audited changes", "Store-level permissions"].map(item => <span key={item} className="flex items-center gap-2"><Check className="size-3 text-[#c9f269]" />{item}</span>)}
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-8 sm:px-10 lg:px-14 xl:px-20">
          <div className="absolute left-6 top-6 lg:hidden"><BrandMark /></div>
          <Link href="/" aria-label="Back to platform" className="absolute right-6 top-7 grid size-10 place-items-center rounded-full border border-[#dce2da] bg-white text-[#647168] transition hover:text-[#10231a] lg:hidden"><ArrowLeft className="size-4" /></Link>
          <div className="w-full max-w-[510px] pt-20 lg:pt-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#e9f1e3] px-3 py-2 text-[10px] font-black uppercase tracking-[.17em] text-[#47705a]"><span className="size-1.5 rounded-full bg-[#79a95e]" />{eyebrow}</div>
            <h1 className="mt-6 text-4xl font-black leading-[.98] tracking-[-.06em] sm:text-5xl xl:text-[3.7rem]">{title}</h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#69766e]">{description}</p>
            <div className="mt-8 rounded-[26px] border border-[#dce3dc] bg-white p-5 shadow-[0_22px_60px_rgba(20,50,34,.08)] sm:p-7">
              {children}
            </div>
            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-[#89948d]"><LockKeyhole className="size-3" />Credentials are encrypted in transit and never shared between tenants.</div>
          </div>
        </section>
      </div>
    </main>
  );
}
