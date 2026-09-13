# Cantoa v18.8.54 — Library Remix + Uniform Studio Layout

## What changed

### Create from an existing song
The Library now has a **Create from** action for every saved song. It opens a focused workflow with these choices:

- Another version
- Change style
- Keep lyrics · change music
- Keep music feel · new lyrics
- Extend
- Replace a section
- Make instrumental
- Make vocal version
- Blend songs

The same Remix / transform entry point is also available from a finished song under Cantoa Moments.

All of these preserve the original song. Cantoa prepares a new creation brief and uses the existing audio-remix path for the new generation.

### Blend Songs
Blend Songs lets the user choose **2–4 Cantoa Library songs**. One selected song is used as the audio anchor; the other selected songs contribute their saved creative brief and available lyric context. The output is a **new composition**. Cantoa does not claim to splice or stem-mix several source recordings together.

The user can type a natural instruction such as:

> Keep the chorus energy from Song A, the romantic storytelling from Song B, and the cinematic production from Song C.

### Better version labels
Prepared transformations are now saved with meaningful labels such as `Restyled`, `New arrangement`, `New lyrics`, `Extended`, `Instrumental version`, `Vocal version`, or `Blend` rather than every derivative being shown only as `Revised version`.

### Desktop layout consistency
The main moment/idea/source area and Create/Advanced composer now share one **1080 px studio grid** on desktop. The narrower composer was the reason the screenshots looked like two separate products stacked together.

The heading remains intentionally narrower for reading comfort, but the interactive creation surfaces now align to the same left/right edges.

### Phone consistency
The v18.8.53 mobile fixes remain intact. The new Create-from-song modal also has dedicated responsive behavior:

- full-width phone-safe modal
- one-column action choices on small phones
- one-column Blend song picker
- stacked full-width action buttons
- Library cards keep a clean full-width Create from button
- iOS safe-area and fixed-nav protection remain unchanged

## Safety / compatibility

- No pricing changes.
- No quota changes.
- No provider-routing policy changes.
- No new environment variables.
- No new SQL migration.
- Original songs are never overwritten by these workflows.
- Existing `/api/music/remix` is reused rather than introducing a parallel billing/provider path.
- Photo/video state is explicitly cleared before a Library audio transform so stale soundtrack routing cannot override remix routing.

## Important product wording

`Blend Songs` is intentionally described as **creative-DNA blending**, not literal multi-waveform/stem mixing. One song provides the audio anchor and the other selected songs provide stored creative context. This keeps the feature honest with the provider capabilities currently used by Cantoa.
