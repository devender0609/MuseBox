# Cantoa v18.7.9 — precedence, recovery & indexing audit

- Voice precedence: explicit vocal direction in the user's prompt overrides a conflicting saved/advanced voice value; default is now Auto — follow my prompt.
- User-facing provider/policy errors are normalized into actionable Cantoa language instead of exposing raw provider JSON or a vague Terms message.
- Completed-song state clears the transient “Finalizing your song…” message.
- Provider fallback reasons are categorized (quota, concurrency, rate limit, permissions, provider policy) for cleaner owner diagnostics.
- Owner Console now separates the 30-day routing history from last-24-hour primary/fallback health so a repaired API key is visible without waiting 30 days.
- Canonicalization middleware redirects www and HTTP requests to https://cantoamusic.com with 308 redirects.
- /owner has explicit noindex metadata in addition to robots.txt exclusion; /checkout-success and /share already remain noindex.
