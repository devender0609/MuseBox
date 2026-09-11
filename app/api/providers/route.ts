import { NextRequest, NextResponse } from "next/server";
import { ownerUser } from "@/lib/owner-access";
import { availableMusicProviders } from "@/lib/music-providers";

export async function GET(request: NextRequest) {
  const owner = await ownerUser(request);
  if (!owner) return NextResponse.json({ error: "Owner access required." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  const available = availableMusicProviders();
  return NextResponse.json({
    routing: "automatic",
    providers: {
      primary_song: available.elevenlabs ? "ElevenLabs Music" : available.mureka ? "Mureka" : "Not configured",
      alternate_song: available.mureka ? "Mureka" : "Fallback only",
      background_instrumental: available.stability ? "Stable Audio" : available.elevenlabs ? "ElevenLabs Music" : "Not configured",
      video_soundtrack: available.mureka ? "Mureka" : "Not configured",
    },
  }, { headers: { "Cache-Control": "private, no-store" } });
}
