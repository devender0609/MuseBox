# Cantoa v18.8.6 QA Audit — Sing & Use

## Scope

v18.8.6 adds practical post-generation utility without adding new primary navigation or permanent result-page buttons.

### Added inside the existing Download panel

- **Lyrics · Sing Along** for finished vocal songs with stored lyrics.
  - Uses the existing song player.
  - Highlights lyric lines based on playback progress.
  - The UI explicitly states that follow-along timing is estimated; Cantoa does not claim word-level synchronization without provider timestamps.
- **Karaoke package · Creator** for vocal songs.
  - Reuses the existing provider-backed stem-separation route.
  - Builds a non-vocal backing WAV from returned non-vocal stems.
  - Packages backing WAV + stored lyrics + a short README into a ZIP.
  - Does not generate a new song or consume music-generation minutes; existing stem-export/provider limits still apply.
- **Instrumental version · Creator** for vocal songs.
  - Reuses the same cached backing-track result when available so clicking Karaoke then Instrumental does not repeat stem separation in the same opened song session.
  - Downloads a WAV backing track assembled from non-vocal stems.

## UI guardrails

- No new sidebar item.
- No new Create mode.
- No new permanent result-page button.
- Vocal-only utilities are hidden for instrumental songs.
- Sing Along is only shown when stored lyrics exist.
- Existing MP3, stems ZIP, lyrics TXT, WAV, Revision Studio, Cantoa Moments, Finish & Share, membership, pricing and owner-console surfaces remain in place.

## Accuracy / safety behavior

- Cantoa does not pretend that local filtering can reliably remove vocals. Karaoke and instrumental exports call the existing server-side stem-separation route.
- Vocal-named stem files are excluded before the backing mix is assembled.
- The Karaoke README warns that separation quality depends on source mix and provider output.
- Sing Along describes timing as estimated rather than claiming exact synchronization.

## Regression results

- **217 / 217 source/regression checks passed.**
- Two existing environment-dependent checks were not run in this packaged source tree:
  1. rendered production HTML check requires a compiled `.next` build;
  2. UI component runtime check requires installed React dependencies.
- Vercel remains the final production build/typecheck verification.

## Deployment

- No Supabase schema change.
- No SQL rerun required.
- No new environment variable is introduced.
- Karaoke/instrumental exports rely on the already-existing `ELEVENLABS_API_KEY` stem-separation integration and its provider/account eligibility.
