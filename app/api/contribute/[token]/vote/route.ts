import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { checkRateLimit, requestFingerprint } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Contributions are not configured." }, { status: 503 });
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const contributionId = Number(body.contributionId);
  if (!Number.isFinite(contributionId)) return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  const limiter = checkRateLimit(`group-vote:${token}:${requestFingerprint(request)}`, 30, 10 * 60 * 1000);
  if (!limiter.ok) return NextResponse.json({ error: "Too many vote changes were sent from this device. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": String(limiter.retryAfterSeconds) } });
  const cookieName = "cantoa_group_voter";
  const existingCookie = request.cookies.get(cookieName)?.value || "";
  const voterToken = /^[0-9a-f-]{36}$/i.test(existingCookie) ? existingCookie : crypto.randomUUID();

  const { data: collection } = await admin.from("moment_collections").select("id,open").eq("token", token).maybeSingle();
  if (!collection?.open) return NextResponse.json({ error: "This contribution link is unavailable." }, { status: 404 });
  const { data: contribution } = await admin.from("moment_contributions").select("id").eq("id", contributionId).eq("collection_id", collection.id).maybeSingle();
  if (!contribution) return NextResponse.json({ error: "Contribution not found." }, { status: 404 });

  const { data: existing } = await admin.from("moment_contribution_votes").select("id").eq("contribution_id", contributionId).eq("voter_token", voterToken).maybeSingle();
  if (existing?.id) {
    await admin.from("moment_contribution_votes").delete().eq("id", existing.id);
    const response = NextResponse.json({ ok: true, removed: true });
    response.cookies.set(cookieName, voterToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
    return response;
  }
  const { error } = await admin.from("moment_contribution_votes").insert({ contribution_id: contributionId, voter_token: voterToken });
  if (error) return NextResponse.json({ error: "Could not save your vote." }, { status: 500 });
  const response = NextResponse.json({ ok: true, removed: false });
  response.cookies.set(cookieName, voterToken, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return response;
}
