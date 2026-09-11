# Cantoa Studio v18.8.47 QA Audit

## Scope
Targeted hardening release on top of v18.8.46. No pricing, allowance, provider-routing, SQL schema, or environment-variable changes.

## Fixed in this pass
- Cloud library now preserves supported native audio filename extensions (`.mp3`, `.wav`, `.m4a`) instead of storing every file as `.mp3`.
- Lyrics sidecar lookup/delete/share derives from any supported audio extension rather than assuming `.mp3`.
- Creation workspace, Create/Advanced and source controls are locked while a generation or direction-preview job is running. Main Create/Library navigation and New Song are also disabled during the active job, preventing UI state from drifting away from the request that is actually running.
- Group Song wording now consistently describes the contribution URL as **unlisted**, not private.
- Public Group Song contribution and vote endpoints have best-effort server-side request throttling without new infrastructure or environment variables.
- Group Song vote identity is no longer accepted from client-controlled localStorage. The server issues/uses an HttpOnly same-site cookie and rate-limits vote changes.

## Generation/tab behavior
When the user presses Create, the active React render already provides a snapshot-like closure for the async generation path. v18.8.47 adds an explicit UI lock so users cannot change creation/source tabs or navigate to another creation state while that request is in progress. This removes ambiguity about whether later clicks changed the song being generated.

## Product invariants retained
- Explore: 2 free creations, up to 2 minutes each.
- Creator: 40 music-generation minutes/month.
- Studio: 120 music-generation minutes/month.
- Server generation ceiling: 300 seconds / 5 minutes.
- Existing provider routing/fallback policy retained.
- Group Song owner tools remain Creator/Studio server-gated; recipients can contribute through the unlisted link.

## Infrastructure
- No new SQL.
- No new environment variables.

## Security note
The in-process throttler is intentionally a no-infrastructure, best-effort protection. It materially raises the cost of accidental/repetitive abuse per active server instance, but it is not a globally distributed anti-abuse service. If Group Song traffic becomes high or adversarial, move these limits to a shared store/edge rate limiter.
