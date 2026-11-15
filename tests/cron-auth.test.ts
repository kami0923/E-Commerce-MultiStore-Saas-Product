import assert from "node:assert/strict";
import test from "node:test";
import { isCronAuthorized } from "../lib/cron-auth.ts";

test("cron authorization accepts the exact bearer secret", () => {
  const request = new Request("https://example.com/api/internal/maintenance", { headers: { authorization: "Bearer meridian-test-secret" } });
  assert.equal(isCronAuthorized(request, "meridian-test-secret"), true);
});

test("cron authorization rejects missing, incorrect and empty secrets", () => {
  const missing = new Request("https://example.com/api/internal/maintenance");
  const incorrect = new Request("https://example.com/api/internal/maintenance", { headers: { authorization: "Bearer incorrect" } });
  assert.equal(isCronAuthorized(missing, "meridian-test-secret"), false);
  assert.equal(isCronAuthorized(incorrect, "meridian-test-secret"), false);
  assert.equal(isCronAuthorized(missing, ""), false);
});
