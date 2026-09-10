# Cantoa v18.8.5 QA audit

## Goal
This release freezes the visible feature set and improves clarity/reuse instead of adding another permanent feature button.

## Changes
- Cantoa Moments derived flows (Song DNA reuse, Living Song, Time Machine, Daily Soundtrack, Song Reply and Group Song) now keep detailed preservation instructions in provider-facing context instead of exposing machine-like instructions in the main Create text box.
- Users see short natural-language briefs that they can edit normally.
- Provider-facing Song DNA context still reaches previews and final generation.
- Starting a normal new song or choosing a top-level Moment clears derived context so it cannot leak into unrelated creations.
- Library now has lightweight search and one compact filter control (All, Vocals, Instrumentals, Revised versions) without adding a new navigation tab or feature mode.
- Existing Create, Advanced, Revision Studio, More with this song, Finish & Share, memberships, owner console, provider routing, pricing, fallback and entitlement logic remain in place.

## Product rule
No new permanent navigation tabs or creation modes were added. The goal is less visible complexity with more intelligence underneath.
