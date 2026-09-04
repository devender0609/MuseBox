# Cantoa v18.7.4

This release removes the remaining visible Source chooser, tightens first-run spacing, repairs the two-free-creation sign-in entitlement for prelaunch Explore accounts, balances the membership summary, and makes downloads feel tied to the individual song. It preserves regional pricing, provider routing, owner analytics, landing pages, and the existing paid-plan entitlements.

## v18.7.4 changes

- No visible Source / Your idea / Change card in either Create or Advanced. The single **Describe what you want to create** field is universal. URLs and long pasted text are detected automatically; **Add media** now accepts photos, video, or audio and switches into the correct workflow contextually.
- Free-offer copy is tighter: **Any 2 Moments · up to 2 minutes each · including Video / Reel.**
- The selected Moment note explicitly says a free creation is used only after provider-backed music is successfully generated.
- One-time `v18.7.4_free_creation_signin_repair` SQL recalculates Explore launch entitlements from songs actually saved after the v18.7 two-free-creation launch, so signing in itself cannot make a user appear to lose a creation.
- Membership summary now shows Explore, Creator, and Studio together in a more compact balanced layout.
- Download panel now carries the current song title, mode, duration and a colorful per-song visual identity. The operating system may still display its own generic audio-file icon after download.
- Current pricing remains Creator **US$7.99 / ₹499, 40 min** and Studio **US$19.99 / ₹1,299, 120 min**.

## Regional Pricing + Two Free Songs

- Explore now includes **2 complete free songs per account**, each up to **2 minutes**. Users may spend the two free entitlements on any two Moments; A/B previews and revisions remain paid.
- Creator is **US$7.99/month** with **40 music-generation minutes/month**.
- Studio is **US$19.99/month** with **120 music-generation minutes/month**.
- India visitors are automatically shown **₹499/month Creator** and **₹1,299/month Studio**, using Cloudflare/Vercel country headers.
- Checkout fails closed unless the matching Stripe recurring Price ID is configured, so Cantoa never advertises one amount and charges another.
- Failed Explore generations restore the free-song entitlement; failed paid generations restore generation minutes.
- Owner analytics keeps INR MRR separate from USD rather than applying a guessed exchange rate.
- Requires the current rerunnable `supabase-setup.sql` once to add `free_songs_remaining` and billing-currency fields.

# Cantoa Studio v18.5.0

## Owner Analytics, Provider Diagnostics & Cost Controls

- Owner-only `/owner` console with 30-day generation health, active-plan MRR estimate, calibrated provider-spend estimate, provider success/failure/fallback counts and recent generation activity.
- Dry routing diagnostics verify expected provider selection without calling a provider or consuming membership minutes.
- Generation observability records compact operational metadata only; lyrics are not logged and prompt previews are capped at 160 characters.
- Cost guardrails preserve one-provider-at-a-time routing, Mureka `n=1`, failed-generation minute restoration, cost-aware Stability routing and free re-exports from existing audio.
- Creator remains 50 music-generation minutes/month; Studio remains 150 minutes/month.
- Requires the new rerunnable v18.5 `generation_events` section in `supabase-setup.sql` for the owner dashboard. The customer app continues to generate even if observability storage is temporarily unavailable.

# Cantoa Studio v18.3.7

## v18.3.7 membership + Create clarity

- Creator: 50 minutes/month of new AI-generated music.
- Studio: 150 minutes/month of new AI-generated music.
- Re-exporting an existing song as Reel, square video, lyric video, gift page or download does not consume music-generation minutes.
- Simple Create now includes optional Song title and Style fields; Advanced keeps the full controls and My Sound.
- Language guidance explicitly names many popular languages while preserving free-text support for any language, dialect, regional variant or mix.

# Cantoa Studio v18.3.3

Video soundtrack routing fix: natural requests such as "create cinematic music that follows this video" now route attached videos to the Mureka soundtrack endpoint.

# Cantoa Studio v18.2

Cantoa turns moments, stories, text, webpages, audio and creative briefs into music and useful finished assets.

