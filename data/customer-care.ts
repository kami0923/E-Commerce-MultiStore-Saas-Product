import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getCustomerCareWorkspace() {
  const scope = await getAuthorizedStoreScope("orders.manage");
  const storeWhere = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const [stores, customers, promotions, taxRules, returns, notifications] = await Promise.all([
    db.store.findMany({ where: storeWhere, orderBy: { name: "asc" }, select: { id: true, tenantId: true, name: true, currency: true, tenant: { select: { name: true } } } }),
    db.customer.findMany({ where: { store: storeWhere }, orderBy: { updatedAt: "desc" }, take: 100, include: { store: { select: { name: true, currency: true } } } }),
    db.promotion.findMany({ where: { store: storeWhere }, orderBy: { createdAt: "desc" }, include: { store: { select: { name: true, currency: true } } } }),
    db.taxRule.findMany({ where: { store: storeWhere }, orderBy: { createdAt: "desc" }, include: { store: { select: { name: true } } } }),
    db.returnRequest.findMany({ where: { store: storeWhere }, orderBy: { createdAt: "desc" }, include: { store: { select: { name: true } }, order: { select: { orderNumber: true, totalMinor: true, currency: true } } } }),
    db.notificationOutbox.findMany({ where: { store: storeWhere }, orderBy: { createdAt: "desc" }, take: 100, include: { store: { select: { name: true } }, order: { select: { orderNumber: true } } } }),
  ]);
  return { stores, customers, promotions, taxRules, returns, notifications };
}
