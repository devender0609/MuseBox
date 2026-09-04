import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, ensureGenerationAccess, usageError } from "@/lib/usage";

function providerMessage(raw: string, status: number) {
  try {
    const parsed = JSON.parse(raw);
    const message =
      parsed?.detail?.message || parsed?.detail || parsed?.message;
    if (typeof message === "string") return message;
  } catch {}
  if (status === 401 || status === 403)
    return "The ElevenLabs API key does not have Music planning access.";
  if (status === 429) return "The music planner is busy. Try again shortly.";
  return "Cantoa could not prepare the song lyrics and structure.";
}

export async function POST(request: NextRequest) {
  try {
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key)
      return NextResponse.json(
        { error: "Song generation is not connected on this deployment." },
        { status: 503 },
      );
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (prompt.length < 8 || prompt.length > 4000)
      return NextResponse.json(
        { error: "Describe the song in at least 8 characters." },
        { status: 400 },
      );
    const duration = Math.min(600, Math.max(10, Number(body.duration) || 30));
    try {
      await ensureGenerationAccess(request, duration / 60);
      await enforceRateLimit(request, "plan", 12, 3600);
    } catch (error) {
      const issue = usageError(error);
      return NextResponse.json({ error: issue.error }, { status: issue.status });
    }
    const response = await fetch("https://api.elevenlabs.io/v1/music/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": key },
      body: JSON.stringify({
        prompt,
        music_length_ms: duration * 1000,
        model_id: "music_v2",
      }),
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: providerMessage(detail, response.status) },
        { status: response.status },
      );
    }
    const raw = (await response.json()) as Record<string, unknown>;
    const compositionPlan = raw.composition_plan || raw;
    return NextResponse.json(
      { compositionPlan },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Song planning failed.",
      },
      { status: 500 },
    );
  }
}
