import "server-only";

import { db } from "@/lib/db";

const storefrontSelect = {
  id: true,
  tenantId: true,
  name: true,
  slug: true,
  status: true,
  vertical: true,
  currency: true,
  defaultLocale: true,
  themeKey: true,
  tenant: { select: { name: true, countryCode: true } },
  shippingProfiles: { where: { enabled: true }, orderBy: { createdAt: "asc" as const }, select: { id: true, name: true, countryCode: true, city: true, rateMinor: true, freeAboveMinor: true, estimatedDays: true } },
  paymentConnections: { where: { enabled: true, status: "CONNECTED" as const }, orderBy: { createdAt: "asc" as const }, select: { provider: true, displayName: true } },
  categories: {
    where: { parentId: null },
    orderBy: { name: "asc" as const },
    select: { id: true, name: true, slug: true, description: true },
  },
  products: {
    where: { status: "ACTIVE" as const },
    orderBy: { createdAt: "desc" as const },
    take: 12,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      brand: true,
      productType: true,
      categories: { select: { category: { select: { id: true, name: true } } } },
      media: { orderBy: { sortOrder: "asc" as const }, select: { isPrimary: true, mediaAsset: { select: { id: true, url: true, altText: true } } } },
      variants: {
        where: { active: true },
        orderBy: { createdAt: "asc" as const },
        select: { id: true, title: true, sku: true, priceMinor: true, compareAtMinor: true, inventory: { select: { onHand: true, reserved: true } } },
      },
    },
  },
};

export async function getPublishedStorefront(slug: string) {
  return db.store.findFirst({ where: { slug, status: "ACTIVE" }, select: storefrontSelect });
}

export async function getStorefrontPreview(storeId: string) {
  return db.store.findUnique({ where: { id: storeId }, select: storefrontSelect });
}

export async function getStorefrontMetadata(slug: string) {
  return db.store.findFirst({ where: { slug }, select: { name: true, vertical: true, tenant: { select: { name: true } } } });
}

export async function getPublishedProduct(storeSlug: string, productSlug: string) {
  return db.product.findFirst({
    where: { slug: productSlug, status: "ACTIVE", store: { slug: storeSlug, status: "ACTIVE" } },
    select: {
      id: true, name: true, slug: true, description: true, brand: true, productType: true, seoTitle: true, seoDescription: true,
      categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
      media: { orderBy: { sortOrder: "asc" }, select: { isPrimary: true, mediaAsset: { select: { id: true, url: true, altText: true } } } },
      variants: { where: { active: true }, orderBy: { createdAt: "asc" }, select: { id: true, title: true, sku: true, priceMinor: true, compareAtMinor: true, attributes: true, inventory: { select: { onHand: true, reserved: true } } } },
      store: { select: { id: true, name: true, slug: true, currency: true, vertical: true, tenantId: true, tenant: { select: { name: true, countryCode: true } } } },
    },
  });
}
