# Cantoa v18.8.22 QA Audit

## Scope
Saved People & Moments, added contextually to Create without a new main navigation item.

## Behavior
- People can store name, relationship, language, music preference, important date and private details.
- Moments can store title, type, date, people and private details.
- Data is stored locally and, when signed in, mirrored into Supabase user metadata. No database migration is required.
- Matching names/relationships/moment titles/types can surface a contextual "Use" suggestion.
- Saved context is never silently injected into generation; the user must click Use.
- Save/edit/delete operations consume no music-generation minutes.
- Users can delete any saved person or moment.
- Light/dark and mobile styling included.

## Regression intent
No changes to provider routing, pricing, payments, export architecture, stem separation, account entitlement logic or main navigation.

## Verification
Focused v18.8.22 static regression tests are included in `tests/cantoa-v18-8-22.test.mjs`.
Vercel remains the final full Next.js build/typecheck environment.
