import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, Heart, Mail, MapPin, Menu, Phone, Search, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { CartTrigger, ProductPurchase, StorefrontCartProvider } from "@/components/storefront-cart";
import { StorefrontCatalog } from "@/components/storefront-catalog";
import { StorefrontCheckout } from "@/components/storefront-checkout";
import { StorefrontProductGallery } from "@/components/storefront-product-gallery";
import { OrderTracker } from "@/components/order-tracker";
import { formatMoney } from "@/lib/utils";

type StorefrontData = NonNullable<Awaited<ReturnType<typeof import("@/data/storefront").getStorefrontPreview>>>;
type StorefrontProductData = NonNullable<Awaited<ReturnType<typeof import("@/data/storefront").getPublishedProduct>>>;
export type StorefrontPageName = "shop" | "collections" | "about" | "contact" | "checkout" | "track";

const verticals = {
  CLOTHING: {
    descriptor: "Contemporary clothing house",
    eyebrow: "The signature collection",
    headline: "Style that moves with you.",
    introduction: "Considered silhouettes, expressive details and everyday essentials designed for modern life.",
    collectionTitle: "Curated wardrobes",
    collections: ["Everyday Essentials", "Occasion Edit", "New Season Layers"],
    philosophy: "Personal style should feel expressive, effortless, and entirely your own.",
    productFallback: "Signature clothing",
    accent: "#1b3b2d",
    soft: "#f8f5ef",
    images: [
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  SHOES: {
    descriptor: "Modern footwear studio",
    eyebrow: "Made for every step",
    headline: "Walk your own way.",
    introduction: "From refined everyday pairs to statement silhouettes, discover footwear made for movement and confidence.",
    collectionTitle: "Find your pair",
    collections: ["Everyday Comfort", "Evening Edit", "New Season Sneakers"],
    philosophy: "The right pair should take you further without asking you to compromise on style.",
    productFallback: "Footwear",
    accent: "#29231f",
    soft: "#f5f1eb",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  JEWELLERY: {
    descriptor: "Fine jewellery atelier",
    eyebrow: "Made to be remembered",
    headline: "Small details. Lasting meaning.",
    introduction: "Timeless pieces, luminous finishes and thoughtful forms created to mark everyday and extraordinary moments.",
    collectionTitle: "Jewels with a story",
    collections: ["Everyday Gold", "Occasion Pieces", "Meaningful Gifts"],
    philosophy: "Jewellery becomes truly precious when it carries a memory, a promise, or a piece of you.",
    productFallback: "Fine jewellery",
    accent: "#4d382b",
    soft: "#f7f1e8",
    images: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  COSMETICS: {
    descriptor: "Beauty and cosmetics studio",
    eyebrow: "Beauty, made personal",
    headline: "Your ritual. Your radiance.",
    introduction: "Performance-led colour, skincare and beauty essentials selected to make every routine feel extraordinary.",
    collectionTitle: "Build your ritual",
    collections: ["Complexion", "Colour & Glow", "Daily Skincare"],
    philosophy: "Beauty is not about becoming someone else; it is the ritual of feeling more like yourself.",
    productFallback: "Beauty essential",
    accent: "#6f3d48",
    soft: "#fbf3f2",
    images: [
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=85",
    ],
  },
  MULTI_CATEGORY: {
    descriptor: "Curated lifestyle marketplace",
    eyebrow: "Everything worth discovering",
    headline: "A world of good choices.",
    introduction: "Explore thoughtfully selected fashion, beauty, accessories and everyday finds in one beautifully simple store.",
    collectionTitle: "Shop by department",
    collections: ["Fashion Edit", "Beauty Finds", "Gifts & Lifestyle"],
    philosophy: "A great marketplace makes discovery feel personal, useful, and full of possibility.",
    productFallback: "Curated find",
    accent: "#173c4a",
    soft: "#f1f6f6",
    images: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=88",
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1000&q=85",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1000&q=85",
    ],
  },
} as const;

function StoreShell({ store, preview, children }: { store: StorefrontData; preview: boolean; children: ReactNode }) {
  const config = verticals[store.vertical];
  const base = `/store/${store.slug}`;
  const nav = [["Shop", "shop"], ["Collections", "collections"], ["Our story", "about"], ["Track order", "track"]] as const;
  const vars = { "--store-accent": config.accent, "--store-soft": config.soft } as CSSProperties;
  return <StorefrontCartProvider storeId={store.id} storeSlug={store.slug} accent={config.accent}><main style={vars} className="min-h-screen bg-[var(--store-soft)] text-[#1d241f]">
    {preview && <div className="flex items-center justify-center gap-2 bg-[var(--store-accent)] px-4 py-2 text-center text-xs font-bold text-white"><ShieldCheck className="size-3.5" />Private storefront preview · Current status: {store.status}</div>}
    <header className="sticky top-0 z-20 border-b border-black/10 bg-[var(--store-soft)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center px-5 sm:px-8">
        <details className="group relative mr-4 lg:hidden"><summary aria-label="Open menu" className="grid size-10 cursor-pointer list-none place-items-center rounded-full border border-black/15"><Menu className="size-4" /></summary><div className="absolute left-0 top-12 w-52 rounded-2xl border border-black/10 bg-white p-2 shadow-xl">{nav.map(([label, page]) => <Link key={page} href={`${base}/${page}` as never} className="block rounded-xl px-4 py-3 text-sm font-bold hover:bg-black/5">{label}</Link>)}</div></details>
        <Link href={base as never} className="min-w-0"><p className="truncate font-serif text-xl font-semibold tracking-[.04em] sm:text-2xl">{store.tenant.name}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.28em] text-black/50">{config.descriptor}</p></Link>
        <nav className="ml-12 hidden items-center gap-8 text-xs font-bold uppercase tracking-[.12em] lg:flex">{nav.map(([label, page]) => <Link key={page} href={`${base}/${page}` as never}>{label}</Link>)}</nav>
        <div className="ml-auto flex items-center gap-2"><Link href={`${base}/shop` as never} aria-label="Search products" className="grid size-10 place-items-center rounded-full hover:bg-white"><Search className="size-[18px]" /></Link><CartTrigger /></div>
      </div>
    </header>
    {children}
    <footer className="bg-[#101815] px-5 py-12 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row"><div><p className="font-serif text-2xl">{store.tenant.name}</p><p className="mt-2 text-xs uppercase tracking-[.18em] text-white/45">Powered securely by Meridian Commerce</p></div><div className="flex flex-wrap gap-7 text-xs text-white/60"><Link href={`${base}/shop` as never}>Shop</Link><Link href={`${base}/about` as never}>About</Link><Link href={`${base}/contact` as never}>Contact</Link><span>Privacy</span></div></div></footer>
  </main></StorefrontCartProvider>;
}

function Collections({ store }: { store: StorefrontData }) {
  const config = verticals[store.vertical];
  return <div className="grid gap-4 md:grid-cols-3">{config.collections.map((title, index) => <article key={title} className="group relative min-h-[350px] overflow-hidden bg-cover bg-center" style={{ backgroundImage: `linear-gradient(0deg,rgba(10,20,15,.74),transparent 68%),url('${config.images[index + 1]}')` }}><div className="absolute inset-x-0 bottom-0 p-6 text-white"><p className="font-serif text-2xl">{store.categories[index]?.name || title}</p><p className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-white/70">Explore collection <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></p></div></article>)}</div>;
}

function ProductGrid({ store, filters = false }: { store: StorefrontData; filters?: boolean }) {
  const config = verticals[store.vertical];
  return <StorefrontCatalog storeSlug={store.slug} currency={store.currency} products={store.products} categories={store.categories} images={config.images} fallback={config.productFallback} filters={filters} />;
}

export function Storefront({ store, preview = false }: { store: StorefrontData; preview?: boolean }) {
  const config = verticals[store.vertical];
  const base = `/store/${store.slug}`;
  return <StoreShell store={store} preview={preview}>
    <section className="mx-auto grid min-h-[650px] max-w-[1500px] lg:grid-cols-[.88fr_1.12fr]"><div className="flex flex-col justify-center px-7 py-20 sm:px-14 lg:px-20"><p className="text-xs font-black uppercase tracking-[.24em] text-black/50">{config.eyebrow}</p><h1 className="mt-7 max-w-xl font-serif text-5xl leading-[.94] tracking-[-.045em] sm:text-7xl">{config.headline}</h1><p className="mt-7 max-w-lg text-base leading-8 text-black/60">{config.introduction}</p><div className="mt-9 flex flex-wrap gap-3"><Link href={`${base}/shop` as never} className="inline-flex h-12 items-center gap-3 rounded-full bg-[var(--store-accent)] px-6 text-sm font-bold text-white">Shop the collection <ArrowRight className="size-4" /></Link><Link href={`${base}/about` as never} className="inline-flex h-12 items-center rounded-full border border-black/20 px-6 text-sm font-bold">Discover our story</Link></div><div className="mt-12 flex gap-8 border-t border-black/10 pt-6 text-xs text-black/55"><span><b className="block text-black/80">Pakistan-wide</b>Delivery ready</span><span><b className="block text-black/80">Secure</b>Merchant managed</span></div></div><div className="relative min-h-[500px] overflow-hidden bg-[#d8d0c4] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(90deg,rgba(255,255,255,.08),rgba(0,0,0,.04)),url('${config.images[0]}')` }}><div className="absolute bottom-6 left-6 rounded-full bg-white/85 px-4 py-2 text-xs font-bold backdrop-blur">{store.tenant.name} · New edit</div></div></section>
    <section className="bg-[var(--store-accent)] px-5 py-16 text-white sm:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-white/60">Explore by collection</p><h2 className="mt-3 font-serif text-4xl">{config.collectionTitle}</h2></div><Link href={`${base}/collections` as never} className="flex items-center gap-2 text-sm font-bold">View all collections <ArrowRight className="size-4" /></Link></div><div className="mt-9"><Collections store={store} /></div></div></section>
    <section className="px-5 py-20 sm:px-8"><div className="mx-auto max-w-7xl"><div className="text-center"><p className="text-xs font-black uppercase tracking-[.22em] text-black/45">New arrivals</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">The latest from {store.tenant.name}</h2></div><div className="mt-12"><ProductGrid store={store} /></div></div></section>
    <section className="border-y border-black/10 bg-white/45 px-5 py-20 text-center sm:px-8"><div className="mx-auto max-w-3xl"><p className="text-xs font-black uppercase tracking-[.22em] text-black/45">Our philosophy</p><blockquote className="mt-6 font-serif text-3xl leading-tight sm:text-5xl">“{config.philosophy}”</blockquote><Link href={`${base}/about` as never} className="mt-8 inline-flex items-center gap-2 text-sm font-bold">Read our story <ArrowRight className="size-4" /></Link></div></section>
  </StoreShell>;
}

export function StorefrontContentPage({ store, page }: { store: StorefrontData; page: StorefrontPageName }) {
  const config = verticals[store.vertical];
  return <StoreShell store={store} preview={false}>
    {page === "shop" && <><section className="px-5 py-16 text-center sm:px-8"><p className="text-xs font-black uppercase tracking-[.22em] text-black/45">The complete edit</p><h1 className="mt-4 font-serif text-5xl sm:text-6xl">Shop {store.tenant.name}</h1><p className="mx-auto mt-5 max-w-2xl leading-7 text-black/55">Browse every active product currently available from this store.</p></section><section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8"><ProductGrid store={store} filters /></section></>}
    {page === "collections" && <><section className="px-5 py-16 text-center sm:px-8"><p className="text-xs font-black uppercase tracking-[.22em] text-black/45">Curated for discovery</p><h1 className="mt-4 font-serif text-5xl sm:text-6xl">{config.collectionTitle}</h1></section><section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8"><Collections store={store} /></section></>}
    {page === "about" && <><section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-black uppercase tracking-[.22em] text-black/45">About the brand</p><h1 className="mt-5 font-serif text-5xl leading-tight sm:text-6xl">Designed with intention.</h1><p className="mt-7 max-w-xl text-base leading-8 text-black/60">{store.tenant.name} is an independent {config.descriptor.toLowerCase()} built around quality, thoughtful selection and a clear point of view. This page is ready for the merchant to replace with their complete brand story.</p><blockquote className="mt-9 border-l-2 border-[var(--store-accent)] pl-6 font-serif text-2xl">“{config.philosophy}”</blockquote></div><div className="min-h-[560px] bg-cover bg-center" style={{ backgroundImage: `url('${config.images[1]}')` }} /></section><section className="bg-[var(--store-accent)] px-5 py-16 text-white sm:px-8"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">{[["01", "Thoughtful quality"], ["02", "Personal service"], ["03", "Confident expression"]].map(([number, value]) => <div key={number} className="border-t border-white/25 pt-5"><p className="text-xs text-white/50">{number}</p><h2 className="mt-4 font-serif text-2xl">{value}</h2></div>)}</div></section></>}
    {page === "contact" && <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-black uppercase tracking-[.22em] text-black/45">We are here to help</p><h1 className="mt-4 font-serif text-5xl sm:text-6xl">Contact us.</h1><p className="mt-6 max-w-md leading-7 text-black/55">Questions about products, sizing, delivery or an order? Send the store team a message.</p><div className="mt-10 space-y-5 text-sm"><p className="flex items-center gap-3"><Mail className="size-4" /> Email support</p><p className="flex items-center gap-3"><Phone className="size-4" /> Phone and WhatsApp</p><p className="flex items-center gap-3"><MapPin className="size-4" /> Pakistan</p></div></div><form className="rounded-3xl bg-white p-6 shadow-sm sm:p-9"><div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-bold">Name<input name="name" className="mt-2 h-12 w-full rounded-xl border border-black/15 px-4 text-sm font-normal outline-none focus:border-[var(--store-accent)]" /></label><label className="text-xs font-bold">Email<input type="email" name="email" className="mt-2 h-12 w-full rounded-xl border border-black/15 px-4 text-sm font-normal outline-none focus:border-[var(--store-accent)]" /></label></div><label className="mt-5 block text-xs font-bold">Subject<input name="subject" className="mt-2 h-12 w-full rounded-xl border border-black/15 px-4 text-sm font-normal outline-none focus:border-[var(--store-accent)]" /></label><label className="mt-5 block text-xs font-bold">Message<textarea name="message" rows={6} className="mt-2 w-full rounded-xl border border-black/15 p-4 text-sm font-normal outline-none focus:border-[var(--store-accent)]" /></label><button type="button" className="mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-[var(--store-accent)] px-6 text-sm font-bold text-white">Send enquiry <ArrowRight className="size-4" /></button></form></section>}
    {page === "checkout" && <StorefrontCheckout storeSlug={store.slug} currency={store.currency} shippingProfiles={store.shippingProfiles} paymentConnections={store.paymentConnections} />}
    {page === "track" && <OrderTracker storeSlug={store.slug} />}
  </StoreShell>;
}

export function StorefrontProductPage({ store, product }: { store: StorefrontData; product: StorefrontProductData }) {
  const originalConfig = verticals[store.vertical];
  const uploadedImages = product.media.map(item => item.mediaAsset.url);
  const galleryImages = uploadedImages.length > 0 ? uploadedImages : originalConfig.images.slice(1);
  const image = galleryImages[0] || originalConfig.images[1];
  const firstVariant = product.variants[0];
  return <StoreShell store={store} preview={false}><section className="mx-auto max-w-7xl px-5 py-8 sm:px-8"><div className="mb-7 flex items-center gap-2 text-xs text-black/40"><Link href={`/store/${store.slug}` as never}>Home</Link><span>/</span><Link href={`/store/${store.slug}/shop` as never}>Shop</Link><span>/</span><span className="text-black/70">{product.name}</span></div><div className="grid gap-10 lg:grid-cols-[1.08fr_.92fr]"><StorefrontProductGallery images={galleryImages} productName={product.name} /><div className="flex flex-col justify-center lg:px-8"><p className="text-xs font-black uppercase tracking-[.18em] text-black/40">{product.brand || product.productType || originalConfig.productFallback}</p><h1 className="mt-4 font-serif text-5xl leading-[1.02] sm:text-6xl">{product.name}</h1>{firstVariant && <div className="mt-5 flex items-center gap-3"><p className="text-xl font-bold">{formatMoney(firstVariant.priceMinor, store.currency)}</p>{firstVariant.compareAtMinor && firstVariant.compareAtMinor > firstVariant.priceMinor && <p className="text-sm text-black/35 line-through">{formatMoney(firstVariant.compareAtMinor, store.currency)}</p>}</div>}<p className="mt-7 text-[15px] leading-8 text-black/55">{product.description || `A considered ${originalConfig.productFallback.toLowerCase()} selected by ${store.tenant.name} for its quality, character and everyday versatility.`}</p><div className="mt-8"><p className="mb-3 text-xs font-black uppercase tracking-[.16em] text-black/50">Choose an option</p><ProductPurchase productSlug={product.slug} name={product.name} currency={store.currency} image={image} variants={product.variants} /></div><div className="mt-9 grid gap-3 border-y border-black/10 py-6 text-sm"><p className="flex items-center gap-3"><Truck className="size-4 text-black/45" /> Delivery coordinated by the merchant</p><p className="flex items-center gap-3"><ShieldCheck className="size-4 text-black/45" /> Stock reserved securely at checkout</p><p className="flex items-center gap-3"><Heart className="size-4 text-black/45" /> Carefully selected by {store.tenant.name}</p></div></div></div></section><section className="mt-12 bg-[var(--store-accent)] px-5 py-16 text-white sm:px-8"><div className="mx-auto max-w-7xl text-center"><p className="text-xs font-bold uppercase tracking-[.2em] text-white/55">The details matter</p><h2 className="mx-auto mt-4 max-w-3xl font-serif text-4xl sm:text-5xl">Designed to become part of your story, not just your wardrobe.</h2></div></section></StoreShell>;
}
