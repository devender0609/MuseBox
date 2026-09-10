# Cantoa Studio v18.7.0 QA Audit

## Release scope
- Regional subscription pricing: Creator US$7.99 / ₹499; Studio US$19.99 / ₹1,299.
- Country-aware display using `cf-ipcountry` first and `x-vercel-ip-country` second.
- Stripe Checkout Sessions use four explicit recurring Price IDs and verify currency, amount and monthly interval before opening checkout.
- Creator entitlement: 40 music-generation minutes/month.
- Studio entitlement: 120 music-generation minutes/month.
- Explore entitlement: exactly two complete songs per account, each capped at 2 minutes; any two Moments may be used.
- Failed free generations restore the free-song entitlement; failed paid generations restore reserved generation minutes.
- A/B previews and revisions remain paid features.
- Owner analytics separates INR and USD MRR instead of guessing an FX conversion.

## Regression verification
- 124/124 applicable source/regression tests passed.
- New v18.7 tests cover exact US/India prices, regional Stripe Price IDs, Stripe Price validation, 40/120 server entitlements, two-free-song reservation/refund behavior, and paid-only previews/revisions.
- TypeScript/TSX parser check on all modified runtime files: 0 syntax diagnostics.
- Secret/TODO/FIXME/HACK scan on runtime/configuration source: no findings.
- package.json and package-lock.json both report 0.18.7.0.

## Environment-dependent checks
Two existing tests are not counted in the 124 applicable tests because this packaged workspace intentionally does not include installed React/Next dependencies or a generated `.next` production build:
- `tests/ui-components.test.mjs`
- `tests/rendered-html.test.mjs`
Vercel remains the definitive production compile/render check after deployment.

## Deployment requirements
1. Run the current `supabase-setup.sql` once. It is rerunnable and adds `free_songs_remaining`, `billing_currency`, and `billing_amount_minor` plus the one-time v18.7 migration.
2. Create four monthly recurring Stripe Prices and add their IDs to Vercel:
   - `STRIPE_CREATOR_PRICE_USD` = US$7.99/month
   - `STRIPE_STUDIO_PRICE_USD` = US$19.99/month
   - `STRIPE_CREATOR_PRICE_INR` = ₹499/month
   - `STRIPE_STUDIO_PRICE_INR` = ₹1,299/month
3. Keep existing `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
4. Checkout fails closed if the matching price is missing or its Stripe amount/currency/interval does not match Cantoa's advertised price.
