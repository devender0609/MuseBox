# Cantoa v18.3.8 QA Audit

## Fix
- Explicit **Instrumental** mode now routes to Stability first whenever `STABILITY_API_KEY` is configured.
- ElevenLabs remains the fallback only if Stability cannot complete the request.
- Vocal/default song routing remains ElevenLabs-first.
- Mureka video soundtrack routing remains separate and unchanged.

## Regression
- Added a source-order regression test proving the instrumental Stability rule executes before the ElevenLabs default.
- Added a fallback-order regression check proving Stability -> ElevenLabs -> Mureka compatibility fallback remains intact.
