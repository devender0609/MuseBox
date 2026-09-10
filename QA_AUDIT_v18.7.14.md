# Cantoa v18.7.14 targeted quality polish

- Replaced the old first-five-prompt-words automatic title with a quality-aware title helper.
- Vocal songs first try to derive a concise title from the generated chorus/hook itself, so titles can reflect the actual song rather than repeat prompt wording; no extra provider request or credit is used.
- Added natural titles for common intents such as patriotic hip-hop, birthday, wedding, anniversary, Navratri, romantic evening, and relaxing evening creations.
- Added a conservative fallback that removes instruction/filler words before title-casing the remaining concept.
- Explicit titles typed by users still win exactly as before.
- Output-page description now shows a cleaned, sentence-like creative brief instead of raw command wording; the original prompt is still stored unchanged for revisions, records, exports, and cloud persistence.
- No provider routing, fallback, membership, pricing, indexing, entitlement, or generation-minute logic was changed.
