# Cantoa Studio v18.8.50

v18.8.50 is a verification/hardening release. It does not intentionally add a new user-facing feature.

### Reliability and concurrency
- Makes authenticated API throttling atomic across multiple tabs/serverless requests.
- Makes Stripe webhook idempotency crash-safe with processing/processed claims and stale-claim recovery.
- Prevents an unfinished concurrent webhook from being falsely acknowledged as complete.

### Billing and entitlements
- Checkout now fails closed if Cantoa cannot verify the current membership, preventing accidental duplicate paid subscriptions during a database failure.
- Account, premium-feature, Group Song, My Voice, and customer-portal checks no longer misclassify membership database failures as ordinary Explore/non-paid states.

### Cloud Library and sharing
- Rejects caller-supplied song UUIDs that already belong to another user before service-role upsert.
- Library delete now proves related Group Song photo metadata can be loaded before deleting cloud audio.
- Share/Secret Drop/Library read failures return truthful temporary-service errors instead of false “not found” responses.

### Public/unlisted flows
- Adds read throttling to Group Song activity and Gift reaction counts.
- Hardens Group Song voting against simultaneous insert races and checks database failures consistently.
- Distinguishes Group Song database failure from a genuinely closed/invalid contribution link.

### QA
- Adds a consolidated current-release regression suite.
- `npm test` now builds and runs the current release gate; historical version-pinned tests remain available separately with `npm run test:historical`.
- 9/9 current v18.8.50 release tests pass.
- 121 TS/TSX files pass syntax-transpile validation with zero syntax errors.

### Deployment
Run `supabase-v18.8.50-hardening.sql` once after the base Supabase setup, then deploy to Vercel and run the live smoke-test matrix described in `QA_AUDIT_v18.8.50.md`.
