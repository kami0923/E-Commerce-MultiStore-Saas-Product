# Phase 3: merchant onboarding and approval

Meridian now separates a public merchant application from a live tenant. Submitting the public form does not create a business, store, subscription, user membership or invitation.

## Public workflow

1. A prospective merchant opens `/apply` from the Meridian home page.
2. The applicant submits owner, business, market, language and requested store-category details.
3. Meridian stores the application as `PENDING` and sends a private status link through the configured platform email transport.
4. Repeated submissions for the same open email rotate the status token instead of creating duplicate applications.
5. The public status page exposes only the application decision and approved-workspace entry point. It is marked `noindex`.

The form includes server-side validation, a honeypot field and a per-IP daily submission limit. Only `http` and `https` website addresses are accepted.

## Super-admin workflow

Super admins review applications at `/dashboard/onboarding`. They can mark an application under review, approve it or reject it with a review note.

Approval is one database transaction. It creates the isolated tenant, requested stores, shipping profiles, cash-on-delivery connections, trial subscription, owner invitation, email outbox entry and audit event. The application is linked to the newly approved tenant inside the same transaction, preventing a half-created approval.

Rejection records the reviewer and note, writes a security event and attempts to notify the applicant through the shared email transport.

## Email delivery

Merchant application updates and owner invitations use the same platform email adapter. Resend is supported when configured; otherwise the existing SMTP configuration is used. Each tenant does not need a separate email account for platform onboarding.

## Deployment

Apply migration `20261116093000_merchant_onboarding` before using the workflow:

```powershell
npm run db:bootstrap
```

No new environment variables are required beyond the email and database settings already used by Meridian.
