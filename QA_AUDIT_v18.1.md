# Cantoa Studio v18.1 — Video + Theme + Language QA

## Scope
Built directly on v18.0 without changing the navigation or primary layout.

## Changes
- Rebuilt vertical Reel renderer at 1080×1920 with safe margins, dedicated album-art card, controlled title wrapping, waveform, progress and footer.
- Rebuilt square renderer at 1080×1080 instead of cropping the vertical composition.
- Reworked lyric video as a separate full-screen template with readable lyric focus.
- Reworked Memory Movie at 1080×1920 with safer title/dedication placement and photo-focused motion.
- Exported videos use their own presentation palette; app light/dark mode no longer controls the video design.
- Audited result actions, Finish & Share, download tiles, revision buttons, panels, disabled states and modals for light/dark contrast.
- Expanded curated language presets across South Asian, East/Southeast Asian, Middle Eastern, European/American and African languages.
- Added dialect/variant presets while preserving free-text language entry.
- Added collapsible Language details so the composer stays compact.
- Expanded quick mixed-language section patterns (Hindi, Punjabi, Tamil, Telugu, Arabic and Spanish with English).

## Database
No new SQL migration is required relative to v18.0/v17.8.

## Verification
See tests/cantoa-v18-1.test.mjs and the complete regression suite.

## Verification result
- 69/69 targeted source/regression tests passed (v14 through v18.1).
- TypeScript parse/type scan showed only missing dependency/type declarations because node_modules is not installed; no new syntax-level errors attributable to v18.1 were observed.
- Full Next.js production build was not claimed because dependencies are unavailable in this sandbox.
