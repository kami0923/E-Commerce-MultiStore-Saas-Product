import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Permission } from "@/lib/permissions";
import { permissions, permissionsForRole, roleCan } from "@/lib/permissions";

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession();
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, platformRole: true, emailVerified: true },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requirePlatformAdmin() {
  const user = await requireUser();
  if (user.platformRole !== "SUPER_ADMIN") {
    throw new Error("Forbidden: platform administrator access is required.");
  }
  return user;
}

export async function requireTenantPermission(tenantId: string, permission: Permission, storeId?: string) {
  const user = await requireUser();

  if (user.platformRole === "SUPER_ADMIN") {
    return { user, tenantId, storeId, role: "OWNER" as const, platformAccess: true };
  }

  const membership = await db.membership.findFirst({
    where: { tenantId, userId: user.id, active: true },
    select: { role: true },
  });

  if (!membership || !roleCan(membership.role, permission)) {
    throw new Error("Forbidden: you do not have permission for this business.");
  }

  if (storeId) {
    const storeAccess = await db.storeAccess.findFirst({
      where: { tenantId, storeId, userId: user.id },
      select: { id: true },
    });
    if (!storeAccess && membership.role !== "OWNER" && membership.role !== "ADMIN") {
      throw new Error("Forbidden: this store is not assigned to you.");
    }
  }

  return { user, tenantId, storeId, role: membership.role, platformAccess: false };
}

export async function requireAnyTenantPermission(permission: Permission) {
  const user = await requireUser();
  if (user.platformRole === "SUPER_ADMIN") return { user, platformAccess: true };

  const memberships = await db.membership.findMany({
    where: { userId: user.id, active: true },
    select: { tenantId: true, role: true },
  });
  const membership = memberships.find(({ role }) => roleCan(role, permission));
  if (!membership) throw new Error("Forbidden: you do not have access to this area.");

  return { user, tenantId: membership.tenantId, role: membership.role, platformAccess: false };
}

export async function getCurrentPermissions() {
  const user = await requireUser();
  if (user.platformRole === "SUPER_ADMIN") return [...permissions];
  const memberships = await db.membership.findMany({
    where: { userId: user.id, active: true },
    select: { role: true },
  });
  return [...new Set(memberships.flatMap(({ role }) => permissionsForRole(role)))];
}

export async function getAuthorizedStoreScope(permission: Permission) {
  const user = await requireUser();
  if (user.platformRole === "SUPER_ADMIN") {
    return { user, platformAccess: true as const, fullTenantIds: [] as string[], storeIds: [] as string[] };
  }

  const memberships = await db.membership.findMany({
    where: { userId: user.id, active: true },
    select: { tenantId: true, role: true },
  });
  const permitted = memberships.filter(({ role }) => roleCan(role, permission));
  const permittedTenantIds = permitted.map(({ tenantId }) => tenantId);
  const fullTenantIds = permitted
    .filter(({ role }) => role === "OWNER" || role === "ADMIN")
    .map(({ tenantId }) => tenantId);
  const storeIds = (await db.storeAccess.findMany({
    where: { userId: user.id, tenantId: { in: permittedTenantIds } },
    select: { storeId: true },
  })).map(({ storeId }) => storeId);

  if (permitted.length === 0) throw new Error("Forbidden: you do not have access to this area.");
  return { user, platformAccess: false as const, fullTenantIds, storeIds };
}

export async function getDashboardWorkspace() {
  const user = await requireUser();
  if (user.platformRole === "SUPER_ADMIN") {
    return {
      name: "Meridian Commerce",
      subtitle: "Commerce OS",
      initials: "M",
      scopeLabel: "Super admin",
      platformAccess: true as const,
      storefront: null,
    };
  }

  const membership = await db.membership.findFirst({
    where: { userId: user.id, active: true },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      tenant: {
        select: {
          name: true,
          stores: { orderBy: { createdAt: "asc" }, take: 1, select: { id: true, name: true, slug: true, status: true } },
        },
      },
    },
  });
  if (!membership) throw new Error("Your account is not assigned to a merchant workspace.");
  const name = membership.tenant.name;
  return {
    name,
    subtitle: "Merchant Console",
    initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase(),
    scopeLabel: `${membership.role.toLowerCase().replace("_", " ")} workspace`,
    platformAccess: false as const,
    storefront: membership.tenant.stores[0] ?? null,
  };
}
