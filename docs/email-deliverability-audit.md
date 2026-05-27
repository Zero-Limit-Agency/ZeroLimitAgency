# Email deliverability audit (signup/contact)

_Date: 2026-05-27_

## Current provider configuration

- The contact/signup flow sends transactional emails through **Resend API** (`new Resend(RESEND_API_KEY)`), not direct SMTP from app code.
- Two transactional messages are sent on signup:
  - internal notification to `INSCRIPTIONS_EMAIL`
  - confirmation to the applicant email
- Required env vars are:
  - `RESEND_API_KEY`
  - `INSCRIPTIONS_EMAIL` (used as `from` and internal recipient)

## Shared vs dedicated IPs

- By default, this app currently relies on provider-managed infrastructure.
- With Resend, most accounts use shared IP pools unless a dedicated IP/pool is explicitly provisioned at the account level.
- If SMTP logs show `551 5.7.1 ... black listed by SpamCop`, the issue is consistent with upstream IP reputation (shared pool or mis-warmed dedicated IP), not a form-validation bug.

## DNS authentication checks (SPF / DKIM / DMARC)

This repository does not store DNS zone records, so these must be checked in your DNS provider:

1. **SPF**
   - Ensure your sender domain has exactly one SPF TXT record.
   - Include your active provider include/mechanism and avoid multiple SPF records.
2. **DKIM**
   - Ensure provider DKIM CNAME/TXT records are published and verified.
3. **DMARC**
   - Ensure a DMARC TXT exists for `_dmarc.<domain>` with at least `p=none` for monitoring.
4. **Alignment**
   - Ensure envelope-from / header-from domains are aligned with your authenticated sending domain.

## Recommended provider posture

- Keep transactional mail on a dedicated transactional provider account/domain (separate from marketing where possible).
- If sending volume is high enough and stable, move to **dedicated IP infrastructure** and perform warmup.
- If volume is low or spiky, high-quality shared pools may perform better than a cold dedicated IP.

## Resend vs Postmark vs SendGrid (transactional focus)

- **Resend**: simple API/dev UX; supports dedicated IP pools with plan/volume prerequisites.
- **Postmark**: transactional-first reputation posture; dedicated IPs available with managed warmup options.
- **SendGrid**: mature ecosystem; dedicated IP included/available on higher tiers; strong pool/IP tooling.

## Application hardening added in this repo

- Added retry with exponential backoff for transient provider failures (timeouts, 429, 5xx).
- Added structured logging for provider responses and extracted failure reason.
- Added API response payload to indicate partial success when signup is saved but email delivery failed.
- Added graceful UI message so users know submission succeeded even if confirmation email is delayed.

## Migration guidance (if blacklisting persists)

1. Verify DNS auth on current provider first (SPF/DKIM/DMARC).
2. Ask current provider support to confirm whether your traffic used shared pool IPs at bounce time.
3. If recurring SpamCop blacklisting persists:
   - move transactional sending to a clean subdomain (e.g. `tx.example.com`),
   - migrate to provider tier with deliverability support / dedicated IP option,
   - warm up gradually,
   - monitor bounces/complaints daily for 2-4 weeks.
