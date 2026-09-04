# Cantoa Studio v17.9 — QA and polish audit

This release builds directly on v17.8 without changing the established navigation or page architecture.

## Changes
- Removed persistent developer-style gift-page success text. Successful gift creation/copy now uses a short transient toast.
- Social-video actions are explicitly capability checked. Unsupported browsers show disabled actions instead of implying rendering will work.
- Successful social video is a real WebM generated from canvas animation plus the finished song audio. A visible in-app video preview and download action confirm the file exists.
- Finish & share heading and buttons use smaller, less-heavy typography with restrained luminous gradients.
- Top result actions and download choices use a coordinated polished color system.
- Expanded language suggestions while retaining free-text language entry.
- Added quick mixed-language section templates (Hindi/English, Punjabi/English, Spanish/English) inside the already-collapsed section-language tool.
- Language copy avoids promising unsupported provider capabilities; final quality remains provider-dependent.

## Preserved
- v17.5 free-song entitlement protection and migration repair.
- v17.4 security/rate-limit/cloud fixes.
- v17.6 layout and light/dark theme system.
- v17.7 My Sound, natural-language revisions, A/B and Best of both.
- v17.8 Pronunciation Studio, section-language control, Creator Pack 2.0, Gift Experience 2.0 and social-video rendering.

## Verification
- Run `node --test tests/cantoa-v14.test.mjs tests/cantoa-v15.test.mjs tests/cantoa-v16.test.mjs tests/cantoa-v17*.test.mjs` for source/regression coverage.
- The combined v14–v17.9 source/regression suite passed 60/60 tests. A TypeScript parse check reported only missing dependency/type modules because node_modules is not installed; no syntax-level TypeScript error was reported. A full Next.js production build still requires registry access to install dependencies.

## Database
No new SQL is required for v17.9 if the v17.8 `supabase-setup.sql` has already been run successfully.
