import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";
import type { Permission } from "@/lib/permissions";

async function storeScope(permission: Permission) {
  const scope = await getAuthorizedStoreScope(permission);
  return {
    scope,
    where: scope.platformAccess
      ? undefined
      : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] },
  };
}

export async function getAccessibleStoreIds(permission: Permission) {
  const { where } = await storeScope(permission);
  return (await db.store.findMany({ where, select: { id: true } })).map(({ id }) => id);
}

export async function getCatalogWorkspace() {
  const { where } = await storeScope("products.view");
  const [stores, products, categories, mediaAssets] = await Promise.all([
    db.store.findMany({
      where,
      orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
      select: { id: true, tenantId: true, name: true, currency: true, tenant: { select: { name: true } } },
    }),
    db.product.findMany({
      where: { store: where },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        tenantId: true,
        storeId: true,
        name: true,
        brand: true,
        productType: true,
        status: true,
        createdAt: true,
        store: { select: { name: true, currency: true } },
        categories: { select: { category: { select: { id: true, name: true } } } },
        media: { orderBy: { sortOrder: "asc" }, select: { isPrimary: true, mediaAsset: { select: { id: true, url: true, altText: true } } } },
        variants: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            title: true,
            sku: true,
            priceMinor: true,
            active: true,
            inventory: { select: { id: true, onHand: true, reserved: true, incoming: true, reorderPoint: true } },
          },
        },
      },
    }),
    db.category.findMany({
      where: { store: where },
      orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        tenantId: true,
        storeId: true,
        name: true,
        description: true,
        parentId: true,
        store: { select: { name: true } },
        _count: { select: { products: true, children: true } },
      },
    }),
    db.mediaAsset.findMany({ where: { store: where }, orderBy: { createdAt: "desc" }, select: { id: true, tenantId: true, storeId: true, url: true, originalName: true, altText: true } }),
  ]);
  return { stores, products, categories, mediaAssets };
}

export async function getInventoryWorkspace() {
  const { where } = await storeScope("inventory.view");
  const items = await db.inventoryItem.findMany({
    where: { store: where },
    orderBy: [{ store: { name: "asc" } }, { variant: { product: { name: "asc" } } }],
    select: {
      id: true,
      tenantId: true,
      storeId: true,
      locationKey: true,
      onHand: true,
      reserved: true,
      incoming: true,
      reorderPoint: true,
      updatedAt: true,
      store: { select: { name: true } },
      variant: { select: { sku: true, title: true, product: { select: { name: true, status: true } } } },
    },
  });
  return { items };
}

export async function getOrdersWorkspace() {
  const { where } = await storeScope("orders.view");
  const [stores, orders] = await Promise.all([
    db.store.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        tenantId: true,
        name: true,
        currency: true,
        tenant: { select: { name: true } },
        products: {
          where: { status: "ACTIVE" },
          select: {
            name: true,
            variants: {
              where: { active: true },
              select: {
                id: true,
                sku: true,
                title: true,
                priceMinor: true,
                inventory: { select: { onHand: true, reserved: true } },
              },
            },
          },
        },
      },
    }),
    db.order.findMany({
      where: { store: where },
      orderBy: { placedAt: "desc" },
      take: 100,
      select: {
        id: true,
        tenantId: true,
        storeId: true,
        orderNumber: true,
        status: true,
        currency: true,
        totalMinor: true,
        customerEmail: true,
        customerName: true,
        placedAt: true,
        store: { select: { name: true } },
        items: { select: { id: true, productName: true, variantName: true, sku: true, quantity: true, totalMinor: true } },
      },
    }),
  ]);
  return { stores, orders };
}

export async function getAuditWorkspace() {
  const { scope } = await storeScope("audit.view");
  return db.auditLog.findMany({
    where: scope.platformAccess ? undefined : { tenantId: { in: scope.fullTenantIds } },
    orderBy: { createdAt: "desc" },
    take: 150,
    select: {
      id: true,
      action: true,
      entityType: true,
      summary: true,
      changes: true,
      createdAt: true,
      tenant: { select: { name: true } },
      store: { select: { name: true } },
      actor: { select: { name: true, email: true } },
    },
  });
}
