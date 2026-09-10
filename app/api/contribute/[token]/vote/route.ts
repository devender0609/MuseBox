import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Contributions are not configured." }, { status: 503 });
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const contributionId = Number(body.contributionId);
  const voterToken = String(body.voterToken || "").trim().slice(0, 100);
  if (!Number.isFinite(contributionId) || !voterToken) return NextResponse.json({ error: "Invalid vote." }, { status: 400 });

  const { data: collection } = await admin.from("moment_collections").select("id,open").eq("token", token).maybeSingle();
  if (!collection?.open) return NextResponse.json({ error: "This contribution link is unavailable." }, { status: 404 });
  const { data: contribution } = await admin.from("moment_contributions").select("id").eq("id", contributionId).eq("collection_id", collection.id).maybeSingle();
  if (!contribution) return NextResponse.json({ error: "Contribution not found." }, { status: 404 });

  const { data: existing } = await admin.from("moment_contribution_votes").select("id").eq("contribution_id", contributionId).eq("voter_token", voterToken).maybeSingle();
  if (existing?.id) {
    await admin.from("moment_contribution_votes").delete().eq("id", existing.id);
    return NextResponse.json({ ok: true, removed: true });
  }
  const { error } = await admin.from("moment_contribution_votes").insert({ contribution_id: contributionId, voter_token: voterToken });
  if (error) return NextResponse.json({ error: "Could not save your vote." }, { status: 500 });
  return NextResponse.json({ ok: true, removed: false });
}
