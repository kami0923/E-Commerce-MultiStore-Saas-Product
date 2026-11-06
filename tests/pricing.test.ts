import assert from "node:assert/strict";
import test from "node:test";
import { orderTotal, promotionDiscount, taxAmount } from "../lib/pricing.ts";

test("percentage promotions are capped at the subtotal", () => {
  assert.equal(promotionDiscount(10_000, { discountType: "PERCENT", value: 10 }), 1_000);
  assert.equal(promotionDiscount(10_000, { discountType: "PERCENT", value: 150 }), 10_000);
});

test("fixed promotions never make an order negative", () => {
  assert.equal(promotionDiscount(2_000, { discountType: "FIXED", value: 5_000 }), 2_000);
});

test("exclusive and inclusive taxes use different formulas", () => {
  assert.equal(taxAmount(10_000, { rateBps: 1800, included: false }), 1_800);
  assert.equal(taxAmount(11_800, { rateBps: 1800, included: true }), 1_800);
});

test("included tax is recorded but not added twice", () => {
  assert.equal(orderTotal({ subtotalMinor: 11_800, discountMinor: 0, shippingMinor: 250, taxMinor: 1_800, taxIncluded: true }), 12_050);
  assert.equal(orderTotal({ subtotalMinor: 10_000, discountMinor: 1_000, shippingMinor: 250, taxMinor: 1_620, taxIncluded: false }), 10_870);
});
