import Link from "next/link";
import { ArrowRight, Check, Globe2, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const principles = [
  { icon: Layers3, title: "One platform, every store", text: "Launch clothing, footwear, jewellery, cosmetics, or a combined catalog without rebuilding the system." },
  { icon: ShieldCheck, title: "Tenant-safe by design", text: "Every user, product, order and report is resolved through verified business and store membership." },
  { icon: Globe2, title: "Pakistan first. Global next.", text: "PKR and USD foundations, English and Urdu, RTL layouts, regional subscriptions and custom domains." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden px-5 pb-12 pt-5 sm:px-8 lg:px-12">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between rounded-[22px] border border-white/80 bg-white/75 px-5 py-4 shadow-[0_12px_50px_rgba(16,35,26,.06)] backdrop-blur-xl sm:px-7">
        <BrandMark />
        <div className="hidden items-center gap-8 text-sm font-semibold text-[#68756d] md:flex">
          <a href="#platform" className="transition hover:text-[#164b36]">Platform</a>
          <a href="#architecture" className="transition hover:text-[#164b36]">Architecture</a>
          <a href="#launch" className="transition hover:text-[#164b36]">Launch plan</a>
        </div>
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#164b36] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(22,75,54,.2)] transition hover:-translate-y-0.5 hover:bg-[#0d3827]">
          Open console <ArrowRight className="size-4" />
        </Link>
      </nav>

      <section className="mx-auto grid max-w-[1440px] items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
        <div className="animate-enter">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce6d8] bg-white px-3.5 py-2 text-xs font-bold text-[#164b36] shadow-sm">
            <Sparkles className="size-3.5" /> Multi-tenant commerce, built to expand
          </div>
          <h1 className="max-w-3xl text-[clamp(3.5rem,7.5vw,7.8rem)] font-black leading-[.85] tracking-[-0.075em] text-[#10231a]">
            Every store.<br /><span className="text-[#3f745a]">One calm</span><br />command center.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#68756d]">
            Create distinct retail brands, give each team exactly the access they need, and grow from Pakistan to global markets without replacing your foundation.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-2xl bg-[#c9f269] px-6 py-4 text-sm font-black text-[#0d3827] shadow-[0_12px_35px_rgba(118,164,52,.2)] transition hover:-translate-y-0.5">
              Explore the platform <ArrowRight className="size-4" />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-2xl border border-[#dfe5df] bg-white px-5 py-4 text-sm font-bold text-[#506057]">
              <Check className="size-4 text-[#3f745a]" /> PostgreSQL foundation
            </span>
          </div>
        </div>

        <div className="animate-enter delay-2 relative mx-auto w-full max-w-[680px]">
          <div className="absolute -inset-6 -z-10 rotate-3 rounded-[48px] bg-[#c9f269]/35 blur-2xl" />
          <div className="overflow-hidden rounded-[36px] border border-white bg-[#10231a] p-3 shadow-[0_35px_90px_rgba(16,35,26,.25)]">
            <div className="rounded-[28px] bg-[#f7f8f4] p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#8c978f]">Portfolio overview</p>
                  <p className="mt-2 text-2xl font-black tracking-[-.04em]">Northstar Collective</p>
                </div>
                <div className="rounded-full bg-[#e7f5c4] px-3 py-1.5 text-xs font-bold text-[#31502c]">4 stores live</div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {[['Revenue','PKR 4.82M','+18.4%'],['Orders','1,284','+12.1%'],['Low stock','23','Needs review'],['Conversion','3.84%','+0.62%']].map(([label,value,trend], index) => (
                  <div key={label} className={`rounded-2xl border border-[#e5e9e4] bg-white p-4 ${index === 0 ? 'shadow-[0_10px_25px_rgba(22,75,54,.08)]' : ''}`}>
                    <p className="text-xs font-semibold text-[#87938b]">{label}</p>
                    <p className="mt-2 text-xl font-black tracking-[-.04em]">{value}</p>
                    <p className={`mt-3 text-[11px] font-bold ${index === 2 ? 'text-[#c26d35]' : 'text-[#4c7f46]'}`}>{trend}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#164b36] p-5 text-white">
                <div className="flex items-end justify-between">
                  <div><p className="text-xs text-white/60">Sales momentum</p><p className="mt-1 font-bold">All stores · 30 days</p></div>
                  <p className="text-xs font-bold text-[#c9f269]">Healthy</p>
                </div>
                <div className="mt-7 flex h-24 items-end gap-2">
                  {[34,48,42,62,56,78,68,91,76,84,94,88].map((height, i) => <span key={i} className="flex-1 rounded-t-md bg-[#c9f269]" style={{height: `${height}%`, opacity: .34 + i * .045}} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-3">
        {principles.map(({icon: Icon, title, text}, index) => (
          <article key={title} className={`animate-enter delay-${index + 1} rounded-[28px] border border-white bg-white/80 p-7 shadow-[0_12px_45px_rgba(16,35,26,.05)]`}>
            <span className="grid size-11 place-items-center rounded-2xl bg-[#edf3e9] text-[#164b36]"><Icon className="size-5" /></span>
            <h2 className="mt-8 text-xl font-black tracking-[-.035em]">{title}</h2>
            <p className="mt-3 leading-7 text-[#6f7c74]">{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
