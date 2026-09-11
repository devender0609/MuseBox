import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

function monthlyMinutes(plan: string) {
  return plan === "Studio" ? 120 : plan === "Creator" ? 40 : 2;
}

function periodEndMs(subscription: Stripe.Subscription | null | undefined) {
  const seconds = Number((subscription as Stripe.Subscription & { current_period_end?: number } | null | undefined)?.current_period_end || 0);
  return seconds > 0 ? seconds * 1000 : null;
}

function planFromSubscription(subscription: Stripe.Subscription, fallback: string) {
  const priceId = subscription.items.data[0]?.price?.id || "";
  if (priceId && [process.env.STRIPE_STUDIO_PRICE_USD, process.env.STRIPE_STUDIO_PRICE_INR].includes(priceId)) return "Studio";
  if (priceId && [process.env.STRIPE_CREATOR_PRICE_USD, process.env.STRIPE_CREATOR_PRICE_INR].includes(priceId)) return "Creator";
  const tagged = subscription.metadata?.cantoa_plan;
  return tagged === "Studio" || tagged === "Creator" ? tagged : fallback;
}

function billingFromSubscription(subscription: Stripe.Subscription) {
  const price = subscription.items.data[0]?.price;
  return {
    billing_currency: price?.currency?.toLowerCase() || "usd",
    billing_amount_minor: price?.unit_amount ?? null,
  };
}

async function billingCountryFromSubscription(stripe: Stripe, subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id;
  if (!customerId) return null;
  const customer = await stripe.customers.retrieve(customerId).catch(() => null);
  if (!customer || customer.deleted) return null;
  return customer.address?.country || customer.shipping?.address?.country || null;
}

function missingColumn(error: { message?: string } | null | undefined, column: string) {
  return Boolean(error && new RegExp(`${column}|schema cache`, "i").test(error.message || ""));
}

async function claimWebhookEvent(admin: NonNullable<ReturnType<typeof adminSupabase>>, eventId: string) {
  const { error } = await admin.from("stripe_webhook_events").insert({ event_id: eventId });
  if (!error) return "claimed" as const;
  if (error.code === "23505" || /duplicate|unique/i.test(error.message || "")) return "duplicate" as const;
  // Backward compatible until the v18.8.49 migration is run.
  if (/stripe_webhook_events|schema cache|relation .* does not exist/i.test(error.message || "")) return "unavailable" as const;
  throw new Error(`WEBHOOK_EVENT_CLAIM_FAILED:${error.message}`);
}

