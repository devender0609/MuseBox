# Cantoa Studio v18.7.1 QA Audit

## Hotfix scope
- Fixes Vercel TypeScript failure in `app/api/checkout/route.ts` caused by destructuring `request.json()` as `any` and then indexing the strongly typed `PLAN` object with an `any` currency key.
- Validates the request body as `{ plan?: unknown }`, narrows the plan to `Creator | Studio`, and types currency as `"usd" | "inr"` before indexing plan pricing.
- No UI, membership entitlement, Stripe amount, Supabase schema, provider routing, or customer-flow behavior changed from v18.7.0.

## Regression results
- 124/124 applicable source/regression tests passed.
- Two environment-dependent tests remain unavailable in this workspace:
  - rendered HTML test requires a completed `.next` production build.
  - UI component test requires installed React/Next dependencies.
- Vercel had already compiled v18.7.0 successfully and failed only during TypeScript checking at the corrected checkout line.

## Regional checkout invariants preserved
- Creator USD: 799 cents / month.
- Studio USD: 1999 cents / month.
- Creator INR: 49900 paise / month.
- Studio INR: 129900 paise / month.
- Stripe Price ID verification remains fail-closed for currency, amount, and monthly recurring interval.
