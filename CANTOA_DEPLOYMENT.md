# v18.7.4 deployment note

1. Deploy v18.7.4 with the existing regional Stripe Price-ID variables:
   - `STRIPE_CREATOR_PRICE_USD` ($7.99/month)
   - `STRIPE_CREATOR_PRICE_INR` (₹499/month)
   - `STRIPE_STUDIO_PRICE_USD` ($19.99/month)
   - `STRIPE_STUDIO_PRICE_INR` (₹1,299/month)
2. Run the current `supabase-setup.sql` once. The new guarded migration `v18.7.4_free_creation_signin_repair` repairs prelaunch Explore accounts that could inherit the old one-song state.
3. Smoke-test with a fresh/repairable Explore account: sign in without generating and confirm the free count does **not** change; complete one successful ≤2-minute generation and confirm it decreases by exactly one; trigger a provider failure and confirm the entitlement is restored.
4. Check both Create and Advanced: neither should show a Source / Your idea / Change card. Add media should accept photos, video, or audio contextually.
5. Vercel remains the definitive production Next.js type-check/build.

---

# v18.0 deployment note

v18.0 does **not** require a new Supabase SQL migration if the v17.8/v17.9 database setup was already applied successfully. Deploy the new code normally.

Feature tiers are authorized through `/api/feature-access` using the existing memberships table.

---

# v17.9 deployment note

v17.9 adds competitive client-side creative controls on top of v17.6 without changing the database schema. **Do not rerun SQL solely for v17.9** if the v17.5 `supabase-setup.sql` already completed successfully.

New smoke checks:
- Save **My Sound**, start another song, and confirm **Use My Sound** restores style/emotion/language/voice/finish preferences.
- On a Creator/Studio/Owner song, enter a custom **Make this better** instruction and confirm a linked revision is prepared while the original remains intact.
- Generate the existing Faithful/Bold previews and confirm **Blend the best of both** changes the complete-song brief without adding a third paid preview.

# Cantoa production setup

## 1. Supabase

1. Open **SQL Editor** in the Cantoa Supabase project.
2. Run `supabase-setup.sql` once.
3. In **Authentication > URL Configuration**, set the production Site URL to the final Cantoa domain and add the Vercel preview URL pattern if previews need authentication.
4. Add the three Supabase values shown in `.env.example` to Vercel.

The SQL creates private song metadata, a private audio bucket, account membership rows, row-level security, and atomic usage reservation/refund functions.

## 2. Stripe

Add both Payment Link variables and the Stripe secret key to Vercel. Stripe Payment Links use Adaptive Pricing, so supported customers see an available local currency and eligible local payment methods at secure checkout. In Stripe **Developers > Webhooks**, create an endpoint:

`https://YOUR-CANTOA-DOMAIN/api/stripe/webhook`

