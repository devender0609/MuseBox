# Cantoa v18.8.35 QA Audit

## Scope
Mureka billing calibration and Owner Console historical cost backfill.

## Calibration source supplied by owner
Mureka Billing screenshot on 2026-09-10 showed the `cantoa` API key, service type `Music generation`, total spending US$2.90, current balance US$7.10, and latest API call 2026-09-08 10:59. The current Owner Console showed 18 successful Mureka generations that were previously unpriced.

## Changes
- Calibrated ordinary Mureka song generation at observed average US$2.90 / 18 = US$0.1611 per successful generation.
- Future Mureka song generation events receive this calibrated estimate in `provider-costs.ts`.
- Historical successful Mureka song events with null cost are backfilled in-memory by Owner Analytics, without mutating the stored generation audit log.
- Historical `video_soundtrack` rows are excluded from the song backfill because that route already has its own calibrated cost basis.
- Owner Console cost policy now states the observed Mureka billing basis and calibration date.
- Existing Creator 40-minute and Studio 120-minute allowances are unchanged.

## Expected dashboard effect for the supplied 30-day snapshot
If the same 18 previously unpriced Mureka song rows are in the selected window, known provider spend should rise by approximately US$2.90 and those rows should no longer count as unknown-cost generations. Exact traffic-bucket totals depend on which users/plans those Mureka rows belong to.

## Verification
Static focused tests in `tests/cantoa-v18-8-35.test.mjs` validate the calibration, future event pricing, historical analytics-only backfill, video-soundtrack exclusion, and Owner Console cost-policy text.

Vercel remains the final production build/typecheck/runtime gate.
