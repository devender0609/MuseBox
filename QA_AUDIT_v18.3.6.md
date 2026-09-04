# Cantoa v18.3.6 QA

- Fixed dark-mode membership card contrast: card surfaces, prices, allowance text, feature lists and buttons now receive explicit dark-theme colors.
- Preserved paid allowances at Creator 40 and Studio 120 minutes to avoid an unsafe margin expansion while third-party provider costs are still being benchmarked.
- Reframed membership value around successful new AI-audio minutes, automatic refunds for failed provider generations, and unlimited reasonable-use re-exports from completed songs.
- Removed raw “13 songs / 40 songs” comparisons from cards because they invite an unfavorable and misleading comparison with vertically integrated providers.
- Stripe monthly entitlement logic remains 40/120 server-side. No SQL migration.
