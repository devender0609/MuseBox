import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, ensurePremiumAccess, usageError } from "@/lib/usage";

export const maxDuration = 300;
export async function POST(request: NextRequest) {
  try {
    try {
      const access = await ensurePremiumAccess(request);
      const monthlyStemLimit = access.plan === "Owner" ? 100 : access.plan === "Studio" ? 20 : 6;
      await enforceRateLimit(request, "stems", monthlyStemLimit, 30 * 24 * 3600);
    } catch (error) {
      const issue = usageError(error);
      return NextResponse.json({ error: issue.error }, { status: issue.status });
    }
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return NextResponse.json({ error: "Connect ELEVENLABS_API_KEY to export stems." }, { status: 503 });
    const incoming = await request.formData();
    const file = incoming.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "An audio file is required." }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Keep stem-source audio under 50 MB." }, { status: 413 });
    const form = new FormData();
    form.append("file", file);
    form.append("stem_variation_id", "six_stems_v1");
    form.append("sign_with_c2pa", "true");
    const response = await fetch("https://api.elevenlabs.io/v1/music/stem-separation", { method: "POST", headers: { "xi-api-key": key }, body: form });
    if (!response.ok) {
      const raw = await response.text();
      return NextResponse.json({ error: /paid plan|payment_required/i.test(raw) ? "Stem export requires an eligible paid ElevenLabs plan." : "Stem separation could not be completed." }, { status: response.status });
    }
    return new NextResponse(await response.arrayBuffer(), { headers: { "Content-Type": "application/zip", "Content-Disposition": "attachment; filename=cantoa-stems.zip", "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Stem export failed." }, { status: 500 });
  }
}
