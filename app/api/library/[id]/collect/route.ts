import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";


async function groupSongAllowed(admin: NonNullable<ReturnType<typeof adminSupabase>>, user: { id: string; email?: string | null }) {
  if (isCantoaOwner(user.email)) return true;
  const { data } = await admin.from("memberships").select("plan,status").eq("user_id", user.id).maybeSingle();
  return data?.status === "active" && (data.plan === "Creator" || data.plan === "Studio");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Cloud collaboration is not configured." }, { status: 503 });
  if (!(await groupSongAllowed(admin, user))) return NextResponse.json({ error: "Group Song requires Creator or Studio." }, { status: 402 });
  const { id } = await params;
  const { data: song } = await admin.from("songs").select("id,title").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!song) return NextResponse.json({ error: "Song not found in your cloud library." }, { status: 404 });
  const { data: existing, error: existingError } = await admin.from("moment_collections").select("token").eq("song_id", id).eq("owner_id", user.id).maybeSingle();
  if (existingError && /moment_collections/i.test(existingError.message)) return NextResponse.json({ error: "Run the latest Supabase setup before using Group Song." }, { status: 503 });
  if (existing?.token) return NextResponse.json({ url: `${request.nextUrl.origin}/contribute/${existing.token}`, reused: true });
  const token = crypto.randomUUID().replaceAll("-", "");
  const { error: insertError } = await admin.from("moment_collections").insert({ song_id: id, owner_id: user.id, token });
  if (insertError) {
    if (insertError.code === "23505" || /duplicate key|unique constraint/i.test(insertError.message || "")) {
      const { data: racedExisting } = await admin.from("moment_collections").select("token").eq("song_id", id).eq("owner_id", user.id).maybeSingle();
      if (racedExisting?.token) return NextResponse.json({ url: `${request.nextUrl.origin}/contribute/${racedExisting.token}`, reused: true });
    }
    return NextResponse.json({ error: "We could not open your Group Song right now. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ url: `${request.nextUrl.origin}/contribute/${token}`, reused: false });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!admin) return NextResponse.json({ error: "Cloud collaboration is not configured." }, { status: 503 });
  if (!(await groupSongAllowed(admin, user))) return NextResponse.json({ error: "Group Song requires Creator or Studio." }, { status: 402 });
  const { id } = await params;
  const { data: collection, error } = await admin.from("moment_collections").select("id,token").eq("song_id", id).eq("owner_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Run the latest Supabase setup before using Group Song." }, { status: 503 });
  if (!collection) return NextResponse.json({ contributions: [], url: "" });
  let { data, error: itemsError } = await admin.from("moment_contributions").select("id,contributor,kind,memory,feeling,photo_path,created_at").eq("collection_id", collection.id).order("created_at", { ascending: true }).limit(100);
  // Older Group Song installs may not yet have the 2.0 columns. Reading activity should still
  // show an empty/legacy collection instead of alarming the owner just for opening the page.
  if (itemsError) {
    const legacy = await admin.from("moment_contributions").select("id,contributor,memory,created_at").eq("collection_id", collection.id).order("created_at", { ascending: true }).limit(100);
    if (legacy.error) return NextResponse.json({ error: "Group Song activity could not be refreshed. If this continues, run the Group Song 2.0 Supabase migration." }, { status: 503 });
    data = (legacy.data || []).map((item) => ({ ...item, kind: "memory", feeling: null, photo_path: null }));
    itemsError = null;
  }
  const ids = (data || []).map((item) => item.id);
  const voteCounts = new Map<number, number>();
  if (ids.length) {
    const { data: votes } = await admin.from("moment_contribution_votes").select("contribution_id").in("contribution_id", ids);
    for (const vote of votes || []) voteCounts.set(vote.contribution_id, (voteCounts.get(vote.contribution_id) || 0) + 1);
  }
  const contributions = (data || []).map((item) => ({ ...item, votes: voteCounts.get(item.id) || 0, hasPhoto: Boolean(item.photo_path) }));
  return NextResponse.json({ contributions, url: `${request.nextUrl.origin}/contribute/${collection.token}` });
}
