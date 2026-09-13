# Cantoa v18.8.55 Release Notes

v18.8.55 is a release-hardening build on top of v18.8.54. It intentionally avoids feature redesign and focuses on proven edge cases and theme/UI consistency.

## Fixes

- Added a synchronous creation lock so rapid double-clicks cannot start duplicate billable generation/preview requests before React rerenders.
- Preserves a successful A/B preview if the second preview fails; messaging now states that only successful audio was charged.
- Blend Songs no longer inflates short anchor songs to a 2-minute duration.
- Blend creative context is bounded so 2–4 selected songs cannot create an unnecessarily oversized provider prompt.
- Moved analytics inside `<body>` in the root layout.
- Owner Console navigation now follows the same generation/preview busy lock as other creation navigation.
- Removed a first-use Group Song UI redundancy: `Create another Group Song` appears only after a group collection exists.
- Added explicit final light/dark contrast rules for Create/Advanced, segmented/source/smart-direction controls, and the v18.8.54 Library remix/blend interface, including mobile states.

## QA

- 22/22 v18.8.55 release-gate tests passed.
- 123 TS/TSX files syntax-transpiled with 0 syntax-error files.
- 26 API routes inventoried.
- Client literal API calls resolve to packaged routes.
- Environment/documentation audit clean (excluding runtime-provided `NODE_ENV`).
- No new SQL.
- No new environment variables.

## Unchanged

Explore remains 2 free songs up to 2 minutes each; Creator remains 40 minutes/month; Studio remains 120 minutes/month; pricing remains $7.99/$19.99 and ₹499/₹1,299; normal generation remains capped at 5 minutes; existing provider-routing policy is unchanged.

## Deployment note

A full local Next.js build could not be completed because the local dependency install is incomplete and `npm ci` timed out. Use the Vercel deployment reaching **Ready** as the final dependency/compiler integration check, then complete a short live production smoke test.
