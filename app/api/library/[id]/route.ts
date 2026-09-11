import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin)
    return NextResponse.json(
      { error: "Cloud library is not configured." },
      { status: 503 },
    );
  const { id } = await params;
  const { data, error: songReadError } = await admin
    .from("songs")
    .select("id,storage_key")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (songReadError) return NextResponse.json({ error: "The cloud library could not verify this song right now." }, { status: 503 });
  if (!data)
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  // Gather any Group Song photos tied to this song so deleting the song does not
  // leave private orphan files consuming storage after the database cascade runs.
  const { data: collections, error: collectionsError } = await admin.from("moment_collections").select("id").eq("song_id", id).eq("owner_id", user.id);
  if (collectionsError) return NextResponse.json({ error: "Cantoa could not verify related Group Song files, so nothing was deleted. Please try again." }, { status: 503 });
  const collectionIds = (collections || []).map((item) => item.id);
  let groupPhotoPaths: string[] = [];
  if (collectionIds.length) {
    const { data: contributions, error: contributionsError } = await admin.from("moment_contributions").select("photo_path").in("collection_id", collectionIds);
    if (contributionsError) return NextResponse.json({ error: "Cantoa could not verify related Group Song photos, so nothing was deleted. Please try again." }, { status: 503 });
    groupPhotoPaths = (contributions || []).map((item) => String(item.photo_path || "")).filter(Boolean);
  }
  const storageKeys = [
    data.storage_key,
    data.storage_key.replace(/\.[a-z0-9]+$/i, "-lyrics.txt"),
    ...groupPhotoPaths,
  ];
  const { error: storageError } = await admin.storage.from("songs").remove(storageKeys);
  if (storageError)
    return NextResponse.json({ error: "Cloud files could not be removed, so the library record was kept. Please try again." }, { status: 500 });
  const { error } = await admin.from("songs").delete().eq("id", id).eq("user_id", user.id);
  return error
    ? NextResponse.json({ error: "The audio files were removed, but the library record could not be cleaned up. Refresh the library; if the record remains, contact support rather than retrying the same download." }, { status: 500 })
    : NextResponse.json({ ok: true });
}
