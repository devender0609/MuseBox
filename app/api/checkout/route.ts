import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { authenticatedUser } from "@/lib/supabase";

function countryFrom(request: NextRequest) {
  return (request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "").toUpperCase();
}

const PLAN = {
  Creator: { usd: 799, inr: 49900, minutes: 40 },
  Studio: { usd: 1999, inr: 129900, minutes: 120 },
} as const;

function configuredPriceId(plan: "Creator" | "Studio", india: boolean) {
  if (india) return plan === "Creator" ? process.env.STRIPE_CREATOR_PRICE_INR : process.env.STRIPE_STUDIO_PRICE_INR;
  return plan === "Creator" ? process.env.STRIPE_CREATOR_PRICE_USD : process.env.STRIPE_STUDIO_PRICE_USD;
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticatedUser(request);
    if (!user) return NextResponse.json({ error: "Sign in before starting checkout." }, { status: 401 });

    const body = (await request.json()) as { plan?: unknown };
    const requestedPlan = body.plan;
    if (requestedPlan !== "Creator" && requestedPlan !== "Studio") {
      return NextResponse.json({ error: "Choose Creator or Studio." }, { status: 400 });
    }
    const plan: keyof typeof PLAN = requestedPlan;

    const india = countryFrom(request) === "IN";
    const currency: "inr" | "usd" = india ? "inr" : "usd";
    const amount = PLAN[plan][currency];
    const secret = process.env.STRIPE_SECRET_KEY;
    const priceId = configuredPriceId(plan, india);

    // Fail closed rather than show one price and charge another.
    if (!secret || !priceId) {
      return NextResponse.json({
        error: india
          ? "India regional checkout is not connected yet. Add the INR Stripe Price IDs in Vercel before accepting India subscriptions."
          : "The new Cantoa subscription prices are not connected yet. Add the USD Stripe Price IDs in Vercel before accepting subscriptions.",
      }, { status: 503 });
    }

    const stripe = new Stripe(secret);
    const configuredPrice = await stripe.prices.retrieve(priceId);
    if (configuredPrice.currency !== currency || configuredPrice.unit_amount !== amount || configuredPrice.recurring?.interval !== "month") {
      return NextResponse.json({ error: "Stripe regional pricing does not match Cantoa's configured plan amount. Correct the Price ID before accepting subscriptions." }, { status: 503 });
    }
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      line_items: [{ quantity: 1, price: priceId }],
      metadata: {
        cantoa_plan: plan,
        cantoa_currency: currency,
        cantoa_amount_minor: String(amount),
        cantoa_minutes: String(PLAN[plan].minutes),
      },
      subscription_data: {
        metadata: {
          cantoa_plan: plan,
          cantoa_currency: currency,
          cantoa_amount_minor: String(amount),
          cantoa_minutes: String(PLAN[plan].minutes),
        },
      },
      success_url: `${origin}/checkout-success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      allow_promotion_codes: true,
    });
    if (!session.url) throw new Error("CHECKOUT_URL_MISSING");
    return NextResponse.json({ url: session.url, provider: "stripe", currency: currency.toUpperCase(), amountMinor: amount });
  } catch {
    return NextResponse.json({ error: "The configured checkout could not be opened." }, { status: 500 });
  }
}
