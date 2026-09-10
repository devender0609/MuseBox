# Cantoa v18.8.9 QA audit

This patch addresses the user-observed Sing & Use failures without adding new primary navigation.

- Owner QA is no longer blocked by customer stem quotas.
- Two-stem karaoke/instrumental and six-stem exports use separate paid-user rate buckets.
- Backing-track and six-stem provider results are cached for the currently opened song to prevent duplicate provider jobs on repeated clicks.
- Karaoke ZIP now contains WAV backing audio, TXT lyrics, estimated LRC timestamps, and a self-contained karaoke-player.html for on-screen lyrics after extraction.
- WAV remains audio-only by design; the package explicitly explains this.
- Revision Studio now preserves the source song mode, duration, and stored lyrics.
- Legacy revised songs incorrectly stored as instrumental are treated as vocal when stored lyrics exist, including when loaded from cloud lyrics sidecars.
- Library vocal/instrumental filtering reflects stored lyric evidence for affected legacy revisions.
- Dark/light utility and error-message contrast received an additional hardening pass.
- No SQL/schema change and no new environment variable are required.
