# Phase 5: advanced catalogue and variants

Phase 5 expands the existing tenant-scoped catalogue without replacing product records or changing public URLs. Existing products, variants, stock, orders and media relationships remain valid.

## Merchant workflow

From **Dashboard → Catalog**, an authorised merchant can now:

- assign a product to as many as five categories;
- add structured storefront specifications using `Name: Value` lines;
- set a search title and description for each product;
- select and replace a product gallery while keeping its first image as the cover;
- create color, size and material options for every variant;
- set an optional original price above the current selling price;
- edit product copy, brand, type, publication status, categories, SEO and gallery;
- edit a variant's title, SKU, prices and option values;
- deactivate a variant without deleting its order or inventory history.

The server prevents merchants from selecting categories or media belonging to another store. It also prevents the last active variant from being deactivated while a product remains sellable. Products continue to use archival rather than destructive deletion.

## Storefront behaviour

The product page now shows merchant-defined specifications, option details and the price for the currently selected variant. Original prices appear as a strike-through sale reference only when they are greater than the selling price. The selected color/size/material description also follows the item into the shopping bag.

## Data design

This phase uses the existing flexible `Product.attributes`, `ProductVariant.attributes`, SEO, category join and ordered media records. No database migration is required, and older products with empty attributes continue to render normally.

## Validation

Phase 5 includes automated coverage for specification parsing, invalid-line rejection, attribute round-tripping and human-readable variant option labels. Run the normal validation suite before release:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
