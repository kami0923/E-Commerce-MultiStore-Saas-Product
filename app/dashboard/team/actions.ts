"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantPermission } from "@/data/auth";
import { canInviteTeamMember } from "@/data/subscription-limits";
import { db } from "@/lib/db";
import { generateInvitationToken } from "@/lib/invitations";
import { getRequestOrigin } from "@/lib/request-origin";

export type TeamActionState = { status: "idle" | "success" | "error"; message?: string; invitationUrl?: string; errors?: Record<string, string[]> };
const role = z.enum(["ADMIN", "MANAGER", "CATALOG_MANAGER", "INVENTORY_MANAGER", "ORDER_MANAGER", "MARKETING_MANAGER", "ANALYST", "SUPPORT", "VIEWER"]);

export async function inviteTeamMemberAction(_state: TeamActionState, formData: FormData): Promise<TeamActionState> {
  const parsed = z.object({ tenantId: z.string().min(1), email: z.email().trim().toLowerCase(), role, storeIds: z.array(z.string()).min(1, "Select at least one store.") }).safeParse({ tenantId: formData.get("tenantId"), email: formData.get("email"), role: formData.get("role"), storeIds: formData.getAll("storeId") });
  if (!parsed.success) return { status: "error", errors: parsed.error.flatten().fieldErrors, message: "Check the invitation details." };
  const value = parsed.data;
  const scope = await requireTenantPermission(value.tenantId, "staff.manage");
  const capacity = await canInviteTeamMember(value.tenantId);
  if (!capacity.allowed) return { status: "error", message: capacity.message };
  const validStores = await db.store.count({ where: { tenantId: value.tenantId, id: { in: value.storeIds } } });
  if (validStores !== new Set(value.storeIds).size) return { status: "error", message: "A selected store is outside this business." };
  const existing = await db.user.findUnique({ where: { email: value.email }, select: { memberships: { where: { tenantId: value.tenantId }, select: { id: true } } } });
  if (existing?.memberships.length) return { status: "error", message: "This email is already a member of the business." };
  const { token, tokenHash } = generateInvitationToken();
  await db.$transaction(async tx => {
    await tx.invitation.updateMany({ where: { tenantId: value.tenantId, email: value.email, status: "PENDING" }, data: { status: "REVOKED" } });
    const invitation = await tx.invitation.create({ data: { tenantId: value.tenantId, invitedById: scope.user.id, email: value.email, role: value.role, storeIds: [...new Set(value.storeIds)], tokenHash, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) } });
    await tx.auditLog.create({ data: { tenantId: value.tenantId, actorId: scope.user.id, action: "staff.invited", entityType: "Invitation", entityId: invitation.id, summary: `Invited ${value.email} as ${value.role.toLowerCase().replaceAll("_", " ")}`, changes: { storeIds: value.storeIds } } });
  });
  revalidatePath("/dashboard/team");
  const appUrl = await getRequestOrigin();
  return { status: "success", message: "Secure invitation created. Share this link with the invited person.", invitationUrl: `${appUrl}/invite/${token}` };
}

export async function updateMemberAccessAction(formData: FormData) {
  const parsed = z.object({ tenantId: z.string().min(1), userId: z.string().min(1), role, storeIds: z.array(z.string()).min(1) }).parse({ tenantId: formData.get("tenantId"), userId: formData.get("userId"), role: formData.get("role"), storeIds: formData.getAll("storeId") });
  const scope = await requireTenantPermission(parsed.tenantId, "staff.manage");
  if (scope.user.id === parsed.userId) throw new Error("You cannot change your own role or store access.");
  const membership = await db.membership.findUnique({ where: { tenantId_userId: { tenantId: parsed.tenantId, userId: parsed.userId } }, select: { id: true, role: true, user: { select: { email: true } } } });
  if (!membership) throw new Error("Member not found.");
  if (membership.role === "OWNER") throw new Error("Ownership cannot be changed from this workspace.");
  const stores = await db.store.findMany({ where: { tenantId: parsed.tenantId, id: { in: parsed.storeIds } }, select: { id: true } });
  if (stores.length !== new Set(parsed.storeIds).size) throw new Error("Invalid store assignment.");
  await db.$transaction(async tx => {
    await tx.membership.update({ where: { id: membership.id }, data: { role: parsed.role, active: true } });
    await tx.storeAccess.deleteMany({ where: { tenantId: parsed.tenantId, userId: parsed.userId } });
    for (const store of stores) await tx.storeAccess.create({ data: { tenantId: parsed.tenantId, storeId: store.id, userId: parsed.userId, role: parsed.role } });
    await tx.auditLog.create({ data: { tenantId: parsed.tenantId, actorId: scope.user.id, action: "staff.access_updated", entityType: "Membership", entityId: membership.id, summary: `Updated ${membership.user.email} access`, changes: { beforeRole: membership.role, afterRole: parsed.role, storeIds: parsed.storeIds } } });
  });
  revalidatePath("/dashboard/team");
}

export async function setMemberActiveAction(formData: FormData) {
  const parsed = z.object({ tenantId: z.string().min(1), userId: z.string().min(1), active: z.enum(["true", "false"]) }).parse({ tenantId: formData.get("tenantId"), userId: formData.get("userId"), active: formData.get("active") });
  const scope = await requireTenantPermission(parsed.tenantId, "staff.manage");
  if (scope.user.id === parsed.userId) throw new Error("You cannot suspend your own access.");
  const membership = await db.membership.findUnique({ where: { tenantId_userId: { tenantId: parsed.tenantId, userId: parsed.userId } }, select: { id: true, role: true, active: true, user: { select: { email: true } } } });
  if (!membership || membership.role === "OWNER") throw new Error("Owner access cannot be suspended.");
  const active = parsed.active === "true";
  await db.$transaction([db.membership.update({ where: { id: membership.id }, data: { active } }), db.auditLog.create({ data: { tenantId: parsed.tenantId, actorId: scope.user.id, action: active ? "staff.reactivated" : "staff.suspended", entityType: "Membership", entityId: membership.id, summary: `${active ? "Reactivated" : "Suspended"} ${membership.user.email}` } })]);
  revalidatePath("/dashboard/team");
}

export async function revokeInvitationAction(formData: FormData) {
  const parsed = z.object({ tenantId: z.string().min(1), invitationId: z.string().min(1) }).parse({
    tenantId: formData.get("tenantId"),
    invitationId: formData.get("invitationId"),
  });
  const scope = await requireTenantPermission(parsed.tenantId, "staff.manage");
  const invitation = await db.invitation.findFirst({
    where: { id: parsed.invitationId, tenantId: parsed.tenantId, status: "PENDING" },
    select: { id: true, email: true },
  });
  if (!invitation) throw new Error("Pending invitation not found.");

  await db.$transaction([
    db.invitation.update({ where: { id: invitation.id }, data: { status: "REVOKED" } }),
    db.auditLog.create({
      data: {
        tenantId: parsed.tenantId,
        actorId: scope.user.id,
        action: "staff.invitation_revoked",
        entityType: "Invitation",
        entityId: invitation.id,
        summary: `Revoked invitation for ${invitation.email}`,
      },
    }),
  ]);
  revalidatePath("/dashboard/team");
}
