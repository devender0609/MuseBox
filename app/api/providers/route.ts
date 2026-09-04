import { NextResponse } from "next/server";
import { availableMusicProviders } from "@/lib/music-providers";

export async function GET() {
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