Subscribe it to:

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.deleted`
- `customer.subscription.updated`
- `invoice.payment_failed`

Copy its signing secret to `STRIPE_WEBHOOK_SECRET`. Keep all secret values server-only.

## 3. ElevenLabs

Add `ELEVENLABS_API_KEY` with both **Music Generation** and **Speech to Text** access. If the existing restricted key allows only Music, edit or replace it in ElevenLabs before testing **Speak your idea**. Cantoa reserves account minutes before music generation and refunds them if the provider fails.

## 4. Cantoa v12 quality workflow

- Pasted public HTTPS links and long pasted text are detected automatically.
- Voice descriptions are transcribed into editable text before generation.
- Optional Faithful and Bold 30-second previews use one generation minute in total.
- Release-ready vocal songs request a structured Music v2 composition plan before rendering; instrumental/short flows can render directly.
- Finished Music v2 audio is requested as 48 kHz, 192 kbps MP3.

## 5. Domain

The custom domain can be attached while the app remains on Vercel. Hosting migration is not required for a branded URL.

## 6. Launch gate

Before public sales, test signup, email confirmation, sign-in, one successful generation, one failed-generation refund, cloud-library recovery on a second browser, Creator checkout, Studio checkout, monthly renewal, cancellation, and permanent song deletion.

## 7. Cantoa v17 migration and launch checks

Run `supabase-setup.sql` again. v17 adds `public_share`, `share_token`, `gift_to`, and `dedication` to `songs`; existing song/audio privacy is unchanged.

Then verify:

1. Moments populate a useful generation direction without exposing a separate Guided mode.
2. Birthday / For Someone / Business / School presets switch cleanly without losing access to Create or Advanced.
3. A signed-in generated song is saved to the private cloud before the result screen opens.
4. Creator Pack downloads and includes MP3, lyrics, captions, metadata and three SVG social covers.
5. Creation Record downloads and correctly labels commercial eligibility as provider/plan dependent.
6. Gift/share page creation works only for a signed-in cloud song.
7. A valid `/share/<token>` page plays the song while the Supabase `songs` bucket remains private.
8. Deleting a song removes its private audio and makes any previous gift link unusable.

## v17.2 access-control migration

Before public traffic, run the current `supabase-setup.sql` in Supabase SQL Editor. v17.2 requires the `free_song_claimed` membership field and updated generation reservation/refund functions. Do not skip this migration: provider-backed endpoints intentionally fail closed when membership enforcement is not configured.


## v17.5 migration / QA

Run the current `supabase-setup.sql` after deploying v17.5. It is rerunnable. In addition to the v17.4 rate-limit/account backfill, v17.5 performs a one-time repair of Explore welcome entitlements that may have been incorrectly marked used by the prior minute-balance migration.

Production smoke test order:
1. Anonymous visitor can browse Moments/Create/Advanced and source choices remain collapsed until Change.
2. Anonymous Generate opens sign-in instead of calling ElevenLabs.
3. New Explore account can create one song up to 2:00, then gets a membership prompt for another generation/revision.
4. Explore can download MP3/lyrics and share; WAV/stems/Creator Pack prompt for membership.
5. Owner account remains unlimited but still uses rate-limit protection against accidental request loops.
6. Cloud save succeeds; if intentionally misconfigured, the result page shows a precise failure and Retry cloud save.
7. Creator/Studio checkout preserves `client_reference_id`; webhook upgrades the correct account.
8. Creator/Studio stems include an Authorization bearer token and reject Explore/anonymous requests server-side.
9. Light/dark themes are checked on Create, Song, Library, account, membership, export/share panels and Finish & Share.


### v17.5 first-song repair

The previous migration inferred a claimed free song from `minutes_remaining < 2`. That was too aggressive for pre-existing/test accounts. v17.5 removes that inference and records a one-time repair in `public.cantoa_schema_migrations`. For the transition, cloud-saved songs are used as evidence of a delivered song. Accounts without such evidence are restored to one free song up to 2 minutes. Re-running the setup file later will not repeat the repair.


## v17.9 competitive features
- Advanced Pronunciation Studio with per-term and per-section readings.
- Section Language Plan for explicit verse / chorus / bridge language control.
- Browser-rendered 15-second vertical and square WebM social videos for Creator/Studio/Owner accounts.
- Creator Pack 2.0 with platform captions, three artwork formats, rights/metadata files and an automatic social video when browser support is available.
- Gift Experience 2.0 with an animated recipient reveal, sender attribution, privacy-preserving reactions and a direct “make one for someone” loop.

### Database update required for v17.9
Run the included `supabase-setup.sql` once after deployment. It only adds the `gift_from` column and `gift_reactions` table/index; all statements are rerunnable.


## v18.1 deployment note
No new Supabase migration is required relative to v18.0. Deploy normally. The video renderer runs in supported browsers and outputs theme-independent WebM assets.

## v18.3.2 provider and India-payment configuration

Optional additional music providers:

```text
MUREKA_API_KEY=...
STABILITY_API_KEY=...
```

ElevenLabs remains the primary song provider:

```text
ELEVENLABS_API_KEY=...
```

Stripe-only subscription checkout (v18.3.2):

```text
STRIPE_CREATOR_PAYMENT_LINK=...
STRIPE_STUDIO_PAYMENT_LINK=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

Razorpay/UPI is intentionally not active in this release. No Razorpay keys, plan IDs, webhook, or India-specific payment setup are required. Existing optional music-provider keys (`MUREKA_API_KEY`, `STABILITY_API_KEY`) are unrelated to checkout and may still be configured independently.

