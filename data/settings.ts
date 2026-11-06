import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getSettingsWorkspace() {
  const scope = await getAuthorizedStoreScope("stores.view");
  const where = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const stores = await db.store.findMany({ where, orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }], select: { id: true, tenantId: true, name: true, slug: true, status: true, vertical: true, currency: true, defaultLocale: true, enabledLocales: true, themeKey: true, customDomain: true, tenant: { select: { name: true } } } });
  return { stores, platformAccess: scope.platformAccess };
}
