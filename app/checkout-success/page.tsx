import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment Confirmed",
  description: "Your Cantoa membership payment was completed successfully.",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!sessionId || !secret || !/^cs_/.test(sessionId)) redirect("/?checkout=unverified");

  try {
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const plan = session.metadata?.cantoa_plan;
    const valid = session.mode === "subscription"
      && session.status === "complete"
      && (session.payment_status === "paid" || session.payment_status === "no_payment_required")
      && (plan === "Creator" || plan === "Studio")
      && Boolean(session.client_reference_id);
    if (!valid) redirect("/?checkout=unverified");
  } catch {
    redirect("/?checkout=unverified");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px", background: "linear-gradient(135deg, #fff8f3 0%, #f7efff 55%, #fff6e8 100%)", color: "#2b1733" }}>
      <section style={{ width: "min(560px, 100%)", background: "rgba(255,255,255,.9)", border: "1px solid rgba(86,45,91,.14)", borderRadius: "28px", padding: "36px", boxShadow: "0 24px 70px rgba(65,35,72,.12)", textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#d06e58", marginBottom: "14px" }}>Cantoa Music</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(34px, 6vw, 52px)", lineHeight: 1.05, margin: "0 0 16px" }}>Payment confirmed.</h1>
        <p style={{ fontSize: "17px", lineHeight: 1.65, color: "#675a69", margin: "0 auto 24px", maxWidth: "440px" }}>Your payment was verified successfully. Cantoa will refresh your membership when you return; activation can take a few seconds while Stripe's webhook finishes.</p>
        <Link href="/?checkout=success" style={{ display: "inline-block", textDecoration: "none", background: "#2b1733", color: "white", padding: "14px 24px", borderRadius: "14px", fontWeight: 800 }}>Continue to Cantoa</Link>
      </section>
    </main>
  );
}
