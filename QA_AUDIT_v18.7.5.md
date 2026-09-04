# Cantoa Studio v18.7.5 QA note

Scope: membership-management link only.

- Added a paid-member-only **Manage Membership** action beneath the plan summary in the account popup.
- Creator/Studio users can open Stripe Customer Portal to cancel, update payment methods, and view invoices.
- Explore and owner accounts do not show the button.
- Added server-only `/api/stripe/customer-portal` redirect so the configured portal URL is not embedded in the client bundle.
- Added `STRIPE_CUSTOMER_PORTAL_URL` to `.env.example` and deployment guidance.
- Preserved all existing v18.7.4 pricing, generation, free-tier, and authentication logic.

Deployment requirement: set `STRIPE_CUSTOMER_PORTAL_URL` in Vercel to the activated Stripe Customer Portal URL and redeploy.
