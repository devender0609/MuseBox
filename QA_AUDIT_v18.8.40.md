# Cantoa v18.8.40 — streamlined UX / logic audit

## Scope reviewed
- Create page: moment launcher, starter ideas, real-to-music sources, quick/advanced composer, prompt detection, media attachment state, song length, A/B preview, membership messaging.
- Finished-song surface: Download/Sing & Use, revisions, More with this song, Group Song, My Voice, Secret Drop, Creator Pack / social exports.
- Library and account transitions.
- Video export branding: Reel, square video, lyric video, Memory Movie, Gift Reaction.
- Existing free/paid entitlement values and provider-generation paths were intentionally not redesigned in this release.

## Fixes
1. Website helper copy no longer leaks into the normal composer status area.
2. Opening Website no longer overwrites the user's composer prompt with a generic webpage sentence.
3. Real-to-music panels are mutually exclusive and closing/switching clears their hidden source state.
4. Story helper reduced to one free-form sentence/short story plus optional vibe chips; no survey-like who/relationship form.
5. Starter ideas show three by default; More ideas expands the rest.
6. New Song now truly starts fresh: prompt, source URL/text/audio, visual/video source state, story helper, source panels and starter expansion are reset.
7. Images selected from Photo/Screenshot now remain visibly identified in the composer attachment control while active.
8. Informational/progress/success messages use neutral status styling instead of always appearing as red errors.
9. Screenshot limitation remains explicit: Cantoa does not pretend to OCR message screenshots for lyric-level meaning.
10. Verified Cantoa video branding remains always-on in generated social video, Memory Movie and Gift Reaction exports.

## Deliberately preserved
- Explore: 2 free successful music creations, max 2 minutes each.
- Creator: 40 generation minutes/month.
- Studio: 120 generation minutes/month.
- Stripe/payment logic, provider routing/cost accounting, Group Song 2.0 access rules, My Voice access rules, library logic and download click guard.

## Verification
- Focused regression suite for v18.8.36–v18.8.40 and v18.8.6 vocal export compatibility.
- Static syntax/parser check attempted with installed TypeScript tooling; full Next build remains Vercel's production gate because dependencies are not installed in the packaged source tree.
