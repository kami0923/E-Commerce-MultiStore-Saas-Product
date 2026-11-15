import assert from "node:assert/strict";
import test from "node:test";
import { paymentBalance, paymentState, refundableAmount } from "../lib/payments.ts";

test("only succeeded payment entries affect the balance", () => {
  const entries = [
    { type: "PAYMENT" as const, status: "SUCCEEDED" as const, amountMinor: 10_000 },
    { type: "PAYMENT" as const, status: "PENDING" as const, amountMinor: 20_000 },
    { type: "PAYMENT" as const, status: "FAILED" as const, amountMinor: 30_000 },
  ];
  assert.deepEqual(paymentBalance(entries), { paid: 10_000, refunded: 0, net: 10_000 });
});

test("refunds cannot produce a negative refundable balance", () => {
  const entries = [
    { type: "PAYMENT" as const, status: "SUCCEEDED" as const, amountMinor: 5_000 },
    { type: "REFUND" as const, status: "SUCCEEDED" as const, amountMinor: 7_000 },
  ];
  assert.equal(refundableAmount(entries), 0);
});

test("payment state represents partial payment and refund progress", () => {
  assert.equal(paymentState(10_000, [{ type: "PAYMENT", status: "SUCCEEDED", amountMinor: 4_000 }]), "PARTIALLY_PAID");
  assert.equal(paymentState(10_000, [{ type: "PAYMENT", status: "SUCCEEDED", amountMinor: 10_000 }]), "PAID");
  assert.equal(paymentState(10_000, [{ type: "PAYMENT", status: "SUCCEEDED", amountMinor: 10_000 }, { type: "REFUND", status: "SUCCEEDED", amountMinor: 3_000 }]), "PARTIALLY_REFUNDED");
});
