import Link from "next/link";
import { ArrowUpRight, ArrowRight, BarChart3, Boxes, Check, ChevronRight, Globe2, ShieldCheck, ShoppingBag, Sparkles, Store, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { getMarketplaceStores } from "@/data/marketplace";

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

const marketplaceFallback: Record<string, string> = {
  CLOTHING: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=86",
  SHOES: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=86",
  JEWELLERY: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=86",
  COSMETICS: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=86",
  MULTI_CATEGORY: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=86",
};

export default async function HomePage() {
  const stores = await getMarketplaceStores();
  const categories = [...new Set(stores.map(store => store.vertical))];
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
            <a href="#brands" className="transition hover:text-[#10231a]">Shop brands</a>
            <a href="#platform" className="transition hover:text-[#10231a]">Platform</a>
            <a href="#operations" className="transition hover:text-[#10231a]">Operations</a>
            <a href="#architecture" className="transition hover:text-[#10231a]">Architecture</a>
          </div>
          <Link href="/sign-in" className="group inline-flex h-12 items-center gap-3 rounded-full bg-[#10231a] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(16,35,26,.15)] transition hover:-translate-y-0.5 hover:bg-[#174632]">
            Merchant login <span className="grid size-7 place-items-center rounded-full bg-white/10"><ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" /></span>
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
              <a href="#brands" className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#c9f269] px-6 text-sm font-black text-[#10231a] shadow-[0_14px_34px_rgba(120,158,47,.22)] transition hover:-translate-y-0.5 hover:bg-[#d3fa79]">
                Explore live brands <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </a>
              <a href="#platform" className="inline-flex h-14 items-center gap-2 rounded-full border border-[#ccd4cc] bg-white/65 px-6 text-sm font-black transition hover:bg-white">
                Explore capabilities <ChevronRight className="size-4" />
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#d4dad2] pt-6 text-xs font-bold text-[#657269]">
              {["PostgreSQL foundation", "Tenant-isolated", "English + Urdu ready"].map(item => <span key={item} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-full bg-[#dff3a9]"><Check className="size-3 text-[#315a45]" /></span>{item}</span>)}
            </div>
          </div>

          <div className="animate-enter delay-2 relative mx-auto w-full max-w-[820px] lg:ml-auto">
            <div className="absolute -inset-5 -z-10 rotate-2 rounded-[46px] bg-[#c9f269]/30 blur-2xl" />
            <div className="overflow-hidden rounded-[34px] border border-white/80 bg-[#10231a] p-2.5 shadow-[0_45px_100px_rgba(16,35,26,.28)]">
              <div className="overflow-hidden rounded-[26px] bg-[#f8f9f5]">
                <div className="flex flex-col gap-5 border-b border-[#dfe5dd] px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-7">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#52705e]"><span className="size-2 rounded-full bg-[#8fc655] shadow-[0_0_0_5px_rgba(143,198,85,.13)]" /> Live on Meridian</div>
                    <h2 className="mt-3 text-2xl font-black tracking-[-.045em] sm:text-3xl">Official storefronts</h2>
                    <p className="mt-2 text-xs leading-5 text-[#748078]">Choose a brand and enter its public website.</p>
                  </div>
                  <div className="rounded-2xl bg-[#eaf4d2] px-4 py-3 text-left sm:text-right"><p className="text-2xl font-black leading-none text-[#315a45]">{stores.length}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[.12em] text-[#69805f]">public stores</p></div>
                </div>

                {stores.length > 0 ? (
                  <div className="grid max-h-[575px] gap-3 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
                    {stores.map((store, index) => {
                      const image = store.products.flatMap(product => product.media).map(item => item.mediaAsset.url)[0] ?? marketplaceFallback[store.vertical];
                      return (
                        <Link key={store.id} href={`/store/${store.slug}`} className={`group relative min-h-[245px] overflow-hidden rounded-[22px] bg-[#17382a] text-white shadow-[0_12px_28px_rgba(16,35,26,.1)] ${index === 0 ? "sm:col-span-2 sm:min-h-[285px]" : ""}`}>
                          <div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${image}')` }} />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#07130d]/95 via-[#07130d]/25 to-black/10" />
                          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
                            <span className="rounded-full border border-white/20 bg-black/20 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] backdrop-blur">{store.vertical.toLowerCase().replaceAll("_", " ")}</span>
                            <span className="grid size-9 place-items-center rounded-full bg-white text-[#10231a] transition group-hover:rotate-45"><ArrowUpRight className="size-4" /></span>
                          </div>
                          <div className="absolute inset-x-0 bottom-0 p-5">
                            <p className="text-[9px] font-black uppercase tracking-[.16em] text-white/60">Official Meridian store · {store.currency}</p>
                            <h3 className="mt-2 font-serif text-3xl leading-none">{store.name}</h3>
                            <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-[9px] font-bold text-white/65"><span>{store.tenant.name}</span><span className="inline-flex items-center gap-1.5 text-white">Visit store <ArrowRight className="size-3" /></span></div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid min-h-[420px] place-items-center p-8 text-center"><div><Store className="mx-auto size-8 text-[#52705e]" /><h3 className="mt-5 text-xl font-black">No public stores are live yet.</h3><p className="mt-2 text-sm text-[#748078]">Activated storefronts will appear here automatically.</p></div></div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="brands" className="border-b border-[#d8ded7] bg-[#eef0e9] px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-[1480px]">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-[#53715f]">The Meridian marketplace</p><h2 className="mt-5 max-w-4xl text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl">Independent brands.<br /><span className="font-serif font-normal italic text-[#47765d]">One beautiful destination.</span></h2></div><div className="max-w-lg"><p className="text-sm leading-7 text-[#68756d]">Every active storefront created by Meridian appears here automatically. Visitors can discover a brand, browse its public website, and shop without entering a merchant dashboard.</p><div className="mt-5 flex flex-wrap gap-2">{categories.map(category => <span key={category} className="rounded-full border border-[#cfd7cf] bg-white/65 px-3 py-2 text-[10px] font-black uppercase tracking-[.1em] text-[#52665a]">{category.toLowerCase().replaceAll("_", " ")}</span>)}</div></div></div>
          {stores.length > 0 ? <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{stores.map((store, index) => { const image = store.products.flatMap(product => product.media).map(item => item.mediaAsset.url)[0] ?? marketplaceFallback[store.vertical]; return <Link key={store.id} href={`/store/${store.slug}`} className={`group relative min-h-[480px] overflow-hidden rounded-[30px] bg-[#17382a] shadow-[0_22px_60px_rgba(16,35,26,.1)] ${index === 0 ? "xl:col-span-2" : ""}`}><div className="absolute inset-0 bg-cover bg-center transition duration-1000 group-hover:scale-[1.045]" style={{ backgroundImage: `url('${image}')` }} /><div className="absolute inset-0 bg-gradient-to-t from-[#07130d]/90 via-[#07130d]/15 to-transparent" /><div className="absolute inset-x-0 top-0 flex items-center justify-between p-5"><span className="rounded-full border border-white/20 bg-black/15 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-white backdrop-blur">{store.vertical.toLowerCase().replaceAll("_", " ")}</span><span className="grid size-11 place-items-center rounded-full bg-white text-[#10231a] transition duration-300 group-hover:rotate-45 group-hover:scale-105"><ArrowUpRight className="size-4" /></span></div><div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-8"><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/55">{store.name} · {store.currency}</p><h3 className="mt-3 font-serif text-4xl sm:text-5xl">{store.tenant.name}</h3><div className="mt-6 flex items-center gap-5 border-t border-white/15 pt-5 text-[10px] font-bold text-white/55"><span>{store._count.products} products</span><span>{store._count.categories} collections</span><span>{store.themeKey} design</span></div></div></Link>; })}</div> : <div className="mt-14 rounded-[30px] border border-dashed border-[#bfcbbf] bg-white/55 p-12 text-center"><Store className="mx-auto size-7 text-[#51705e]" /><h3 className="mt-5 text-2xl font-black">The first storefront is being prepared.</h3><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#6b786f]">Published stores will appear in this marketplace automatically as soon as a Meridian super administrator activates them.</p></div>}
        </div>
      </section>

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
