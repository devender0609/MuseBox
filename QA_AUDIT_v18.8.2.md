# Cantoa v18.8.2 QA audit

Focused Group Song idempotency patch.

- Reuses the existing `moment_collections` row for the same song + owner.
- Handles duplicate-key race (`23505`) by re-reading and returning the already-created token.
- Does not expose raw Supabase/Postgres errors to end users for Group Song create/load failures.
- No changes to music generation, provider routing, fallback, plans, Stripe, entitlements, SEO, or owner analytics.