## v18.0
The visible v17.9 layout is preserved. New capabilities are intent-led rather than exposed as more navigation:
- Cantoa Intent Planner
- photo attachments and Studio Memory Movie
- Creator/Studio lyric video
- Studio 15/30/60 Business Jingle Pack
- server-authorized membership feature matrix
- stronger preserve-my-words and bilingual prompt inference

See `QA_AUDIT_v18.0.md` and `CANTOA_DEPLOYMENT.md` for details.

---

## Previous project documentation

# Cantoa Studio v17.9

Competitive-feature release built directly on the v17.6 visual baseline. The layout/navigation remain unchanged. v17.9 adds reusable **My Sound**, natural-language **Make this better** revisions with change strength, and **Best of both** blending for the existing A/B direction previews. No new SQL is required if the v17.5 Supabase setup has already been run.

# Cantoa Studio

## Owner and support setup

The verified account `devender0309@gmail.com` is recognized server-side as the
Cantoa owner and receives unlimited generation access while signed in. Optional
additional owner addresses can be supplied as a comma-separated server-only
`CANTOA_OWNER_EMAILS` environment variable.

The public support address is `support@cantoamusic.com`. Configure that mailbox or an
email-routing rule with your domain provider to forward messages to the private
destination address; forwarding cannot be performed by the web application.

## Starter foundation

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and
Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Linux with `flock`, `curl`, and GNU `timeout`

## Sites Lifecycle

The Sites lifecycle CLI runs the locked dependency install before returning this checkout. Edit the source under `app/`, then checkpoint when a coherent milestone is ready to inspect or share. The remote Sites builder runs `npm run build` against the pushed commit. Do not repeat install or build as a normal pre-checkpoint step.

This starter does not use `wrangler.jsonc`.

`install:ci` is intentionally a single, non-retrying `npm ci`. It refuses a concurrent install for the same project, consumes a matching image-seeded npm cache with `--prefer-offline` while retaining registry fallback for a missing cache object, otherwise downloads and verifies the complete vinext tarball recorded in `package-lock.json`, limits npm to one socket, and terminates a stalled install. `build` applies a short timeout. These helpers target Linux and use GNU `timeout`; they are not native macOS scripts.

Scripts that need writable project-scoped home, npm, XDG, and temporary paths use `scripts/sites-env.sh`. The `dev` and `start` scripts honor the caller's runtime environment and keep Wrangler logs inside the checkout. The generated `.sites-runtime/` directory is disposable and ignored by Git.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get(
    "oai-authenticated-user-full-name",
  );
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with
  `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper
  module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can
  prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned
  `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Diagnostic Commands

- `npm run install:ci`: perform the one bounded lockfile install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: start the built Vinext application
- `npm test`: build and verify the rendered development-preview metadata
- `npm run db:generate`: generate Drizzle migrations after schema changes

Use build commands for targeted diagnosis after a remote failure, not as part of the normal checkpoint path.

The timeout defaults can be overridden for a controlled canary with `SITES_INSTALL_TIMEOUT`, `SITES_INSTALL_KILL_AFTER`, `SITES_BUILD_TIMEOUT`, and `SITES_BUILD_KILL_AFTER`. A timeout fails the command; the helpers never retry an unchanged install or build.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## Cantoa v17 — Moments → Music

v17 preserves the v16 production foundation and adds a consumer-first creation layer:

- **Moments launcher** for For Someone, Birthday, Wedding, Family, Graduation, Video/Reel, Business, School, Relaxation and Anything → Music.
- **Create / Advanced** with Moments providing the guidance automatically, so first-time users are not forced through an extra mode.
- Guided recipient/context/details/dedication fields plus lyric-style and mixed-language section planning.
- Context-aware smart style suggestions and Surprise Me direction.
- Existing Music v2 plan + generation, A/B previews, source transformation, audio remix, private library, accounts, memberships and revisions are preserved.
- Expanded one-click revisions: pronunciation, chorus, ending, arrangement, clearer vocals, more energy, more emotion and shorter intro.
- **Creator Pack** ZIP with MP3, lyrics, captions, metadata/creation note, YouTube copy and square/vertical/widescreen editable SVG covers.
- Standalone **Creation Record** export to document the creation session without making unsupported copyright claims.
- **Opt-in gift/share pages** for signed-in cloud songs. The Songs bucket remains private; public pages receive short-lived signed audio/lyrics URLs from the server.

