import assert from "node:assert/strict";
import test from "node:test";
import { isPurchaseOrderOverdue, purchaseOrderStatus, purchaseOrderTotal, remainingQuantity, reorderRecommendation } from "../lib/procurement.ts";

test("remaining quantities never become negative", () => {
  assert.equal(remainingQuantity({ orderedQuantity: 10, receivedQuantity: 4 }), 6);
  assert.equal(remainingQuantity({ orderedQuantity: 10, receivedQuantity: 12 }), 0);
});

test("purchase order status follows receiving progress", () => {
  assert.equal(purchaseOrderStatus([{ orderedQuantity: 5, receivedQuantity: 0 }]), "ORDERED");
  assert.equal(purchaseOrderStatus([{ orderedQuantity: 5, receivedQuantity: 2 }]), "PARTIALLY_RECEIVED");
  assert.equal(purchaseOrderStatus([{ orderedQuantity: 5, receivedQuantity: 5 }]), "RECEIVED");
});

test("purchase order total uses minor currency units", () => {
  assert.equal(purchaseOrderTotal([{ orderedQuantity: 3, unitCostMinor: 1250 }, { orderedQuantity: 2, unitCostMinor: 500 }]), 4750);
});

test("reorder planning considers reserved and incoming stock", () => {
  assert.deepEqual(reorderRecommendation({ onHand: 4, reserved: 2, incoming: 8, reorderPoint: 5 }), {
    available: 2, projected: 10, needsReorder: false, suggestedQuantity: 0,
  });
  assert.deepEqual(reorderRecommendation({ onHand: 4, reserved: 2, incoming: 1, reorderPoint: 5 }), {
    available: 2, projected: 3, needsReorder: true, suggestedQuantity: 7,
  });
});

test("overdue detection applies only to open expected deliveries", () => {
  const now = new Date("2026-11-21T12:00:00.000Z");
  assert.equal(isPurchaseOrderOverdue({ expectedAt: new Date("2026-11-20T12:00:00.000Z"), status: "ORDERED" }, now), true);
  assert.equal(isPurchaseOrderOverdue({ expectedAt: new Date("2026-11-20T12:00:00.000Z"), status: "RECEIVED" }, now), false);
  assert.equal(isPurchaseOrderOverdue({ expectedAt: null, status: "ORDERED" }, now), false);
});
