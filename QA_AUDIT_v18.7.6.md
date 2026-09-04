# Cantoa v18.7.6 — Membership Usage Clarity

## Scope
- Paid Creator/Studio account UI now states remaining music-generation minutes against the monthly allowance (40 / 120).
- Added a Monthly usage panel with a remaining-minutes meter.
- Added next reset date when `current_period_end` is available from the membership record.
- Explicitly states that Reels and video exports made from finished songs are included and do not consume music-generation minutes.
- Top-profile usage copy now distinguishes music minutes from video/export usage.
- Existing Manage Membership / Stripe Customer Portal flow from v18.7.5 is preserved.

## Intended plan semantics
- Creator: 40 new-AI-music-generation minutes per billing cycle.
- Studio: 120 new-AI-music-generation minutes per billing cycle.
- Reels, square videos, lyric videos, gift pages, and re-exports from an existing finished song do not use those music-generation minutes.
