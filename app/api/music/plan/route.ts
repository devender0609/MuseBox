import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, ensureGenerationAccess, usageError } from "@/lib/usage";

function qualityPlanningPrompt(prompt: string) {
  const lower = prompt.toLocaleLowerCase();
  const multilingual = /\bhinglish\b|\bbilingual\b|\bmixed[- ]language\b|\bcode[- ]switch(?:ing)?\b|\b(?:hindi|punjabi|arabic|spanish)\s*(?:[-/+&]|and)\s*english\b|\benglish\s*(?:[-/+&]|and)\s*(?:hindi|punjabi|arabic|spanish)\b|\bhindi\s*(?:[-/+&]|and)\s*spanish\b|\bspanish\s*(?:[-/+&]|and)\s*hindi\b/i.test(lower);
  const exactWords = /keep (?:my|these|the) words|do not change my words|don't change my words|exact words|wedding vows|my poem|my letter/i.test(lower);
  return [
    prompt,
    "Cantoa quality gate (production guidance, never sing these instructions): Reconcile any conflict in favor of the user’s newest explicit request. Treat explicit voice, language, names, supplied lyrics, duration intent and requested mood as hard constraints. Preserve proper names exactly. Do not turn prompt instructions, section labels, pronunciation notes or production directions into sung lyrics. Build a concise, memorable chorus/hook with complete natural phrases; avoid accidental partial-word or partial-phrase repetition at hook or section boundaries. Put a memorable musical idea early, keep verses singable rather than overcrowded, and end cleanly rather than abruptly. Do not introduce a different singer type, language or emotional direction merely because it is a common genre default.",
    multilingual && "For multilingual writing, code-switch naturally at musically sensible points. Do not mechanically translate every line. Preserve proper names and use idiomatic phrasing in each requested language.",
    exactWords && "The user has asked to preserve wording. Keep their supplied words intact wherever musically possible and do not invent replacements for names or key phrases.",
  ].filter(Boolean).join("\n\n");
}

function providerMessage(raw: string, status: number) {
  let message = raw;
  try {
    const parsed = JSON.parse(raw);
    const candidate = parsed?.detail?.message || parsed?.detail || parsed?.message;
    if (typeof candidate === "string") message = candidate;
  } catch {}
  const value = String(message || "").toLowerCase();
  if (/terms of service|policy|copyright|imitat|specific artist|artist style|protected style|moderation/.test(value))
    return "Try describing the mood, genre, instruments, vocal character, tempo or energy instead of asking to copy a specific artist, song or movie style.";
  if (/quota_exceeded|quota exceeded|credit limit/.test(value))
    return "The primary music connection is temporarily unavailable. Please try again in a moment.";
  if (status === 401 || status === 403)
    return "Cantoa's music connection needs attention. Please try again shortly.";
  if (status === 429) return "The music service is busy right now. Please wait a few seconds and try again.";
  return "Cantoa could not prepare the song lyrics and structure. Try again or adjust the description.";
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
    if (prompt.length < 8)
      return NextResponse.json(
        { error: "Describe the song in at least 8 characters." },
        { status: 400 },
      );
    if (prompt.length > 4000)
      return NextResponse.json(
        { error: "This song brief is too long to pre-plan. Shorten the description or source material and try again." },
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
        prompt: qualityPlanningPrompt(prompt),
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
