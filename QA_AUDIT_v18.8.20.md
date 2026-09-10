# Cantoa QA Audit — v18.8.20

## Scope
Adds result-side **Editable Lyrics + Pronunciation Memory** without adding a new main navigation tab or Create-screen button.

## Implemented
- Existing **Fix pronunciation** action now opens an inline Revision Studio editor instead of immediately generating a generic revision.
- Stored lyrics are editable line-by-line.
- Users can teach a written word/name and a pronunciation reading.
- Pronunciation memory is stored locally per account and, when signed in, mirrored to Supabase Auth user metadata (`cantoa_pronunciations`) so no SQL/schema migration is needed.
- Future song prompts automatically include only remembered pronunciations whose written term actually appears in the current brief/lyrics/source context.
- Pronunciation memory can be removed by the user.
- Creating a revised song preserves the original and sends edited lyrics as the revision lyrics override.
- Pronunciation saving itself does not consume generation minutes; only creating revised audio does.
- Light and dark theme styling added for the new inline editor.

## Validation
- TypeScript parser/transpile syntax diagnostics for `app/page.tsx`: **0 errors**.
- Focused v18.8.20 regression tests: **6/6 passed**.
- Full Next.js production build was not run locally because the deployment copy has no installed dependency tree. Vercel remains the final production TypeScript/build check.

## Database / environment
- **No SQL migration required.**
- **No new environment variable required.**
