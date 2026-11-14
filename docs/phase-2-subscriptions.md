# Phase 2: subscriptions and platform allowances

Phase 2 makes monthly plans enforceable across tenant boundaries without adding a payment gateway.

## Plan model

Every active plan has:

- a market (`PK` or `INTL`) and currency (`PKR` or `USD`);
- a monthly price;
- active store and allocated team-seat limits;
- a non-archived product limit;
- a total media-storage allowance.

Pakistan businesses can only receive Pakistan plans. All other countries use international plans.

## Enforcement points

Allowances are checked on the server before:

- a store is created;
- a team invitation is issued;
- a product is created;
- a local media upload is stored;
- a Vercel Blob upload token is issued; and
- a completed Blob upload is registered in the database.

The final Blob registration repeats the storage check using verified object sizes. If registration is rejected, verified uploaded objects are removed.

Subscriptions must be `ACTIVE` or `TRIALING` and the current period must not have expired. Archiving data preserves history and releases store or product capacity.

## Super-admin workflow

Open **Dashboard → Plans & usage** to:

1. review live usage for every business;
2. assign a market-compatible plan and renew it for 30 days;
3. block unsafe downgrades when current usage exceeds a target plan;
4. mark access active, past due or canceled; and
5. update plan prices and allowances.

Plan assignments and status changes are written to tenant audit logs. Plan catalogue changes are written to the audit log of every subscribed tenant affected by that plan.

## Merchant workflow

Merchant owners and permitted staff can open **Plans & usage** in read-only mode. Progress bars show stores, seats, products and media consumption, together with the current period end date.

## Deployment

The migration `20261114120000_phase_2_subscription_quotas` preserves existing plans with safe defaults:

- Launch plans: 100 products and 250 MB media;
- Growth plans: 1,000 products and 2 GB media.

Run `npm run db:bootstrap` before deploying code that reads the new columns.
