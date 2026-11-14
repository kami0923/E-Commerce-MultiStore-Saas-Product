import assert from "node:assert/strict";
import test from "node:test";
import { canFitMedia, mediaLimitBytes, planCapacityConflicts } from "../lib/subscription-policy.ts";

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
