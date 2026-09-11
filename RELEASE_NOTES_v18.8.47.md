# Cantoa Studio v18.8.47

Targeted hardening release based on v18.8.46.

## Changes
- Lock creation/source controls and Create/Library/New Song navigation while generation or direction previews are active, preventing tab/source changes from making the UI diverge from the running request.
- Preserve native supported cloud audio extensions (`.mp3`, `.wav`, `.m4a`).
- Make lyrics sidecars extension-agnostic for listing, deletion and shared-song playback.
- Use **unlisted** consistently for Group Song collection links.
- Add best-effort server-side throttling to public Group Song contributions and vote changes.
- Move Group Song voter identity from client-controlled localStorage to a server-issued HttpOnly same-site cookie.

## Retained product rules
- Explore: 2 free creations, max 2 minutes each.
- Creator: 40 generation minutes/month.
- Studio: 120 generation minutes/month.
- Maximum generation duration: 5 minutes.
- Existing provider-routing policy retained.

## Validation performed
- `node --test tests/cantoa-v18-8-47.test.mjs`: 9/9 passed.
- Global TypeScript `transpileModule` syntax diagnostics across every modified TS/TSX file: 0 errors.
- Full dependency-backed Next.js build was not completed in the review container because `npm ci` timed out. Deploy/Vercel build and real external-provider smoke tests remain required.

No new SQL. No new environment variables.
