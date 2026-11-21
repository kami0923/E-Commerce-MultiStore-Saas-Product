import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getProcurementWorkspace() {
  const scope = await getAuthorizedStoreScope("inventory.view");
  const storeWhere = scope.platformAccess
    ? undefined
    : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };

  const [stores, suppliers, purchaseOrders, movements] = await Promise.all([
    db.store.findMany({
      where: storeWhere,
      orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true, tenantId: true, name: true, currency: true, tenant: { select: { name: true } },
        products: {
          where: { status: { not: "ARCHIVED" } },
          select: { name: true, variants: { where: { active: true }, orderBy: { sku: "asc" }, select: { id: true, sku: true, title: true, costMinor: true } } },
        },
      },
    }),
    db.supplier.findMany({
      where: { store: storeWhere },
      orderBy: [{ store: { name: "asc" } }, { name: "asc" }],
      select: { id: true, tenantId: true, storeId: true, name: true, email: true, phone: true, notes: true, active: true, store: { select: { name: true } } },
    }),
    db.purchaseOrder.findMany({
      where: { store: storeWhere },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, tenantId: true, storeId: true, number: true, status: true, currency: true, expectedAt: true, createdAt: true,
        store: { select: { name: true } }, supplier: { select: { name: true } },
        lines: { select: { id: true, orderedQuantity: true, receivedQuantity: true, unitCostMinor: true, variant: { select: { sku: true, title: true, product: { select: { name: true } } } } } },
      },
    }),
    db.stockMovement.findMany({
      where: { store: storeWhere },
      orderBy: { createdAt: "desc" },
      take: 75,
      select: { id: true, type: true, quantity: true, note: true, createdAt: true, store: { select: { name: true } }, variant: { select: { sku: true, product: { select: { name: true } } } }, actor: { select: { name: true } } },
    }),
  ]);

  return { stores, suppliers, purchaseOrders, movements };
}
