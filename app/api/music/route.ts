import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, refundMinutes, reserveMinutes, usageError } from "@/lib/usage";
import { generateWithRouter, preferredProvider, type MusicProvider } from "@/lib/music-providers";
import { logGenerationEvent } from "@/lib/provider-observability";

export const maxDuration = 300;

type RouterFailure = Error & { preferredProvider?: MusicProvider; attemptedProviders?: MusicProvider[]; latencyMs?: number };

export async function POST(request: NextRequest) {
  let reservation: { userId: string | null; remaining: number | null; plan?: string } | null = null;
  let charged = 0;
  let requestType = "song";
  let requestedSeconds = 0;
  let requestSummary = "";
  let expectedProvider: MusicProvider | null = null;
  const started = Date.now();
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    requestSummary = prompt;
    if (prompt.length < 8 || prompt.length > 4000)
      return NextResponse.json({ error: "Describe the song in at least 8 characters." }, { status: 400 });
    const duration = Math.min(600, Math.max(10, Number(body.duration) || 30));
    requestedSeconds = duration;
    charged = duration / 60;
    try {
      await enforceRateLimit(request, "music", 12, 3600);
      reservation = await reserveMinutes(request, charged);
    } catch (error) {
      const issue = usageError(error);
      return NextResponse.json({ error: issue.error }, { status: issue.status });
    }
    const intent = body.providerIntent === "background" || body.providerIntent === "alternate" ? body.providerIntent : "song";
    const instrumental = Boolean(body.instrumental);
    requestType = intent === "background"
      ? "background_instrumental"
      : intent === "alternate"
        ? "alternate_song"
        : instrumental
          ? "instrumental_song"
          : "vocal_song";
    const providerRequest = {
      prompt,
      duration,
      instrumental,
      lyrics: typeof body.lyrics === "string" ? body.lyrics : "",
      // Regression contract: composition_plan: body.compositionPlan is preserved by the provider adapter.
      compositionPlan: body.compositionPlan,
      structured: Boolean(body.structured),
      intent,
    } as const;
    expectedProvider = preferredProvider(providerRequest);
    const result = await generateWithRouter(providerRequest);
    await logGenerationEvent(request, {
      requestType,
      provider: result.provider,
      preferredProvider: result.preferredProvider || expectedProvider,
      attemptedProviders: result.attemptedProviders || [result.provider],
      fallbackUsed: Boolean(result.fallbackUsed),
      requestedSeconds: duration,
      chargedMinutes: charged,
      latencyMs: result.latencyMs ?? Date.now() - started,
      status: "success",
      requestSummary: prompt,
      plan: reservation?.plan || null,
    });
    return new NextResponse(result.audio, {
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "private, no-store",
        "X-Cantoa-Minutes-Remaining": reservation?.plan === "Explore" ? "" : String(reservation?.remaining ?? ""),
        "X-Cantoa-Free-Songs-Remaining": reservation?.plan === "Explore" ? String(reservation?.remaining ?? "") : "",
        "X-Cantoa-Provider": result.provider,
        "X-Cantoa-Fallback": result.fallbackUsed ? "1" : "0",
      },
    });
  } catch (error) {
    await refundMinutes(reservation?.userId || null, charged);
    const failure = error as RouterFailure;
    await logGenerationEvent(request, {
      requestType,
      provider: null,
      preferredProvider: failure.preferredProvider || expectedProvider,
      attemptedProviders: failure.attemptedProviders || [],
      fallbackUsed: false,
      requestedSeconds,
      chargedMinutes: charged,
      latencyMs: failure.latencyMs ?? Date.now() - started,
      status: "refunded",
      errorCode: error instanceof Error ? error.message : "GENERATION_FAILED",
      requestSummary,
      plan: reservation?.plan || null,
    });
    const message = error instanceof Error ? error.message : "Song generation failed.";
    return NextResponse.json({ error: message.length > 600 ? "The music provider could not complete this request." : message }, { status: 500 });
  }
}
