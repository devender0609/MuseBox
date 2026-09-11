import { NextResponse } from "next/server";
import { authenticatedUser, adminSupabase } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";
import { enforceRateLimit, usageError } from "@/lib/usage";

type VoiceProfile = { id: string; voiceId: string; name: string; createdAt: number; provider: "elevenlabs"; };

async function entitlement(userId: string, email?: string | null) {
  if (isCantoaOwner(email)) return { allowed: true, limit: 10, plan: "Owner" };
  const admin = adminSupabase();
  if (!admin) return { allowed: false, limit: 0, plan: "Explore" };
  const { data } = await admin.from("memberships").select("plan,status").eq("user_id", userId).maybeSingle();
  const plan = data?.status === "active" ? String(data.plan || "Explore") : "Explore";
  return { allowed: plan === "Creator" || plan === "Studio", limit: plan === "Studio" ? 3 : plan === "Creator" ? 1 : 0, plan };
}

function profilesFromUser(user: any): VoiceProfile[] {
  const raw = user?.user_metadata?.cantoa_my_voices;
  return Array.isArray(raw) ? raw.filter((x) => x?.voiceId && x?.name).slice(0, 10) : [];
}

export async function GET(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const ent = await entitlement(user.id, user.email);
  return NextResponse.json({ profiles: profilesFromUser(user), limit: ent.limit, plan: ent.plan, supportedUse: "spoken_voice" });
}

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const ent = await entitlement(user.id, user.email);
  if (!ent.allowed) return NextResponse.json({ error: "My Voice requires Creator or Studio." }, { status: 402 });
  if (ent.plan !== "Owner") {
    try { await enforceRateLimit(request, "my_voice_create", 5, 24 * 60 * 60); }
    catch (error) { const issue = usageError(error); return NextResponse.json({ error: issue.error }, { status: issue.status }); }
  }
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "Voice provider is not configured." }, { status: 503 });
  const form = await request.formData();
  const consent = String(form.get("consent") || "") === "true";
  if (!consent) return NextResponse.json({ error: "Confirm that this is your own voice and that you consent to creating a private voice profile." }, { status: 400 });
  const file = form.get("file");
  if (!(file instanceof File) || file.size < 10000) return NextResponse.json({ error: "Add a clear voice recording before creating My Voice." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Voice sample is too large. Keep the sample under 25 MB." }, { status: 400 });
  const existing = profilesFromUser(user);
  if (existing.length >= ent.limit) return NextResponse.json({ error: `${ent.plan} supports ${ent.limit} saved voice profile${ent.limit === 1 ? "" : "s"}. Delete one before creating another.` }, { status: 409 });
  const requested = String(form.get("name") || "My Voice").trim().slice(0, 60) || "My Voice";
  const providerName = `Cantoa ${user.id.slice(0, 8)} ${Date.now()}`;
  const providerForm = new FormData();
  providerForm.append("name", providerName);
  providerForm.append("description", "Private Cantoa self-voice profile. User explicitly confirmed this is their own voice.");
  providerForm.append("remove_background_noise", "false");
  providerForm.append("files[]", file, file.name || "my-voice-sample.webm");
  const response = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": key }, body: providerForm });
  if (!response.ok) {
    const raw = await response.text();
    let providerDetail = "";
    try {
      const parsed = JSON.parse(raw);
      providerDetail = String(parsed?.detail?.message || parsed?.detail || parsed?.message || "").slice(0, 220);
    } catch { providerDetail = raw.slice(0, 220); }
    const error = response.status === 401 || response.status === 403
      ? "The connected ElevenLabs key does not have Voice access."
      : response.status === 422
        ? "We couldn’t create your voice from this recording. Try again with about 30–45 seconds of clear speech in a quiet room."
        : response.status === 429
          ? "The voice provider is temporarily rate-limited. Wait a moment and try again."
          : response.status >= 500
            ? "The voice provider is temporarily unavailable. Please try again."
            : `Voice creation failed (${response.status}).`;
    return NextResponse.json({ error, detail: providerDetail }, { status: response.status >= 500 ? 502 : 400 });
  }
  const data = await response.json() as { voice_id?: string; requires_verification?: boolean };
  if (!data.voice_id) return NextResponse.json({ error: "Voice provider returned no voice ID." }, { status: 502 });
  const profile: VoiceProfile = { id: `voice-${Date.now()}`, voiceId: data.voice_id, name: requested, createdAt: Date.now(), provider: "elevenlabs" };
  const next = [profile, ...existing].slice(0, ent.limit);
  const admin = adminSupabase();
  if (!admin) {
    await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(data.voice_id)}`, { method: "DELETE", headers: { "xi-api-key": key } }).catch(() => undefined);
    return NextResponse.json({ error: "Cantoa could not save this voice profile, so the provider copy was cleaned up. Please try again." }, { status: 503 });
  }
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...(user.user_metadata || {}), cantoa_my_voices: next } });
  if (metadataError) {
    await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(data.voice_id)}`, { method: "DELETE", headers: { "xi-api-key": key } }).catch(() => undefined);
    return NextResponse.json({ error: "Cantoa could not save this voice profile, so the provider copy was cleaned up. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ profile, profiles: next, limit: ent.limit, requiresVerification: Boolean(data.requires_verification) });
}

export async function DELETE(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.id || "");
  const profiles = profilesFromUser(user);
  const target = profiles.find((x) => x.id === id);
  if (!target) return NextResponse.json({ error: "Voice profile not found." }, { status: 404 });
  const key = process.env.ELEVENLABS_API_KEY;
  if (key) {
    const r = await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(target.voiceId)}`, { method: "DELETE", headers: { "xi-api-key": key } });
    if (!r.ok && r.status !== 404) return NextResponse.json({ error: "Voice provider could not delete this profile. Nothing was removed from Cantoa." }, { status: 502 });
  }
  const next = profiles.filter((x) => x.id !== id);
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "The provider voice was removed, but Cantoa could not update your saved profile list. Refresh later to retry cleanup." }, { status: 503 });
  const { error: metadataError } = await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...(user.user_metadata || {}), cantoa_my_voices: next } });
  if (metadataError) return NextResponse.json({ error: "The provider voice was removed, but Cantoa could not update your saved profile list. Refresh later to retry cleanup." }, { status: 500 });
  return NextResponse.json({ profiles: next });
}
