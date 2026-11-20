import assert from "node:assert/strict";
import test from "node:test";
import { applicationReference, applicationTokenHash, createApplicationTrackingToken } from "../lib/merchant-application-token.ts";

test("merchant application tracking tokens are opaque and hash deterministically", () => {
  const first = createApplicationTrackingToken();
  const second = createApplicationTrackingToken();

  assert.notEqual(first.token, second.token);
  assert.equal(first.hash, applicationTokenHash(first.token));
  assert.equal(first.hash.length, 64);
  assert.equal(first.token.includes(first.hash), false);
});

test("merchant application references expose only a short display identifier", () => {
  assert.equal(applicationReference("cm1234567890abcdef"), "MER-90ABCDEF");
});
