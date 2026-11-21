import assert from "node:assert/strict";
import test from "node:test";
import { getStorefrontTheme, recommendedTheme, storefrontThemeKeys } from "../lib/storefront-themes.ts";

test("every modern storefront theme exposes a complete visual system", () => {
  assert.equal(storefrontThemeKeys.length, 9);
  for (const key of storefrontThemeKeys) {
    const theme = getStorefrontTheme(key);
    assert.ok(theme.label && theme.description);
    assert.match(theme.accent, /^#[0-9a-f]{6}$/i);
    assert.match(theme.surface, /^#[0-9a-f]{6}$/i);
    assert.match(theme.ink, /^#[0-9a-f]{6}$/i);
    assert.match(theme.highlight, /^#[0-9a-f]{6}$/i);
  }
});

test("new stores receive category-aware themes", () => {
  assert.equal(recommendedTheme("SHOES", 0), "kinetic");
  assert.equal(recommendedTheme("JEWELLERY", 0), "noir");
  assert.equal(recommendedTheme("COSMETICS", 0), "canvas");
  assert.equal(recommendedTheme("MULTI_CATEGORY", 0), "market");
});

test("unknown persisted themes safely fall back to atelier", () => {
  assert.equal(getStorefrontTheme("future-theme").label, "Editorial Atelier");
});
