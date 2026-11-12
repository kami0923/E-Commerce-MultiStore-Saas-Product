import "server-only";

import { connection } from "next/server";
import { db } from "@/lib/db";

export async function getMarketplaceStores() {
  await connection();
  return db.store.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      vertical: true,
      themeKey: true,
      currency: true,
      tenant: { select: { name: true, countryCode: true } },
      products: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          media: {
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
            select: { mediaAsset: { select: { url: true, altText: true } } },
          },
        },
      },
      _count: { select: { products: true, categories: true } },
    },
  });
}

export async function getMerchantAccessStores() {
  return db.store.findMany({
    where: { status: { in: ["ACTIVE", "PAUSED", "DRAFT"] } },
    orderBy: [{ vertical: "asc" }, { tenant: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      vertical: true,
      themeKey: true,
      tenant: { select: { name: true } },
    },
  });
}

export async function getMerchantAccessStore(slug: string) {
  return db.store.findFirst({
    where: { slug, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      name: true,
      slug: true,
      vertical: true,
      themeKey: true,
      tenant: { select: { name: true } },
    },
  });
}
