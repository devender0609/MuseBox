# QA Audit — Cantoa v18.8.54

Baseline: deployed v18.8.53 package supplied in the current conversation.

## Scope

This pass was intentionally additive and non-destructive. It focused on:

1. desktop width consistency seen in the supplied screenshots;
2. phone consistency for every new surface;
3. Library-to-remix workflows;
4. avoiding duplicate billing/provider logic;
5. preserving v18.8.52/v18.8.53 source precedence and stale-media protections.

## Findings fixed

### 1. Main Create surface was visibly narrower than the moment/source surface
The older CSS retained a historical `composer` max width while the moment launcher used a wider surface. v18.8.54 puts both on one 1080 px studio grid on desktop.

### 2. Library had no consolidated create-from-existing-song workflow
A new `Create from` action now provides nine transformations without deleting or replacing the existing open/delete Library behavior.

### 3. Multi-song creative reuse was fragmented
Blend Songs now selects 2–4 saved songs and creates one new song from an explicit anchor plus the other songs' saved prompt/lyric context.

### 4. Potential stale media precedence during Library remix
Before preparing an audio transform, v18.8.54 explicitly clears text/link/Photo/Video source state, memory photos, starter provenance and visual auto-instrumental provenance. This protects the existing routing invariant that an old visual attachment must not silently capture a later audio remix.

### 5. Keep-lyrics workflow could partially mutate state before discovering missing lyrics
The stored-lyrics requirement is now validated before the Create workspace is reconfigured.

### 6. Blend anchor order
The anchor is derived from the ordered selection IDs rather than the Library's display sort order, so the song shown as `Anchor` is the song actually sent as the audio source.

### 7. Generic derivative version labels
Prepared transforms now provide meaningful saved version labels.

## Automated checks

- `tests/cantoa-v18-8-54.test.mjs`: **11/11 passed**.
- TypeScript syntax/transpile sweep across `app`, `components`, and `lib`: **123 files, 0 syntax-error files**.
- Previous v18.8.52 functional regression suite was also inspected; its only unavoidable failure against later packages is its hard-coded historical version assertion. Several still-older static suites intentionally expect superseded implementation strings and are not used as the release gate.

## Current release gate coverage

The v18.8.54 test checks:

- package/current-test version;
- shared desktop studio width;
- preservation of v18.8.53 phone full-width/safe-area behavior;
- Library open/delete plus new Create from action;
- all nine transformation choices;
- reuse of the existing audio remix path;
- 2–4 song Blend bounds;
- deterministic anchor ordering;
- honest creative-DNA wording rather than waveform-splice claims;
- meaningful derivative version labels;
- required section direction for Replace a section;
- responsive transform modal and mobile Library action.

## Not claimed

A local dependency-backed `next build` was not available in this container because the project dependencies are not installed here. Vercel reaching **Ready** remains the final dependency/compiler integration gate, as in the prior releases.

Provider behavior still requires normal production smoke testing with the connected ElevenLabs/other configured music services. In particular, provider interpretation of requests such as "replace a section" is generative: Cantoa produces a new full version; it does not claim destructive DAW-style in-place editing of the original waveform.

## Deployment requirements

- No new SQL.
- No new environment variables.
- Deploy normally from the same Vercel project.
