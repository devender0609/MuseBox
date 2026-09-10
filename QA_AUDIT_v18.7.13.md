# Cantoa v18.7.13 targeted correction

This build intentionally avoids adding new visible creation controls.

## Changes
- Fully gates hidden Advanced-only voice direction, section-language plan, pronunciation guidance, exclusions, and finish-quality state from fresh Create-mode requests.
- Keeps explicit voice wording in the current prompt authoritative in both modes.
- Keeps Create-visible Style and Song language controls active, as intended.
- Adds per-provider Last 24h direct/fallback counts to Owner Console so current health is not confused with 30-day historical incidents.
- Adds regression coverage for the above behavior.

## Not changed
- Provider routing order.
- Membership/free-creation accounting.
- SEO/canonical/indexing behavior.
- Mureka song cost calibration (remains Unknown until a verified cost basis is supplied).
- ElevenLabs streaming (not introduced in this stability-focused release).
