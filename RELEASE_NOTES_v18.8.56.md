# Cantoa v18.8.56 — Theme & Library Reliability Patch

This release is intentionally small and low-risk. It keeps the v18.8.55 feature set and commercial/provider logic unchanged.

## Fixed

- Dark-mode placeholders are now explicitly readable across the studio, including the main creation description field.
- Light-mode placeholders also have an explicit, consistent secondary-text color.
- Expired Cloud Library signed URLs now refresh automatically before Open Song, Compare Versions, Create From, Blend, or lyric retrieval fails.
- Library signed-URL responses are marked `private, no-store` to avoid stale browser caching.
- Create From / Blend now supports Escape-to-close, keyboard focus trapping, initial modal focus, and focus restoration.

## Validation

- 26/26 current v18.8.56 release tests passed.
- 134 TS/TSX files syntax-transpiled with 0 syntax errors.
- No new SQL.
- No new environment variables.
- No pricing, allowance, entitlement, or provider-routing changes.
