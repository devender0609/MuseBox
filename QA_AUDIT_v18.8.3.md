# Cantoa v18.8.3 QA Audit

## Scope
Focused full-app state and Cantoa Moments regression pass after reports that some result-page actions appeared unavailable after first use.

## Fixes
- Reset per-song transient Moment/export state when opening, generating, or switching songs so Group Song links, Secret Drop times, Emotion Lock, Best Moment offsets, share links, videos, Memory Movies and jingle-pack state cannot leak between songs.
- Song DNA now derives from the saved song brief itself rather than stale Create/Advanced form state.
- Smart revision actions and result-only intent controls now derive from the loaded song rather than whichever composer settings happened to be active.
- Best Moment AI and One song → many formats explicitly return to a reusable state after rendering; labels now make temporary rendering lockouts clear.
- Added media metadata/finalization timeouts so browser video rendering cannot remain indefinitely stuck in a busy state if MediaRecorder fails to finish.
- Added explicit progress messaging for multi-format exports.

## Regression results
- 206/206 source/regression tests passed when excluding the two environment-dependent tests that require installed React dependencies or a compiled `.next` tree.
- Existing v18.8 Group Song, Secret Drop, Best Moment, packaging, entitlement, routing, payment, SEO, library and generation tests remain intact.

## Not changed
Provider routing/fallback, plan pricing, Stripe, free/paid entitlement accounting, SEO/indexing, and music-generation behavior were not intentionally changed.

## Production verification
Vercel remains the final TypeScript/Next production-build verification because this deployment ZIP intentionally omits `node_modules` and `.next`.
