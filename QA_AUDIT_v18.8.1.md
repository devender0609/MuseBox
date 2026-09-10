# Cantoa v18.8.1 QA audit

## Build-fix scope

Vercel v18.8.0 compiled successfully but TypeScript failed in `app/share/[token]/page.tsx` because a Supabase `PostgrestBuilder` was chained with `.catch(...)`. That builder is awaitable but does not expose a Promise `.catch` method in its TypeScript type.

v18.8.1 removes the invalid chained `.catch()` and awaits `maybeSingle()` directly. Supabase query failures are returned in the result object (`data`/`error`), and `data` remains nullable, which preserves the intended optional Secret Song Drop behavior without the type error.

A repository search found no other `maybeSingle().catch` or `single().catch` instances.

## Verification

The failing line was corrected and the source was checked for the same invalid pattern elsewhere. A fresh local dependency installation was attempted for a complete `next build`, but installation timed out in this environment. Vercel remains the production TypeScript/build verification.

No provider routing, membership, payment, entitlement, SEO, generation, or pricing logic was changed in this patch.
