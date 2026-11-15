# Phase 2: account security without production email delivery

Resend remains intentionally postponed. The security foundation is implemented so email verification and password recovery delivery activate automatically after `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are configured.

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
