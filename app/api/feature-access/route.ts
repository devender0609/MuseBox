import { NextResponse } from "next/server";
import { authenticatedUser, adminSupabase } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";
import { type CantoaFeature, minimumPlanForFeature, planAllowsFeature } from "@/lib/features";

const VALID = new Set<CantoaFeature>([
  "gift_page","advanced_language","my_sound","social_video","lyric_video","creator_pack",
  "advanced_revision","wav_export","stems","memory_movie","jingle_pack",
]);

export async function POST(request: Request) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ allowed: false, error: "Sign in to use this feature." }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const feature = String(body.feature || "") as CantoaFeature;
  if (!VALID.has(feature)) return NextResponse.json({ allowed: false, error: "Unknown feature." }, { status: 400 });
  if (isCantoaOwner(user.email)) return NextResponse.json({ allowed: true, plan: "Owner" });
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ allowed: false, error: "Membership is not configured." }, { status: 503 });
  const { data } = await admin.from("memberships").select("plan,status").eq("user_id", user.id).maybeSingle();
  const plan = data?.status === "active" ? String(data.plan || "Explore") : "Explore";
  const allowed = planAllowsFeature(plan, feature);
  return NextResponse.json({ allowed, plan, minimumPlan: minimumPlanForFeature(feature) }, { status: allowed ? 200 : 402 });
}
