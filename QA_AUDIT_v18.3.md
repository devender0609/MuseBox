# Cantoa Studio v18.3.1 QA Audit

## Scope
v18.3.1 builds on v18.2. It does not add navigation or redesign the established visual system. The release focuses on default-screen simplification, automatic provider routing and India checkout architecture.

## Default Create simplification
- Create remains the default mode.
- Advanced remains opt-in.
- Song Blueprint is Advanced-only.
- Full style preset matrix and My Sound editing are Advanced-only.
- Section language plan, language preset encyclopedia and Pronunciation Studio are Advanced-only.
- Creative/Release-ready and Faithful/Bold controls are Advanced-only.
- Quick Create retains the natural-language prompt, intent summary, open-ended language field, vocals/instrumental control, duration and generation.
- Hidden Advanced settings remain part of the generated brief when inferred from the prompt/Moment defaults.

## Provider architecture
- ElevenLabs remains primary for full songs.
- Mureka is integrated as an automatic fallback when prepared lyrics are available, and as the dedicated image/video soundtrack provider.
- Stable Audio is integrated for background/instrumental requests and fallback when configured.
- No provider-selection control is exposed to consumers.
- Missing optional provider keys fail over rather than presenting nonfunctional buttons.

## Visual-media workflow
- The existing Add media control now accepts up to 20 images and one supported video.
- A video plus a soundtrack/score request is recognized in `Cantoa understood`.
- Video soundtrack generation is authenticated, rate-limited and usage-reserved server-side.

## India payments
- Checkout detects India using deployment country headers (or the explicit test override).
- If Razorpay keys and the appropriate plan ID are configured, Creator/Studio subscriptions are created through Razorpay.
- Razorpay subscription lifecycle webhooks update Cantoa membership server-side after signature verification.
- Stripe remains the fallback/international checkout.
- v18.3.1 requires rerunning `supabase-setup.sql` to add `razorpay_subscription_id`.

## Verification limitations
Source/regression tests and static TypeScript parse checks can run in this sandbox. A complete Next.js production build still requires project dependencies (`node_modules`) and registry access. Build-dependent tests are not represented as passing unless they actually execute.

## Regression result
- 78/78 source, functional, security and architecture regression tests passed.
- Build-dependent rendered HTML and React component tests are excluded because this sandbox has no installed project dependencies or generated `.next` output.
- Static TypeScript parsing found no new syntax-level errors; unresolved module/type declarations are expected without `node_modules`.
