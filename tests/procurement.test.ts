import assert from "node:assert/strict";
import test from "node:test";
import { purchaseOrderStatus, purchaseOrderTotal, remainingQuantity } from "../lib/procurement.ts";

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
