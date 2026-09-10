# Cantoa v18.8.18 QA Audit

Focused fixes from live QA on 2026-09-09.

- Download panel suppresses accidental double-click propagation/click-through.
- MP3/local downloads remain ungated.
- PCM WAV, Karaoke, Instrumental and Six Stems use silent entitlement checks: denied access shows an inline message instead of opening Account/Membership automatically.
- Export actions explicitly close stale Account/Membership surfaces before starting.
- Six Stems and PCM WAV buttons are disabled while their jobs are actively processing.
- Long progress labels wrap inside download cards and cannot overflow the card.
- Removed hidden monthly 20/60 stem request quota. Paid users retain a generous 60 requests/hour abuse guard; owner remains exempt. Provider credits/plan still govern actual ElevenLabs availability.
- Existing per-song stem serialization/caching remains in place.
- ElevenLabs stem API contract rechecked against current documentation: POST /v1/music/stem-separation, stem_variation_id two_stems_v1/six_stems_v1, ZIP response; high latency may occur for long audio.

Focused regression tests: 6/6 passed (`tests/cantoa-v18-8-18.test.mjs`).

A full Next.js production build still must be verified on Vercel because this package does not contain installed dependencies/.next output.
