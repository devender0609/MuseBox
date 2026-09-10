# Cantoa v18.7.12 — Deep Audit

Production-hardening pass after v18.7.11.

- Neutral scratch creation: default Moment is Anything → music and default Style follows the prompt.
- Quick mode no longer injects hidden Advanced creative-direction controls into scratch prompts.
- Voice inference recognizes natural wording such as “sung by a man/woman” and “vocalist”.
- Webpage-source import now requires authenticated per-account rate limiting, while retaining SSRF/private-network protections and size caps.
- Creative-policy provider rejection no longer falls through to a different provider.
- Stripe checkout success now carries and verifies CHECKOUT_SESSION_ID before showing a successful-membership confirmation.
- Removed development-only `codex-preview` metadata.
- Pinned Node to the supported 22.x major instead of an open-ended >= version.
- Removed bundled partial node_modules from the deployment archive.

QA: 164/164 source/regression tests passed. Rendered-HTML and React-runtime tests require an installed dependency tree / completed Next build and were not counted in the 164.
