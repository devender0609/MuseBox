# Cantoa QA Audit v18.8.12

Purpose: harden Sing & Use audio exports after live QA found silent Instrumental/Stem/PCM downloads and misleading WAV artwork behavior.

## Changes
- Instrumental/Karaoke now preserve the provider-native separated audio (normally MP3) instead of unnecessarily decoding and re-encoding it to PCM WAV.
- Provider-native MP3 instrumental/stem downloads receive Cantoa ID3 title + cover artwork metadata.
- Backing-track audio is decoded and checked for duration, peak and RMS before download; silent output is refused.
- Six-stem export now verifies every included stem is decodable and audibly non-silent.
- If the provider's detailed six-stem result is not usable, Cantoa automatically retries the robust two-stem vocal + instrumental split and states this in the manifest/UI message rather than sending empty tracks.
- PCM WAV export is kept as a clean RIFF PCM file for compatibility. It validates audible source audio before download. Cantoa no longer relies on non-standard WAV embedded-artwork behavior, which media players may ignore or mishandle.
- Karaoke player continues to embed the verified backing audio and lyrics in the portable HTML package.
- Per-song in-memory caching remains in place so Karaoke and Instrumental reuse the same two-stem result.

## Verification
- New v18.8.12 focused regression suite: 5/5 passed.
- Broad source suite was also exercised; legacy version-pinned tests for older releases and environment-dependent compiled-Next/React tests are not applicable to this source-only package.
- Full Next.js build still requires the complete dependency tree; Vercel is the final production build/typecheck gate.

## Product note
ElevenLabs documents stem separation as potentially high-latency, especially for longer source files. Two-stem and six-stem requests are provider-backed operations; Cantoa now avoids duplicate two-stem work, but a first-time detailed six-stem request can still take materially longer than a normal file download.
