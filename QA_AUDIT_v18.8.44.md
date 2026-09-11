# Cantoa QA Audit v18.8.44

## Scope
This patch includes all v18.8.43 fixes and adds the final Owner Console refinements requested after production screenshot review.

## Changes verified
- Fallback reasons are classified into quota/API, rate limit, timeout, network/transport, provider 5xx/unavailable, content/policy rejection, invalid/unsupported request, authentication/permission, other provider error, and unknown/not logged.
- Mureka-like providers that are used only as fallback destinations can display `Fallback-heavy` instead of a generic `Attention` badge.
- `Active membership records` is renamed to `Active accounts by plan`.
- `Current calibrated assumptions` is renamed to `Cost assumptions used in analytics`.
- Dry routing diagnostics are more compact and responsive.
- Generation-log minimum width is reduced while retaining all columns.
- v18.8.43 billing, Stripe portal, subscription-cycle quota renewal, renewal-date, Explore 2-song fallback, cloud delete, Gift Reaction, unlisted-link, latency, economics, and Owner Console fixes remain present.

## Database / environment
- No SQL migration.
- No new environment variables.

## Validation
- Targeted v18.8.43 + v18.8.44 source regression tests run before packaging.
- TypeScript/TSX syntax parsing is run on modified files where the local parser is available.
- Vercel remains the final full Next.js production build/typecheck gate.
