import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Membership Activated",
  description: "Your Cantoa membership payment was completed successfully.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px", background: "linear-gradient(135deg, #fff8f3 0%, #f7efff 55%, #fff6e8 100%)", color: "#2b1733" }}>
      <section style={{ width: "min(560px, 100%)", background: "rgba(255,255,255,.9)", border: "1px solid rgba(86,45,91,.14)", borderRadius: "28px", padding: "36px", boxShadow: "0 24px 70px rgba(65,35,72,.12)", textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: "#d06e58", marginBottom: "14px" }}>Cantoa Music</div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(34px, 6vw, 52px)", lineHeight: 1.05, margin: "0 0 16px" }}>Your membership is ready.</h1>
        <p style={{ fontSize: "17px", lineHeight: 1.65, color: "#675a69", margin: "0 auto 24px", maxWidth: "440px" }}>Your payment was completed successfully. Return to Cantoa to start creating with your paid plan.</p>
        <Link href="/?checkout=success" style={{ display: "inline-block", textDecoration: "none", background: "#2b1733", color: "white", padding: "14px 24px", borderRadius: "14px", fontWeight: 800 }}>Continue to Cantoa</Link>
      </section>
    </main>
  );
}
