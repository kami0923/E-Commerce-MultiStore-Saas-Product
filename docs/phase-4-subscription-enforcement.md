# Phase 4: complete subscription enforcement

Phase 4 turns plan status and allowances into server-enforced platform access. Hiding a button is never treated as enforcement.

## Active access

A business has active commercial access only when:

- a subscription is assigned;
- its status is `ACTIVE` or `TRIALING`; and
- `currentPeriodEnd` is still in the future.

The decision is shared by dashboard mutations, public storefront discovery, product pages and checkout. An expired period is treated as inactive immediately, even before the daily maintenance job updates its stored status.

## Inactive business behaviour

Past-due, cancelled, expired or unassigned businesses become read-only:

- public stores disappear from the Meridian marketplace;
- storefront and product URLs stop serving published commerce pages;
- public and manually created orders are blocked;
- store, catalogue, inventory, media, supplier, gateway and staff mutations are blocked for merchant users; and
- the dashboard shows a clear read-only notice.

Existing order fulfilment, refunds, reporting, exports and account-security controls remain available so merchants can meet obligations and recover their data. Platform super admins retain support access.

## Allowance safety

Store, team-seat, product and media limits continue to be enforced on the server. Plan catalogue limits cannot be reduced below any subscribed business's current usage. A business must first reduce usage or move to a different plan.

## Lifecycle

Assigning or renewing a plan activates both the subscription and tenant for 30 days. Marking a subscription past due or cancelled suspends the tenant. Daily maintenance atomically:

1. marks expired active or trial subscriptions `PAST_DUE`;
2. suspends their tenants; and
3. writes tenant audit records.

Reactivation restores the tenant and grants a fresh 30-day period. No database migration or new environment variable is required for this phase.
