import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
function monthlyMinutes(plan: string) {
  return plan === "Studio" ? 120 : plan === "Creator" ? 40 : 2;
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY,
    webhookSecret = process.env.STRIPE_WEBHOOK_SECRET,
    signature = request.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature)
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 503 },
    );
  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }
  const admin = adminSupabase();
  if (!admin)
    return NextResponse.json(
      { error: "Membership database is not configured." },
      { status: 503 },
    );
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    if (!userId)
      return NextResponse.json({
        received: true,
        warning: "No Cantoa user reference",
      });
    let plan = session.metadata?.cantoa_plan === "Studio" ? "Studio" : "Creator";
    let billingCurrency = (session.metadata?.cantoa_currency || session.currency || "usd").toLowerCase();
    let billingAmountMinor = Number(session.metadata?.cantoa_amount_minor || 0) || null;
    if (!session.metadata?.cantoa_plan && typeof session.payment_link === "string") {
      const link = await stripe.paymentLinks.retrieve(session.payment_link);
      if (link.url === process.env.STRIPE_STUDIO_PAYMENT_LINK) plan = "Studio";
    }
    if (!billingAmountMinor) billingAmountMinor = billingCurrency === "inr" ? (plan === "Studio" ? 129900 : 49900) : (plan === "Studio" ? 1999 : 799);
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : null;
    await admin
      .from("memberships")
      .upsert({
        user_id: userId,
        email: session.customer_details?.email || session.customer_email,
        plan,
        status: "active",
        minutes_remaining: monthlyMinutes(plan),
        stripe_customer_id:
          typeof session.customer === "string" ? session.customer : null,
        stripe_subscription_id: subscriptionId,
        billing_currency: billingCurrency,
        billing_amount_minor: billingAmountMinor,
        free_songs_remaining: 0,
        free_song_claimed: true,
        updated_at: Date.now(),
      });
  }
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    await admin
      .from("memberships")
      .update({
        plan: "Explore",
        status: "active",
        minutes_remaining: 0,
        free_songs_remaining: 0,
        free_song_claimed: true,
        updated_at: Date.now(),
      })
      .eq("stripe_subscription_id", subscription.id);
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const active = subscription.status === "active" || subscription.status === "trialing";
    await admin
      .from("memberships")
      .update({
        status: active ? "active" : subscription.status,
        updated_at: Date.now(),
      })
      .eq("stripe_subscription_id", subscription.id);
  }
  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
    if (customerId)
      await admin
        .from("memberships")
        .update({ status: "past_due", updated_at: Date.now() })
        .eq("stripe_customer_id", customerId);
  }
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === "string" ? invoice.customer : null;
    if (customerId) {
      const { data } = await admin
        .from("memberships")
        .select("plan")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      if (data)
        await admin
          .from("memberships")
          .update({
            status: "active",
            minutes_remaining: monthlyMinutes(data.plan),
            updated_at: Date.now(),
          })
          .eq("stripe_customer_id", customerId);
    }
  }
  return NextResponse.json({ received: true });
}