### v17 database migration

Run `supabase-setup.sql` again after deploying v17. The migration uses `add column if not exists`, adding only the sharing fields/index required by gift pages.

### Important product boundary

Cantoa does not present unimplemented DAW, social OAuth publishing, personal-voice cloning, referral-credit accounting, or automatic video rendering as active features. The app integrates the high-value flows that can be delivered safely on the current ElevenLabs + Supabase + Stripe architecture rather than displaying nonfunctional controls.

## Cantoa v17.2 — preferred layout + protected first-song access

This patch intentionally keeps the v17 Moments-first layout. It does not adopt the denser v18 Create screen.

Changes:
- Light mode only: reduced the excessive top whitespace above Create and tightened the hero-to-Moments spacing without changing the dark theme composition.
- Anonymous visitors may explore Moments, Guided/Quick/Advanced Create, type/paste their brief, and set song controls.
- Any provider-backed action is protected server-side. Full generation, song planning, remixing, and voice transcription require a valid Supabase session.
- Explore is now one complete welcome song per account, up to 2 minutes. The claim is atomic in Supabase and cannot be reset by clearing cookies/localStorage or refreshing the browser.
- Failed provider renders refund the welcome claim so a genuine failure does not consume the user's free song.
- A/B audio previews are Creator/Studio features, preventing an Explore user from accidentally spending the one-song welcome entitlement on previews.
- If Supabase/usage enforcement is not configured, generation fails closed instead of silently allowing unlimited anonymous API usage.

### Required database migration

Run the current `supabase-setup.sql` after deploying v17.5. It is rerunnable. v17.5 includes a one-time repair for Explore accounts that were incorrectly marked as having used the welcome song by the older minute-balance migration. The repair uses an existing cloud-saved song as transition evidence; Explore accounts without one are restored to one complete free song up to 2 minutes.


## Cantoa v17.3 — adaptive Moments + collapsed Source chooser

This patch keeps the v17.2 layout and access model unchanged while fixing two presentation/interaction issues:

- Source choices stay collapsed until the user explicitly clicks **Change**. Selecting **Anything → music** no longer opens the Source menu automatically, and selecting a Moment closes any previously open Source menu.
- The Moments launcher now follows the selected theme. Light mode uses light glass/surface cards with readable dark text and soft borders; dark mode retains the existing dark studio treatment.

### First-time visitor flow (unchanged)

Visitors may explore Moments, choose Create or Advanced, type/paste a song idea and configure the song without signing in. Provider-backed audio generation requires authentication. A new Explore account receives one complete free song up to two minutes, enforced server-side through Supabase. The entitlement is reserved atomically before generation and returned if provider generation fails. Paid Creator/Studio accounts use their generation-minute balance.

Run `supabase-setup.sql` if the v17.1+ free-song entitlement migration has not already been applied.


## v17.5 entitlement repair + v17.4 QA hardening

- Fixed the light-theme Finish & Share panel so it no longer renders as a dark/blank block.
- Free Explore users can download MP3, lyrics and share their first song; WAV, stems and Creator Pack are premium tools.
- Stem separation now requires authenticated Creator/Studio/Owner access on the server.
- Provider-backed routes have database-backed per-account throttling.
- Webpage import now resolves DNS, blocks private/link-local targets and caps response size to reduce SSRF/resource-abuse risk.
- Checkout now requires an authenticated Cantoa account.
- Cloud-save failures show the real server message and a Retry cloud save action; the app no longer claims it will retry automatically when it will not.
- Membership copy was corrected so no unimplemented priority processing, album organization or rollover is advertised.


## v17.5 migration correction

- Removed the old migration rule that treated `minutes_remaining < 2` as proof the first free song had been used.
- Added a one-time, idempotent repair tracked in `cantoa_schema_migrations`.
- During this transition, an active Explore account with at least one cloud-saved song is treated as claimed; one without a cloud-saved song is restored to one free song (2-minute maximum).
- The customer-facing Explore copy now says `1 complete song free` and explicitly includes MP3 download and sharing.


