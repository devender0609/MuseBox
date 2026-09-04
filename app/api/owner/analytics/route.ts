import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { ownerUser } from "@/lib/owner-access";
import { availableMusicProviders } from "@/lib/music-providers";

type PaidPlan = "Creator" | "Studio";
type BillingCurrency = "usd" | "inr";

const CURRENT_USD: Record<PaidPlan, number> = { Creator: 799, Studio: 1999 };
const CURRENT_INR: Record<PaidPlan, number> = { Creator: 49900, Studio: 129900 };

function paidPlanFrom(value: unknown): PaidPlan | null {
  return value === "Creator" || value === "Studio" ? value : null;
}

function billingCurrencyFrom(value: unknown): BillingCurrency {
  return String(value || "usd").toLowerCase() === "inr" ? "inr" : "usd";
}

export async function GET(request: NextRequest) {
  const owner = await ownerUser(request);
  if (!owner) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Supabase admin access is not configured." }, { status: 503 });

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [eventsResult, membershipsResult] = await Promise.all([
    admin.from("generation_events")
      .select("id,user_email,plan,request_type,provider,preferred_provider,attempted_providers,fallback_used,requested_seconds,charged_minutes,estimated_cost_usd,cost_basis,latency_ms,status,error_code,request_summary,created_at")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(2000),
    admin.from("memberships")
      .select("plan,status,minutes_remaining,billing_currency,billing_amount_minor")
      .eq("status", "active").limit(5000),
  ]);

  if (eventsResult.error) {
    const missing = /generation_events/i.test(eventsResult.error.message || "");
    return NextResponse.json({
      error: missing ? "Owner analytics storage is not installed yet. Run the v18.5+ section of supabase-setup.sql once." : "Owner analytics could not be loaded.",
      setupRequired: missing,
    }, { status: missing ? 503 : 500 });
  }
  if (membershipsResult.error) {
    const missingPricing = /billing_currency|billing_amount_minor/i.test(membershipsResult.error.message || "");
    return NextResponse.json({
      error: missingPricing ? "Regional pricing storage is not installed yet. Run the current supabase-setup.sql once." : "Membership analytics could not be loaded.",
      setupRequired: missingPricing,
    }, { status: missingPricing ? 503 : 500 });
  }

  const events = eventsResult.data || [];
  const memberships = membershipsResult.data || [];
  const successful = events.filter((event) => event.status === "success");
  const failed = events.filter((event) => event.status !== "success");
  const estimatedProviderSpend = successful.reduce((sum, event) => sum + Number(event.estimated_cost_usd || 0), 0);
  const creatorCount = memberships.filter((item) => item.plan === "Creator").length;
  const studioCount = memberships.filter((item) => item.plan === "Studio").length;
  const exploreCount = memberships.filter((item) => item.plan === "Explore").length;

  let mrrUsdMinor = 0;
  let mrrInrMinor = 0;
  for (const item of memberships) {
    const plan = paidPlanFrom(item.plan);
    if (!plan) continue;
    const currency = billingCurrencyFrom(item.billing_currency);
    const fallback = currency === "inr" ? CURRENT_INR[plan] : CURRENT_USD[plan];
    const amount = Number(item.billing_amount_minor ?? fallback);
    if (currency === "inr") mrrInrMinor += amount;
    else mrrUsdMinor += amount;
  }

  const unknownCostGenerations = successful.filter((event) => event.estimated_cost_usd == null).length;
  const alerts: Array<{ level: "info" | "warning"; message: string }> = [];
  if (events.length === 0) alerts.push({ level: "info", message: "No generation events are logged yet. Run live smoke tests after the analytics SQL migration." });
  if (unknownCostGenerations > 0) alerts.push({ level: "info", message: `${unknownCostGenerations} successful generation${unknownCostGenerations === 1 ? " has" : "s have"} uncalibrated provider cost and are excluded from spend estimates.` });
  if (mrrInrMinor > 0) alerts.push({ level: "info", message: "India MRR is shown separately in ₹. Cantoa does not apply a guessed FX rate when comparing it with USD-denominated provider spend." });
  if (mrrInrMinor === 0 && mrrUsdMinor > 0 && estimatedProviderSpend / (mrrUsdMinor / 100) >= 0.6) alerts.push({ level: "warning", message: "Calibrated provider spend is at least 60% of estimated active-plan USD MRR. Review routing and plan usage before increasing allowances." });
  if (events.length >= 5 && failed.length / events.length >= 0.15) alerts.push({ level: "warning", message: "Generation failure/refund rate is at least 15%. Review the provider log before expanding traffic." });
  if (events.length >= 5 && events.filter((event) => event.fallback_used).length / events.length >= 0.15) alerts.push({ level: "warning", message: "Fallback usage is at least 15%. A preferred provider may be unstable or mismatched for current requests." });

  const providerNames = ["elevenlabs", "stability", "mureka"] as const;
  const providers = providerNames.map((provider) => {
    const rows = events.filter((event) => event.provider === provider || event.preferred_provider === provider);
    const providerSuccess = rows.filter((event) => event.status === "success" && event.provider === provider);
    const spend = providerSuccess.reduce((sum, event) => sum + Number(event.estimated_cost_usd || 0), 0);
    const latencyRows = providerSuccess.filter((event) => Number(event.latency_ms) > 0);
    return {
      provider,
      requests: rows.length,
      successful: providerSuccess.length,
      failures: rows.filter((event) => event.status !== "success").length,
      fallbackCount: rows.filter((event) => event.fallback_used).length,
      estimatedSpend: Number(spend.toFixed(2)),
      averageLatencyMs: latencyRows.length ? Math.round(latencyRows.reduce((sum, event) => sum + Number(event.latency_ms), 0) / latencyRows.length) : null,
    };
  });

  return NextResponse.json({
    periodDays: 30,
    generatedAt: new Date().toISOString(),
    providerAvailability: availableMusicProviders(),
    summary: {
      activeAccounts: memberships.length,
      exploreCount, creatorCount, studioCount,
      generationEvents: events.length,
      successfulGenerations: successful.length,
      failedOrRefunded: failed.length,
      fallbackGenerations: events.filter((event) => event.fallback_used).length,
      estimatedProviderSpend: Number(estimatedProviderSpend.toFixed(2)),
      estimatedActivePlanMrrUsd: Number((mrrUsdMinor / 100).toFixed(2)),
      estimatedActivePlanMrrInr: Number((mrrInrMinor / 100).toFixed(2)),
      unknownCostGenerations,
      note: "MRR is estimated from active subscription billing currency/amount. INR revenue is kept separate from USD provider spend rather than converted with a guessed FX rate.",
    },
    alerts,
    providers,
    events: events.slice(0, 250),
    costPolicy: {
      elevenlabs: "~$0.15 per generated minute from Cantoa's 2026-09-02 live test",
      stability: "~$0.26 per successful Stable Audio 3.0 generation from Cantoa's 2026-09-02 live test",
      murekaSoundtrack: "~$0.10 per video soundtrack from Cantoa's 2026-09-02 live test",
      murekaSong: "Not yet calibrated; shown as unknown rather than guessed",
    },
    guardrails: [
      "One normal provider path at a time; fallbacks only after a compatible provider failure.",
      "Mureka generation requests use n=1 unless a future user-facing multi-variant workflow explicitly opts in.",
      "Failed provider-backed audio generations restore reserved membership minutes or free-song entitlement.",
      "Explore provides two free music creations per account, each capped at 2 minutes; A/B previews and revisions remain paid features.",
      "Creator renews at 40 generation minutes; Studio renews at 120 generation minutes.",
      "Standard instrumental selection does not automatically force the more expensive Stable Audio route.",
      "Re-exporting an existing song as a Reel, square video, lyric video, gift page or download does not call a music provider.",
    ],
  }, { headers: { "Cache-Control": "private, no-store" } });
}
