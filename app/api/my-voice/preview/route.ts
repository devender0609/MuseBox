import { NextResponse } from "next/server";
import { authenticatedUser, adminSupabase } from "@/lib/supabase";
import { enforceRateLimit, ensurePremiumAccess, usageError } from "@/lib/usage";

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { await ensurePremiumAccess(request); await enforceRateLimit(request, "my_voice_preview", 30, 60 * 60); }
  catch (error) { const issue = usageError(error); return NextResponse.json({ error: issue.error }, { status: issue.status }); }
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const text = String(body.text || "This is my Cantoa voice, ready for a personal spoken message.").trim().slice(0, 300);
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "My Voice storage is not configured." }, { status: 503 });
  const { data: target, error } = await admin.from("cantoa_voice_profiles").select("provider_voice_id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "My Voice ownership could not be verified right now." }, { status: 503 });
  if (!target?.provider_voice_id) return NextResponse.json({ error: "Voice profile not found." }, { status: 404 });
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "Voice provider is not configured." }, { status: 503 });
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(target.provider_voice_id)}?output_format=mp3_44100_128`, { method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ text, model_id: "eleven_multilingual_v2" }) });
  if (!response.ok) return NextResponse.json({ error: `Voice preview failed (${response.status}).` }, { status: 502 });
  return new Response(await response.arrayBuffer(), { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}
