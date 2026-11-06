export function promotionDiscount(subtotalMinor: number, promotion?: { discountType: "PERCENT" | "FIXED"; value: number } | null) {
  if (!promotion || subtotalMinor <= 0) return 0;
  const discount = promotion.discountType === "PERCENT" ? Math.round(subtotalMinor * promotion.value / 100) : promotion.value;
  return Math.max(0, Math.min(subtotalMinor, discount));
}

export function taxAmount(discountedSubtotalMinor: number, rule?: { rateBps: number; included: boolean } | null) {
  if (!rule || discountedSubtotalMinor <= 0 || rule.rateBps <= 0) return 0;
  return rule.included
    ? Math.round(discountedSubtotalMinor * rule.rateBps / (10000 + rule.rateBps))
    : Math.round(discountedSubtotalMinor * rule.rateBps / 10000);
}

export function orderTotal({ subtotalMinor, discountMinor, shippingMinor, taxMinor, taxIncluded }: { subtotalMinor: number; discountMinor: number; shippingMinor: number; taxMinor: number; taxIncluded: boolean }) {
  return Math.max(0, subtotalMinor - discountMinor + shippingMinor + (taxIncluded ? 0 : taxMinor));
}
