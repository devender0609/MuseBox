import { NextResponse } from "next/server";
import { authenticatedUser, adminSupabase } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";
import { enforceRateLimit, usageError } from "@/lib/usage";
import { isSupportedAudioFile } from "@/lib/audio-upload";

type VoiceProfile = { id: string; voiceId: string; name: string; createdAt: number; provider: "elevenlabs" };

async function entitlement(userId: string, email?: string | null) {
  if (isCantoaOwner(email)) return { allowed: true, limit: 10, plan: "Owner" };
  const admin = adminSupabase();
  if (!admin) return { allowed: false, limit: 0, plan: "Explore" };
  const { data, error } = await admin.from("memberships").select("plan,status").eq("user_id", userId).maybeSingle();
  if (error || !data) return { allowed: false, limit: 0, plan: "Unavailable", verificationError: true };
  const plan = data.status === "active" ? String(data.plan || "Explore") : "Explore";
  return { allowed: plan === "Creator" || plan === "Studio", limit: plan === "Studio" ? 3 : plan === "Creator" ? 1 : 0, plan, verificationError: false };
}

async function profilesForUser(userId: string): Promise<VoiceProfile[] | null> {
  const admin = adminSupabase();
  if (!admin) return null;
  const { data, error } = await admin.from("cantoa_voice_profiles").select("id,provider_voice_id,name,provider,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
  if (error) return null;
  return (data || []).map((x: any) => ({ id: String(x.id), voiceId: String(x.provider_voice_id), name: String(x.name), provider: "elevenlabs" as const, createdAt: new Date(x.created_at).getTime() }));
}

async function cleanupProviderVoice(voiceId: string, key: string) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(voiceId)}`, { method: "DELETE", headers: { "xi-api-key": key } });
    return response.ok || response.status === 404;
  } catch { return false; }
}

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const ent = await entitlement(user.id, user.email);
  if (ent.verificationError) return NextResponse.json({ error: "My Voice membership access could not be verified right now." }, { status: 503 });
  const profiles = await profilesForUser(user.id);
  if (!profiles) return NextResponse.json({ error: "My Voice needs the v18.9.2 database hardening update before it can be used safely." }, { status: 503 });
  return NextResponse.json({ profiles, limit: ent.limit, plan: ent.plan, supportedUse: "spoken_voice" });
}

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const ent = await entitlement(user.id, user.email);
  if (ent.verificationError) return NextResponse.json({ error: "My Voice membership access could not be verified right now." }, { status: 503 });
  if (!ent.allowed) return NextResponse.json({ error: "My Voice requires Creator or Studio." }, { status: 402 });
  if (ent.plan !== "Owner") {
    try { await enforceRateLimit(request, "my_voice_create", 5, 24 * 60 * 60); }
    catch (error) { const issue = usageError(error); return NextResponse.json({ error: issue.error }, { status: issue.status }); }
  }
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "Voice provider is not configured." }, { status: 503 });
  const form = await request.formData();
  if (String(form.get("consent") || "") !== "true") return NextResponse.json({ error: "Confirm that this is your own voice and that you consent to creating a private voice profile." }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 10000) return NextResponse.json({ error: "Add a clear voice recording before creating My Voice." }, { status: 400 });
  if (!isSupportedAudioFile(file)) return NextResponse.json({ error: "Use MP3, WAV, M4A, AAC, FLAC, OGG, MP4 audio, or WebM for My Voice." }, { status: 415 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Voice sample is too large. Keep the sample under 25 MB." }, { status: 413 });
  const existing = await profilesForUser(user.id);
  if (!existing) return NextResponse.json({ error: "My Voice needs the v18.9.2 database hardening update before it can be used safely." }, { status: 503 });
  if (existing.length >= ent.limit) return NextResponse.json({ error: `${ent.plan} supports ${ent.limit} saved voice profile${ent.limit === 1 ? "" : "s"}. Delete one before creating another.` }, { status: 409 });
  const requested = String(form.get("name") || "My Voice").trim().slice(0, 60) || "My Voice";
  const providerForm = new FormData();
  providerForm.append("name", `Cantoa ${user.id.slice(0, 8)} ${Date.now()}`);
  providerForm.append("description", "Private Cantoa self-voice profile. User explicitly confirmed this is their own voice.");
  providerForm.append("remove_background_noise", "false");
  providerForm.append("files[]", file, file.name || "my-voice-sample.webm");
  const response = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": key }, body: providerForm });
  if (!response.ok) {
    const raw = await response.text();
    const error = response.status === 401 || response.status === 403 ? "The connected ElevenLabs key does not have Voice access." : response.status === 422 ? "We couldn’t create your voice from this recording. Try again with about 30–45 seconds of clear speech in a quiet room." : response.status === 429 ? "The voice provider is temporarily rate-limited. Wait a moment and try again." : response.status >= 500 ? "The voice provider is temporarily unavailable. Please try again." : `Voice creation failed (${response.status}).`;
    return NextResponse.json({ error, detail: raw.slice(0, 220) }, { status: response.status >= 500 ? 502 : 400 });
  }
  const data = await response.json() as { voice_id?: string; requires_verification?: boolean };
  if (!data.voice_id) return NextResponse.json({ error: "Voice provider returned no voice ID." }, { status: 502 });
  const admin = adminSupabase();
  if (!admin) {
    const cleaned = await cleanupProviderVoice(data.voice_id, key);
    return NextResponse.json({ error: cleaned ? "Cantoa could not save this voice profile. The provider copy was removed; please try again." : "Cantoa could not save this voice profile, and provider cleanup could not be confirmed. Please contact support before retrying." }, { status: 503 });
  }
  const id = `voice-${crypto.randomUUID()}`;
  const { error: saveError } = await admin.from("cantoa_voice_profiles").insert({ id, user_id: user.id, provider_voice_id: data.voice_id, name: requested, provider: "elevenlabs" });
  if (saveError) {
    const cleaned = await cleanupProviderVoice(data.voice_id, key);
    return NextResponse.json({ error: cleaned ? "Cantoa could not save this voice profile. The provider copy was removed; please try again." : "Cantoa could not save this voice profile, and provider cleanup could not be confirmed. Please contact support before retrying." }, { status: 500 });
  }
  const profiles = await profilesForUser(user.id) || [];
  const profile = profiles.find((x) => x.id === id) || { id, voiceId: data.voice_id, name: requested, createdAt: Date.now(), provider: "elevenlabs" as const };
  return NextResponse.json({ profile, profiles, limit: ent.limit, requiresVerification: Boolean(data.requires_verification) });
}

export async function DELETE(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "Voice provider is not configured, so Cantoa will not remove the local ownership record without confirming provider deletion." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "My Voice storage is not configured." }, { status: 503 });
  const { data: target, error: findError } = await admin.from("cantoa_voice_profiles").select("id,provider_voice_id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (findError) return NextResponse.json({ error: "My Voice ownership could not be verified right now." }, { status: 503 });
  if (!target) return NextResponse.json({ error: "Voice profile not found." }, { status: 404 });
  const removed = await cleanupProviderVoice(String(target.provider_voice_id), key);
  if (!removed) return NextResponse.json({ error: "Voice provider could not confirm deletion. Nothing was removed from Cantoa." }, { status: 502 });
  const { error: deleteError } = await admin.from("cantoa_voice_profiles").delete().eq("id", id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: "The provider voice was removed, but Cantoa could not remove its ownership record. Please retry cleanup later." }, { status: 500 });
  return NextResponse.json({ profiles: await profilesForUser(user.id) || [] });
}
