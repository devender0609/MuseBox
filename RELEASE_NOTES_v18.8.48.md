# Cantoa Studio v18.8.48 — Release Notes

## What changed

### Creation input precedence
Starter ideas are now explicitly treated as seeds rather than permanent hidden instructions. If a user selects a “Not sure what to make?” starter and then edits the main “Describe what you want to create” brief, the edited brief becomes authoritative. Cantoa clears starter-only defaults that could otherwise compete with the newer request, while preserving style/language/output/duration controls the user explicitly changed after selecting the starter.

Vocal/instrumental inference was also tightened. A mixed request such as “instrumental intro with a male singer” is treated as a vocal song, while explicit wording such as “no vocals”, “instrumental only”, or “music only” remains a hard instrumental request.

Voice-memo transcription, long-paste detection, derived-song workflows, Group Song assembly, and revisions now clear stale starter provenance before replacing the prompt.

### Owner Console: USD and INR
The Owner Console now shows USD and INR active-plan MRR as separate top-level metrics. It also includes an owner-only Paid Members table with the active member email, Creator/Studio plan, recorded Stripe price, currency/regional price market, and remaining minutes.

This deliberately does not infer a customer’s physical location from currency. “INR / India regional price” means the active membership is recorded with the INR Stripe price; it is not a claim about nationality or current location.

The console also reports whether the INR Stripe Price IDs are configured, without exposing the IDs or any secret value.

### Audio format correctness
Cloud and packaged exports preserve the native supported audio extension instead of silently naming everything `.mp3`. Memory Capsule, Creator Pack, Jingle Pack, instrumental exports, and Karaoke exports now derive filenames from the actual audio blob. User-facing copy was updated where it incorrectly promised MP3 regardless of provider output.

### Deployment configuration cleanup
`.env.example` now matches the production environment variables actually referenced by the current source. `CANTOA_OWNER_EMAILS` is documented. The unused Creator Payment Link example variable was removed; the Studio Payment Link remains documented only as a legacy webhook fallback.

## Preserved commercial rules
- Explore: 2 free creations, maximum 2 minutes each.
- Creator: 40 generation minutes.
- Studio: 120 generation minutes.
- USD recurring prices: Creator US$7.99, Studio US$19.99.
- INR recurring prices: Creator ₹499, Studio ₹1,299.
- General server generation ceiling: 300 seconds.

## Database / environment changes
No new SQL is required. No new environment variable is required. `CANTOA_OWNER_EMAILS` was already supported by the source; it is now documented in `.env.example`.
