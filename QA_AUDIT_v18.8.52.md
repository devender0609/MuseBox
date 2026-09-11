# Cantoa v18.8.52 QA audit

This release is a non-feature state-transition and redundancy hardening pass on v18.8.51.

Verified/fixed:
- New Song now resets all per-song creative state that could silently leak into the next song (recipient, dedication, details, mode, duration, style, language, voice, fine-tune controls, pronunciation/section-language state, starter overrides, etc.).
- Switching/closing/hiding Photo or Video tools clears only the instrumental mode that Cantoa itself auto-applied for that visual source.
- Generic Add media -> Video now selects the real video soundtrack path, sets the video moment, and supplies a default soundtrack brief when needed.
- Song DNA/Living Song/Time Machine/Daily Soundtrack/Song Reply and Group Song contribution flows clear stale source files, URLs, video, photo-score files and memory-photo state before starting the new creation.
- Audio revision/remix clears stale visual sources before enabling the audio-reference path, so old video/photo state cannot steal routing precedence.
- A/B direction previews are hidden/blocked for attached photo/video because those previews do not analyze the visual media and should not consume a minute misleadingly.
- Group Song owner activity now reports vote-query failures instead of silently displaying zero votes.
- Photo/video accept lists and soundtrack server MIME validation agree: JPG/PNG/WebP and MP4/WebM/MOV.
- Removed unused backing-track React state, unused memory-photo object-URL state/effect, and an unreachable voice-memo helper.
- Current focused regression suite: 12/12 passed.
- Syntax transpile audit: 123 TS/TSX source files, 0 syntax-error files.
- API route inventory remains 26 routes.
- No new SQL migration and no new environment variables.

Production integrations still require live smoke testing after Vercel deployment; this audit does not claim provider, Stripe or Supabase availability without exercising those live services.
