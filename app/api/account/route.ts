import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";

const noStore = { "Cache-Control": "private, no-store" };
export async function GET(request: NextRequest) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401, headers: noStore });
  if (isCantoaOwner(user.email))
    return NextResponse.json({
      plan: "Owner",
      status: "active",
      minutesRemaining: null,
      isOwner: true,
      cloudConfigured: Boolean(admin),
    }, { headers: noStore });
  if (!admin)
    return NextResponse.json({
      plan: "Explore",
      status: "unconfigured",
      minutesRemaining: 2,
      freeSongsRemaining: 2,
      isOwner: false,
      cloudConfigured: false,
    }, { headers: noStore });
  let { data, error: membershipError } = await admin
    .from("memberships")
    .select("plan,status,minutes_remaining,current_period_end,free_song_claimed,free_songs_remaining,billing_currency,billing_amount_minor")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) return NextResponse.json({ error: "Your membership could not be loaded right now." }, { status: 503, headers: noStore });

  // Authentication and membership are one product account. The database trigger normally
  // creates this row, but self-heal here as well so a valid Supabase user can never end up
  // with a "signed in but no Cantoa account" state if the trigger was installed late or a
  // transient setup race occurred. ignoreDuplicates protects existing paid memberships.
  if (!data) {
    const { error: repairError } = await admin.from("memberships").upsert(
      {
        user_id: user.id,
        email: user.email || null,
        plan: "Explore",
        status: "active",
        minutes_remaining: 2,
        free_song_claimed: false,
        free_songs_remaining: 2,
        updated_at: Date.now(),
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    );
    if (repairError) return NextResponse.json({ error: "Your Cantoa account could not be initialized right now." }, { status: 503, headers: noStore });
    const repaired = await admin
      .from("memberships")
      .select("plan,status,minutes_remaining,current_period_end,free_song_claimed,free_songs_remaining,billing_currency,billing_amount_minor")
      .eq("user_id", user.id)
      .maybeSingle();
    if (repaired.error || !repaired.data) return NextResponse.json({ error: "Your Cantoa account could not be initialized right now." }, { status: 503, headers: noStore });
    data = repaired.data;
  }

  return NextResponse.json(
    data
      ? {
          plan: data.plan,
          status: data.status,
          minutesRemaining: Number(data.minutes_remaining),
          currentPeriodEnd: data.current_period_end,
          freeSongClaimed: Boolean(data.free_song_claimed),
          freeSongsRemaining: Number(data.free_songs_remaining ?? (data.free_song_claimed ? 0 : 2)),
          billingCurrency: data.billing_currency || null,
          billingAmountMinor: data.billing_amount_minor == null ? null : Number(data.billing_amount_minor),
          isOwner: false,
          cloudConfigured: true,
        }
      : {
          plan: "Explore",
          status: "active",
          minutesRemaining: 2,
          freeSongClaimed: false,
          freeSongsRemaining: 2,
          isOwner: false,
          cloudConfigured: true,
        },
    { headers: noStore },
  );
}