No new Supabase SQL migration is required solely for v18.3.2 if the existing Cantoa schema is already current. An older `razorpay_subscription_id` column left in a previously migrated database is harmless and can remain unused.


## v18.4.0 routing note
Cantoa uses cost/workload-aware provider routing based on live September 2026 tests. Ordinary vocal songs and ordinary instrumental songs prefer ElevenLabs when configured. Background, ambient, cinematic-score, atmospheric, sound-design, texture, meditation, sleep, and relaxing instrumental workloads prefer Stability when configured. Attached video soundtrack requests use the dedicated Mureka route. Provider API keys remain server-side only.

## v18.4.1 UI hierarchy note

No SQL or environment-variable changes are required. This release is a UI/copy hierarchy refinement on top of v18.4.0. Provider routing, Stripe entitlements (Creator 50 / Studio 150), Supabase usage logic, Mureka soundtrack routing and cost-aware provider behavior are unchanged.


## v18.5.0 owner analytics deployment

1. Deploy the application normally with the existing Supabase, Stripe and provider environment variables.
2. Run the current `supabase-setup.sql` once in Supabase SQL Editor. The v18.5 section creates the server-only `generation_events` table and indexes; the script is rerunnable.
3. Sign in with an authorized owner account and open `/owner` (or use the Owner console item in the sidebar).
4. Verify the Provider Health cards show the configured providers.
5. Run the four dry routing tests. They must state `charged: false` and must not change provider balances or membership minutes.
6. Perform one live vocal generation, one normal instrumental, one background/ambient instrumental and one visual soundtrack; refresh `/owner` and confirm provider, fallback status, estimated cost, latency and success/refund state are recorded.
7. Treat MRR and provider-spend figures as operational estimates, not accounting records. Stripe fees, storage, tax, provider billing adjustments and other overhead are intentionally excluded from the displayed gross-after-provider-spend number.

The observability insert is best-effort and never blocks a customer generation. If the v18.5 SQL has not been run, the owner console will explicitly request the migration while the existing customer generation flow remains available.


## v18.7.2 regional pricing + two-free-song deployment

1. In Stripe, create four **monthly recurring Prices** with these exact amounts and copy each `price_...` ID:
   - Creator USD: **US$7.99/month**
   - Studio USD: **US$19.99/month**
   - Creator INR: **₹499/month**
   - Studio INR: **₹1,299/month**
2. Add these server-only Vercel environment variables:

```text
STRIPE_CREATOR_PRICE_USD=price_...
STRIPE_STUDIO_PRICE_USD=price_...
STRIPE_CREATOR_PRICE_INR=price_...
STRIPE_STUDIO_PRICE_INR=price_...
```

Keep the existing `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. The old payment-link variables may remain during transition but v18.7 checkout does not use them.
3. Run the **current `supabase-setup.sql` once**. It is rerunnable. The v18.7 migration adds `free_songs_remaining`, `billing_currency`, and `billing_amount_minor`. Existing Explore users who already used the prior single free song receive **one additional free song**; unused Explore accounts receive two. Paid/cancelled accounts do not regain free entitlements.
4. Deploy to Vercel.
5. Verify US/global pricing displays US$7.99 / US$19.99 and India displays ₹499 / ₹1,299. Country detection prefers Cloudflare `cf-ipcountry`, then Vercel `x-vercel-ip-country`.
6. Test one new Explore account: first free song succeeds, account shows 1 free song remaining; second succeeds, account shows 0; third is blocked. Each free song must be ≤2 minutes. A failed free generation must restore the entitlement.
7. Test Creator and Studio checkout and confirm Stripe webhook grants **40 / 120** minutes respectively.

Checkout intentionally fails closed when a regional Stripe Price ID is missing. This prevents a user from seeing an INR price but being charged USD, or seeing the new lower US price but being sent to an older payment link.


## v18.7.5 membership management

Add the activated Stripe no-code Customer Portal URL in Vercel as:

```text
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/...
```

Paid Creator and Studio users will then see **Manage Membership** in the Cantoa account popup. The link opens Stripe Customer Portal for cancellation, payment-method changes, and invoices.
