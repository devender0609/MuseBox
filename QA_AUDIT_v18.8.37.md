# Cantoa v18.8.37 QA Audit

## Scope
This release adds a guided Story Interview, a compact "Turn something real into music" source launcher, image/video soundtrack entry points, voice-memo transcription into a song brief, and optional local reaction-video capture on gift pages.

## Existing logic intentionally preserved
- Existing Create and Advanced generation paths remain in place.
- Existing `/api/music`, `/api/music/remix`, `/api/soundtrack`, `/api/source`, and `/api/transcribe` routes are reused rather than duplicated.
- Explore first-time allowance remains 2 successful audio creations, up to 2 minutes each.
- Creator/Studio music-minute entitlement and charging logic is unchanged.
- Paid-feature gates, downloads, provider routing/fallbacks, account/auth, Stripe, analytics, owner console, and Group Song logic are not modified by this release.
- No advertising logic or page-level monetization logic was changed.

## New behavior
1. **Tell Cantoa the story**: six short guided fields build an editable song brief. This step itself does not generate audio or consume minutes.
2. **Turn something real into music** launcher:
   - Text/message -> existing text-source song path.
   - Website -> existing safe public HTTPS reader.
   - Voice memo -> existing transcription API, then an editable song brief.
   - Photo/screenshot -> visual soundtrack path. For screenshots containing text, the UI explicitly asks the user to paste the text for lyric-level understanding rather than pretending OCR exists.
   - Video -> existing Mureka soundtrack path.
   - Existing audio -> existing remix/cover path.
3. **Gift reaction capture**: recipient may record up to 30 seconds of camera+mic reaction. The clip remains local to the recipient device unless they explicitly share/download it. No server upload is performed.

## Validation performed
- TypeScript parser/transpile syntax check: `app/page.tsx` PASS; `app/share/[token]/gift-client.tsx` PASS.
- Focused regression tests v18.8.36 + v18.8.37: 10/10 PASS.
- No SQL migration required.
- No new environment variable required.

## Production gate
A full Next.js production build was not executed in this packaged working tree because its dependency installation is not present. Vercel remains the final production build/typecheck/runtime gate.
