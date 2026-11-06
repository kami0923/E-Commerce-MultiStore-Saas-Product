import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import { decryptSecret, encryptSecret } from "../lib/crypto-secrets.ts";

test("merchant access tokens are encrypted and authenticated", () => {
  process.env.APP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  const original = "merchant-access-token-that-must-not-be-stored-in-plain-text";
  const encrypted = encryptSecret(original);
  assert.notEqual(encrypted.ciphertext, original);
  assert.equal(decryptSecret(encrypted), original);
  assert.throws(() => decryptSecret({ ...encrypted, tag: randomBytes(16).toString("base64") }));
});
