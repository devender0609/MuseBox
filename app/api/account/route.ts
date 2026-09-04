import { NextRequest, NextResponse } from "next/server";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";
export async function GET(request: NextRequest) {
  const user = await authenticatedUser(request);
  const admin = adminSupabase();
  if (!user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (isCantoaOwner(user.email))
    return NextResponse.json({
      plan: "Owner",
      status: "active",
      minutesRemaining: null,
      isOwner: true,
      cloudConfigured: Boolean(admin),
    });
  if (!admin)
    return NextResponse.json({
      plan: "Explore",
      status: "unconfigured",
      minutesRemaining: 2,
      freeSongsRemaining: 2,
      isOwner: false,
      cloudConfigured: false,
    });
  const { data } = await admin
    .from("memberships")
    .select("plan,status,minutes_remaining,current_period_end,free_song_claimed,free_songs_remaining,billing_currency,billing_amount_minor")
    .eq("user_id", user.id)
    .maybeSingle();
  return NextResponse.json(
    data
      ? {
          plan: data.plan,
          status: data.status,
          minutesRemaining: Number(data.minutes_remaining),
          currentPeriodEnd: data.current_period_end,
          freeSongClaimed: Boolean(data.free_song_claimed),
          freeSongsRemaining: Number(data.free_songs_remaining ?? (data.free_song_claimed ? 0 : 1)),
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
  );
}
