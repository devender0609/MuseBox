# Cantoa QA Audit v18.8.15

Focused auth/download-state patch.

- Feature authorization now waits for `useCantoaSession().ready` before deciding a user is signed out.
- Transient Supabase auth events with a null session no longer clear an already-restored session unless the event is an explicit `SIGNED_OUT`.
- Stale OAuth error query parameters (`error`, `error_code`, `error_description`) are removed from the app URL after load.
- Existing download/export logic, provider routing, pricing, memberships, database schema, and generation behavior are unchanged.
- Focused regression tests: 3/3 passed.
- Vercel remains the final production build/typecheck check.
