# Cantoa v18.8.4 QA audit

## Account creation repair
- Email signup now asks for name, email, password, and password confirmation.
- Signup stores the display name in Supabase user metadata.
- Email confirmation redirect is explicitly set to the live Cantoa origin.
- Unconfirmed accounts get a clear "account created" state rather than looking like nothing happened.
- Confirmation email can be resent from the same modal.
- Existing-email signup attempts are redirected toward Sign in with friendly copy.
- `/api/account` self-heals a missing Explore membership for an authenticated Supabase user without overwriting existing paid memberships.

## Broader regression guard
- Existing Create, Advanced, Library, account, membership, generation, Cantoa Moments, Group Song, Secret Drop, media export, owner, routing, pricing, and entitlement regression tests remain in the suite.
- v18.8.4 adds explicit checks that core Cantoa Moments actions remain wired.

## Database
- No schema change is required for v18.8.4.
