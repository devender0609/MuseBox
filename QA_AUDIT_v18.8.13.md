# Cantoa QA Audit v18.8.13

## Scope
Order-independent Sing & Use export reliability.

## Root cause fixed
Karaoke/Instrumental and Six Stems previously owned separate async provider promises. Random-order clicks could overlap provider requests, hit provider concurrency/rate limits, or complete against stale per-song state. The apparently reliable test order only worked because it warmed the 2-stem cache first.

## Changes
- Added one per-song export session keyed by `song.id`.
- Added a serialized per-song stem-provider queue.
- Added a single shared 2-stem archive promise/cache used by Karaoke, Instrumental and Six-Stem fallback.
- Kept Six-Stem output as its own single promise/cache.
- Added stale-song guards before downloading async results.
- Reset the entire export session when changing/opening songs.
- Removed non-standard WAV artwork mutation from provider-returned instrumental WAV files; MP3 artwork remains supported.
- PCM WAV continues to derive only from the original finished-song blob and validates audible source audio first.

## Expected behavior
The same finished song must produce the same valid outputs regardless of click order. Concurrent clicks are serialized at the provider boundary and reuse cached assets instead of launching duplicate separation work.

## Database / configuration
No Supabase SQL or new environment variables are required.
