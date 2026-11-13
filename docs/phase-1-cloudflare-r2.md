# Phase 1: permanent media storage with Cloudflare R2

Meridian Commerce uses Cloudflare R2 as its preferred production media store.
Vercel Blob remains supported as a fallback, and local disk is used only while
developing on a computer.

## What is already integrated

- Upload credentials stay on the server and are never sent to a browser.
- Every object is isolated under `tenants/{tenantId}/stores/{storeId}/...`.
- Uploaded objects use unique names and one-year immutable browser caching.
- The database continues to store the final public URL, so storefronts and
  product galleries do not need provider-specific code.
- If the database operation fails, the newly uploaded object is removed so no
  partial upload is left behind.
- Production fails closed when durable storage is not configured.
- `/api/health` reports whether media storage is ready and which provider is in
  use, without exposing credentials.

## Cloudflare setup

1. Sign in to Cloudflare and open **Storage & databases > R2 > Overview**.
2. Enable R2 for the account if Cloudflare requests it.
3. Create a Standard storage bucket named `meridian-commerce-media`.
4. Open **Manage R2 API tokens** and create an Account API token.
5. Give the token **Object Read & Write** permission for only the
   `meridian-commerce-media` bucket.
6. Copy the **Access Key ID** and **Secret Access Key** immediately. Cloudflare
   shows the secret only once.
7. Copy the Cloudflare **Account ID** shown on the R2 overview page.
8. For initial testing, open the bucket's **Settings**, enable the public
   development URL, and copy its complete `https://...r2.dev` URL.
9. Before a commercial launch, connect a domain such as
   `media.yourdomain.com` under **Settings > Custom Domains** and use that URL
   instead of the development URL.

## Vercel environment variables

Add the following to the Vercel project under **Settings > Environment
Variables** for Production, Preview, and Development:

```text
MEDIA_STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=<Cloudflare Account ID>
R2_ACCESS_KEY_ID=<R2 Access Key ID>
R2_SECRET_ACCESS_KEY=<R2 Secret Access Key>
R2_BUCKET_NAME=meridian-commerce-media
R2_PUBLIC_BASE_URL=<public r2.dev URL for testing, custom domain for production>
```

Do not put `R2_ACCESS_KEY_ID` or `R2_SECRET_ACCESS_KEY` in a variable beginning
with `NEXT_PUBLIC_`, and never commit their values to GitHub.

After saving the variables, redeploy the latest production deployment.

## Verification checklist

1. Open `https://YOUR-VERCEL-DOMAIN/api/health` and confirm:
   `integrations.mediaStorage.ready` is `true` and `provider` is
   `cloudflare-r2`.
2. Sign in as a merchant and upload one new test image from **Media library**.
3. Confirm the image appears in Cloudflare R2 under a `tenants/` folder.
4. Attach it to a draft product and confirm it loads on the public storefront.
5. Test the storefront in a private browser window and on a phone.
6. Keep the existing images untouched until their R2 copies and storefront
   URLs have been verified.
