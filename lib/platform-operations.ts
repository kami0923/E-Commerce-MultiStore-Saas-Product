import "server-only";

import { db } from "@/lib/db";
import { dispatchPendingNotifications } from "@/lib/notification-dispatcher";
import { resolveMediaStorageConfiguration } from "@/lib/media-storage-config";

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
      email: { ready: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL), label: "Resend email" },
      whatsapp: { ready: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_WHATSAPP_CONFIG_ID && process.env.APP_ENCRYPTION_KEY), label: "WhatsApp linking" },
      cron: { ready: Boolean(process.env.CRON_SECRET), label: "Scheduled maintenance" },
    },
    recentFailures,
  };
}

export async function runPlatformMaintenance() {
  const now = new Date();
  const [sessions, invitations, subscriptions] = await db.$transaction([
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.invitation.updateMany({ where: { status: "PENDING", expiresAt: { lt: now } }, data: { status: "EXPIRED" } }),
    db.tenantSubscription.updateMany({ where: { status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { lt: now } }, data: { status: "PAST_DUE" } }),
  ]);
  const notifications = await dispatchPendingNotifications(50);
  return {
    completedAt: new Date().toISOString(),
    expiredSessionsRemoved: sessions.count,
    invitationsExpired: invitations.count,
    subscriptionsMarkedPastDue: subscriptions.count,
    notifications,
  };
}
