import { NextRequest, NextResponse } from "next/server";
import { ownerUser } from "@/lib/owner-access";
import { availableMusicProviders, preferredProvider, providerRouteReason, type ProviderRequest } from "@/lib/music-providers";

export async function POST(request: NextRequest) {
  const owner = await ownerUser(request);
  if (!owner) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const kind = typeof body.kind === "string" ? body.kind : "vocal";
  const sample: ProviderRequest = kind === "background"
    ? { prompt: "owner routing test: ambient background instrumental", duration: 60, instrumental: true, intent: "background" }
    : kind === "instrumental"
      ? { prompt: "owner routing test: ordinary instrumental song", duration: 60, instrumental: true, intent: "song" }
      : kind === "alternate"
        ? { prompt: "owner routing test: alternate vocal direction", duration: 60, instrumental: false, lyrics: "Prepared test lyrics", intent: "alternate" }
        : { prompt: "owner routing test: vocal song", duration: 60, instrumental: false, intent: "song" };
  try {
    const provider = preferredProvider(sample);
    return NextResponse.json({
      kind,
      provider,
      reason: providerRouteReason(sample, provider),
      available: availableMusicProviders(),
      charged: false,
      message: "Dry routing test only. No provider API was called and no membership minutes were used.",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Routing test failed.", charged: false }, { status: 503 });
  }
}