## v17.9 competitive features
- Advanced Pronunciation Studio with per-term and per-section readings.
- Section Language Plan for explicit verse / chorus / bridge language control.
- Browser-rendered 15-second vertical and square WebM social videos for Creator/Studio/Owner accounts.
- Creator Pack 2.0 with platform captions, three artwork formats, rights/metadata files and an automatic social video when browser support is available.
- Gift Experience 2.0 with an animated recipient reveal, sender attribution, privacy-preserving reactions and a direct “make one for someone” loop.

### Database update required for v17.9
Run the included `supabase-setup.sql` once after deployment. It only adds the `gift_from` column and `gift_reactions` table/index; all statements are rerunnable.


## v18.1
Full-screen-safe Reel/square/lyric video templates, improved Memory Movie rendering, light/dark contrast parity, and expanded open-ended language guidance. Users may always type any language or dialect. No new SQL is required if the v17.8 setup was already run.

## v18.3.2 — simpler Create + automatic provider/payment routing

Cantoa v18.3.2 keeps the v18.2 visual baseline but reduces the default Create surface. The first-time Create view now centers on the prompt, Cantoa's intent summary, one open-ended language field, voice/instrumental choice, duration and the Create action. Blueprint, detailed styles, section-language planning, Pronunciation Studio, release/creative finish and Faithful/Bold direction controls remain available under **Advanced** and still respond to natural-language instructions even when hidden.

### Music providers
Cantoa now has an internal provider router. Users do not choose a provider.

- `ELEVENLABS_API_KEY` — primary full vocal-song generation and current composition-plan workflow.
- `MUREKA_API_KEY` — alternate song/instrumental fallback and image/video soundtrack generation. When a video is attached and the prompt asks Cantoa to score it, Cantoa uses the soundtrack route automatically.
- `STABILITY_API_KEY` — Stable Audio background/instrumental generation and fallback where configured.

The app remains functional with ElevenLabs alone. Mureka and Stability are additive; missing optional keys do not expose broken provider buttons.

### India checkout / UPI
Stripe remains Cantoa's single active subscription checkout provider in v18.3.2. India-specific UPI/Razorpay checkout has been intentionally removed for now to avoid unnecessary merchant/KYC complexity during product validation. The payment layer remains modular so a local provider can be added later without redesigning the product.

No Razorpay environment variables or webhook configuration are required.



## v18.3.6
- Simple Create now includes an explicit **Use my lyrics** control; users can paste up to 8,000 characters of finished lyrics without entering Advanced.
- Supplied lyrics are preserved for generation instead of being replaced by the automatic lyric planner.
- Song title and Style remain optional in both Create and Advanced.
- Language guidance now makes clear that listed languages are examples and many more languages, dialects, regional variants and mixes can be typed directly.

## v18.4.0 — cost-aware provider routing
Live provider tests showed that a one-minute ordinary Stability generation cost more than the corresponding ElevenLabs test. Cantoa therefore no longer treats the Instrumental toggle alone as a reason to force Stability. Stability is reserved for background/ambient/cinematic/atmospheric/sound-design-style instrumental workloads where it is a better fit, while ordinary instrumentals default to ElevenLabs when available. Video soundtrack generation remains on the dedicated Mureka route. Membership allowances remain Creator 50 / Studio 150 music-generation minutes.

## v18.4.1 — cleaner Create / Advanced hierarchy

- Shortened the Create language guidance while preserving the message that any language, dialect, regional variant or mix can be typed.
- Kept Song title, Style and user-supplied lyrics available in both Create and Advanced.
- Moved Song Blueprint into compact optional progressive disclosure after the Advanced essentials.
- Grouped advanced language presets, section-language controls and pronunciation tools under one optional multilingual panel.
- Renamed the Vocals/Instrumental group from “Voice” to “Output” so it does not conflict with “Voice direction.”
- Clarified the style-strength slider and softened the optional A/B preview wording in Create.
- No provider, billing, entitlement, database or generation behavior changed from v18.4.0.

## v18.6.0 — Search & use-case landing pages
Adds eight first-party marketing pages under cantoamusic.com, plus sitemap/robots metadata and deep-linking into the existing Moment-based Create flow. No SQL migration is required beyond the v18.5 analytics setup already introduced.
