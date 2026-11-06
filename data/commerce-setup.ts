import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getCommerceSetupWorkspace() {
  const scope = await getAuthorizedStoreScope("stores.view");
  const where = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const [stores, plans] = await Promise.all([
    db.store.findMany({ where, orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }], select: { id: true, tenantId: true, name: true, currency: true, tenant: { select: { name: true, countryCode: true, subscription: { select: { status: true, currentPeriodEnd: true, plan: { select: { id: true, name: true, code: true, currency: true, monthlyMinor: true, storeLimit: true, staffLimit: true, features: true } } } } } }, shippingProfiles: { orderBy: { createdAt: "asc" } }, paymentConnections: { orderBy: { createdAt: "asc" } } } }),
    db.subscriptionPlan.findMany({ where: { active: true }, orderBy: [{ market: "asc" }, { monthlyMinor: "asc" }] }),
  ]);
  return { stores, plans, platformAccess: scope.platformAccess };
}
