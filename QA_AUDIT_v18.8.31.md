# Cantoa v18.8.31 QA audit

Scope: membership gating and Group Song empty/legacy activity handling.

- Group Song 2.0 owner creation and Build from group ideas now require Creator/Studio/owner.
- Contributors using an already-created private Group Song link do not need a paid Cantoa account.
- My Voice requires Creator/Studio/owner.
- Saved People & Moments requires Creator/Studio/owner and suggestions are not surfaced to Explore.
- Version comparison is shown only to Creator/Studio/owner.
- Existing basic MP3/share/gift flow is not changed by this patch.
- Paid features carry a small Creator+ badge in the existing UI rather than adding navigation.
- Group Song GET endpoints now fall back to legacy contribution fields when the 2.0 schema columns are missing, so simply opening an empty group page does not create a misleading red "could not load collected memories" error.
- If a contribution write fails because the Group Song 2.0 migration is missing, the contributor gets an actionable database-setup message rather than a generic retry.

No new SQL migration is introduced by v18.8.31. The existing v18.8.29 Group Song 2.0 migration is still required for full Memory/Message/Song idea/Feeling/Photo/Vote functionality.
