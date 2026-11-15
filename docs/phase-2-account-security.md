# Phase 2: account security without production email delivery

Resend remains intentionally postponed. Password recovery and verification delivery can use temporary Gmail SMTP through `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM_EMAIL`. Resend remains the recommended production provider once a branded domain is available.

## Active now

- stronger 12–128 character password policy with case, number and symbol rules;
- database-backed sessions with per-device revocation;
- revoke-all-other-devices control;
- current-password verification before password changes;
- optional automatic session revocation after a password change;
- automatic revocation of all sessions after a reset;
- PostgreSQL-backed authentication endpoint rate limiting that remains consistent across server instances;
- one-hour, single-use Better Auth reset and verification tokens; and
- global security event history independent of merchant tenant records.

## Prepared but delivery postponed

- forgotten-password request and reset screens;
- verification email callbacks; and
- branded security email templates.

When email is unconfigured, recovery requests do not expose account existence or reset links. Existing unverified merchant accounts are not locked out. Once delivery is connected, new invitation accounts receive verification emails automatically; mandatory verification can then be enabled after existing accounts are reviewed.
