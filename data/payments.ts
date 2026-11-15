import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getPaymentsWorkspace() {
  const scope = await getAuthorizedStoreScope("orders.view");
  const storeWhere = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const [orders, transactions] = await Promise.all([
    db.order.findMany({
      where: { store: storeWhere, status: { not: "CANCELLED" } }, orderBy: { placedAt: "desc" }, take: 150,
      select: { id: true, tenantId: true, storeId: true, orderNumber: true, status: true, currency: true, totalMinor: true, customerName: true, customerEmail: true, placedAt: true, store: { select: { name: true } }, paymentTransactions: { orderBy: { createdAt: "asc" }, select: { id: true, type: true, status: true, amountMinor: true, provider: true, providerReference: true, note: true, processedAt: true, createdAt: true } } },
    }),
    db.paymentTransaction.findMany({
      where: { store: storeWhere }, orderBy: { createdAt: "desc" }, take: 200,
      select: { id: true, type: true, status: true, amountMinor: true, currency: true, provider: true, providerReference: true, note: true, processedAt: true, createdAt: true, order: { select: { orderNumber: true } }, store: { select: { name: true } }, actor: { select: { name: true } } },
    }),
  ]);
  return { orders, transactions };
}
