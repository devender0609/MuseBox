import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { checkPublicRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Contributions are not configured." }, { status: 503 });
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const contributionId = Number(body.contributionId);
  if (!Number.isFinite(contributionId)) return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  const limiter = await checkPublicRateLimit(request, `group-vote:${token}`, 30, 10 * 60);
  if (!limiter.ok) return NextResponse.json({ error: "Too many vote changes were sent from this device. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } });
  const cookieName = `cantoa_group_voter_${createHash("sha256").update(token).digest("hex").slice(0, 12)}`;
  const scopedCookie = request.cookies.get(cookieName)?.value || "";
  const legacyCookie = request.cookies.get("cantoa_group_voter")?.value || "";
  const existingCookie = scopedCookie || legacyCookie;
  const voterToken = /^[0-9a-f-]{36}$/i.test(existingCookie) ? existingCookie : crypto.randomUUID();
  const cookiePath = `/api/contribute/${token}`;

  const { data: collection, error: collectionError } = await admin.from("moment_collections").select("id,open").eq("token", token).maybeSingle();
  if (collectionError) return NextResponse.json({ error: "Voting is temporarily unavailable." }, { status: 500 });
  if (!collection?.open) return NextResponse.json({ error: "This contribution link is unavailable." }, { status: 404 });
  const { data: contribution, error: contributionError } = await admin.from("moment_contributions").select("id").eq("id", contributionId).eq("collection_id", collection.id).maybeSingle();
  if (contributionError) return NextResponse.json({ error: "Voting is temporarily unavailable." }, { status: 500 });
  if (!contribution) return NextResponse.json({ error: "Contribution not found." }, { status: 404 });

  const { data: existing, error: existingError } = await admin.from("moment_contribution_votes").select("id").eq("contribution_id", contributionId).eq("voter_token", voterToken).maybeSingle();
  if (existingError) return NextResponse.json({ error: "Voting is temporarily unavailable." }, { status: 500 });
  if (existing?.id) {
    const { error: deleteError } = await admin.from("moment_contribution_votes").delete().eq("id", existing.id);
    if (deleteError) return NextResponse.json({ error: "Could not update your vote right now." }, { status: 500 });
    const response = NextResponse.json({ ok: true, removed: true });
    response.cookies.set(cookieName, voterToken, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: cookiePath, maxAge: 60 * 60 * 24 * 365 });
    if (legacyCookie) response.cookies.set("cantoa_group_voter", "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
    return response;
  }
  const { error } = await admin.from("moment_contribution_votes").insert({ contribution_id: contributionId, voter_token: voterToken });
  // Two near-simultaneous clicks can race between the read and insert. The unique
  // constraint means the intended single vote already exists, so do not surface a false 500.
  if (error && !(error.code === "23505" || /duplicate|unique/i.test(error.message || ""))) return NextResponse.json({ error: "Could not save your vote." }, { status: 500 });
  const response = NextResponse.json({ ok: true, removed: false });
  response.cookies.set(cookieName, voterToken, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: cookiePath, maxAge: 60 * 60 * 24 * 365 });
  if (legacyCookie) response.cookies.set("cantoa_group_voter", "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
