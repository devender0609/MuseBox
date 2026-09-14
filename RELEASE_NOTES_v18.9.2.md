# Cantoa v18.9.2 — hardening release

This release intentionally avoids changes to generation pricing, quotas, provider routing, Stripe entitlements, Create/Advanced behavior, Smart Remix, Blend, and Library generation flows.

## Security and privacy
- My Voice provider IDs moved from editable auth metadata to `cantoa_voice_profiles`, a service-role-only ownership table keyed to `user_id`.
- My Voice preview/delete now verify ownership server-side.
- Provider deletion must be confirmed before the Cantoa ownership record is removed.
- Failed voice-save cleanup now reports whether provider cleanup was actually confirmed.
- Gift-link disable clears the old share token so a later re-share gets a new URL.
- Group Song close rotates the token and marks the collection closed; reopening generates a new URL.
- Generation diagnostics use a rolling 30-day retention cleanup.
- CSP is introduced as Report-Only to observe violations without breaking production integrations.

## Controls and reliability
- Added visible Disable Gift Link, Close Group Link, and Cancel Secret Drop actions.
- Standardized accepted audio uploads across Remix, Stems, Transcribe, and My Voice.
- Added minimum helper-text readability rules in the affected sharing/voice surfaces.
- Added `/privacy` and `/terms` informational pages.

## Database step required
Run `supabase-v18.9.2-hardening.sql` once in Supabase before using reusable My Voice. The full `supabase-setup.sql` also includes this migration.
