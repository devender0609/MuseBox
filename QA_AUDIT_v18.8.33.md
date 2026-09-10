# Cantoa v18.8.33 QA Audit

Scope: Owner Console economics and decision-support improvements only. No consumer feature or entitlement changes.

## Added
- Explore acquisition cost per unique generator in selected analytics window.
- Observed Explore→paid conversion signal using current paid membership email matched to Explore generation events in the selected window. UI explicitly labels this directional, not attribution.
- Observed acquisition cost per conversion when an observed conversion exists.
- Known USD paid gross contribution and known gross margin, excluding Stripe fees, taxes, infrastructure and unknown provider costs. INR revenue is not mixed into USD provider economics.
- Unknown-cost impact panel showing unpriced successes, known-spend floor and providers blocking complete margin calculation.
- Provider-level known cost per priced success and cost-coverage percentage.
- 30-day Explore economics warning when Explore known spend reaches at least 50% of active-plan USD MRR.

## Preserved
- Creator 40 / Studio 120 generation-minute allowances.
- Existing provider routing and fallback behavior.
- Existing 24h / 7d / 30d analytics windows.
- Existing owner/test separation.
- Unknown provider costs remain unknown and are never treated as $0.

## Caveats
- Explore→paid is an observed selected-window signal, not a causal attribution model.
- Known gross contribution is not net profit and excludes Stripe fees, taxes, infrastructure, support, refunds outside provider restoration, and unknown provider costs.
- Full provider spend cannot be estimated until unpriced provider paths (currently notably Mureka song generations) are calibrated. The console therefore shows a known-spend floor instead of inventing a range.
