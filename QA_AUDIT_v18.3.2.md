# Cantoa Studio v18.3.2 QA Audit

## Scope
v18.3.2 is a focused payment simplification release built from v18.3.1.

## Changes
- Razorpay/UPI removed from all active checkout logic.
- Razorpay webhook route removed.
- Razorpay environment variables and plan IDs removed from `.env.example` and current deployment instructions.
- Customer-facing India/Razorpay/Paytm/PhonePe checkout claims removed.
- Stripe remains the single active subscription checkout provider.
- Optional Mureka and Stability music-provider integrations remain unchanged and independent of payments.
- `supabase-setup.sql` no longer introduces Razorpay-specific schema fields. An already-existing unused column in a deployed database is harmless.

## Security / behavior
- Checkout still requires an authenticated Cantoa account.
- Only Creator and Studio can be requested.
- Checkout destinations must be configured HTTPS Stripe Payment Links.
- User ID and email are passed as Stripe checkout references as before.

## Verification
- Legacy and current source/regression tests are rerun for this package.
- A dedicated v18.3.2 regression test asserts there are no Razorpay env variables, routes, UI claims, or checkout code, while Mureka/Stability remain available.
