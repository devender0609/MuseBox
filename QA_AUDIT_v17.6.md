# Cantoa Studio v17.6 — Focused Visual Polish QA

v17.6 is a targeted visual-polish release built on the complete v17.5 QA/security baseline. It does not change the Supabase entitlement schema or membership logic.

## Changes

- Keeps **Speak your idea** anchored at the lower-left of the idea box as a secondary input method.
- Adds a restrained **luminous glass selected state** inspired by the supplied reference for creative choice controls: Create/Advanced, segmented creative controls, styles, and selected Moments.
- Keeps operational actions such as Download, Share, Delete, and Change visually quieter so the page does not become crowded.
- **Surprise me** now visibly reports the direction it chose and becomes **Surprise me again** after use.
- Moves **Style** directly after the prompt/examples so the creative decision is closer to the idea.
- Compacts **Cantoa Song Blueprint** into a three-column fine-tuning strip on desktop and removes unnecessary explanatory copy.
- Rebalances the song result page: artwork and player are a tighter top row; Revision Studio, Finish & Share, and publishing checks span the content width below.
- Reduces album-art shadow and top-level result spacing.
- Normalizes **Finish & Share** heading hierarchy while preserving smaller supporting copy.
- Preserves light/dark adaptive surfaces and the complete v17.5 access, cloud, security, sharing, revisions, Creator Pack, and entitlement behavior.

## Verification

- Existing v14–v17.5 source/regression suite: 43/43 passing.
- New v17.6 polish regression tests: 4/4 passing.
- Combined source/regression suite: 47/47 passing.
- TypeScript parse attempt reports missing local Next/React dependencies in this sandbox but no syntax/parser diagnostics from the modified page.
- Full `next build` was not claimed because dependencies are not installed in the sandbox.

## Deployment

No new SQL migration is required for v17.6 if the v17.5 `supabase-setup.sql` has already been run successfully. Deploy the project normally on Vercel using the existing environment variables.
