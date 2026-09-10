# Cantoa v18.8.36 QA Audit

## Scope
Adds the customer-facing **Not sure what to make?** one-click starter ideas inside the existing Create-page moment launcher. No new navigation and no provider call is made by selecting an idea.

## Behavior
- Six starter cards: Birthday song, Romantic evening, Motivation boost, Family memory, Reel / video, Hindi–Punjabi mix.
- Selecting a card fills prompt, style, emotion, language, duration and vocal/instrumental mode as appropriate.
- User remains in Create mode and can edit everything before generation.
- Existing moment tiles and Surprise me are preserved.
- Responsive desktop/tablet/mobile layout and dedicated dark-theme contrast included.

## Data / billing
- No SQL migration.
- No new environment variables.
- Clicking a starter idea consumes no generation minutes and does not call a music provider.

## Verification
Focused `cantoa-v18-8-36.test.mjs` validates rendering, field prefilling, no generation side effect, useful intent coverage and responsive/dark styling.
