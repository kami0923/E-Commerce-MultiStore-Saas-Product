# Meridian Commerce

Multi-tenant, multi-store commerce platform for Pakistan-first and international retail brands.

## Technology

- Next.js App Router, React and TypeScript
- Tailwind CSS design system
- PostgreSQL with Prisma ORM and pooled production connections
- Better Auth database sessions and invitation-only merchant onboarding
- Vercel Blob for durable production media uploads
- Tenant-scoped catalogues, inventory, orders, roles, audit logs and storefronts

## Local setup

1. Copy `.env.example` to `.env` and add your PostgreSQL connection details.
2. Install packages: `npm install`
3. Generate the Prisma client: `npm run db:generate`
4. Apply database migrations: `npm run db:bootstrap`
5. Start the app: `npm run dev`
6. Open `http://localhost:3000/setup` once if a platform owner has not been created.

`DATABASE_URL` is the direct PostgreSQL connection used by Prisma commands. `DATABASE_URL_POOLED` is preferred by the running application when supplied. Never commit `.env` files or database credentials.

Public account creation is disabled. The platform owner creates merchant businesses and shares secure, single-use owner invitation URLs. Invitations expire after 48 hours. Products and variants are preserved as operational history and are archived instead of being hard-deleted.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Add the environment variables listed in `.env.example` to the Vercel project.
3. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the final HTTPS deployment URL.
4. Set `DATABASE_URL` to the direct Prisma Postgres URL and `DATABASE_URL_POOLED` to its pooled URL.
5. Create and connect a Vercel Blob store so Vercel supplies `BLOB_READ_WRITE_TOKEN`.
6. Deploy. The `postinstall` script generates the Prisma client during the build.

Production media is stored in Vercel Blob and registered against the correct tenant and store. Browser-direct uploads support up to 20 images per batch, 12 MB per image and 120 MB total; each tenant's plan storage allowance is also enforced on the server. See `docs/phase-1-cloudflare-r2.md` for the storage and migration workflow.

Subscription plans are market-specific (PKR for Pakistan and USD internationally) and enforce stores, team seats, products and media storage. Super admins manage pricing, renewals and access from **Plans & usage**. See `docs/phase-2-subscriptions.md`.

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for the complete launch checklist.

## WhatsApp Business linking

Each store can link its own WhatsApp Business account from **Dashboard → WhatsApp Business**. Production linking requires the Meta and encryption settings documented in `.env.example`. Merchant tokens are encrypted and scoped to their store.

## Validation

Run these checks before every production release:

```bash
npm run db:validate
npm run typecheck
npm run lint
npm test
npm run build
```
