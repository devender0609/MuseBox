# Cantoa v18.3.5 QA Audit

## Changes
- Added **Use my lyrics** to simple Create. Users can paste up to 8,000 characters without opening Advanced.
- User-supplied lyrics now bypass automatic lyric planning so the app does not replace the submitted words before audio generation.
- Preserved optional Song title and Style controls in both Create and Advanced.
- Expanded language guidance to make clear that listed languages are examples; users can type other languages, dialects, regional variants and mixed-language combinations.
- Preserved v18.3.4 membership allowances: Creator 40 new-music minutes/month; Studio 120 new-music minutes/month.

## Verification
- 90/90 source and regression tests passed.
- Full `next build` was not run in this sandbox because the packaged deployment intentionally does not include installed Next/React dependencies. The two environment-dependent rendered/UI tests therefore were not counted as passing.
- No SQL migration required.
