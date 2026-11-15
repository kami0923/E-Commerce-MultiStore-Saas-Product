import assert from "node:assert/strict";
import test from "node:test";
import { passwordRequirements, passwordSchema } from "../lib/password-policy.ts";

test("password policy requires length, case, number and symbol", () => {
  assert.equal(passwordSchema.safeParse("Correct-Horse-9").success, true);
  assert.equal(passwordSchema.safeParse("alllowercase99!").success, false);
  assert.equal(passwordSchema.safeParse("NoNumbersHere!").success, false);
});

test("password requirement feedback identifies individual rules", () => {
  assert.deepEqual(passwordRequirements("Short1!"), { length: false, lowercase: true, uppercase: true, number: true, symbol: true });
});
