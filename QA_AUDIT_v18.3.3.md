# Cantoa v18.3.3 QA Audit

## Routing fix
v18.3.2 recognized a narrow set of video-soundtrack phrases. A natural request such as `Create cinematic music that follows this video` with an attached video could therefore miss the Mureka soundtrack route and fall through to normal music generation.

v18.3.3 broadens soundtrack intent recognition for attached video/clip/Reel/footage requests containing score, soundtrack, music-for-video, follows/follow, matches/match, sync/synchronized, or cinematic-music language. The existing `/api/soundtrack` endpoint remains the dedicated Mureka route.

## Verification
- 82 source/regression tests passed, including the new natural-language soundtrack-routing regression.
- 2 environment-dependent tests could not execute because this sandbox lacks installed React/Next dependencies and generated `.next` build artifacts; these are the same environment-bound checks documented in earlier releases.
- ZIP integrity verified after packaging.
