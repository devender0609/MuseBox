# Cantoa v18.8.53 — Mobile Layout Uniformity Audit

This release is a mobile-only responsive hardening pass based on a real iPhone Safari production screenshot.

## Proven issues corrected
- Starter ideas used `flex: 0 0 76%` below 700px, deliberately leaving the next card partially clipped. On narrow iPhone widths this looked broken rather than intentional. Phones now show one complete card per row.
- The `Start with something real` launcher kept its heading and large action button on one row at phone widths, creating awkward wrapping. The mobile layout now stacks the action cleanly at full width.
- The fixed mobile navigation used a fixed 64px height without consistently accounting for `env(safe-area-inset-bottom)`. It now reserves iOS safe-area space.
- Next.js now explicitly emits a device-width viewport with `viewport-fit=cover`, allowing iPhone safe-area insets to be applied consistently.
- Owner Console used different mobile dimensions/text behavior than Create/Library. All bottom navigation destinations now receive equal mobile sizing; the owner-only destination uses its icon at phone widths.
- Main mobile content now reserves enough bottom space to avoid being visually covered by the fixed navigation.
- Horizontal overflow is constrained at document and principal workspace/card levels.
- Composer and principal cards now explicitly fit the phone viewport rather than relying on inherited desktop maxima.

## Scope safety
- No generation, provider, billing, quota, Supabase, Stripe, Library, Gift, Group Song, My Voice, or entitlement logic changed.
- No SQL migration.
- No environment variable changes.
- Desktop and tablet rules are unchanged; all new component layout rules are limited to <=590px, with an extra <=390px refinement.
