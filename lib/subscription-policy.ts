export type SubscriptionUsage = { stores: number; staff: number; products: number; mediaBytes: number };
export type SubscriptionAllowances = { storeLimit: number; staffLimit: number; productLimit: number; mediaStorageMb: number };
export type SubscriptionAccessInput = { status: string; currentPeriodEnd: Date } | null | undefined;

export function subscriptionAccessDecision(subscription: SubscriptionAccessInput, now = new Date()) {
  if (!subscription) return { active: false as const, reason: "No subscription is assigned to this business." };
  if (!['ACTIVE', 'TRIALING'].includes(subscription.status)) {
    return { active: false as const, reason: subscription.status === 'PAST_DUE' ? "The subscription is past due. Renew it to restore write access and the public storefront." : "The subscription is cancelled. Reactivate it to restore access." };
  }
  if (subscription.currentPeriodEnd <= now) return { active: false as const, reason: "The subscription period has expired. Renew it to restore write access and the public storefront." };
  return { active: true as const, reason: null };
}

export function mediaLimitBytes(allowances: Pick<SubscriptionAllowances, "mediaStorageMb">) {
  return allowances.mediaStorageMb * 1024 * 1024;
}

export function canFitMedia(usedBytes: number, incomingBytes: number, allowances: Pick<SubscriptionAllowances, "mediaStorageMb">) {
  return usedBytes + incomingBytes <= mediaLimitBytes(allowances);
}

export function planCapacityConflicts(usage: SubscriptionUsage, allowances: SubscriptionAllowances) {
  return {
    stores: usage.stores > allowances.storeLimit,
    staff: usage.staff > allowances.staffLimit,
    products: usage.products > allowances.productLimit,
    media: usage.mediaBytes > mediaLimitBytes(allowances),
  };
}
