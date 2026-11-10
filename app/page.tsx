import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, Check, ChevronRight, Globe2, LockKeyhole, PackageCheck, ShieldCheck, ShoppingBag, Sparkles, Store, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const capabilities = [
  { icon: Store, number: "01", title: "Launch any retail vertical", text: "Clothing, footwear, jewellery, cosmetics, or a composed multi-category storefront—without rebuilding the operating system." },
  { icon: ShieldCheck, number: "02", title: "Keep every tenant private", text: "Membership, permissions, products, customers, orders, media, and reports remain verified inside the correct business boundary." },
  { icon: Globe2, number: "03", title: "Expand without re-platforming", text: "Start with PKR and Pakistan operations, then add USD, multilingual storefronts, domains, branches, and new markets." },
];

const operations = [
  { icon: ShoppingBag, label: "Storefront", detail: "Beautiful vertical-specific customer experiences" },
  { icon: Boxes, label: "Operations", detail: "Catalog, stock, orders, delivery, tax and returns" },
  { icon: UsersRound, label: "Access", detail: "Owners, teams, roles and store-level permissions" },
  { icon: BarChart3, label: "Intelligence", detail: "Revenue, inventory and performance visibility" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f3ed] text-[#10231a]">
      <div className="relative border-b border-[#d8ddd5]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 top-0 size-[40rem] rounded-full bg-[#c9f269]/25 blur-[110px]" />
          <div className="absolute -left-40 top-80 size-[30rem] rounded-full bg-[#91b8a3]/15 blur-[100px]" />
        </div>

        <nav className="relative mx-auto flex h-24 max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <BrandMark />
          <div className="hidden items-center gap-9 text-[13px] font-bold text-[#657269] lg:flex">
            <a href="#platform" className="transition hover:text-[#10231a]">Platform</a>
            <a href="#operations" className="transition hover:text-[#10231a]">Operations</a>
            <a href="#architecture" className="transition hover:text-[#10231a]">Architecture</a>
          </div>
          <Link href="/dashboard" className="group inline-flex h-12 items-center gap-3 rounded-full bg-[#10231a] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(16,35,26,.15)] transition hover:-translate-y-0.5 hover:bg-[#174632]">
            Open workspace <span className="grid size-7 place-items-center rounded-full bg-white/10"><ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></span>
          </Link>
        </nav>

        <section className="relative mx-auto grid max-w-[1480px] items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:min-h-[760px] lg:grid-cols-[.88fr_1.12fr] lg:px-12 lg:pb-24 lg:pt-16">
          <div className="animate-enter relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ccd5ca] bg-white/70 px-4 py-2 text-[11px] font-black uppercase tracking-[.14em] text-[#315a45] shadow-sm backdrop-blur">
              <Sparkles className="size-3.5 text-[#4b7d5e]" /> Commerce infrastructure, beautifully composed
            </div>
            <h1 className="mt-8 max-w-3xl text-[clamp(3.5rem,6.4vw,6.8rem)] font-black leading-[.89] tracking-[-.075em]">
              Many brands.<br />One <span className="font-serif font-normal italic tracking-[-.06em] text-[#47765d]">operating</span><br />system.
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#647168] sm:text-lg">
              Build distinctive online stores while managing every tenant, team, catalogue, order, and market from one secure command center.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#c9f269] px-6 text-sm font-black text-[#10231a] shadow-[0_14px_34px_rgba(120,158,47,.22)] transition hover:-translate-y-0.5 hover:bg-[#d3fa79]">
                Enter the platform <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <a href="#platform" className="inline-flex h-14 items-center gap-2 rounded-full border border-[#ccd4cc] bg-white/65 px-6 text-sm font-black transition hover:bg-white">
                Explore capabilities <ChevronRight className="size-4" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#d4dad2] pt-6 text-xs font-bold text-[#657269]">
              {["PostgreSQL foundation", "Tenant-isolated", "English + Urdu ready"].map(item => <span key={item} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-[#dff3a9]"><Check className="size-3 text-[#315a45]" /></span>{item}</span>)}
            </div>
          </div>

          <div className="animate-enter delay-2 relative mx-auto w-full max-w-[800px] lg:ml-auto">
            <div className="absolute -inset-5 -z-10 rotate-2 rounded-[46px] bg-[#c9f269]/30 blur-2xl" />
            <div className="overflow-hidden rounded-[34px] border border-white/80 bg-[#10231a] p-2.5 shadow-[0_45px_100px_rgba(16,35,26,.28)]">
              <div className="flex min-h-[590px] overflow-hidden rounded-[26px] bg-[#f8f9f5]">
                <aside className="hidden w-[170px] shrink-0 flex-col bg-[#17382a] p-5 text-white sm:flex">
                  <div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-xl bg-[#c9f269] text-xs font-black text-[#10231a]">M</span><span className="text-xs font-black tracking-wide">MERIDIAN</span></div>
                  <div className="mt-9 rounded-2xl border border-white/10 bg-white/7 p-3"><p className="text-[9px] uppercase tracking-[.15em] text-white/45">Workspace</p><p className="mt-2 text-xs font-bold">Northstar Co.</p><p className="mt-1 text-[9px] text-[#c9f269]">4 stores active</p></div>
                  <div className="mt-7 space-y-2 text-[10px] font-semibold text-white/50">
                    {["Overview", "Stores", "Catalog", "Inventory", "Orders", "Analytics"].map((item, index) => <div key={item} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 ${index === 0 ? "bg-white/10 text-white" : ""}`}><span className={`size-1.5 rounded-full ${index === 0 ? "bg-[#c9f269]" : "bg-white/20"}`} />{item}</div>)}
                  </div>
                  <div className="mt-auto rounded-2xl bg-[#c9f269] p-3 text-[#10231a]"><p className="text-[9px] font-black uppercase tracking-[.12em]">System health</p><p className="mt-1 text-[11px] font-bold">Everything is steady</p></div>
                </aside>

                <div className="min-w-0 flex-1 p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#8b978f]">Monday, 10 November</p><h2 className="mt-2 text-2xl font-black tracking-[-.045em] sm:text-3xl">Good morning, Kamran.</h2></div>
                    <span className="hidden rounded-full border border-[#dce2da] bg-white px-3 py-2 text-[10px] font-bold text-[#647168] sm:block">EN · PKR</span>
                  </div>
                  <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[["Revenue", "PKR 4.82M", "+18.4%"], ["Orders", "1,284", "+12.1%"], ["Stores", "4", "All live"], ["Low stock", "23", "Review"]].map(([label, value, trend], index) => <div key={label} className="rounded-2xl border border-[#e0e5df] bg-white p-4 shadow-[0_10px_25px_rgba(20,50,34,.035)]"><p className="text-[10px] font-bold text-[#89948d]">{label}</p><p className="mt-2 text-lg font-black tracking-[-.04em]">{value}</p><p className={`mt-2 text-[9px] font-black ${index === 3 ? "text-[#c36b3e]" : "text-[#4d7e47]"}`}>{trend}</p></div>)}
                  </div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1.45fr_.75fr]">
                    <div className="rounded-[22px] bg-white p-5 shadow-[0_10px_30px_rgba(20,50,34,.04)] ring-1 ring-[#e1e6e0]">
                      <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold text-[#89948d]">Revenue performance</p><p className="mt-1 text-sm font-black">All stores · 30 days</p></div><span className="rounded-full bg-[#edf6d8] px-2.5 py-1 text-[9px] font-black text-[#4d713d]">Healthy</span></div>
                      <div className="mt-8 flex h-36 items-end gap-2 border-b border-[#e7ebe6]">{[31,46,39,58,52,74,65,87,72,82,96,89].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-[#79a95e]" style={{ height: `${height}%`, opacity: .5 + index * .035 }} />)}</div>
                      <div className="mt-3 flex justify-between text-[8px] font-bold uppercase tracking-[.1em] text-[#9aa39d]"><span>01 Nov</span><span>Today</span></div>
                    </div>
                    <div className="rounded-[22px] bg-[#17382a] p-5 text-white shadow-[0_14px_30px_rgba(16,35,26,.14)]">
                      <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#c9f269]">Live network</p><p className="mt-3 text-xl font-black tracking-[-.04em]">Four brands.<br />One clear view.</p>
                      <div className="mt-7 space-y-3">{["Atelier PK", "Nova Shoes", "Aurelia", "Serein Beauty"].map((store, index) => <div key={store} className="flex items-center justify-between border-b border-white/10 pb-2.5 text-[10px]"><span className="text-white/65">{store}</span><span className={`size-2 rounded-full ${index === 2 ? "bg-[#f2c96d]" : "bg-[#c9f269]"}`} /></div>)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#dce2dc] bg-[#eef2eb] px-4 py-3"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#315a45]"><PackageCheck className="size-4" /></span><div><p className="text-[10px] font-black">Orders are moving</p><p className="mt-0.5 text-[9px] text-[#7d8981]">18 ready for fulfilment</p></div></div><ArrowRight className="size-4 text-[#617067]" /></div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-4 hidden items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-[0_18px_45px_rgba(16,35,26,.15)] backdrop-blur sm:flex"><span className="grid size-9 place-items-center rounded-xl bg-[#eaf4d2] text-[#315a45]"><LockKeyhole className="size-4" /></span><div><p className="text-[10px] font-black">Tenant boundary verified</p><p className="mt-0.5 text-[9px] text-[#78857d]">Every request, every store</p></div></div>
          </div>
        </section>
      </div>

      <section id="platform" className="mx-auto max-w-[1480px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
          <div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#53715f]">Designed for expansion</p><h2 className="mt-5 text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-5xl">Start focused.<br /><span className="font-serif font-normal italic text-[#47765d]">Stay flexible.</span></h2><p className="mt-6 max-w-md leading-7 text-[#68756d]">A composed foundation for commerce businesses that need their brands to feel individual and their operations to remain connected.</p></div>
          <div className="grid gap-px overflow-hidden rounded-[30px] border border-[#d8ded7] bg-[#d8ded7] md:grid-cols-3">{capabilities.map(({ icon: Icon, number, title, text }) => <article key={title} className="group bg-[#fafbf8] p-7 transition hover:bg-white sm:p-8"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#e9f1e4] text-[#315a45]"><Icon className="size-5" /></span><span className="font-serif text-2xl italic text-[#abb4ad]">{number}</span></div><h3 className="mt-16 text-xl font-black tracking-[-.035em]">{title}</h3><p className="mt-4 text-sm leading-7 text-[#6d7971]">{text}</p></article>)}</div>
        </div>
      </section>

      <section id="operations" className="bg-[#10231a] text-white">
        <div className="mx-auto max-w-[1480px] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
          <div className="flex flex-col justify-between gap-7 border-b border-white/12 pb-12 lg:flex-row lg:items-end"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#c9f269]">A connected operating model</p><h2 className="mt-5 max-w-3xl text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl">Everything your stores need.<br /><span className="font-serif font-normal italic text-white/55">Nothing they should not see.</span></h2></div><p className="max-w-md text-sm leading-7 text-white/55">Super admins govern the platform. Merchant owners operate their businesses. Staff see only the work their role and store assignments permit.</p></div>
          <div id="architecture" className="grid gap-px bg-white/12 lg:grid-cols-4">{operations.map(({ icon: Icon, label, detail }, index) => <article key={label} className="bg-[#10231a] py-9 lg:px-7"><div className="flex items-center gap-4"><span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-[#c9f269]"><Icon className="size-5" /></span><span className="font-serif text-lg italic text-white/35">0{index + 1}</span></div><h3 className="mt-10 text-lg font-black">{label}</h3><p className="mt-3 text-sm leading-6 text-white/50">{detail}</p></article>)}</div>
          <div className="mt-16 flex flex-col items-start justify-between gap-8 rounded-[30px] bg-[#c9f269] p-7 text-[#10231a] sm:p-10 lg:flex-row lg:items-center"><div><p className="text-[10px] font-black uppercase tracking-[.18em]">Your commerce network</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-4xl">Ready when the next brand is.</h2></div><Link href="/dashboard" className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#10231a] px-6 text-sm font-black text-white transition hover:-translate-y-0.5">Open your workspace <ArrowRight className="size-4 transition group-hover:translate-x-1" /></Link></div>
        </div>
      </section>
      <footer className="bg-[#0b1812] px-5 py-8 text-white sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1480px] flex-col justify-between gap-5 sm:flex-row sm:items-center"><BrandMark /><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">Multi-tenant commerce infrastructure · Pakistan to the world</p></div></footer>
    </main>
  );
}
