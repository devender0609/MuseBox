import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Cloud sharing is not configured." }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { data: song } = await admin
    .from("songs")
    .select("id,share_token")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!song) return NextResponse.json({ error: "Song not found in your cloud library." }, { status: 404 });
  const token = song.share_token || crypto.randomUUID().replaceAll("-", "");
  const { error } = await admin
    .from("songs")
    .update({
      public_share: true,
      share_token: token,
      gift_to: String(body.giftTo || "").slice(0, 120) || null,
      gift_from: String(body.giftFrom || "").slice(0, 120) || null,
      dedication: String(body.dedication || "").slice(0, 600) || null,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: `${request.nextUrl.origin}/share/${token}` });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Cloud sharing is not configured." }, { status: 503 });
  const { id } = await params;
  const { error } = await admin.from("songs").update({ public_share: false }).eq("id", id).eq("user_id", user.id);
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ ok: true });
}
