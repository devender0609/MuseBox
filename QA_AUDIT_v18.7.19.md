# Cantoa v18.7.19 QA Audit

Focused metadata-safety and multilingual-context correction.

- Blocks internal planning/provider instructions from output descriptions.
- Uses a deterministic safe metadata fallback if all prompt clauses are internal.
- Passes generated lyrics into output metadata generation as an additional safe signal.
- Recognizes Hindi-Spanish / Spanish-Hindi as multilingual for Smart Actions.
- Adds Hindi-Spanish-specific editorial metadata when that mix is requested.
- Provider routing, fallback, pricing, plans, SEO, payment, entitlement and generation accounting unchanged.
