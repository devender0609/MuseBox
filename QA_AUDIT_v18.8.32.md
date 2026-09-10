# Cantoa v18.8.32 — Owner Console economics & routing audit

## What changed
- Confirmed production paid allowances remain Creator 40 music minutes and Studio 120 music minutes in checkout, pricing API, Stripe renewal webhook, UI copy and owner guardrails.
- Added owner analytics period switch: 24h / 7d / 30d.
- Added Traffic Economics section separating Creator/Studio provider spend from Explore, owner/test and unknown traffic.
- Added known provider cost per *priced* successful generation. Unknown-cost completions remain explicitly unpriced and are not treated as $0.
- Owner/test traffic is classified by the authenticated owner email, even if the owner's membership plan is Creator/Studio.
- Added Current issue / Historical issue / Owner note alert states so recovered 30-day problems do not look identical to current incidents.
- MRR-vs-provider-spend alert is evaluated only on the 30-day view, avoiding an invalid 1-day/7-day spend-to-monthly-revenue comparison.
- Added Generation Log filters for plan, provider and status.
- Added responsive + dark-mode styles for the new owner controls.

## Verification
Focused static regression tests:
- v18.8.31: 4/4 passed
- v18.8.32: 6/6 passed
- Combined: 10/10 passed

The packaged source does not include installed dependencies, so a full local `next build` / TypeScript production typecheck was not run. Vercel remains the final production build gate.

## Database / environment
- No SQL migration.
- No new environment variable.
