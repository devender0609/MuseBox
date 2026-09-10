import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, ensurePremiumAccess, usageError } from "@/lib/usage";

export const maxDuration = 300;
export async function POST(request: NextRequest) {
  try {
    let incoming: FormData;
    let access: Awaited<ReturnType<typeof ensurePremiumAccess>>;
    try {
      access = await ensurePremiumAccess(request);
      incoming = await request.formData();
      const requestedVariation = incoming.get("variation") === "two_stems_v1" ? "two" : "six";
      // Do not impose a hidden monthly stem quota on paid users. The client already
      // deduplicates/serializes stem jobs per song, and ElevenLabs applies provider-side
      // usage/credit limits. Keep only a generous short-window abuse guard.
      if (access.plan !== "Owner") {
        await enforceRateLimit(request, `stems_${requestedVariation}`, 60, 60 * 60);
      }
    } catch (error) {
      const issue = usageError(error);
      return NextResponse.json({ error: issue.error }, { status: issue.status });
    }
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return NextResponse.json({ error: "Connect ELEVENLABS_API_KEY to export stems." }, { status: 503 });
    const file = incoming!.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "An audio file is required." }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Keep stem-source audio under 50 MB." }, { status: 413 });
    const variationRaw = incoming!.get("variation");
    const variation = variationRaw === "two_stems_v1" ? "two_stems_v1" : "six_stems_v1";
    const callProvider = async () => {
      const form = new FormData();
      form.append("file", file);
      form.append("stem_variation_id", variation);
      form.append("sign_with_c2pa", "false");
      return fetch("https://api.elevenlabs.io/v1/music/stem-separation?output_format=mp3_44100_128", {
        method: "POST",
        headers: { "xi-api-key": key },
        body: form,
      });
    };

    let response = await callProvider();
    // The provider documents this endpoint as potentially high-latency and it can transiently
    // return 429/5xx. Retry once server-side rather than making the user click repeatedly.
    if ([429, 500, 502, 503, 504].includes(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      response = await callProvider();
    }
    if (!response.ok) {
      const raw = await response.text();
      const lower = raw.toLowerCase();
      const error = /paid plan|payment_required|insufficient.*credit|quota/i.test(lower)
        ? "ElevenLabs stem separation is not available for the connected provider account or its current credits/plan."
        : response.status === 401 || response.status === 403
          ? "ElevenLabs rejected the stem-separation API key or this key does not have access to stem separation."
          : response.status === 400 || response.status === 415 || response.status === 422
            ? "The stem provider could not read this audio file. Try the original MP3 download or another finished song."
            : response.status === 429
              ? "Stem separation is temporarily busy or rate-limited. Wait a moment and try again."
              : "Stem separation could not be completed by the provider. Try again shortly.";
      console.error("[cantoa/stems] provider error", { status: response.status, variation, detail: raw.slice(0, 500) });
      return NextResponse.json({ error }, { status: response.status });
    }
    const archive = await response.arrayBuffer();
    const signature = new Uint8Array(archive.slice(0, 2));
    if (archive.byteLength < 2048 || signature[0] !== 0x50 || signature[1] !== 0x4b) {
      return NextResponse.json({ error: "The stem provider returned an invalid or empty archive. No download was created." }, { status: 502 });
    }
    return new NextResponse(archive, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename=cantoa-${variation}.zip`, "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stem export failed." }, { status: 500 });
  }
}
