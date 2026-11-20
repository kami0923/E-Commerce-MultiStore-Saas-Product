import assert from "node:assert/strict";
import test from "node:test";
import { canFitMedia, mediaLimitBytes, planCapacityConflicts, subscriptionAccessDecision } from "../lib/subscription-policy.ts";

test("media allowance accepts the exact boundary and rejects one byte over", () => {
  const plan = { mediaStorageMb: 250 };
  const limit = mediaLimitBytes(plan);
  assert.equal(canFitMedia(limit - 10, 10, plan), true);
  assert.equal(canFitMedia(limit - 10, 11, plan), false);
});

test("plan fit reports every exceeded allowance without treating exact limits as exceeded", () => {
  const plan = { storeLimit: 1, staffLimit: 3, productLimit: 100, mediaStorageMb: 250 };
  assert.deepEqual(planCapacityConflicts({ stores: 1, staff: 3, products: 100, mediaBytes: mediaLimitBytes(plan) }, plan), { stores: false, staff: false, products: false, media: false });
  assert.deepEqual(planCapacityConflicts({ stores: 2, staff: 4, products: 101, mediaBytes: mediaLimitBytes(plan) + 1 }, plan), { stores: true, staff: true, products: true, media: true });
});

test("subscription access requires an active state and a future period end", () => {
  const now = new Date("2026-11-20T12:00:00.000Z");
  assert.equal(subscriptionAccessDecision({ status: "ACTIVE", currentPeriodEnd: new Date("2026-11-21T12:00:00.000Z") }, now).active, true);
  assert.equal(subscriptionAccessDecision({ status: "TRIALING", currentPeriodEnd: new Date("2026-11-21T12:00:00.000Z") }, now).active, true);
  assert.equal(subscriptionAccessDecision({ status: "PAST_DUE", currentPeriodEnd: new Date("2026-11-21T12:00:00.000Z") }, now).active, false);
  assert.equal(subscriptionAccessDecision({ status: "ACTIVE", currentPeriodEnd: now }, now).active, false);
  assert.equal(subscriptionAccessDecision(null, now).active, false);
});