async function releaseWebhookEvent(admin: NonNullable<ReturnType<typeof adminSupabase>>, eventId: string, claimed: boolean) {
  if (!claimed) return;
  await admin.from("stripe_webhook_events").delete().eq("event_id", eventId);
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !webhookSecret || !signature) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Membership database is not configured." }, { status: 503 });

  let claimed = false;
  try {
    const claim = await claimWebhookEvent(admin, event.id);
    if (claim === "duplicate") return NextResponse.json({ received: true, duplicate: true });
    claimed = claim === "claimed";

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) return NextResponse.json({ received: true, warning: "No Cantoa user reference" });

      let plan = session.metadata?.cantoa_plan === "Studio" ? "Studio" : "Creator";
      const billingCurrency = (session.metadata?.cantoa_currency || session.currency || "usd").toLowerCase();
      let billingAmountMinor = Number(session.metadata?.cantoa_amount_minor || 0) || null;
      if (!session.metadata?.cantoa_plan && typeof session.payment_link === "string") {
        const link = await stripe.paymentLinks.retrieve(session.payment_link);
        if (link.url === process.env.STRIPE_STUDIO_PAYMENT_LINK) plan = "Studio";
      }
      if (!billingAmountMinor) billingAmountMinor = billingCurrency === "inr" ? (plan === "Studio" ? 129900 : 49900) : (plan === "Studio" ? 1999 : 799);

      const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
      const subscription = subscriptionId ? await stripe.subscriptions.retrieve(subscriptionId).catch(() => null) : null;
      const { data: existing, error: existingError } = await admin.from("memberships").select("stripe_subscription_id,minutes_remaining").eq("user_id", userId).maybeSingle();
      if (existingError) throw new Error(`MEMBERSHIP_READ_FAILED:${existingError.message}`);
      const sameSubscription = Boolean(subscriptionId && existing?.stripe_subscription_id === subscriptionId);

      const record: Record<string, unknown> = {
        user_id: userId,
        email: session.customer_details?.email || session.customer_email,
        plan,
        status: "active",
        // A duplicate/replayed checkout completion must never refill an account that
        // has already begun spending the allowance for this exact subscription.
        minutes_remaining: sameSubscription ? Number(existing?.minutes_remaining ?? monthlyMinutes(plan)) : monthlyMinutes(plan),
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        stripe_subscription_id: subscriptionId,
        current_period_end: periodEndMs(subscription),
        billing_currency: billingCurrency,
        billing_amount_minor: billingAmountMinor,
        billing_country: session.customer_details?.address?.country || null,
        free_songs_remaining: 0,
        free_song_claimed: true,
        updated_at: Date.now(),
      };
      let result = await admin.from("memberships").upsert(record);
      if (missingColumn(result.error, "billing_country")) {
        delete record.billing_country;
        result = await admin.from("memberships").upsert(record);
      }
      if (result.error) throw new Error(`MEMBERSHIP_UPSERT_FAILED:${result.error.message}`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const { error } = await admin.from("memberships").update({
        plan: "Explore",
        status: "active",
        minutes_remaining: 0,
        free_songs_remaining: 0,
        free_song_claimed: true,
        current_period_end: null,
        updated_at: Date.now(),
      }).eq("stripe_subscription_id", subscription.id);
      if (error) throw new Error(`SUBSCRIPTION_DELETE_UPDATE_FAILED:${error.message}`);
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const active = subscription.status === "active" || subscription.status === "trialing";
      const { data: existing, error: existingError } = await admin.from("memberships").select("plan,minutes_remaining").eq("stripe_subscription_id", subscription.id).maybeSingle();
      if (existingError) throw new Error(`SUBSCRIPTION_READ_FAILED:${existingError.message}`);
      const nextPlan = planFromSubscription(subscription, existing?.plan || "Creator");
      const billing = billingFromSubscription(subscription);
      const billingCountry = await billingCountryFromSubscription(stripe, subscription);
      const update: Record<string, unknown> = {
        plan: nextPlan,
        status: active ? "active" : subscription.status,
        current_period_end: periodEndMs(subscription),
        ...billing,
        updated_at: Date.now(),
      };
      if (billingCountry) update.billing_country = billingCountry;
      // Preserve usage already consumed this cycle while aligning the quota to a
      // Creator <-> Studio plan change immediately.
      if (active && existing && existing.plan !== nextPlan) {
        const oldAllowance = monthlyMinutes(existing.plan);
        const newAllowance = monthlyMinutes(nextPlan);
        const oldRemaining = Math.max(0, Number(existing.minutes_remaining || 0));
        const consumed = Math.max(0, oldAllowance - Math.min(oldAllowance, oldRemaining));
        update.minutes_remaining = Math.max(0, newAllowance - consumed);
      }
      let result = await admin.from("memberships").update(update).eq("stripe_subscription_id", subscription.id);
      if (missingColumn(result.error, "billing_country")) {
        delete update.billing_country;
        result = await admin.from("memberships").update(update).eq("stripe_subscription_id", subscription.id);
      }
      if (result.error) throw new Error(`SUBSCRIPTION_UPDATE_FAILED:${result.error.message}`);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      if (customerId) {
        const { error } = await admin.from("memberships").update({ status: "past_due", updated_at: Date.now() }).eq("stripe_customer_id", customerId);
        if (error) throw new Error(`PAYMENT_FAILED_STATUS_UPDATE_FAILED:${error.message}`);
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      if (customerId) {
        const { data, error: readError } = await admin.from("memberships").select("plan,stripe_subscription_id").eq("stripe_customer_id", customerId).maybeSingle();
        if (readError) throw new Error(`INVOICE_MEMBERSHIP_READ_FAILED:${readError.message}`);
        if (data) {
          const subscription = data.stripe_subscription_id
            ? await stripe.subscriptions.retrieve(data.stripe_subscription_id).catch(() => null)
            : null;
          const update: Record<string, unknown> = {
            status: "active",
            current_period_end: periodEndMs(subscription),
            updated_at: Date.now(),
          };
          // Refill only on the true recurring cycle. Idempotency above prevents a
          // duplicate invoice.paid delivery from granting the allowance twice.
          if (invoice.billing_reason === "subscription_cycle") update.minutes_remaining = monthlyMinutes(data.plan);
          const { error } = await admin.from("memberships").update(update).eq("stripe_customer_id", customerId);
          if (error) throw new Error(`INVOICE_MEMBERSHIP_UPDATE_FAILED:${error.message}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await releaseWebhookEvent(admin, event.id, claimed);
    console.error("[cantoa/stripe-webhook] processing failed", { eventId: event.id, type: event.type, error: error instanceof Error ? error.message : String(error) });
    // Return non-2xx so Stripe retries transient database/provider failures instead
    // of silently losing membership state.
    return NextResponse.json({ error: "Stripe event could not be applied yet. It is safe to retry." }, { status: 500 });
  }
}
