# Cantoa v18.3.1 build-fix audit

## Production build issue fixed
Vercel compiled the Next.js application successfully but TypeScript failed in `lib/music-providers.ts` because the Mureka payload is a union: the instrumental payload intentionally has no `lyrics` property, while the vocal payload does. Accessing `payload.lyrics.trim()` after constructing that union was therefore unsafe.

The fix validates a standalone `preparedLyrics` string before building the payload. Instrumental requests remain lyric-free; vocal Mureka requests require non-empty prepared lyrics.

## Regression verification
78/78 source/regression tests passed after the patch.

## Deployment
No database migration was added by this patch. If the v18.3 Supabase SQL was already applied, do not rerun it solely for v18.3.1.
