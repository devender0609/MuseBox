# Cantoa v18.7.8 — Owner truth, generation UX & SEO hygiene

## Changes
- Owner Console now separates final success from primary-route completion and fallback rate.
- Provider cards show primary requests, actual attempts, direct completions, fallback-ins/outs, known spend, unknown-cost count, and P50/P95 latency.
- Unknown Mureka song cost is displayed as Unknown rather than $0 when no calibrated cost exists.
- Successful fallback generations preserve the prior provider error as an operational fallback reason in the existing `error_code` field; no database migration required.
- User generation messaging now progresses through creating, longer-than-usual, and finalizing states without exposing provider names.
- `/checkout-success`, `/owner`, `/api/*`, and `/share/*` are excluded from crawling; checkout and share pages also carry noindex metadata where applicable.
- Added canonical host/protocol proxy redirect for `http` and `www` requests to `https://cantoamusic.com`.
- Marketing copy standardized to "First 2 music creations free".

## Deployment
No new environment variables and no SQL migration are required for this release.
