# Cantoa QA Audit v18.8.11

## Build-blocking fix

Vercel/Next.js 16 TypeScript rejected passing JSZip's `Uint8Array<ArrayBufferLike>` directly as a `BlobPart` in `app/page.tsx`.

The backing-track code now first slices the exact bytes into an `ArrayBuffer`, then passes that `ArrayBuffer` to `new Blob(...)`. The same `ArrayBuffer` is reused for `decodeAudioData`, avoiding both the TypeScript incompatibility and an unnecessary copy.

No Supabase SQL, provider routing, pricing, membership, karaoke/stem behavior, or UI behavior was changed by this patch.

## Verification

- Targeted search confirms the failing `new Blob([bytes], ...)` call for JSZip stem bytes is gone.
- Existing `pcmWav` `new Blob([bytes], ...)` is safe because that `bytes` value is itself an `ArrayBuffer`, not a JSZip `Uint8Array<ArrayBufferLike>`.
- Final production build/typecheck should be verified by Vercel because the deployment ZIP intentionally excludes `node_modules`.
