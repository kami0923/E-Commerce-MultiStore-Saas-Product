import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontContentPage, type StorefrontPageName } from "@/components/storefront";
import { getPublishedStorefront, getStorefrontMetadata } from "@/data/storefront";

const pages: StorefrontPageName[] = ["shop", "collections", "about", "contact", "checkout", "track"];
type PublicPageProps = { params: Promise<{ slug: string; page: string }> };

function isStorefrontPage(value: string): value is StorefrontPageName {
  return pages.includes(value as StorefrontPageName);
}

export async function generateMetadata({ params }: PublicPageProps): Promise<Metadata> {
  const { slug, page } = await params;
  if (!isStorefrontPage(page)) return {};
  const store = await getStorefrontMetadata(slug);
  if (!store) return {};
  const pageName = page === "about" ? "Our Story" : page[0].toUpperCase() + page.slice(1);
  const title = `${pageName} | ${store.tenant.name}`;
  const description = `${pageName} at ${store.tenant.name}, a ${store.vertical.toLowerCase().replaceAll("_", " ")} store.`;
  return { title: { absolute: title }, description, alternates: { canonical: `/store/${slug}/${page}` }, openGraph: { title, description, type: "website" }, ...(["checkout", "track"].includes(page) ? { robots: { index: false, follow: false } } : {}) };
}

export default async function PublicStoreContentPage({ params }: PublicPageProps) {
  const { slug, page } = await params;
  if (!isStorefrontPage(page)) notFound();
  const store = await getPublishedStorefront(slug);
  if (!store) notFound();
  return <StorefrontContentPage store={store} page={page} />;
}
