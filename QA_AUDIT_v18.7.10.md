# Cantoa v18.7.10 — Next.js 16 proxy compatibility hotfix

## Fix
- Removed legacy `middleware.ts` because Next.js 16.2.6 rejects projects that contain both `middleware.ts` and `proxy.ts`.
- Preserved canonical HTTP/www → `https://cantoamusic.com` redirect in the existing `proxy.ts`.
- No application behavior, environment-variable names, Supabase schema, provider routing, voice precedence, user-facing error handling, or indexing policy from v18.7.9 was otherwise changed.

## Deployment note
Vercel build error addressed:
`Both middleware file "./middleware.ts" and proxy file "./proxy.ts" are detected. Please use "./proxy.ts" only.`
