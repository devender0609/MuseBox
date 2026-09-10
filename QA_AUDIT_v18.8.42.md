# Cantoa QA Audit v18.8.42

Scope: UX density, progressive disclosure, source/starter state, Story helper polish, post-song feature overload, Finish & Share duplication, and preservation of generation/payment/provider logic.

## Changes
- The “Not sure what to make?” area no longer disappears after a starter is chosen. It becomes a compact “Want a different direction?” strip and expands only when requested.
- Story helper copy and typography were upgraded. The central prompt is now “What should this song remember?” with a clear one-line helper and a larger input.
- Source cards and helper panels use larger labels, descriptions, hit targets and spacing.
- “More with this song” now shows four useful next-step actions first; the long-tail feature set is preserved under “More tools”.
- Finish & Share now exposes four primary actions first. Secondary square/lyric/memory/jingle/link tools are under “More export & sharing options”.
- No song-generation, quota, Stripe, provider-routing, Group Song persistence, My Voice entitlement, Library, or download-click-through logic was intentionally changed.
- Video export implementation was not rewritten; existing always-on Cantoa watermark paths remain intact.

## Regression focus
- starter ideas remain visible/accessible after selection
- source panels remain mutually exclusive
- story panel remains lightweight
- all previously available post-song tools remain reachable
- no new SQL or environment variables
