import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { checkRateLimit, requestFingerprint } from "@/lib/rate-limit";

const allowedKinds = new Set(["memory","message","idea"]);
const allowedPhotoTypes = new Set(["image/jpeg","image/png","image/webp"]);
const extForType = (type:string) => type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";

async function contributionPayload(admin: NonNullable<ReturnType<typeof adminSupabase>>, collectionId: string) {
  let { data, error } = await admin.from("moment_contributions")
    .select("id,contributor,kind,memory,feeling,photo_path,created_at")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) {
    const legacy = await admin.from("moment_contributions")
      .select("id,contributor,memory,created_at")
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: true })
      .limit(100);
    if (legacy.error) throw legacy.error;
    data = (legacy.data || []).map((item) => ({ ...item, kind: "memory", feeling: null, photo_path: null }));
    error = null;
  }
  const ids = (data || []).map((item) => item.id);
  const voteCounts = new Map<number, number>();
  if (ids.length) {
    const { data: votes } = await admin.from("moment_contribution_votes").select("contribution_id").in("contribution_id", ids);
    for (const vote of votes || []) voteCounts.set(vote.contribution_id, (voteCounts.get(vote.contribution_id) || 0) + 1);
  }
  return Promise.all((data || []).map(async (item) => {
    let photo_url: string | null = null;
    if (item.photo_path) {
      const { data: signed } = await admin.storage.from("songs").createSignedUrl(item.photo_path, 3600);
      photo_url = signed?.signedUrl || null;
    }
    return { ...item, votes: voteCounts.get(item.id) || 0, photo_url };
  }));
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Contributions are not configured." }, { status: 503 });
  const { token } = await params;
  const { data: collection, error } = await admin.from("moment_collections").select("id,open,song_id").eq("token", token).maybeSingle();
  if (error || !collection?.open) return NextResponse.json({ error: "This contribution link is unavailable." }, { status: 404 });
  const { data: song } = await admin.from("songs").select("title").eq("id", collection.song_id).maybeSingle();
  try {
    const contributions = await contributionPayload(admin, collection.id);
    return NextResponse.json({ title: song?.title || "Group Song", contributions });
  } catch {
    return NextResponse.json({ error: "Could not load the shared ideas right now." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Contributions are not configured." }, { status: 503 });
  const { token } = await params;
  const limiter = checkRateLimit(`group-contribution:${token}:${requestFingerprint(request)}`, 8, 10 * 60 * 1000);
  if (!limiter.ok) return NextResponse.json({ error: "Too many contributions were sent from this device. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } });
  const contentType = request.headers.get("content-type") || "";
  let contributor = "Someone", memory = "", feeling = "", kind = "memory";
  let photo: File | null = null;
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    contributor = String(form.get("contributor") || "Someone").trim().slice(0,80) || "Someone";
    memory = String(form.get("memory") || "").trim().slice(0,1200);
    feeling = String(form.get("feeling") || "").trim().slice(0,120);
    kind = String(form.get("kind") || "memory").trim().toLowerCase();
    const maybePhoto = form.get("photo");
    if (maybePhoto instanceof File && maybePhoto.size > 0) photo = maybePhoto;
  } else {
    const body = await request.json().catch(() => ({}));
    contributor = String(body.contributor || "Someone").trim().slice(0,80) || "Someone";
    memory = String(body.memory || "").trim().slice(0,1200);
    feeling = String(body.feeling || "").trim().slice(0,120);
    kind = String(body.kind || "memory").trim().toLowerCase();
  }
  if (!allowedKinds.has(kind)) kind = "memory";
  if (memory.length < 3) return NextResponse.json({ error: "Add a memory, message or song idea first." }, { status: 400 });
  if (photo && (!allowedPhotoTypes.has(photo.type) || photo.size > 5 * 1024 * 1024)) return NextResponse.json({ error: "Photo must be a JPG, PNG or WebP up to 5 MB." }, { status: 400 });

  const { data: collection, error } = await admin.from("moment_collections").select("id,open").eq("token", token).maybeSingle();
  if (error || !collection?.open) return NextResponse.json({ error: "This contribution link is unavailable." }, { status: 404 });

  let photo_path: string | null = null;
  if (photo) {
    photo_path = `group-photos/${collection.id}/${crypto.randomUUID()}.${extForType(photo.type)}`;
    const { error: uploadError } = await admin.storage.from("songs").upload(photo_path, photo, { contentType: photo.type, upsert: false });
    if (uploadError) return NextResponse.json({ error: "Your text is ready, but the photo could not be uploaded. Please try again without the photo or use a smaller image." }, { status: 500 });
  }

  const { error: insertError } = await admin.from("moment_contributions").insert({ collection_id: collection.id, contributor, kind, memory, feeling: feeling || null, photo_path });
  if (insertError) {
    if (photo_path) await admin.storage.from("songs").remove([photo_path]).catch(() => undefined);
    return NextResponse.json({ error: /column|schema cache|kind|feeling|photo_path/i.test(insertError.message || "") ? "Group Song 2.0 setup needs the latest database update. Please ask the song creator to finish setup." : "Could not add your contribution right now. Please try again." }, { status: /column|schema cache|kind|feeling|photo_path/i.test(insertError.message || "") ? 503 : 500 });
  }
  return NextResponse.json({ ok: true });
}
