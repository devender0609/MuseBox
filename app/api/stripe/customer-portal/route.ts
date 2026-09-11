import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminSupabase, authenticatedUser } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await authenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Sign in before managing membership." }, { status: 401 });

  const secret = process.env.STRIPE_SECRET_KEY;
  const admin = adminSupabase();
  if (!secret || !admin) return NextResponse.json({ error: "Membership management is not configured." }, { status: 503 });

  const { data: membership } = await admin
    .from("memberships")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.stripe_customer_id) return NextResponse.json({ error: "No paid Stripe membership was found for this account." }, { status: 404 });

  try {
    const stripe = new Stripe(secret);
    const origin = new URL(request.url).origin;
    const session = await stripe.billingPortal.sessions.create({
      customer: membership.stripe_customer_id,
      return_url: `${origin}/`,
    });
    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Stripe membership management could not be opened." }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/?portal=use-account", request.url));
}
