import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to open your cloud library." },
      { status: 401 },
    );
  if (!admin)
    return NextResponse.json(
      { error: "Cloud library is not configured." },
      { status: 503 },
    );
  const { data, error } = await admin
    .from("songs")
    .select(
      "id,title,prompt,mode,duration,storage_key,created_at,parent_id,version_label",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const songs = await Promise.all(
    (data || []).map(async (item) => {
      const lyricsKey = item.storage_key.replace(/\.[a-z0-9]+$/i, "-lyrics.txt");
      const [{ data: signed }, { data: signedLyrics }] = await Promise.all([
        admin.storage.from("songs").createSignedUrl(item.storage_key, 3600),
        admin.storage.from("songs").createSignedUrl(lyricsKey, 3600),
      ]);
      return {
        ...item,
        url: signed?.signedUrl || null,
        lyrics_url: signedLyrics?.signedUrl || null,
      };
    }),
  );
  return NextResponse.json({ songs });
}

export async function POST(request: NextRequest) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user)
    return NextResponse.json(
      { error: "Sign in to save songs to the cloud." },
      { status: 401 },
    );
  if (!admin)
    return NextResponse.json(
      { error: "Cloud library is not configured." },
      { status: 503 },
    );
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "Audio file is required." },
      { status: 400 },
    );
  const id = String(form.get("id") || crypto.randomUUID());
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(id)) return NextResponse.json({ error: "Invalid song identifier." }, { status: 400 });
  // Service-role writes bypass row-level security. Never let a caller-supplied UUID
  // collide with a song owned by another account and turn an upsert into a cross-user overwrite.
  const { data: existingId, error: existingIdError } = await admin.from("songs").select("user_id").eq("id", id).maybeSingle();
  if (existingIdError) return NextResponse.json({ error: "The cloud library could not verify this song identifier." }, { status: 503 });
  if (existingId && existingId.user_id !== user.id) return NextResponse.json({ error: "That song identifier is already in use." }, { status: 409 });
  if (file.size === 0 || file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Song audio must be between 1 byte and 50 MB." }, { status: 413 });
  const parentIdRaw = String(form.get("parentId") || "");
  let parentId = parentIdRaw && uuid.test(parentIdRaw) ? parentIdRaw : null;
  if (parentId) {
    const { data: parent, error: parentError } = await admin.from("songs").select("id").eq("id", parentId).eq("user_id", user.id).maybeSingle();
    if (parentError) return NextResponse.json({ error: "The cloud library could not verify the parent song." }, { status: 503 });
    if (!parent) parentId = null;
  }
  const mode = String(form.get("mode") || "vocals");
  if (!(["vocals", "instrumental"] as string[]).includes(mode)) return NextResponse.json({ error: "Invalid song mode." }, { status: 400 });
  const duration = Math.min(300, Math.max(1, Number(form.get("duration")) || 30));
  const audioType = file.type.toLowerCase();
  const supportedAudioTypes = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/x-m4a", "audio/m4a"]);
  if (!supportedAudioTypes.has(audioType)) return NextResponse.json({ error: "Unsupported audio format. Save MP3, WAV or M4A audio only." }, { status: 415 });
  const audioExtension = audioType === "audio/wav" || audioType === "audio/x-wav"
    ? "wav"
    : audioType === "audio/mp4" || audioType === "audio/x-m4a"
      ? "m4a"
      : "mp3";
  const contentType = audioExtension === "wav" ? "audio/wav" : audioExtension === "m4a" ? "audio/mp4" : "audio/mpeg";
  const storageKey = `${user.id}/${id}.${audioExtension}`;
  const { error: uploadError } = await admin.storage
    .from("songs")
    .upload(storageKey, file, { contentType, upsert: true });
  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  const lyrics = String(form.get("lyrics") || "").trim();
  const lyricsKey = `${user.id}/${id}-lyrics.txt`;
  if (lyrics) {
    const { error: lyricsError } = await admin.storage
      .from("songs")
      .upload(
        lyricsKey,
        new Blob([lyrics], { type: "text/plain;charset=utf-8" }),
        { contentType: "text/plain;charset=utf-8", upsert: true },
      );
    if (lyricsError) {
      await admin.storage.from("songs").remove([storageKey]);
      return NextResponse.json({ error: lyricsError.message }, { status: 500 });
    }
  } else {
    await admin.storage.from("songs").remove([lyricsKey]);
  }
  const record = {
    id,
    user_id: user.id,
    title: String(form.get("title") || "Untitled song").slice(0, 120),
    prompt: String(form.get("prompt") || "").slice(0, 4000),
    mode,
    duration,
    storage_key: storageKey,
    created_at: Number(form.get("createdAt")) || Date.now(),
    parent_id: parentId,
    version_label: String(form.get("versionLabel") || "Original").slice(0, 80),
  };
  const { error } = await admin.from("songs").upsert(record);
  if (error) {
    await admin.storage.from("songs").remove([storageKey, lyricsKey]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ song: record });
}
