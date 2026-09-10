# Cantoa v18.6.0 QA Audit

## Scope
Customer-acquisition / SEO release. Adds eight first-party landing pages on cantoamusic.com, deep-link CTAs into the existing creation flow, per-page metadata, sitemap and robots directives. Core generation, billing, account, owner analytics and provider routes are intentionally unchanged except for reading optional `prompt` from a landing-page URL.

## Landing pages
- /birthday-song
- /wedding-song
- /anniversary-song
- /song-for-someone
- /reel-music
- /business-jingle
- /hindi-song
- /hinglish-song

## Search readiness
- Unique titles/descriptions/keywords per use case.
- Canonical URL per page.
- OpenGraph/Twitter metadata.
- `/sitemap.xml` via Next metadata route.
- `/robots.txt` allows public pages and excludes `/owner` + `/api/`.
- Internal links among use-case pages.

## Conversion path
Every primary CTA sends the visitor to the existing Cantoa studio with the relevant `moment` query parameter. Example prompts also pass `prompt`, and the existing Create screen now reads that optional prompt without changing the underlying generation workflow.

## UI
Dedicated Cantoa marketing treatment: ivory/midnight parity, editorial serif headings, coral/rose/violet/gold accents, responsive layouts, no provider names exposed to customers.

## Regression policy
Existing provider routing, usage accounting, Stripe, Supabase, free entitlement, owner analytics, gifts, video and generation APIs were not modified by this release.

## Verification performed
- 118/118 applicable source/regression tests passed.
- Two existing environment-dependent tests remain excluded because this workspace does not have installed React/Next dependencies or a completed `.next` production build.
- New landing-page structural checks passed.
- Critical provider/billing/usage backend files were byte-for-byte unchanged from v18.5.0.
- Secret-like literal scan passed.
- TODO/FIXME/HACK scan passed across app/lib/components.
- ZIP integrity passed.
