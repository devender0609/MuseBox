import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";

const ALLOWED = new Set(["love", "wow", "moved", "celebrate"]);

function fingerprint(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  return createHash("sha256").update(`${forwarded}|${ua}|cantoa-gift-v1`).digest("hex").slice(0, 40);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Gift reactions are unavailable." }, { status: 503 });
  const { token } = await params;
  const { data: song } = await admin.from("songs").select("id").eq("share_token", token).eq("public_share", true).maybeSingle();
  if (!song) return NextResponse.json({ error: "Gift page not found." }, { status: 404 });
  const { data, error } = await admin.from("gift_reactions").select("reaction").eq("song_id", song.id);
  if (error) return NextResponse.json({ error: "Reactions are temporarily unavailable." }, { status: 500 });
  const counts = { love: 0, wow: 0, moved: 0, celebrate: 0 };
  for (const row of data || []) if (row.reaction in counts) counts[row.reaction as keyof typeof counts] += 1;
  return NextResponse.json({ counts });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Gift reactions are unavailable." }, { status: 503 });
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const reaction = String(body.reaction || "");
  if (!ALLOWED.has(reaction)) return NextResponse.json({ error: "Choose a valid reaction." }, { status: 400 });
  const { data: song } = await admin.from("songs").select("id").eq("share_token", token).eq("public_share", true).maybeSingle();
  if (!song) return NextResponse.json({ error: "Gift page not found." }, { status: 404 });
  const { error } = await admin.from("gift_reactions").upsert({ song_id: song.id, fingerprint: fingerprint(request), reaction }, { onConflict: "song_id,fingerprint" });
  if (error) return NextResponse.json({ error: "Reaction could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
