# Cantoa v18.8.7 QA audit

Scope: Sing & Use state/download patch only.

- Karaoke and Instrumental now use independent UI busy states.
- A single shared backing-track promise deduplicates simultaneous stem-separation work.
- Clicking one utility no longer globally deselects the other via the generic `action` state.
- If one utility starts the backing-track job, the other can join/reuse that same in-flight result.
- Blob downloads now use a hidden attached anchor with the `download` attribute and no `_blank` target, avoiding intentional tab creation/navigation.
- Completed backing audio is cached for the currently opened song and reused by both utilities.
- Per-song reset clears backing-track status/promise and utility busy flags.
- No provider routing, pricing, membership, SEO, authentication, free-entitlement, or database schema changes.
- No SQL rerun required.
