# Cantoa v18.8.45 QA Audit

## Website → song reliability fix

A production test of the Website source path showed a recoverable failure at the optional ElevenLabs music planning step. The webpage was read successfully, but the appended webpage context could make the planning prompt too large or too complex for the planning endpoint. Because planning was treated as mandatory for vocal generation, that failure stopped the song before audio generation.

### Changes
- Website source material is now bounded so the provider-facing prompt stays below the app's 4,000-character music prompt ceiling.
- The user's main creative brief is preserved first; webpage text uses only the remaining context budget.
- Recoverable planning failures (400/422/500/502/503) no longer abort the creation. Cantoa continues directly to music generation without a composition plan.
- Authentication/rate-limit failures are still surfaced and are not bypassed.
- The planning API now distinguishes a too-short prompt from a too-long planning brief instead of returning the same validation text for both.

### Regression QA
- v18.8.43 + v18.8.44 + v18.8.45 focused tests: 12/12 passed.
- No SQL migration.
- No new environment variables.
- Vercel remains the final full Next.js build/typecheck gate.
