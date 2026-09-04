# Cantoa Studio v18.0 — Intent-Led Creation QA

## Scope
v18.0 builds on v17.9 without adding new navigation or changing the established visual layout. The release moves complexity behind the prompt and adds contextual outputs.

## New capabilities
- Cantoa Intent Planner infers requested deliverables from the user's prompt.
- Compact “Cantoa understood” summary instead of more permanent controls.
- Optional photo attachment beside voice input, up to 20 photos.
- Studio Memory Movie renderer: vertical WebM using the finished song audio and uploaded photos.
- Creator/Studio lyric-video renderer using generated lyrics and actual song audio.
- Studio 15/30/60-second Business Jingle Pack with three provider-backed audio renders in a ZIP.
- Word-preservation intent for vows, letters, poems and requests such as “don’t change my words.”
- Prompt-level detection for instrumental requests and common bilingual Hindi/English, Punjabi/English and Spanish/English directions.
- Server-authorized feature matrix for browser-side premium tools.

## Membership model encoded
### Explore — Free
- Build/customize before sign-in.
- One complete song free, up to 2 minutes.
- MP3 download and sharing.
- Opt-in gift page.
- Multilingual and pronunciation controls.
- Private cloud library after sign-in.

### Creator — US$9.99/month
- 20 generation minutes.
- Make It Better revisions and A/B/Best-of-both workflow.
- WAV, stems, social video and lyric video.
- Creator Pack 2.0.
- My Sound workflow.
- Commercial-use eligibility where provider terms allow.

### Studio — US$24.99/month
- 60 generation minutes.
- Everything in Creator.
- Memory Movie from up to 20 photos.
- 15/30/60-second Business Jingle Packs.
- Intended for larger multi-output projects.

Owner retains unlimited owner access.

## Access enforcement
`lib/features.ts` is the canonical feature matrix. `/api/feature-access` verifies the signed-in account server-side before premium browser-generated assets such as Memory Movie, social/lyric video and Creator Pack are created.

Provider-backed music generation remains protected separately by the existing Supabase usage reservation system.

## Verification
- Legacy + v18 source/regression suite: 65/65 passing after updating the superseded version assertion.
- TypeScript parse attempt produced only unresolved-module/type-declaration errors because node_modules is not installed in this sandbox; no syntax parse errors were reported in changed files.
- ZIP integrity verified after packaging.

## Database
No new database schema is required for v18.0 beyond the successful v17.8 Supabase setup already used by v17.9.
