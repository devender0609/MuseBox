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
  const { data } = await admin
    .from("songs")
    .select("storage_key")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data)
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  const { error: storageError } = await admin.storage
    .from("songs")
    .remove([
      data.storage_key,
      data.storage_key.replace(/\.[a-z0-9]+$/i, "-lyrics.txt"),
    ]);
  if (storageError)
    return NextResponse.json({ error: "Cloud audio could not be removed. Nothing was deleted; please try again." }, { status: 500 });
  const { error } = await admin
    .from("songs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ ok: true });
}
