import "server-only";

import { db } from "@/lib/db";

type LimitKind = "store" | "team member";

function limitMessage(planName: string, limit: number, kind: LimitKind) {
  return `${planName} allows ${limit} ${kind}${limit === 1 ? "" : "s"}. Upgrade the subscription before adding another ${kind}.`;
}

async function getCapacity(tenantId: string) {
  return db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
          plan: { select: { name: true, storeLimit: true, staffLimit: true } },
        },
      },
      _count: {
        select: {
          stores: { where: { status: { not: "ARCHIVED" } } },
          memberships: { where: { active: true } },
          invitations: { where: { status: "PENDING", expiresAt: { gt: new Date() } } },
        },
      },
    },
  });
}

function subscriptionUnavailable(capacity: Awaited<ReturnType<typeof getCapacity>>) {
  if (!capacity?.subscription) return "No subscription is assigned to this business.";
  if (!["ACTIVE", "TRIALING"].includes(capacity.subscription.status)) return "The business subscription is not active.";
  if (capacity.subscription.currentPeriodEnd <= new Date()) return "The business subscription period has expired.";
  return null;
}

export async function canCreateStore(tenantId: string) {
  const capacity = await getCapacity(tenantId);
  const unavailable = subscriptionUnavailable(capacity);
  if (unavailable) return { allowed: false as const, message: unavailable };

  const subscription = capacity!.subscription!;
  if (capacity!._count.stores >= subscription.plan.storeLimit) {
    return { allowed: false as const, message: limitMessage(subscription.plan.name, subscription.plan.storeLimit, "store") };
  }
  return { allowed: true as const };
}

export async function canInviteTeamMember(tenantId: string) {
  const capacity = await getCapacity(tenantId);
  const unavailable = subscriptionUnavailable(capacity);
  if (unavailable) return { allowed: false as const, message: unavailable };

  const subscription = capacity!.subscription!;
  const allocatedSeats = capacity!._count.memberships + capacity!._count.invitations;
  if (allocatedSeats >= subscription.plan.staffLimit) {
    return { allowed: false as const, message: limitMessage(subscription.plan.name, subscription.plan.staffLimit, "team member") };
  }
  return { allowed: true as const };
}
