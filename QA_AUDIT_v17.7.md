# Cantoa Studio v17.7 QA / feature audit

## Scope
v17.7 builds on the v17.6 visual baseline. It intentionally does **not** add navigation, a DAW, new page layouts, or a database migration.

## Added competitive features
1. **My Sound** — stores the user's preferred style, emotional direction, language, voice direction, finish quality and faithful/bold preference in this browser. Users can update or reuse it from the existing style row.
2. **Make this better** — adds a natural-language revision request inside the existing Revision Studio. The user chooses Subtle / Balanced / Bold change strength and describes the desired change. The original audio remains preserved and the revision uses the existing linked-version remix workflow.
3. **Best of both** — after the existing paid Faithful/Bold 30-second preview flow, the user can ask the complete song to combine the faithful take's clarity with the bold take's strongest creative idea. This does not create a third preview or consume extra preview minutes.

## Access model
- My Sound is local creative preference storage and does not call the provider.
- A/B previews retain the existing Creator/Studio/Owner gate and usage accounting.
- Custom revisions retain the existing revision access gate and create a new provider-backed linked version rather than overwriting the original.

## Schema
No new SQL is required for v17.7 beyond the already-required v17.5 setup.
