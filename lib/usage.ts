import { adminSupabase, authenticatedUser } from "@/lib/supabase";
import { isCantoaOwner } from "@/lib/owner";

type Access = { userId: string | null; remaining: number | null; plan?: string };

async function generationAccount(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("USAGE_NOT_CONFIGURED");
  const user = await authenticatedUser(request);
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  if (isCantoaOwner(user.email)) return { user, owner: true, admin: null, membership: null };
  const admin = adminSupabase();
  if (!admin) throw new Error("USAGE_NOT_CONFIGURED");
  const { data, error } = await admin
    .from("memberships")
    .select("plan,status,minutes_remaining,free_song_claimed,free_songs_remaining")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data || data.status !== "active") throw new Error("USAGE_NOT_CONFIGURED");
  return { user, owner: false, admin, membership: data };
}

export async function ensureGenerationAccess(request: Request, minutes = 0) {
  const access = await generationAccount(request);
  if (access.owner) return { userId: null, remaining: null, plan: "Owner" } satisfies Access;
  const membership = access.membership!;
  if (membership.plan === "Explore") {
    if (Number(membership.free_songs_remaining ?? (membership.free_song_claimed ? 0 : 1)) <= 0) throw new Error("FREE_SONGS_USED");
    if (minutes > 2) throw new Error("FREE_SONG_TOO_LONG");
    return { userId: access.user.id, remaining: Number(membership.free_songs_remaining ?? 1), plan: "Explore" } satisfies Access;
  }
  if (Number(membership.minutes_remaining) < minutes) throw new Error("INSUFFICIENT_MINUTES");
  return { userId: access.user.id, remaining: Number(membership.minutes_remaining), plan: membership.plan } satisfies Access;
}

export async function reserveMinutes(request: Request, minutes: number) {
  const access = await generationAccount(request);
  if (access.owner) return { userId: null, remaining: null, plan: "Owner" } satisfies Access;
  const admin = access.admin!;
  const { data, error } = await admin.rpc("reserve_generation_minutes", {
    p_user_id: access.user.id,
    p_minutes: minutes,
  });
  if (error) {
    const message = error.message || "";
    if (/FREE_SONGS_USED|FREE_SONG_USED/i.test(message)) throw new Error("FREE_SONGS_USED");
    if (/FREE_SONG_TOO_LONG/i.test(message)) throw new Error("FREE_SONG_TOO_LONG");
    if (/INSUFFICIENT_MINUTES/i.test(message)) throw new Error("INSUFFICIENT_MINUTES");
    throw new Error("USAGE_NOT_CONFIGURED");
  }
  return { userId: access.user.id, remaining: Number(data), plan: access.membership?.plan } satisfies Access;
}

export async function refundMinutes(userId: string | null, minutes: number) {
  if (!userId) return;
  const admin = adminSupabase();
  if (admin)
    await admin.rpc("refund_generation_minutes", {
      p_user_id: userId,
      p_minutes: minutes,
    });
}

export async function ensurePremiumAccess(request: Request) {
  const access = await generationAccount(request);
  if (access.owner) return { userId: null, remaining: null, plan: "Owner" } satisfies Access;
  const plan = String(access.membership?.plan || "Explore");
  if (plan === "Explore") throw new Error("PREMIUM_REQUIRED");
  return { userId: access.user.id, remaining: Number(access.membership?.minutes_remaining ?? 0), plan } satisfies Access;
}

export async function enforceRateLimit(
  request: Request,
  action: string,
  limit: number,
  windowSeconds = 3600,
) {
  const user = await authenticatedUser(request);
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const admin = adminSupabase();
  if (!admin) throw new Error("USAGE_NOT_CONFIGURED");
  const { data, error } = await admin.rpc("check_cantoa_rate_limit", {
    p_user_id: user.id,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error("USAGE_NOT_CONFIGURED");
  if (!data) throw new Error("RATE_LIMITED");
}

export function usageError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "SIGN_IN_REQUIRED")
    return { error: "Create or sign in to your Cantoa account before generating music.", status: 401 };
  if (code === "FREE_SONGS_USED")
    return { error: "Your 2 free music creations have been used. Choose a membership to create more music.", status: 402 };
  if (code === "FREE_SONG_TOO_LONG")
    return { error: "Each free music creation can be up to 2 minutes. Shorten it or choose a membership for longer creations.", status: 402 };
  if (code === "INSUFFICIENT_MINUTES")
    return { error: "You do not have enough generation minutes for this request. Shorten the song or choose a membership.", status: 402 };
  if (code === "PREMIUM_REQUIRED")
    return { error: "This is a Creator or Studio feature. Choose a membership to use it.", status: 402 };
  if (code === "RATE_LIMITED")
    return { error: "Too many requests were made in a short period. Please wait and try again.", status: 429 };
  return { error: "Membership usage is not configured. Run the supplied Supabase setup before accepting customers.", status: 503 };
}
