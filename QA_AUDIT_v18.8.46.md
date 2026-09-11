# Cantoa v18.8.46 — exhaustive product, logic and QA audit

## Scope reviewed

This pass reviewed the current v18.8.45 source as a product manager, UX reviewer, application engineer and owner/operator. The review covered the main Create flow, Quick and Advanced modes, starter/moment selection, Smart Create summary, Story/Website/Photo/Video/Audio source precedence, lyrics/language/voice controls, duration and plan rules, generation planning, provider routing/fallbacks, revisions, A/B/version comparison, Library/local/cloud persistence, downloads, stem/karaoke exports, social video/watermarks, Gift pages/reactions, Group Song, My Voice, Saved People & Moments, membership/Stripe, Supabase quota accounting, Owner Console/analytics, public marketing pages, server API validation, source URL security, and customer-facing documentation.

## Issues found and fixed in v18.8.46

1. **Source-only Website flow could still depend on a normal typed prompt.** A website is now a valid creation input by itself. Pasting a bare HTTPS URL is converted into a safe generic creation brief before webpage context is added.
2. **Hidden source state could conflict across tabs/media.** Switching Story/Website/Photo/Video now clears stale text/audio/video/photo source state. Add Media now chooses one primary media type deterministically; mixed audio/video selections no longer leave multiple generation modes active.
3. **Server duration limits did not match the UI.** Music generation, music planning, remix and cloud metadata accepted up to 10 minutes while the product advertises a 5-minute render ceiling. All now enforce 300 seconds server-side.
4. **Media APIs trusted the browser too much.** Remix now rejects non-audio files and files over 50 MB. Visual soundtrack rejects anything that is not image/video and retains image/video size limits.
5. **Website redirect handling was too brittle.** Public HTTPS redirects are now followed up to a bounded limit, with every redirect host revalidated. Redirects to non-HTTPS/private targets are rejected.
6. **SSRF hardening missed some IPv4-mapped IPv6 private addresses.** `::ffff:` targets are now normalized back through the IPv4 private-address check.
7. **Cloud delete could orphan state if storage deletion failed.** Cantoa now stops before deleting the database row and reports that nothing was deleted.
8. **Native audio container could be mislabeled as MP3.** Downloads, sharing, revision source files and cloud upload metadata now preserve WAV/MP4-family vs MP3 MIME/extension where supported instead of blindly forcing `.mp3`/`audio/mpeg`.
9. **Group Song premium enforcement existed primarily in the UI.** Owner create/read Group Song endpoints now enforce Creator/Studio server-side as well. Recipient contribution links remain intentionally account-free/unlisted.
10. **Group Song privacy wording overstated privacy.** Customer copy now calls token links **unlisted** rather than implying authenticated/private access.
11. **Some current customer controls were still visually tiny.** Smart Create, language/pronunciation and My Voice micro-controls received a minimum readability pass without expanding the main navigation or adding new surfaces.
12. **README/deployment guidance still contained old 50/150-minute and legacy one-free-song language.** Current documentation now reflects 2 free songs (≤2 minutes each), Creator 40 minutes and Studio 120 minutes.

## Precedence / intent rules checked

- New explicit user choices remain the strongest input.
- Only one primary source tool is active at a time.
- Website context augments the creative brief; it does not silently become protected copied lyrics.
- Photo/video soundtrack path takes the dedicated soundtrack route.
- Audio reference takes the remix route.
- Explicit lyrics remain lyrics; planning does not overwrite them.
- Vocals/Instrumental controls affect output form independently of source context.
- Advanced-only settings do not silently leak into Quick/Create mode.
- Standard instrumental does not automatically force Stable Audio; background/ambient intent is required for that preferred route.
- Provider fallback remains compatibility-based; creative-policy rejection is not silently bypassed.
- New Song clears prior source state.

## Commercial/account invariants rechecked

- Explore: 2 free successful creations, each capped at 2 minutes.
- Creator: 40 generation minutes/month.
- Studio: 120 generation minutes/month.
- Failed provider-backed generations refund the reserved entitlement.
- True recurring subscription-cycle invoices refill paid minutes; prorations/one-off invoices do not.
- Existing paid accounts are directed to Stripe membership management instead of opening duplicate subscription checkout.
- Group Song/My Voice/revision/export premium controls retain their existing plan rules; Group Song owner APIs are now server-enforced.

## QA performed

- v18.8.43 + v18.8.44 + v18.8.45 + v18.8.46 focused regression suite: **24/24 passed** after the final changes.
- v18.8.46 new regression tests cover source precedence, website-only creation, safe redirects/SSRF, media validation, 5-minute ceiling, cloud-delete honesty, audio MIME preservation, Group Song server entitlement, wording/readability and package version.
- TypeScript/TSX parser/transpile scan: **131 source files, 0 syntax diagnostics**.
- Full historical static test folder was also inspected. Old version-pinned tests intentionally conflict with later product changes and build-dependent tests require a built `.next` tree/installed React dependencies; they are not used as the current release gate.

## What cannot be truthfully certified from an offline source bundle

A source audit cannot prove live third-party behavior. Final production smoke testing must still confirm: live Stripe checkout/portal/webhook events, Supabase production schema/storage/RPCs, ElevenLabs/Mureka/Stability credentials and quotas, browser microphone/camera permissions, and real exported media in supported browsers. Vercel remains the final full Next.js production build/typecheck gate.

## Database / environment changes

- **No SQL migration required.**
- **No new environment variables required.**
