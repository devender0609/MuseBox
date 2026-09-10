# Cantoa v18.7.7 — Google Ads Conversion Tag + Purchase Destination

## Changes
- Installed the Google Ads global site tag `AW-18430730512` once in `app/layout.tsx` using `next/script` with `afterInteractive`.
- Added `/checkout-success` as a dedicated post-purchase destination so the Google Ads URL-based Purchase conversion configured in the ad account has a real matching route.
- Updated Stripe app checkout `success_url` to `/checkout-success`.
- Added a clear post-purchase confirmation page with a `Continue to Cantoa` link back to `/?checkout=success`.
- Preserved existing Stripe webhook, pricing, entitlement, Customer Portal, and membership usage logic.

## Validation
- Focused source regression tests added for the tag, purchase destination, and success page.
- Existing source tests were run where possible without installing dependencies.
- Full Next.js production build is not claimed unless dependencies are available in the execution environment.
