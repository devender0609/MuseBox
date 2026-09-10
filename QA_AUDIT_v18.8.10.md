# Cantoa v18.8.10 QA audit

Focused utility/export repair release.

- Karaoke HTML now embeds the separated backing audio directly, so its Play control works even when Windows opens only the HTML into a temporary folder from inside a ZIP.
- The package still includes a standalone karaoke WAV, TXT lyrics and estimated LRC timing.
- Instrumental and PCM WAV exports now carry a generated Cantoa cover through a RIFF ID3/APIC metadata chunk when the receiving player supports WAV artwork. Player artwork remains ultimately player/OS dependent.
- Six-stem exports are post-processed in Cantoa. Audibly empty stem categories are omitted instead of being delivered as blank audio files, and a STEM-MANIFEST.txt explains which stems were included or omitted.
- The download panel explains that six-stem availability depends on content actually present in the source song.
- Existing provider routing, plans, entitlements, pricing, auth, Song DNA and generation logic are unchanged.
- No Supabase migration or new environment variable is required.
