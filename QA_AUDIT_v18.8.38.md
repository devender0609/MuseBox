# Cantoa v18.8.38 QA Audit

Scope: navigation/duplication cleanup, dark-mode voice CTA visibility, and universal Cantoa video branding. No changes to provider routing, free allowance, membership/Stripe logic, generation-minute accounting, Group Song, library persistence, or owner economics.

## Changes verified
- `Speak your idea` now has an explicit high-contrast dark-mode treatment and hover state.
- `Turn something real into music` no longer duplicates three controls already present in the composer. Text is pasted directly into the main idea field; voice stories use `Speak your idea`; existing audio uses `Add media`. The launcher keeps the unique entry points: Story Interview, Website, Photo/Screenshot, and Video.
- Social Reel, square video, lyric video, and Memory Movie rendering always draw `Made with Cantoa`, regardless of Explore/Creator/Studio/Owner plan.
- Gift Reaction Capture is now recorded through a branded canvas and includes visible `Cantoa · Moments → Music` branding in the exported reaction video.
- Existing free/paid logic is untouched. Creator remains 40 minutes; Studio remains 120 minutes; Explore still has two free music creations up to two minutes each.

## Static regression checks
`node --test tests/cantoa-v18-8-36.test.mjs tests/cantoa-v18-8-37.test.mjs tests/cantoa-v18-8-38.test.mjs`

Result: 14/14 passed.

## Important limitation
The packaged source does not include an installed dependency tree, so a full Next.js production compile/typecheck was not run locally. Vercel remains the final production build/typecheck/runtime gate. Browser video rendering should be tested on current Chrome/Edge/Firefox because it relies on `MediaRecorder` + canvas capture.
