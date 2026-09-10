# Cantoa Studio v17.8 — Competitive Feature QA

## Baseline
Built directly on v17.7. The v17.6 visual/layout architecture is intentionally preserved. No new top-level navigation was added.

## Added
1. Advanced Pronunciation Studio: multiple named terms/readings, scoped to all vocals, verse, chorus, or bridge/outro.
2. Section Language Plan: explicit verse, chorus, and bridge/outro language assignments added to the structured generation brief.
3. Automatic social video: Creator/Studio/Owner users can render 15-second vertical or square WebM videos in-browser with the actual generated song audio.
4. Creator Pack 2.0: MP3, lyrics, metadata/rights note, platform-specific captions, three SVG artwork formats, and an automatic vertical social video when browser APIs support it.
5. Gift Experience 2.0: animated recipient reveal, sender attribution, reactions, and a direct recipient-to-creator loop. Reactions use a hashed IP + user-agent fingerprint; raw IP addresses are not stored by Cantoa.

## Database
Run the included `supabase-setup.sql` once after deploying v17.8. It adds `songs.gift_from` and the `gift_reactions` table/index. The script remains rerunnable.

## Browser caveat
Automatic social video uses Canvas capture, Web Audio and MediaRecorder. Current Chromium/Firefox browsers should support the flow; unsupported browsers receive a clear message. Output is WebM, which can be uploaded directly where supported or transcoded to MP4 in a publishing tool.

## Access
Social video and Creator Pack 2.0 use the existing premium-tool gate. Explore users keep their full first-song MP3 download/share experience and gift-page sharing.
