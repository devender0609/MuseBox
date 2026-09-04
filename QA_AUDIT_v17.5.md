# Cantoa Studio v17.5 — Product / Security QA Audit

## Scope

Audited the v17.3.1 code path from anonymous visit through account creation, first free song, owner/paid generation, source import, voice transcription, cloud library, revisions, downloads, sharing/gift pages, membership/Stripe, themes, and failure handling. v17.5 preserves the preferred v17 visual composition rather than reintroducing the crowded v18 redesign.

## Critical defects fixed

1. **Light-mode Finish & Share rendered as a dark/blank panel.** Cause: v17 used the original dark `--panel/--line` tokens in a light theme. Added explicit light result styling and normalized shared light/dark tokens.
2. **Cloud status falsely said it would retry automatically.** There was no automatic retry. Failures now show an honest failure state plus a working **Retry cloud save** action.
3. **Auth could be connected while cloud storage was not.** The sidebar previously said `Cloud connected` based on sign-in alone. `/api/account` now reports `cloudConfigured`; the UI distinguishes **Cloud ready**, **Cloud setup needed**, and **Signed in**.
4. **Stem separation was not protected like generation.** `/api/music/stems` now requires authenticated Creator/Studio/Owner access and a server-side quota/rate limit. Explore still gets MP3 download and sharing.
5. **A newly generated song could be lost if IndexedDB failed.** The result is now shown immediately after successful provider generation; local-library failure no longer turns a successful paid generation into a false generation failure.
6. **New Song could accidentally link the next song as a revision of the previous song.** `newSong()` now clears the parent song/audio source/version state.
7. **Local browser library was not account-scoped.** New local records carry `ownerId`; signed-in libraries only show that account’s local songs. Legacy unscoped songs are hidden from signed-in accounts unless the user explicitly chooses **Recover device-only** after confirming ownership.
8. **Audio remix could nest the provider composition plan incorrectly.** Remix now extracts `rawPlan.composition_plan || rawPlan` and uses the same 48 kHz / 192 kbps MP3 output target as normal generation.
9. **Webpage import needed stronger server protection.** It now resolves DNS, rejects private/link-local targets, disallows redirects, accepts only public HTTPS text/html or text/plain, and caps downloaded source bytes.
10. **Provider-backed planning/transcription could be repeatedly called before using the free song.** Added database-backed per-account throttling in Supabase.
11. **Checkout could be called directly without an authenticated account.** `/api/checkout` now requires authentication before returning a Stripe destination with the account reference.
12. **Membership UI advertised unimplemented Studio benefits.** Removed priority-processing, album/project organization, and rollover claims. Plans now describe only implemented capabilities.
13. **Subscription failure lifecycle was incomplete.** Stripe webhook handling now covers subscription updates and failed invoices in addition to checkout, paid invoices, and deletion.
14. **Cloud library upload validation was weak.** Added UUID/mode/duration/file-size validation; missing cloud parents no longer break revision saves; failed database saves remove both audio and lyric sidecars.

## First-time / Explore behavior verified in code

- Anonymous visitor can browse Moments, Create/Advanced, source choices, language/style controls without generating paid audio.
- Source chooser stays collapsed until **Change** is clicked.
- Full audio generation requires sign-in.
- Explore receives exactly one complete song up to 2:00, reserved atomically server-side.
- Failed provider generation refunds the welcome entitlement.
- After the free song: MP3, lyrics, device share, social-share workflow, private library, Creation Record and opt-in gift page remain available.
- WAV, stems, Creator Pack, A/B previews and new audio revisions require Creator/Studio (Owner bypasses membership but not safety throttles).

## Owner behavior

- Owner identity is verified server-side by email.
- Owner generation remains unlimited by minutes.
- Provider endpoints still use rate limits to prevent accidental loops or abuse of a stolen session.
- Account UI no longer equates successful authentication with successful cloud-storage configuration.

## Theme review

Checked theme-specific CSS contracts for Create, Moments, source disclosure, result/player, Export, Share, Revision Studio, Finish & Share, Library, Account and Membership. The dark Revision Studio remains intentionally dark in both themes; the previously broken Finish & Share panel now follows the selected theme.

## Verification performed

- 39 targeted source/regression tests pass across v14–v17.5.
- TypeScript syntax parsing was run on all modified TS/TSX routes/components; no parse errors were found.
- ZIP integrity is checked after packaging.
- A fresh `npm ci` / full Next production build could not be completed in this sandbox because the npm registry dependency fetch timed out / one dependency was not present in the offline cache. Vercel will perform the normal dependency install/build from the included lockfile.

## Required deployment step

Run the current `supabase-setup.sql` again before public use. v17.5 includes the v17.4 account backfill/rate-limit schema plus the one-time Explore entitlement repair. Also add the Stripe webhook event types documented in `CANTOA_DEPLOYMENT.md`.


## v17.5 entitlement migration correction

The prior migration could falsely classify a pre-existing Explore/test account as having used its free song solely because its legacy minute balance was below two. v17.5 removes that inference. A one-time repair, recorded in `public.cantoa_schema_migrations`, uses a cloud-saved song as transition evidence; accounts without that evidence are restored to one complete free song up to two minutes. This repair is deliberately conservative in the customer's favor and cannot repeat on later setup reruns.

Customer-facing membership copy now states `1 complete song free` and `Up to 2 minutes · MP3 download & sharing included.`
