# Cantoa v18.8.51

Production polish and verification release. No pricing, plan allowance, provider-routing or product-feature changes.

## Highlights
- Prevents Google Ads analytics from loading on unlisted Gift/Group Song, Owner and checkout-success pages.
- Removes query strings and URL paths from Cantoa's analytics referrer reporting.
- Expands robots protection for private/unlisted/admin/payment routes.
- Adds production security headers and canonical www → apex redirect.
- Improves Stripe checkout-return reconciliation for webhook timing delay.
- Scopes My Sound preferences per account on shared browsers.
- Makes provider-configuration diagnostics owner-only.
- Removes raw unlisted tokens from persisted public rate-limit identifiers.
- Scopes anonymous Group Song voting and Gift reaction identifiers per link.
- Stops vote-query failures from being displayed as zero votes.
- Distinguishes shared-song DB outages from invalid Gift links.
- Cleans up reaction video object URLs and improves ARIA state on public contribution/reaction controls.
- Confirms generation-minute refunds before recording a failed provider request as refunded.
- Cleans up remaining “private” wording where the actual model is an unlisted link.

## Deployment
No new SQL and no new environment variables are required for v18.8.51. Deploy over v18.8.50 after the v18.8.50 database migration is already in place.

After Vercel reports Ready, verify:
1. `https://www.cantoamusic.com/...` redirects to `https://cantoamusic.com/...`.
2. Response headers contain nosniff, DENY frame policy, origin referrer policy and HSTS on production.
3. Gift/Group Song token pages still open and work, but do not load Google Ads scripts.
4. Stripe test checkout returns to Cantoa and membership changes from Explore to paid without requiring multiple manual refreshes.
5. A failed provider test (where safe) does not claim “refunded” unless the quota restoration RPC succeeds.
