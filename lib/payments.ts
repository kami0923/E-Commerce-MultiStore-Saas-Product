export type PaymentLedgerEntry = { type: "PAYMENT" | "REFUND"; status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED"; amountMinor: number };

export function paymentBalance(entries: PaymentLedgerEntry[]) {
  const paid = entries.filter(entry => entry.type === "PAYMENT" && entry.status === "SUCCEEDED").reduce((sum, entry) => sum + entry.amountMinor, 0);
  const refunded = entries.filter(entry => entry.type === "REFUND" && entry.status === "SUCCEEDED").reduce((sum, entry) => sum + entry.amountMinor, 0);
  return { paid, refunded, net: Math.max(0, paid - refunded) };
}

export function paymentState(orderTotalMinor: number, entries: PaymentLedgerEntry[]) {
  const balance = paymentBalance(entries);
  if (balance.refunded > 0 && balance.net === 0) return "REFUNDED" as const;
  if (balance.refunded > 0) return "PARTIALLY_REFUNDED" as const;
  if (balance.net >= orderTotalMinor) return "PAID" as const;
  if (balance.net > 0) return "PARTIALLY_PAID" as const;
  if (entries.some(entry => entry.type === "PAYMENT" && entry.status === "PENDING")) return "PENDING" as const;
  return "UNPAID" as const;
}

export function refundableAmount(entries: PaymentLedgerEntry[]) {
  return paymentBalance(entries).net;
}
