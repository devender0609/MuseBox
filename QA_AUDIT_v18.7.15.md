# Cantoa v18.7.15 QA audit

Targeted metadata-quality release only.

- Lyric-derived titles now trim repeated hook openings and weak trailing words, preventing titles such as “This Is Our Land This”.
- Output descriptions are compact editorial metadata built only from cues present in the user’s brief, rather than reproducing the full generation instruction.
- Explicit user-entered titles still take priority.
- No provider routing, fallback, pricing, entitlement, SEO/indexing, Create/Advanced, or membership logic was intentionally changed.
