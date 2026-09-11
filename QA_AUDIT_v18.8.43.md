# Cantoa v18.8.43 QA audit

## Scope
Stability, billing correctness, Owner Console interpretation, error honesty, and low-risk usability fixes. No new major customer-facing feature.

## Correctness changes
- Blocks a signed-in Creator/Studio account from opening a second paid subscription checkout; existing paid members are directed to authenticated membership management.
- Replaces the deprecated static Stripe portal URL with a customer-specific Stripe Billing Portal session created server-side after Supabase authentication.
- Paid generation minutes refill only when `invoice.billing_reason === "subscription_cycle"`; proration/plan-change/adjustment invoices do not reset quota.
- Stripe subscription updates maintain `current_period_end`, billing currency/amount, and detect Creator/Studio from the active Stripe Price ID.
- Cancellation clears renewal date and keeps consumed Explore entitlement from being silently restored.
- Legacy null fallback for Explore is consistently two songs, not one.
- Cloud library deletion no longer removes the local copy if cloud deletion fails.
- Gift Reaction reports unsupported-browser or camera/microphone permission failures instead of failing silently.
- Gift link terminology is consistently "unlisted" rather than mixing private/public.
- Account and Membership dialogs close with Escape.

## Owner Console changes
- Top KPIs prioritize active USD MRR, paid-generation spend, paid contribution before other costs, and final user-facing success.
- Explore + Owner/Test spend is separated from paid-customer economics.
- Removes the misleading principal alert comparing all provider spend directly with MRR.
- Explore-to-paid metrics are labeled as observed overlap/directional spend, not attribution-grade CAC.
- Recent P50/P95 latency is shown alongside selected-window P95 so recovered performance is not hidden by old spikes.
- Latency split added for primary-route vs fallback-route successes.
- Fallback reason summary added from logged provider errors.
- Generation log gains Primary/Fallback route filtering, compact route display, shorter prompt previews, cost-basis labeling, and 25-row progressive loading.
- "Active accounts" is renamed to "Active membership records" to reflect the underlying query.
- INR MRR remains separate and is demoted from prime dashboard space when not decision-critical.
- Cost-control wording is simplified and no longer presented as dynamic live verification.

## Verification
- Current v18.8.42 + v18.8.43 focused regression suite: 11/11 passed.
- Changed TypeScript/TSX files parsed with TypeScript compiler parser: 0 syntax diagnostics across 10 files.
- Full `next build` was not run locally because the deployment ZIP does not include installed Next/React dependencies. Vercel remains the full production build/typecheck gate.
- The full historical test directory contains intentionally stale version assertions and tests requiring `.next`/installed React; it is not used as the current-release pass criterion.

## Deployment
- SQL migration: none.
- New environment variables: none.
- `STRIPE_CUSTOMER_PORTAL_URL` is no longer required; Stripe Billing Portal sessions use `STRIPE_SECRET_KEY` and the stored customer ID.
