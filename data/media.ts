import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getMediaWorkspace() {
  const scope = await getAuthorizedStoreScope("products.view");
  const storeWhere = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const [stores, assets] = await Promise.all([
    db.store.findMany({ where: storeWhere, orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }], select: { id: true, tenantId: true, name: true, tenant: { select: { name: true } } } }),
    db.mediaAsset.findMany({ where: { store: storeWhere }, orderBy: { createdAt: "desc" }, select: { id: true, tenantId: true, storeId: true, originalName: true, mimeType: true, sizeBytes: true, url: true, altText: true, createdAt: true, store: { select: { name: true } } } }),
  ]);
  return { stores, assets };
}
