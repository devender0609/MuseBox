# Cantoa v18.8.29 QA audit — Group Song 2.0

## Added
- Structured contributor types: Memory, Message, Song idea.
- Optional emotional intent / feeling.
- Optional JPG/PNG/WebP photo upload, max 5 MB, stored privately in the existing `songs` bucket and served with short-lived signed URLs.
- Shared private-link contribution board.
- Per-browser toggle voting on contributions.
- Owner-side Group Song brief generation sorted by votes while explicitly preserving representation of quieter contributors.
- Group page link can be copied or opened directly from the finished-song tools.
- Light/dark styling for the updated owner controls; responsive public contribution page.

## Data / security
- Existing private collection tokens remain the access boundary for contributors.
- Voting uses a random browser-local voter token and a database unique constraint per contribution to reduce duplicate voting from the same browser. It is lightweight preference voting, not identity-verified polling.
- Photos use signed URLs and are not made public-bucket assets.
- Only the authenticated song owner can load collected contributions into a Cantoa generation brief.

## Migration required
Run the updated `supabase-setup.sql` once after deployment. It is idempotent and adds three contribution columns plus `moment_contribution_votes`.

## Verification
Focused v18.8.27 + v18.8.28 + v18.8.29 regression checks: **11/11 passed**.
Vercel remains the final production build/typecheck gate.
