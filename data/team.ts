import "server-only";

import { requireUser } from "@/data/auth";
import { db } from "@/lib/db";
import { roleCan } from "@/lib/permissions";

export async function getTeamWorkspace() {
  const user = await requireUser();
  const tenantIds = user.platformRole === "SUPER_ADMIN" ? undefined : (await db.membership.findMany({ where: { userId: user.id, active: true }, select: { tenantId: true, role: true } })).filter(item => roleCan(item.role, "staff.view")).map(item => item.tenantId);
  if (tenantIds && tenantIds.length === 0) throw new Error("Forbidden: staff access is required.");
  const tenants = await db.tenant.findMany({
    where: tenantIds ? { id: { in: tenantIds } } : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true, name: true,
      stores: { orderBy: { name: "asc" }, select: { id: true, name: true } },
      memberships: { orderBy: { createdAt: "asc" }, select: { id: true, role: true, active: true, createdAt: true, user: { select: { id: true, name: true, email: true, image: true, storeAccess: { select: { storeId: true, tenantId: true } } } }, } },
      invitations: { where: { status: "PENDING", expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" }, select: { id: true, email: true, role: true, storeIds: true, expiresAt: true, createdAt: true } },
    },
  });
  return { user, tenants };
}
