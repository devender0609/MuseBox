# Cantoa Studio v18.8.49 — Release Notes

Date: 2026-09-11

This hardening release starts from v18.8.48 and concentrates on the remaining issues that were explicitly not represented as fully solved in the prior audit, plus additional defects found while tracing billing, public/unlisted writes, provider-cost surfaces and cloud cleanup.

## Fixed / strengthened

- Stripe webhook delivery is now idempotent when the v18.8.49 migration is installed. Duplicate `checkout.session.completed` / `invoice.paid` deliveries no longer risk refilling monthly minutes.
- Stripe/Supabase write failures now return a non-2xx webhook response so Stripe can retry instead of silently losing membership state.
- Creator ↔ Studio portal plan changes preserve already-consumed minutes while immediately aligning the remaining allowance to the new plan.
- `past_due`/payment-attention memberships now receive a truthful billing-attention message instead of being misreported as a generic configuration failure.
- Billing country is stored when Stripe supplies it. Owner Console shows billing country separately from the selected regional currency/price, and can backfill existing paid customers from Stripe when possible.
- Group Song contribution/vote and Gift Reaction writes now prefer a Supabase-backed public limiter that persists across serverless instances. The prior in-memory limiter remains a compatibility fallback until the migration is installed.
- Public limiter fingerprints are hashed before persistence and the SQL function serializes same-key checks with a transaction advisory lock.
- Gift Reaction writes now have abuse throttling too.
- Website import has an explicit network timeout and blocks non-standard HTTPS ports in addition to the existing HTTPS/private-DNS/redirect/size/content-type checks.
- Cloud Library rejects unsupported MIME types instead of silently labeling arbitrary uploads as MP3.
- Deleting a cloud song now also removes Group Song photo files associated with it, avoiding private storage orphans.
- Cloud-delete failure messages now distinguish storage failure from the rare partial-cleanup case where files were removed but the DB row could not be deleted.
- My Voice creation is rate-limited; My Voice preview is both premium-gated and rate-limited.
- If a newly created provider voice cannot be saved to Cantoa metadata, the provider copy is cleaned up. Delete failures now report partial state truthfully.

## Database migration

Run `supabase-v18.8.49-hardening.sql` once in Supabase SQL Editor before or immediately after deploying v18.8.49. It is safe to run repeatedly. The app remains backward-compatible without it, but distributed public throttling, webhook-event idempotency and billing-country persistence require the migration.

## No commercial changes

Explore remains 2 free songs up to 2 minutes each. Creator remains 40 minutes at $7.99 / ₹499 monthly. Studio remains 120 minutes at $19.99 / ₹1,299 monthly. The 5-minute maximum generation duration and provider-routing policy are unchanged.
