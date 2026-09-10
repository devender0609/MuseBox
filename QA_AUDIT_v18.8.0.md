# Cantoa v18.8.0 — Cantoa Moments / no-clutter innovation layer

## Goal
Add substantial new product capabilities without expanding the primary Create navigation or crowding the result screen.

## Added
- One collapsed **More with this song** surface branded **Cantoa Moments**.
- **Song DNA** reuse and preview.
- **Emotion Lock** for future revisions.
- **Living Song** next-chapter creation.
- **Cantoa Time Machine** re-imagining flow.
- **Song Reply** flow, including reply CTA on recipient gift pages.
- **Best Moment AI**: analyzes finished audio locally and seeks a stronger 15-second section for Reel export.
- **One song → many formats**: Reel, square, and lyric-video packaging from the finished song.
- **Memory Capsule** ZIP with song, story context, photos, lyrics, DNA, and already-created visuals.
- **Song Passport** provenance / identity export.
- **Group Song** private contribution links + creator retrieval of submitted memories.
- **Secret Song Drop** scheduled server-side gift-page lock.
- **Daily Soundtrack** continuation.
- Contextual **duet across languages** action for multilingual vocal songs.
- Background **cultural intelligence**, **story-to-chorus**, and **duet intelligence** in the generation brief.
- Existing gift reactions, Memory Movie, Creator Pack, social exports, pronunciation tools and Smart Actions remain intact.

## Progressive disclosure
None of the new result tools are permanently added to the primary navigation. The Cantoa Moments surface is collapsed by default. Group and drop controls appear only after the user deliberately opens it.

## Cost behavior
- Song DNA, Song Passport, Memory Capsule, group contribution collection, and social packaging do not silently call a music provider.
- New versions (Living Song, Time Machine, Song Reply, Daily Soundtrack, Duet) prepare or invoke an explicit new generation/revision only after the user chooses the action.
- Existing entitlement and refund logic is unchanged.

## Database
Run the appended v18.8 section of `supabase-setup.sql` once to enable Group Song contribution links and Secret Song Drop. Existing song generation and gift pages continue to work if that migration has not yet been applied; the new server-dependent actions return a setup message instead of silently failing.

## Regression
200 source/regression tests pass when excluding the same two environment-dependent tests that require an installed React tree / compiled `.next` output.
