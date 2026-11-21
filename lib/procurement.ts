export type PurchaseLineProgress = { orderedQuantity: number; receivedQuantity: number };

export function remainingQuantity(line: PurchaseLineProgress) {
  return Math.max(0, line.orderedQuantity - line.receivedQuantity);
}

export function purchaseOrderStatus(lines: PurchaseLineProgress[]) {
  const received = lines.reduce((sum, line) => sum + line.receivedQuantity, 0);
  const remaining = lines.reduce((sum, line) => sum + remainingQuantity(line), 0);
  if (remaining === 0 && received > 0) return "RECEIVED" as const;
  if (received > 0) return "PARTIALLY_RECEIVED" as const;
  return "ORDERED" as const;
}

export function purchaseOrderTotal(lines: { orderedQuantity: number; unitCostMinor: number }[]) {
  return lines.reduce((sum, line) => sum + line.orderedQuantity * line.unitCostMinor, 0);
}

export function reorderRecommendation(item: { onHand: number; reserved: number; incoming: number; reorderPoint: number }) {
  const available = Math.max(0, item.onHand - item.reserved);
  const projected = available + item.incoming;
  const target = Math.max(item.reorderPoint * 2, item.reorderPoint + 1);
  return {
    available,
    projected,
    needsReorder: projected <= item.reorderPoint,
    suggestedQuantity: Math.max(0, target - projected),
  };
}

export function isPurchaseOrderOverdue(order: { expectedAt: Date | null; status: string }, now = new Date()) {
  if (!order.expectedAt || !["ORDERED", "PARTIALLY_RECEIVED"].includes(order.status)) return false;
  return order.expectedAt.getTime() < now.getTime();
}
