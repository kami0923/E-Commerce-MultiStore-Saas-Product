import "server-only";

import { db } from "@/lib/db";
import { dispatchPendingNotifications } from "@/lib/notification-dispatcher";
import { resolveMediaStorageConfiguration } from "@/lib/media-storage-config";
import { securityEmailConfigured } from "@/lib/security-email";

export async function getPlatformOperationsSnapshot() {
  const startedAt = Date.now();
  const now = new Date();
  await db.$queryRaw`SELECT 1`;

  const [
    tenants,
    stores,
    activeStores,
    expiredSessions,
    expiredInvitations,
    overdueSubscriptions,
    pendingNotifications,
    failedNotifications,
    recentFailures,
  ] = await Promise.all([
    db.tenant.count(),
    db.store.count(),
    db.store.count({ where: { status: "ACTIVE" } }),
    db.session.count({ where: { expiresAt: { lt: now } } }),
    db.invitation.count({ where: { status: "PENDING", expiresAt: { lt: now } } }),
    db.tenantSubscription.count({ where: { status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { lt: now } } }),
    db.notificationOutbox.count({ where: { status: { in: ["PENDING", "PROCESSING"] } } }),
    db.notificationOutbox.count({ where: { status: "FAILED" } }),
    db.notificationOutbox.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        channel: true,
        template: true,
        recipient: true,
        attempts: true,
        maxAttempts: true,
        lastError: true,
        updatedAt: true,
        store: { select: { name: true, tenant: { select: { name: true } } } },
      },
    }),
  ]);

  const media = resolveMediaStorageConfiguration();
  return {
    checkedAt: now,
    responseMs: Date.now() - startedAt,
    database: "CONNECTED" as const,
    counts: { tenants, stores, activeStores, expiredSessions, expiredInvitations, overdueSubscriptions, pendingNotifications, failedNotifications },
    integrations: {
      media: { ready: media.ready, label: media.provider === "cloudflare-r2" ? "Cloudflare R2" : media.provider === "vercel-blob" ? "Vercel Blob" : "Local development" },
      email: { ready: securityEmailConfigured(), label: process.env.SMTP_HOST ? "Gmail security email" : "Resend email" },
      whatsapp: { ready: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_WHATSAPP_CONFIG_ID && process.env.APP_ENCRYPTION_KEY), label: "WhatsApp linking" },
      cron: { ready: Boolean(process.env.CRON_SECRET), label: "Scheduled maintenance" },
    },
    recentFailures,
  };
}

export async function runPlatformMaintenance() {
  const now = new Date();
  const { sessions, invitations, subscriptions } = await db.$transaction(async tx => {
    const sessions = await tx.session.deleteMany({ where: { expiresAt: { lt: now } } });
    const invitations = await tx.invitation.updateMany({ where: { status: "PENDING", expiresAt: { lt: now } }, data: { status: "EXPIRED" } });
    const overdue = await tx.tenantSubscription.findMany({ where: { status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { lt: now } }, select: { id: true, tenantId: true, status: true } });
    if (overdue.length > 0) {
      await tx.tenantSubscription.updateMany({ where: { id: { in: overdue.map(item => item.id) } }, data: { status: "PAST_DUE" } });
      await tx.tenant.updateMany({ where: { id: { in: overdue.map(item => item.tenantId) } }, data: { status: "SUSPENDED" } });
      await tx.auditLog.createMany({ data: overdue.map(item => ({ tenantId: item.tenantId, action: "subscription.expired", entityType: "TenantSubscription", entityId: item.id, summary: `Subscription changed from ${item.status} to PAST_DUE after its period ended` })) });
    }
    return { sessions, invitations, subscriptions: overdue.length };
  });
  const notifications = await dispatchPendingNotifications(50);
  return {
    completedAt: new Date().toISOString(),
    expiredSessionsRemoved: sessions.count,
    invitationsExpired: invitations.count,
    subscriptionsMarkedPastDue: subscriptions,
    notifications,
  };
}
