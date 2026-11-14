import "server-only";

import { getAuthorizedStoreScope } from "@/data/auth";
import { db } from "@/lib/db";

export async function getSubscriptionWorkspace() {
  const scope = await getAuthorizedStoreScope("stores.view");
  const tenantWhere = scope.platformAccess
    ? undefined
    : { OR: [{ id: { in: scope.fullTenantIds } }, { stores: { some: { id: { in: scope.storeIds } } } }] };

  const [tenants, plans] = await Promise.all([
    db.tenant.findMany({
      where: tenantWhere,
      orderBy: { name: "asc" },
      take: 100,
      select: {
        id: true,
        name: true,
        countryCode: true,
        baseCurrency: true,
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            plan: {
              select: {
                id: true,
                code: true,
                name: true,
                market: true,
                currency: true,
                monthlyMinor: true,
                storeLimit: true,
                staffLimit: true,
                productLimit: true,
                mediaStorageMb: true,
              },
            },
          },
        },
        _count: {
          select: {
            stores: { where: { status: { not: "ARCHIVED" } } },
            memberships: { where: { active: true } },
            invitations: { where: { status: "PENDING", expiresAt: { gt: new Date() } } },
            products: { where: { status: { not: "ARCHIVED" } } },
            mediaAssets: true,
          },
        },
      },
    }),
    db.subscriptionPlan.findMany({ where: { active: true }, orderBy: [{ market: "asc" }, { monthlyMinor: "asc" }] }),
  ]);

  const mediaByTenant = await db.mediaAsset.groupBy({
    by: ["tenantId"],
    where: { tenantId: { in: tenants.map(tenant => tenant.id) } },
    _sum: { sizeBytes: true },
  });
  const mediaMap = new Map(mediaByTenant.map(row => [row.tenantId, row._sum.sizeBytes ?? 0]));

  return {
    platformAccess: scope.platformAccess,
    plans,
    tenants: tenants.map(tenant => ({
      ...tenant,
      usage: {
        stores: tenant._count.stores,
        staff: tenant._count.memberships + tenant._count.invitations,
        members: tenant._count.memberships,
        pendingInvitations: tenant._count.invitations,
        products: tenant._count.products,
        mediaFiles: tenant._count.mediaAssets,
        mediaBytes: mediaMap.get(tenant.id) ?? 0,
      },
    })),
  };
}
