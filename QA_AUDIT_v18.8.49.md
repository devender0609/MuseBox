# Cantoa Studio v18.8.49 — QA / Audit Record

Date: 2026-09-11

## Scope
This pass continued from deployed v18.8.48 and specifically investigated the remaining limitations called out in the prior audit, then widened the review to Stripe webhook correctness/idempotency, plan-change quota semantics, billing-country visibility, public/unlisted abuse controls, Website import network hardening, cloud library format/delete behavior, My Voice provider-cost surfaces, current commercial invariants and parser-level source validity.

## Defects found and corrected
1. Stripe webhook DB writes were not checked for errors, so a transient Supabase failure could be acknowledged to Stripe even though Cantoa membership state was not updated.
2. Duplicate webhook delivery could reapply monthly quota, especially `checkout.session.completed` and `invoice.paid`.
3. Creator ↔ Studio changes updated the plan but did not align `minutes_remaining` to the new allowance.
4. `past_due` accounts surfaced as generic usage configuration failures.
5. Billing country was not persisted or displayed even when Stripe could provide it.
6. Group Song throttling was process-local only; Gift Reaction POST had no rate limiter.
7. Website source fetches had no explicit fetch timeout and permitted custom HTTPS ports.
8. Cloud Library accepted unsupported MIME types and defaulted them to MP3 metadata.
9. Deleting a song could leave Group Song photos orphaned in private storage.
10. My Voice preview lacked premium/rate-limit enforcement; voice-create metadata persistence failures could orphan a provider voice.

## Validation
- `tests/cantoa-v18-8-49.test.mjs`: 12/12 passed.
- 121 TS/TSX files parsed/transpiled with 0 syntax diagnostics using TypeScript 5.8.3.
- No TODO/FIXME/HACK markers in app/lib/components.
- Environment audit: all app-specific `process.env` references are documented in `.env.example`; `NODE_ENV` is a platform-provided runtime variable and intentionally not listed.
- No hardcoded cloud `.mp3` storage key was reintroduced.
- v18.8.48 creation-state and commercial invariants are reasserted in the v18.8.49 release tests.

## Database migration
`supabase-v18.8.49-hardening.sql` adds:
- `memberships.billing_country`
- `stripe_webhook_events` for idempotency
- `cantoa_public_rate_limits` plus service-role RPC for distributed public throttling

The code includes compatibility fallbacks so older schema does not immediately break core flows, but the migration is required for the full v18.8.49 hardening guarantees.

## Boundaries
The v18.8.48 Vercel deployment shown by the owner reached `Ready`, confirming that release built in Vercel. This audit does not claim that v18.8.49 itself has built on Vercel until it is deployed. Live Stripe event delivery, provider calls, Supabase migration execution and browser/media-permission behavior still require production smoke tests after this new release is deployed.

Website import remains application-layer SSRF hardened, but ordinary platform `fetch()` does not provide network-layer DNS pinning; v18.8.49 further narrows risk with standard-port enforcement and an 8-second fetch timeout rather than claiming impossible absolute immunity.
