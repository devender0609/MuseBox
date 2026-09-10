# Cantoa v18.8.34 QA Audit

## Scope
Owner Console accounting-label correctness and clarity only. No user plan allowance changes.

## Changes
- Renamed paid gross contribution to **Paid contribution before unknown costs**.
- Renamed margin display to **known-cost margin ceiling**.
- Added count of unpriced USD paid generations beside the contribution metric.
- Added exact 30-day known-provider-spend / USD-MRR percentage instead of a generic 60% threshold message.
- Alert now explicitly says total provider spend includes Explore and Owner/Test traffic and directs the owner to the separate paid economics.
- Added a known spend / USD MRR card in Unknown-cost impact.
- Preserved Creator 40-minute and Studio 120-minute monthly allowances.

## Verification
Run focused static tests in `tests/cantoa-v18-8-34.test.mjs`. Full Next/Vercel build remains the production compile/typecheck gate.
