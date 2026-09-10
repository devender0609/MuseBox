# Cantoa v18.8.39 QA audit

Scope: simplify the Create-page "Turn something real into music" interaction without touching generation, plans, Stripe, routing, downloads, Group Song, Owner Console economics, or free-tier logic.

## Changes
- Removed the non-interactive "Already in the composer" card.
- Added one mutually-exclusive source panel state: Story, Website, Photo/Screenshot, or Video.
- Clicking another source closes the previous source UI and opens only the new one.
- Clicking the active source again closes it; double-click also closes the active source.
- Website URL input now appears inside the Website panel, avoiding a duplicate field lower in the composer while that panel is open.
- Story flow shortened from six survey-like fields to three lightweight inputs: optional subject, optional vibe, and one required story/moment field.
- Story copy changed to playful language: "Tell Cantoa one good thing" and "No survey. A sentence or two is enough."
- Photo and Video expose their upload controls only when selected.
- Added active-state and dark-mode styling.

## Preserved
- Explore: 2 free music creations, max 2 minutes each.
- Creator: 40 music minutes.
- Studio: 120 music minutes.
- Existing Stripe, provider routing, generation quota, watermark/export, Group Song, Library and Owner Console logic.

## Verification
Focused static regression tests were added in `tests/cantoa-v18-8-39.test.mjs`.

Focused v18.8.38 + v18.8.39 tests: 9/9 passed. `app/page.tsx` also passed a TypeScript parser/transpile syntax check. Vercel remains the full production build/typecheck gate because the packaged source does not include the installed dependency tree.
