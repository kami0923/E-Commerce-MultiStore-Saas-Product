import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontProductPage } from "@/components/storefront";
import { getPublishedProduct, getPublishedStorefront } from "@/data/storefront";

type ProductPageProps = { params: Promise<{ slug: string; productSlug: string }> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params;
  const product = await getPublishedProduct(slug, productSlug);
  if (!product) return {};
  const title = product.seoTitle || `${product.name} | ${product.store.tenant.name}`;
  const description = product.seoDescription || product.description || `Shop ${product.name} from ${product.store.tenant.name}.`;
  return { title: { absolute: title }, description, alternates: { canonical: `/store/${slug}/product/${productSlug}` }, openGraph: { title, description, type: "website" } };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params;
  const [store, product] = await Promise.all([getPublishedStorefront(slug), getPublishedProduct(slug, productSlug)]);
  if (!store || !product) notFound();
  const variant = product.variants[0];
  const available = variant?.inventory.reduce((sum, item) => sum + item.onHand - item.reserved, 0) ?? 0;
  const structuredData = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description || undefined,
    brand: { "@type": "Brand", name: product.brand || product.store.tenant.name }, sku: variant?.sku,
    offers: variant ? { "@type": "Offer", priceCurrency: product.store.currency, price: (variant.priceMinor / 100).toFixed(2), availability: available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `/store/${slug}/product/${productSlug}` } : undefined,
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><StorefrontProductPage store={store} product={product} /></>;
}
