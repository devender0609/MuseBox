# Cantoa v18.8.52

## Purpose
Release-candidate state hygiene, routing correctness and redundancy cleanup. No new product features.

## Highlights
- Prevents stale Photo/Video state from influencing later songs, revisions, derived songs or Group Song builds.
- New Song now starts as a genuinely clean song draft while preserving account-level preferences/data.
- Video selected through Add media reliably uses Cantoa's soundtrack workflow.
- Visual media no longer offers misleading audio-only A/B previews.
- Closing or hiding a visual source removes Cantoa's auto-applied instrumental mode without overriding a later explicit user mode choice.
- Group Song vote read failures are surfaced truthfully.
- Removed dead/unused state and helper code.
- Unified advertised and server-accepted visual upload formats.

No new SQL. No new required environment variables. Pricing, quotas and provider precedence are unchanged.
