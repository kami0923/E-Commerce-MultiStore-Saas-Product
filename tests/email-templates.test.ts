import assert from "node:assert/strict";
import test from "node:test";
import { buildEmail } from "../lib/email-templates.ts";

const brand = { storeName: "Shoes Store", storeSlug: "shoes-store", businessName: "Shoes Store", locale: "en" };

test("order emails contain branded totals and tracking links", () => {
  const result = buildEmail("order_confirmation", { orderNumber: "WEB-123", totalMinor: 499900, currency: "PKR" }, brand);
  assert.match(result.subject, /Shoes Store/);
  assert.match(result.html, /WEB-123/);
  assert.match(result.html, /store\/shoes-store\/track/);
});

test("invitation emails escape unsafe values and preserve the secure link", () => {
  const result = buildEmail("team_invitation", { role: "ORDER_MANAGER", inviterName: "<script>alert(1)</script>", invitationUrl: "https://example.com/invite/secure-token" }, brand);
  assert.doesNotMatch(result.html, /<script>/);
  assert.match(result.html, /&lt;script&gt;/);
  assert.match(result.html, /https:\/\/example.com\/invite\/secure-token/);
});
