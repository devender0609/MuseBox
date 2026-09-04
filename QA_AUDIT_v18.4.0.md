# Cantoa v18.4.0 QA audit

## Why this release exists
Live cost-routing tests on 2026-09-02 showed approximately US$0.15 for a one-minute ElevenLabs music generation, 26 Stability credits (~US$0.26 at the purchased credit rate) for a one-minute Stable Audio 3.0 generation, and approximately US$0.10 for the tested Mureka visual soundtrack workflow. v18.3.8 correctly sent every Instrumental-toggle request to Stability, but the live data showed that policy was not cost-efficient for ordinary short instrumentals.

## Routing correction
- Ordinary vocal song: ElevenLabs first.
- Ordinary instrumental song: ElevenLabs first when configured.
- Background / ambient / cinematic-score / atmospheric / sound-design / texture / meditation / sleep / relaxing instrumental: Stability first, with ElevenLabs fallback.
- Attached video + soundtrack intent: dedicated Mureka `/api/soundtrack` workflow.
- Mureka soundtrack generation retains `n: 1` to prevent accidental duplicate paid generations.
- If the preferred provider is unavailable or fails, compatible fallbacks remain available.

## Membership economics guard
Creator remains 50 new-music minutes/month at US$9.99 and Studio remains 150 minutes/month at US$24.99. Re-exports from existing audio remain outside new-music minute charging. Provider failures continue to refund reserved user minutes.

## QA scope
The release is checked for source/regression behavior, TypeScript/Next production build, lint, rendered/component tests when the environment supports them, routing precedence, provider fallbacks, soundtrack upload path, membership entitlements, free-generation enforcement, theme/membership contrast regressions, lyrics preservation, title/style controls, language copy, and archive integrity.

## Known external limitation
No automated local test can prove third-party provider uptime or quality. Live provider billing tests remain the authoritative check for real external routing/cost, and provider pricing can change.
