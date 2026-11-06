import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Storefront } from "@/components/storefront";
import { getPublishedStorefront, getStorefrontMetadata } from "@/data/storefront";

type StorePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefrontMetadata(slug);
  if (!store) return {};
  const title = `${store.tenant.name} | ${store.name}`;
  const description = `Shop the latest ${store.vertical.toLowerCase().replaceAll("_", " ")} collection from ${store.tenant.name}.`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/store/${slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = await getPublishedStorefront(slug);
  if (!store) notFound();
  return <Storefront store={store} />;
}
