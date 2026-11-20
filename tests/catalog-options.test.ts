import assert from "node:assert/strict";
import test from "node:test";
import { attributesToSpecificationLines, parseSpecificationLines, variantAttributes, variantOptionSummary } from "../lib/catalog-options.ts";

test("product specification lines become a clean attribute record", () => {
  assert.deepEqual(parseSpecificationLines("Material: Linen\nCare: Cold wash\n\nOrigin: Pakistan"), {
    attributes: { Material: "Linen", Care: "Cold wash", Origin: "Pakistan" },
    invalidLines: [],
  });
});

test("invalid specification lines are rejected without losing valid lines", () => {
  assert.deepEqual(parseSpecificationLines("Material Linen\nColor: Black\nMissing:"), {
    attributes: { Color: "Black" },
    invalidLines: ["Material Linen", "Missing:"],
  });
});

test("catalog attributes round-trip and variant labels stay human readable", () => {
  const options = variantAttributes({ color: " Black ", size: "42", material: "" });
  assert.deepEqual(options, { color: "Black", size: "42" });
  assert.equal(variantOptionSummary(options), "Black · 42");
  assert.equal(attributesToSpecificationLines({ Material: "Leather", ignored: 4 }), "Material: Leather");
});
