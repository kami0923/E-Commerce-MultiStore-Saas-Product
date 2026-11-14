import "server-only";

import { db } from "@/lib/db";
import { canFitMedia, mediaLimitBytes } from "@/lib/subscription-policy";

type LimitKind = "store" | "team member" | "product";

function limitMessage(planName: string, limit: number, kind: LimitKind) {
  return `${planName} allows ${limit.toLocaleString()} ${kind}${limit === 1 ? "" : "s"}. Upgrade the subscription before adding another ${kind}.`;
}

export async function getTenantSubscriptionCapacity(tenantId: string) {
  const [tenant, media] = await Promise.all([
    db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        countryCode: true,
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
    db.mediaAsset.aggregate({ where: { tenantId }, _sum: { sizeBytes: true } }),
  ]);

  if (!tenant) return null;
  return {
    ...tenant,
    usage: {
      stores: tenant._count.stores,
      staff: tenant._count.memberships + tenant._count.invitations,
      members: tenant._count.memberships,
      pendingInvitations: tenant._count.invitations,
      products: tenant._count.products,
      mediaFiles: tenant._count.mediaAssets,
      mediaBytes: media._sum.sizeBytes ?? 0,
    },
  };
}

function subscriptionUnavailable(capacity: Awaited<ReturnType<typeof getTenantSubscriptionCapacity>>) {
  if (!capacity?.subscription) return "No subscription is assigned to this business.";
  if (!["ACTIVE", "TRIALING"].includes(capacity.subscription.status)) return "The business subscription is not active.";
  if (capacity.subscription.currentPeriodEnd <= new Date()) return "The business subscription period has expired.";
  return null;
}

export async function canCreateStore(tenantId: string) {
  const capacity = await getTenantSubscriptionCapacity(tenantId);
  const unavailable = subscriptionUnavailable(capacity);
  if (unavailable) return { allowed: false as const, message: unavailable };
  const subscription = capacity!.subscription!;
  if (capacity!.usage.stores >= subscription.plan.storeLimit) {
    return { allowed: false as const, message: limitMessage(subscription.plan.name, subscription.plan.storeLimit, "store") };
  }
  return { allowed: true as const };
}

export async function canInviteTeamMember(tenantId: string) {
  const capacity = await getTenantSubscriptionCapacity(tenantId);
  const unavailable = subscriptionUnavailable(capacity);
  if (unavailable) return { allowed: false as const, message: unavailable };
  const subscription = capacity!.subscription!;
  if (capacity!.usage.staff >= subscription.plan.staffLimit) {
    return { allowed: false as const, message: limitMessage(subscription.plan.name, subscription.plan.staffLimit, "team member") };
  }
  return { allowed: true as const };
}

export async function canCreateProduct(tenantId: string) {
  const capacity = await getTenantSubscriptionCapacity(tenantId);
  const unavailable = subscriptionUnavailable(capacity);
  if (unavailable) return { allowed: false as const, message: unavailable };
  const subscription = capacity!.subscription!;
  if (capacity!.usage.products >= subscription.plan.productLimit) {
    return { allowed: false as const, message: limitMessage(subscription.plan.name, subscription.plan.productLimit, "product") };
  }
  return { allowed: true as const };
}

export async function canStoreMedia(tenantId: string, incomingBytes: number) {
  const capacity = await getTenantSubscriptionCapacity(tenantId);
  const unavailable = subscriptionUnavailable(capacity);
  if (unavailable) return { allowed: false as const, message: unavailable };
  const subscription = capacity!.subscription!;
  const limitBytes = mediaLimitBytes(subscription.plan);
  if (!canFitMedia(capacity!.usage.mediaBytes, incomingBytes, subscription.plan)) {
    return {
      allowed: false as const,
      message: `${subscription.plan.name} includes ${formatStorage(limitBytes)} of media storage. Remove unused assets or upgrade the subscription before uploading more images.`,
    };
  }
  return { allowed: true as const };
}

export function formatStorage(bytes: number) {
  if (bytes >= 1024 ** 3) return `${Number((bytes / 1024 ** 3).toFixed(1))} GB`;
  if (bytes >= 1024 ** 2) return `${Number((bytes / 1024 ** 2).toFixed(1))} MB`;
  if (bytes >= 1024) return `${Number((bytes / 1024).toFixed(1))} KB`;
  return `${bytes} B`;
}
