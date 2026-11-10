# Vercel deployment checklist

## 1. Import the repository

In Vercel, choose **Add New → Project**, import `kami0923/E-Commerce-MultiStore-Saas-Product`, keep the detected Next.js settings, and do not deploy until the environment variables are configured.

## 2. Configure production secrets

Add the following in **Project Settings → Environment Variables** for Production (and Preview only when needed):

- `DATABASE_URL`: direct Prisma Postgres connection string
- `DATABASE_URL_POOLED`: pooled Prisma Postgres connection string
- `BETTER_AUTH_SECRET`: a new random secret of at least 32 characters
- `BETTER_AUTH_URL`: `https://your-production-domain`
- `NEXT_PUBLIC_APP_URL`: `https://your-production-domain`
- `CRON_SECRET`: a separate long random value
- `APP_ENCRYPTION_KEY`: required before enabling WhatsApp account linking

Copy other optional Meta, Resend and payment settings from `.env.example` only when those integrations are enabled. Never paste secrets into source files or commit them to Git.

## 3. Connect image storage

Open **Storage**, create a Blob store, and connect it to this project. Vercel will add `BLOB_READ_WRITE_TOKEN`. Existing repository images remain available; future dashboard uploads use Blob storage.

## 4. Confirm the database

The PostgreSQL migration is stored in `prisma/migrations`. Before the first deployment, confirm the production database is the same Prisma Postgres database that received the migrated application data. Do not run the old SQLite migration scripts against production.

## 5. Deploy and verify

After deployment:

1. Open `/sign-in` and sign in as the platform owner.
2. Verify businesses, stores, products, orders and media.
3. Open the AK Abaya public storefront and a product page.
4. Place a test cash-on-delivery order and verify inventory and the merchant dashboard.
5. Upload one small test image and confirm it remains available after a redeployment.
6. Test an invitation in a private browser window.
7. Confirm tenant isolation with the separate Test Shoes merchant.

## 6. Custom domain

After the default Vercel URL passes the checks, add the production domain, update `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to that domain, redeploy, and update the allowed domains in Meta when WhatsApp is enabled.
