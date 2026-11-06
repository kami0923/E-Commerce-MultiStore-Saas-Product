import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getWhatsAppWorkspace() {
  const scope = await getAuthorizedStoreScope("stores.manage");
  const storeWhere = scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullTenantIds } }, { id: { in: scope.storeIds } }] };
  const stores = await db.store.findMany({
    where: storeWhere,
    orderBy: [{ tenant: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      tenantId: true,
      name: true,
      slug: true,
      status: true,
      tenant: { select: { name: true } },
      whatsappConnection: {
        select: {
          id: true,
          status: true,
          displayPhoneNumber: true,
          verifiedName: true,
          qualityRating: true,
          lastError: true,
          connectedAt: true,
          lastVerifiedAt: true,
        },
      },
    },
  });
  return { stores, platformAccess: scope.platformAccess };
}
