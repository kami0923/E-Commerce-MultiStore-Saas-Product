import "server-only";

import { db } from "@/lib/db";
import { requireUser } from "@/data/auth";
import { roleCan } from "@/lib/permissions";

async function commerceScope() {
  const user = await requireUser();
  if (user.platformRole === "SUPER_ADMIN") {
    return { user, platformAccess: true as const, tenantIds: [] as string[], fullStoreTenantIds: [] as string[], storeIds: [] as string[] };
  }

  const [memberships, access] = await Promise.all([
    db.membership.findMany({ where: { userId: user.id, active: true }, select: { tenantId: true, role: true } }),
    db.storeAccess.findMany({ where: { userId: user.id }, select: { storeId: true } }),
  ]);
  return {
    user,
    platformAccess: false as const,
    tenantIds: memberships.map(({ tenantId }) => tenantId),
    fullStoreTenantIds: memberships.filter(({ role }) => role === "OWNER" || role === "ADMIN").map(({ tenantId }) => tenantId),
    storeIds: access.map(({ storeId }) => storeId),
  };
}

export async function getPlatformStats() {
  const scope = await commerceScope();
  const tenantWhere = scope.platformAccess ? {} : { id: { in: scope.tenantIds } };
  const storeWhere = scope.platformAccess ? {} : { OR: [{ tenantId: { in: scope.fullStoreTenantIds } }, { id: { in: scope.storeIds } }] };
  const [businesses, stores, users, pendingInvitations, sales, orderCount, productCount] = await Promise.all([
    db.tenant.count({ where: { ...tenantWhere, status: { in: ["TRIAL", "ACTIVE"] } } }),
    db.store.count({ where: { ...storeWhere, status: { in: ["DRAFT", "ACTIVE"] } } }),
    scope.platformAccess ? db.user.count() : db.user.count({ where: { memberships: { some: { tenantId: { in: scope.tenantIds }, active: true } } } }),
    db.invitation.count({ where: { ...(scope.platformAccess ? {} : { tenantId: { in: scope.tenantIds } }), status: "PENDING", expiresAt: { gt: new Date() } } }),
    db.order.aggregate({ where: { store: storeWhere, status: { not: "CANCELLED" } }, _sum: { totalMinor: true } }),
    db.order.count({ where: { store: storeWhere } }),
    db.product.count({ where: { store: storeWhere, status: { not: "ARCHIVED" } } }),
  ]);
  return { businesses, stores, users, pendingInvitations, totalSalesMinor: sales._sum.totalMinor ?? 0, orderCount, productCount, platformAccess: scope.platformAccess };
}

export async function listBusinesses() {
  const scope = await commerceScope();
  return db.tenant.findMany({
    where: scope.platformAccess ? undefined : { id: { in: scope.tenantIds } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      countryCode: true,
      baseCurrency: true,
      createdAt: true,
      _count: { select: { stores: true, memberships: true } },
    },
  });
}

export async function listStores() {
  const scope = await commerceScope();
  return db.store.findMany({
    where: scope.platformAccess ? undefined : { OR: [{ tenantId: { in: scope.fullStoreTenantIds } }, { id: { in: scope.storeIds } }] },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      tenantId: true,
      name: true,
      slug: true,
      status: true,
      vertical: true,
      currency: true,
      tenant: { select: { name: true } },
      _count: { select: { products: true, orders: true } },
    },
  });
}

export async function businessOptions() {
  const user = await requireUser();
  const manageableTenantIds = user.platformRole === "SUPER_ADMIN" ? null : (await db.membership.findMany({
    where: { userId: user.id, active: true },
    select: { tenantId: true, role: true },
  })).filter(({ role }) => roleCan(role, "stores.create")).map(({ tenantId }) => tenantId);
  return db.tenant.findMany({
    where: { ...(manageableTenantIds ? { id: { in: manageableTenantIds } } : {}), status: { in: ["TRIAL", "ACTIVE"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, baseCurrency: true },
  });
}
