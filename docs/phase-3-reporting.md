# Phase 3: reporting, profitability and data exports

Phase 3 turns tenant-safe commerce data into operational reporting without requiring a payment gateway.

## Analytics

The analytics dashboard supports 30-day, 90-day, 12-month and all-time reporting. It shows:

- net merchandise sales after discounts;
- estimated cost of goods and gross profit margin;
- order volume, average order value and fulfilment status;
- top-selling products; and
- available and low-stock units.

Profit uses the current cost recorded on each sold product variant. The dashboard shows cost coverage and clearly labels profit as estimated when sold variants are missing costs.

## Exports

Owners, administrators and platform super administrators can download tenant-scoped CSV files for:

- orders;
- customers;
- catalog variants; and
- inventory.

Export authorization is checked on the server. Store assignments and tenant boundaries are applied before every query, and every export is recorded in the affected tenant audit log. CSV cells are escaped and spreadsheet-formula prefixes are neutralized.

The reporting period applies to order exports. Other exports represent the current authorized business records. Each export is limited to 50,000 records per request to protect application memory.

## Deferred work

Customer account registration and password recovery remain deferred until branded transactional email and a production domain are connected. Payment-provider settlement and fee reconciliation remain part of the later payment phase.
