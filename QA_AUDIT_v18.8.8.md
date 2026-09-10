# Cantoa v18.8.8 QA audit

Targeted fixes:
- Karaoke and Instrumental now request ElevenLabs two-stem separation and use the provider's instrumental stem directly.
- Karaoke/Instrumental refuse to download if the returned instrumental is empty, undecodable, or effectively silent.
- Six-stem ZIP validates ZIP signature, expected audio entries, non-empty files, and audible audio before download.
- Stem API validates provider archive integrity before returning it to the browser.
- Sing Along, More with this song, download controls, and result secondary controls have explicit light/dark contrast rules.
- The previously white More-with-this-song header in dark mode is theme-safe.

Verification:
- 224/224 applicable source/regression tests passed.
- Full local Next.js production build was not completed because dependency installation exceeded the execution environment timeout; Vercel remains the final build/typecheck verification.
- No database schema change and no SQL rerun required.
