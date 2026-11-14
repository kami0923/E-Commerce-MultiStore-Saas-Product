export type SubscriptionUsage = { stores: number; staff: number; products: number; mediaBytes: number };
export type SubscriptionAllowances = { storeLimit: number; staffLimit: number; productLimit: number; mediaStorageMb: number };

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
