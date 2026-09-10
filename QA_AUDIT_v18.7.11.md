# Cantoa v18.7.11 — Advanced controls, voice input & indexing QA

## Fixed in this release
- Speech-to-text microphone requests now send the signed-in Supabase bearer token to `/api/transcribe`. The API already required authentication, so the previous browser request could fail even for a signed-in user.
- Updated the v18.7.9 regression test to verify the canonical redirect in `proxy.ts` (Next.js 16) rather than the removed legacy `middleware.ts` file.
- Refined robots policy: `/owner` and `/checkout-success` remain explicit `noindex, nofollow` pages but are no longer blocked in `robots.txt`, allowing compliant crawlers to see the noindex directive. `/api/` and private token share paths remain disallowed.

## Re-verified by source audit
- Prompt-explicit vocal direction overrides selected/saved vocal direction.
- Default vocal direction is `Auto — follow my prompt`.
- Advanced controls feed the structured generation brief: style, language, optional voice, emotion, structure, section-language plan, pronunciation instructions, lyrics, exclusions, quality, faithful/bold direction, style influence, creative variation, output mode and requested duration.
- Speech-to-text uses ElevenLabs `scribe_v2`; the production key therefore needs Music Generation + Speech to Text access.
- Finalizing UI state clears once audio is ready.
- Provider errors are converted to user-facing Cantoa messages; owner diagnostics retain classified fallback reasons.
- Marketing pages have self-referencing HTTPS canonical URLs.
- Sitemap contains canonical HTTPS marketing URLs only.
- `/owner`, `/checkout-success`, and shared-song pages carry explicit noindex metadata.
- HTTP and `www` requests are permanently redirected to `https://cantoamusic.com` by `proxy.ts`.

## Indexing clarification
The Search Console screenshot showed the marketing pages indexed successfully. The cleanup issue was an old `http://cantoamusic.com/` URL variant appearing as an indexed URL. The app now redirects HTTP/www variants to the single HTTPS non-www canonical URL. Google may continue showing the historical HTTP row until it recrawls and consolidates it.

## Regression result
- `node --test tests/cantoa*.test.mjs`: **158/158 passed**.
- A full local `next build` was not run because dependency installation is unavailable/timed out in this container; Vercel remains the production build verification step.
