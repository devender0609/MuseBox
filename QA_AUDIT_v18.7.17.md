# Cantoa v18.7.17 QA Audit

## Scope
Small product-intelligence release built on v18.7.16. No provider routing, pricing, entitlement, SEO/indexing, payment or account logic was changed.

## Changes
- Added three contextual Smart Actions on the result page. Suggestions adapt to instrumental, business, multilingual and personal/gift-oriented songs.
- Existing revision controls are preserved under **More changes**, reducing visual density instead of adding another permanent tool panel.
- Deepened both client-side and server-side generation quality guidance so current explicit user intent wins conflicts; names, language, vocal type, lyrics and mood are preserved more deliberately; production instructions are not sung; phrase-boundary repetition and abrupt endings are discouraged.

## Safety / cost
- Smart Actions use the existing revision workflow and do not add hidden generations. Nothing runs until the user chooses an action.
- No provider/fallback changes.
- No new environment variables or SQL.
