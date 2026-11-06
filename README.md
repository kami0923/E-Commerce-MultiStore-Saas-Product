# Meridian Commerce

Multi-tenant, multi-store commerce platform for Pakistan-first and international retail brands.

## Foundation

- Next.js App Router and TypeScript
- Tailwind CSS design system
- SQLite with Prisma for zero-cost local development; PostgreSQL-ready data model for production scale
- Tenant and store scoped data model
- Better Auth database sessions with invitation-only merchant onboarding
- Capability-based roles, store assignments, secure invitation hashes, and audit events
- Tenant-scoped product and hierarchical category management
- Additive product variants with SKU-level pricing and stock records
- Audited stock adjustments with reserved and available quantity protection
- Manual order entry with database-calculated totals and stock reservation
- Controlled order transitions from pending through fulfilment, cancellation, delivery, and refund
- English/Urdu-ready locale fields
- Clothing, shoes, jewellery, cosmetics, and multi-category verticals

## Local setup

1. Copy `.env.example` to `.env`. The default local SQLite database is free and needs no separate service.
2. Install packages with `npm install`.
3. Generate the database client with `npm run db:generate`.
4. Initialize the free local database with `npm run db:bootstrap`.
5. Start the app with `npm run dev`.
6. Open `http://localhost:3000/setup` once to create the platform owner.

Public account creation is disabled. The platform owner creates businesses and receives a secure, single-use owner invitation URL to share with each merchant. Invitations expire after 48 hours, and accepted users see only businesses, stores, navigation, and data allowed by their tenant memberships and roles.

Products and variants are append-only operational records. Existing products are never hard-deleted; they can be archived so order, inventory, and audit history remains intact.

## Merchant WhatsApp Business linking

Every store can link its own WhatsApp Business account from **Dashboard → WhatsApp Business**. Linking uses Meta Embedded Signup, verifies the selected phone number on the server, encrypts the access token with AES-256-GCM, and records connect, verify, and disconnect events in the tenant audit log. WhatsApp notifications use the account belonging to the order's store; an optional platform fallback sender can be configured separately.

For an existing local database, run `npm run db:migrate:whatsapp`. Then create a Meta Business app with WhatsApp Embedded Signup and configure these hosting secrets:

- `META_APP_ID` and `NEXT_PUBLIC_META_APP_ID`
- `META_APP_SECRET` (server only)
- `META_WHATSAPP_CONFIG_ID` and `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID`
- `APP_ENCRYPTION_KEY` (a base64 or hex encoded 32-byte key)
- `WHATSAPP_GRAPH_VERSION`

Add the production HTTPS domain to the Meta app's allowed domains. Never commit the app secret, encryption key, or merchant access tokens.

## Validation

- `npm run db:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
