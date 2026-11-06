import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export function generateInvitationToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashInvitationToken(token) };
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getInvitationByToken(token: string) {
  if (token.length < 32 || token.length > 128) return null;
  return db.invitation.findUnique({
    where: { tokenHash: hashInvitationToken(token) },
    select: {
      id: true,
      email: true,
      role: true,
      storeIds: true,
      status: true,
      expiresAt: true,
      tenantId: true,
      tenant: { select: { name: true } },
    },
  });
}

export async function acceptInvitationForUser(token: string, user: { id: string; email: string }) {
  const invitation = await getInvitationByToken(token);
  if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt <= new Date()) {
    throw new Error("This invitation is invalid or has expired.");
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error("This invitation belongs to a different email address.");
  }

  await db.$transaction(async (tx) => {
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, status: "PENDING", expiresAt: { gt: new Date() } },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    if (claimed.count !== 1) throw new Error("This invitation has already been used.");

    await tx.membership.upsert({
      where: { tenantId_userId: { tenantId: invitation.tenantId, userId: user.id } },
      update: { role: invitation.role, active: true },
      create: { tenantId: invitation.tenantId, userId: user.id, role: invitation.role },
    });

    const requestedStoreIds = Array.isArray(invitation.storeIds) ? invitation.storeIds.filter((value): value is string => typeof value === "string") : [];
    const stores = await tx.store.findMany({ where: { tenantId: invitation.tenantId, ...(requestedStoreIds.length > 0 ? { id: { in: requestedStoreIds } } : {}) }, select: { id: true } });
    if (stores.length) {
      await Promise.all(
        stores.map((store) =>
          tx.storeAccess.upsert({
            where: { storeId_userId: { storeId: store.id, userId: user.id } },
            update: { role: invitation.role },
            create: {
              tenantId: invitation.tenantId,
              storeId: store.id,
              userId: user.id,
              role: invitation.role,
            },
          }),
        ),
      );
    }

    await tx.auditLog.create({
      data: {
        tenantId: invitation.tenantId,
        actorId: user.id,
        action: "invitation.accepted",
        entityType: "Invitation",
        entityId: invitation.id,
        summary: `${user.email} joined ${invitation.tenant.name}`,
      },
    });
  });

  return invitation;
}
