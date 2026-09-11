import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";
import { ownerUser } from "@/lib/owner-access";
import { availableMusicProviders } from "@/lib/music-providers";
import { MUREKA_OBSERVED_SONG_COST_BASIS, MUREKA_OBSERVED_SONG_COST_USD } from "@/lib/provider-costs";

type PaidPlan = "Creator" | "Studio";
type BillingCurrency = "usd" | "inr";
type GenerationRow = {
  id: number;
  user_email: string | null;
  plan: string | null;
  request_type: string;
  provider: string | null;
  preferred_provider: string | null;
  attempted_providers: string[] | null;
  fallback_used: boolean;
  requested_seconds: number;
  charged_minutes: number;
  estimated_cost_usd: number | null;
  cost_basis: string | null;
  latency_ms: number | null;
  status: string;
  error_code: string | null;
  request_summary: string | null;
  created_at: string;
};

const CURRENT_USD: Record<PaidPlan, number> = { Creator: 799, Studio: 1999 };
const CURRENT_INR: Record<PaidPlan, number> = { Creator: 49900, Studio: 129900 };

function paidPlanFrom(value: unknown): PaidPlan | null {
  return value === "Creator" || value === "Studio" ? value : null;
}

function billingCurrencyFrom(value: unknown): BillingCurrency {
  return String(value || "usd").toLowerCase() === "inr" ? "inr" : "usd";
}

function percentile(values: number[], pct: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((pct / 100) * sorted.length) - 1));
  return Math.round(sorted[index]);
}

function providerHealth(primaryCompletionRate: number | null, fallbackOutRate: number | null, p95LatencyMs: number | null, unknownCosts: number) {
  if ((fallbackOutRate ?? 0) >= 0.2 || (primaryCompletionRate != null && primaryCompletionRate < 0.8) || (p95LatencyMs ?? 0) >= 60000 || unknownCosts > 0) return "attention" as const;
  return "healthy" as const;
}

export async function GET(request: NextRequest) {
  const owner = await ownerUser(request);
  if (!owner) return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  const admin = adminSupabase();
  if (!admin) return NextResponse.json({ error: "Supabase admin access is not configured." }, { status: 503 });

  const daysParam = Number(request.nextUrl.searchParams.get("days") || 30);
  const periodDays = [1, 7, 30].includes(daysParam) ? daysParam : 30;
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const [eventsResult, membershipsResult] = await Promise.all([
    admin.from("generation_events")
      .select("id,user_email,plan,request_type,provider,preferred_provider,attempted_providers,fallback_used,requested_seconds,charged_minutes,estimated_cost_usd,cost_basis,latency_ms,status,error_code,request_summary,created_at")
      .gte("created_at", since).order("created_at", { ascending: false }).limit(2000),
    admin.from("memberships")
      .select("email,plan,status,minutes_remaining,billing_currency,billing_amount_minor")
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

  // v18.8.35: apply the observed Mureka billing calibration to historical successful
  // Mureka song events that were deliberately stored as unpriced before calibration.
  // This is an in-memory analytics backfill only; it does not mutate the audit log.
  const events = ((eventsResult.data || []) as GenerationRow[]).map((event) => {
    if (event.status === "success" && event.provider === "mureka" && event.estimated_cost_usd == null && event.request_type !== "video_soundtrack") {
      return {
        ...event,
        estimated_cost_usd: Number(MUREKA_OBSERVED_SONG_COST_USD.toFixed(4)),
        cost_basis: MUREKA_OBSERVED_SONG_COST_BASIS,
      };
    }
    return event;
  });
  const memberships = membershipsResult.data || [];
  const successful = events.filter((event) => event.status === "success");
  const failed = events.filter((event) => event.status !== "success");
  const fallbackEvents = successful.filter((event) => event.fallback_used);
  const primaryCompletions = successful.filter((event) => !event.fallback_used && event.provider === event.preferred_provider);
  const knownCostEvents = successful.filter((event) => event.estimated_cost_usd != null);
  const estimatedProviderSpend = knownCostEvents.reduce((sum, event) => sum + Number(event.estimated_cost_usd || 0), 0);
  const ownerEmail = String(owner.email || "").toLowerCase();
  const trafficBucket = (event: GenerationRow) => {
    if (ownerEmail && String(event.user_email || "").toLowerCase() === ownerEmail) return "Owner/Test";
    if (event.plan === "Creator") return "Creator";
    if (event.plan === "Studio") return "Studio";
    if (event.plan === "Explore") return "Explore";
    return "Other/Unknown";
  };
  const trafficLabels = ["Explore", "Creator", "Studio", "Owner/Test", "Other/Unknown"] as const;
  const trafficCosts = trafficLabels.map((label) => {
    const rows = successful.filter((event) => trafficBucket(event) === label);
    const known = rows.filter((event) => event.estimated_cost_usd != null);
    const spend = known.reduce((sum, event) => sum + Number(event.estimated_cost_usd || 0), 0);
    return {
      label,
      successfulGenerations: rows.length,
      knownCostGenerations: known.length,
      unknownCostGenerations: rows.length - known.length,
      knownSpend: Number(spend.toFixed(2)),
      knownCostPerSuccess: known.length ? Number((spend / known.length).toFixed(3)) : null,
    };
  });
  const paidTrafficSpend = trafficCosts.filter((row) => row.label === "Creator" || row.label === "Studio").reduce((sum, row) => sum + row.knownSpend, 0);
  const nonPaidTrafficSpend = trafficCosts.filter((row) => row.label !== "Creator" && row.label !== "Studio").reduce((sum, row) => sum + row.knownSpend, 0);
  const knownCostPerSuccess = knownCostEvents.length ? estimatedProviderSpend / knownCostEvents.length : null;

  const exploreCustomerRows = successful.filter((event) => trafficBucket(event) === "Explore");
  const exploreGeneratorEmails = new Set(exploreCustomerRows.map((event) => String(event.user_email || "").trim().toLowerCase()).filter(Boolean));
  const exploreKnownSpend = exploreCustomerRows.filter((event) => event.estimated_cost_usd != null).reduce((sum, event) => sum + Number(event.estimated_cost_usd || 0), 0);
  const exploreAcquisitionCostPerGenerator = exploreGeneratorEmails.size ? exploreKnownSpend / exploreGeneratorEmails.size : null;

  const activePaidEmails = new Set(memberships.filter((item) => item.plan === "Creator" || item.plan === "Studio").map((item) => String(item.email || "").trim().toLowerCase()).filter(Boolean));
  const observedExploreToPaidEmails = [...exploreGeneratorEmails].filter((email) => activePaidEmails.has(email));
  const observedExploreToPaidConversions = observedExploreToPaidEmails.length;
  const observedExploreToPaidConversionRate = exploreGeneratorEmails.size ? observedExploreToPaidConversions / exploreGeneratorEmails.size : null;
  const observedAcquisitionCostPerConversion = observedExploreToPaidConversions ? exploreKnownSpend / observedExploreToPaidConversions : null;

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

  const membershipCurrencyByEmail = new Map(memberships.map((item) => [String(item.email || "").trim().toLowerCase(), billingCurrencyFrom(item.billing_currency)]));
  const paidUsdKnownSpend = successful.filter((event) => {
    const bucket = trafficBucket(event);
    if (bucket !== "Creator" && bucket !== "Studio") return false;
    return membershipCurrencyByEmail.get(String(event.user_email || "").trim().toLowerCase()) !== "inr" && event.estimated_cost_usd != null;
  }).reduce((sum, event) => sum + Number(event.estimated_cost_usd || 0), 0);
  const paidUsdUnknownCostGenerations = successful.filter((event) => {
    const bucket = trafficBucket(event);
    if (bucket !== "Creator" && bucket !== "Studio") return false;
    return membershipCurrencyByEmail.get(String(event.user_email || "").trim().toLowerCase()) !== "inr" && event.estimated_cost_usd == null;
  }).length;
  const paidContributionBeforeUnknownCosts = mrrUsdMinor > 0 ? (mrrUsdMinor / 100) - paidUsdKnownSpend : null;
  const knownCostMarginCeilingRate = mrrUsdMinor > 0 ? paidContributionBeforeUnknownCosts! / (mrrUsdMinor / 100) : null;
  const knownSpendToUsdMrrRate = periodDays === 30 && mrrInrMinor === 0 && mrrUsdMinor > 0 ? estimatedProviderSpend / (mrrUsdMinor / 100) : null;

  const unknownCostGenerations = successful.filter((event) => event.estimated_cost_usd == null).length;
  const finalSuccessRate = events.length ? successful.length / events.length : null;
  const primaryCompletionRate = events.length ? primaryCompletions.length / events.length : null;
  const fallbackRate = successful.length ? fallbackEvents.length / successful.length : null;
  const latencyValues = successful.map((event) => Number(event.latency_ms)).filter((value) => Number.isFinite(value) && value > 0);
  const p50LatencyMs = percentile(latencyValues, 50);
  const p95LatencyMs = percentile(latencyValues, 95);
  const primaryLatencyValues = successful.filter((event) => !event.fallback_used).map((event) => Number(event.latency_ms)).filter((value) => Number.isFinite(value) && value > 0);
  const fallbackLatencyValues = successful.filter((event) => event.fallback_used).map((event) => Number(event.latency_ms)).filter((value) => Number.isFinite(value) && value > 0);
  const primaryP50LatencyMs = percentile(primaryLatencyValues, 50);
  const primaryP95LatencyMs = percentile(primaryLatencyValues, 95);
  const fallbackP50LatencyMs = percentile(fallbackLatencyValues, 50);
  const fallbackP95LatencyMs = percentile(fallbackLatencyValues, 95);

  const recentCutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recentEvents = events.filter((event) => new Date(event.created_at).getTime() >= recentCutoff);
  const recentSuccessful = recentEvents.filter((event) => event.status === "success");
  const recentPrimaryCompletions = recentSuccessful.filter((event) => !event.fallback_used && event.provider === event.preferred_provider);
  const recentFallbacks = recentSuccessful.filter((event) => event.fallback_used);
  const recentLatencyValues = recentSuccessful.map((event) => Number(event.latency_ms)).filter((value) => Number.isFinite(value) && value > 0);
  const recent24hPrimaryCompletionRate = recentEvents.length ? recentPrimaryCompletions.length / recentEvents.length : null;
  const recent24hFallbackRate = recentSuccessful.length ? recentFallbacks.length / recentSuccessful.length : null;
  const recent24hP50LatencyMs = percentile(recentLatencyValues, 50);
  const recent24hP95LatencyMs = percentile(recentLatencyValues, 95);

  const alerts: Array<{ level: "info" | "warning"; state: "current" | "historical" | "info"; message: string }> = [];
  if (events.length === 0) alerts.push({ level: "info", state: "info", message: "No generation events are logged yet. Run live smoke tests after the analytics SQL migration." });
  if (unknownCostGenerations > 0) alerts.push({ level: "warning", state: "current", message: `${unknownCostGenerations} successful generation${unknownCostGenerations === 1 ? " has" : "s have"} unknown provider cost and are excluded from known-spend totals.` });
  if (mrrInrMinor > 0) alerts.push({ level: "info", state: "info", message: "India MRR is shown separately in ₹. Cantoa does not apply a guessed FX rate when comparing it with USD-denominated provider spend." });
  if (periodDays === 30 && mrrUsdMinor > 0 && paidUsdKnownSpend / (mrrUsdMinor / 100) >= 0.7) alerts.push({ level: "warning", state: "current", message: `Paid-customer known generation cost is ${Math.round((paidUsdKnownSpend / (mrrUsdMinor / 100)) * 100)}% of active USD MRR before Stripe, infrastructure and other costs.` });
  if (periodDays === 30 && exploreKnownSpend > paidUsdKnownSpend && exploreKnownSpend >= 5) alerts.push({ level: "info", state: "info", message: `Explore acquisition investment is ${Number(exploreKnownSpend.toFixed(2)).toLocaleString("en-US", { style: "currency", currency: "USD" })} in this window. Evaluate it with tracked conversion and retention rather than comparing it directly with paid-customer margin.` });
  if (events.length >= 5 && failed.length / events.length >= 0.15) alerts.push({ level: "warning", state: recentEvents.length >= 2 && recentSuccessful.length / recentEvents.length >= 0.9 ? "historical" : "current", message: "Generation failure/refund rate is at least 15%. Review the provider log before expanding traffic." });
  if (successful.length >= 5 && (fallbackRate || 0) >= 0.15) alerts.push({ level: "warning", state: recentEvents.length >= 2 && (recent24hFallbackRate || 0) < 0.15 ? "historical" : "current", message: "Fallback usage is at least 15% of successful generations. Primary-route reliability needs attention even though final success may remain high." });
  if ((p95LatencyMs || 0) >= 60000) alerts.push({ level: "warning", state: (recent24hP95LatencyMs || 0) < 60000 ? "historical" : "current", message: (recent24hP95LatencyMs || 0) < 60000 ? `Latency has improved: the selected-window P95 is ${Math.round((p95LatencyMs || 0) / 1000)}s because it still includes earlier slow generations, while the last-24h P95 is ${Math.round((recent24hP95LatencyMs || 0) / 1000)}s.` : `Current P95 generation latency is ${Math.round((recent24hP95LatencyMs || p95LatencyMs || 0) / 1000)} seconds. Review slow primary/fallback routes.` });
  if (recentEvents.length >= 2 && (fallbackRate || 0) >= 0.15 && (recent24hFallbackRate || 0) < 0.15) alerts.push({ level: "info", state: "info", message: `Recent routing has recovered: ${Math.round((recent24hPrimaryCompletionRate || 0) * 100)}% primary-route completion and ${Math.round((recent24hFallbackRate || 0) * 100)}% fallback usage in the last 24 hours. The selected-window totals still include older provider-key failures.` });

  const classifyFallbackReason = (value: string | null) => {
    const raw = String(value || "").toLowerCase();
    if (!raw) return "Unknown / not logged";
    if (raw.includes("quota") || raw.includes("api key") || raw.includes("credit") || raw.includes("insufficient") || raw.includes("billing")) return "Quota / API limit";
    if (raw.includes("rate limit") || raw.includes("too many requests") || raw.includes("429")) return "Rate limit";
    if (raw.includes("timeout") || raw.includes("timed out") || raw.includes("deadline") || raw.includes("504")) return "Timeout";
    if (raw.includes("network") || raw.includes("fetch failed") || raw.includes("econn") || raw.includes("socket") || raw.includes("dns") || raw.includes("connection")) return "Network / transport";
    if (raw.includes("500") || raw.includes("502") || raw.includes("503") || raw.includes("server error") || raw.includes("service unavailable") || raw.includes("provider unavailable")) return "Provider 5xx / unavailable";
    if (raw.includes("content") || raw.includes("moder") || raw.includes("policy") || raw.includes("safety") || raw.includes("blocked")) return "Provider/content rejection";
    if (raw.includes("invalid") || raw.includes("unsupported") || raw.includes("bad request") || raw.includes("400") || raw.includes("422") || raw.includes("parameter") || raw.includes("format")) return "Invalid / unsupported request";
    if (raw.includes("unauthorized") || raw.includes("forbidden") || raw.includes("401") || raw.includes("403") || raw.includes("permission") || raw.includes("auth")) return "Authentication / permission";
    return "Other provider error";
  };

  const fallbackReasonMap = new Map<string, number>();
  for (const event of fallbackEvents) {
    const reason = classifyFallbackReason(event.error_code);
    fallbackReasonMap.set(reason, (fallbackReasonMap.get(reason) || 0) + 1);
  }
  const fallbackReasons = [...fallbackReasonMap.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);

  const providerNames = ["elevenlabs", "stability", "mureka"] as const;
  const providers = providerNames.map((provider) => {
    const preferredRows = events.filter((event) => event.preferred_provider === provider);
    const attemptedRows = events.filter((event) => (event.attempted_providers || []).includes(provider));
    const completedRows = successful.filter((event) => event.provider === provider);
    const directCompletions = completedRows.filter((event) => event.preferred_provider === provider && !event.fallback_used);
    const fallbackIns = completedRows.filter((event) => event.preferred_provider !== provider || event.fallback_used);
    const fallbackOuts = preferredRows.filter((event) => event.status === "success" && event.provider !== provider);
    const knownCostRows = completedRows.filter((event) => event.estimated_cost_usd != null);
    const unknownCostCount = completedRows.filter((event) => event.estimated_cost_usd == null).length;
    const spend = knownCostRows.reduce((sum, event) => sum + Number(event.estimated_cost_usd || 0), 0);
    const latencyRows = completedRows.map((event) => Number(event.latency_ms)).filter((value) => Number.isFinite(value) && value > 0);
    const providerPrimaryRate = preferredRows.length ? directCompletions.length / preferredRows.length : null;
    const providerFallbackOutRate = preferredRows.length ? fallbackOuts.length / preferredRows.length : null;
    const recentPreferredRows = recentEvents.filter((event) => event.preferred_provider === provider);
    const recentCompletedRows = recentSuccessful.filter((event) => event.provider === provider);
    const recentDirectCompletions = recentCompletedRows.filter((event) => event.preferred_provider === provider && !event.fallback_used);
    const recentFallbackOuts = recentPreferredRows.filter((event) => event.status === "success" && event.provider !== provider);
    const recentFallbackIns = recentCompletedRows.filter((event) => event.preferred_provider !== provider || event.fallback_used);
    const recentPrimaryCompletionRate = recentPreferredRows.length ? recentDirectCompletions.length / recentPreferredRows.length : null;
    const recentFallbackOutRate = recentPreferredRows.length ? recentFallbackOuts.length / recentPreferredRows.length : null;
    return {
      provider,
      primaryRequests: preferredRows.length,
      attempts: attemptedRows.length,
      completed: completedRows.length,
      directCompletions: directCompletions.length,
      fallbackIns: fallbackIns.length,
      fallbackOuts: fallbackOuts.length,
      failedFinalRequests: preferredRows.filter((event) => event.status !== "success").length,
      primaryCompletionRate: providerPrimaryRate,
      fallbackOutRate: providerFallbackOutRate,
      recent24hPrimaryRequests: recentPreferredRows.length,
      recent24hDirectCompletions: recentDirectCompletions.length,
      recent24hFallbackOuts: recentFallbackOuts.length,
      recent24hFallbackIns: recentFallbackIns.length,
      recent24hPrimaryCompletionRate: recentPrimaryCompletionRate,
      recent24hFallbackOutRate: recentFallbackOutRate,
      knownSpend: Number(spend.toFixed(2)),
      unknownCostCount,
      knownCostPerSuccess: knownCostRows.length ? Number((spend / knownCostRows.length).toFixed(3)) : null,
      pricedSuccessCoverage: completedRows.length ? knownCostRows.length / completedRows.length : null,
      p50LatencyMs: percentile(latencyRows, 50),
      p95LatencyMs: percentile(latencyRows, 95),
      health: providerHealth(providerPrimaryRate, providerFallbackOutRate, percentile(latencyRows, 95), unknownCostCount),
    };
  });

  return NextResponse.json({
    periodDays,
    generatedAt: new Date().toISOString(),
    providerAvailability: availableMusicProviders(),
    summary: {
      activeAccounts: memberships.length,
      exploreCount, creatorCount, studioCount,
      generationEvents: events.length,
      successfulGenerations: successful.length,
      failedOrRefunded: failed.length,
      fallbackGenerations: fallbackEvents.length,
      primaryCompletions: primaryCompletions.length,
      finalSuccessRate,
      primaryCompletionRate,
      fallbackRate,
      p50LatencyMs,
      p95LatencyMs,
      primaryP50LatencyMs,
      primaryP95LatencyMs,
      fallbackP50LatencyMs,
      fallbackP95LatencyMs,
      estimatedProviderSpend: Number(estimatedProviderSpend.toFixed(2)),
      paidTrafficSpend: Number(paidTrafficSpend.toFixed(2)),
      nonPaidTrafficSpend: Number(nonPaidTrafficSpend.toFixed(2)),
      knownCostPerSuccess: knownCostPerSuccess == null ? null : Number(knownCostPerSuccess.toFixed(3)),
      exploreAcquisitionCostPerGenerator: exploreAcquisitionCostPerGenerator == null ? null : Number(exploreAcquisitionCostPerGenerator.toFixed(3)),
      exploreGeneratorCount: exploreGeneratorEmails.size,
      observedExploreToPaidConversions,
      observedExploreToPaidConversionRate: observedExploreToPaidConversionRate == null ? null : Number(observedExploreToPaidConversionRate.toFixed(4)),
      observedAcquisitionCostPerConversion: observedAcquisitionCostPerConversion == null ? null : Number(observedAcquisitionCostPerConversion.toFixed(2)),
      paidContributionBeforeUnknownCosts: paidContributionBeforeUnknownCosts == null ? null : Number(paidContributionBeforeUnknownCosts.toFixed(2)),
      knownCostMarginCeilingRate: knownCostMarginCeilingRate == null ? null : Number(knownCostMarginCeilingRate.toFixed(4)),
      paidUsdUnknownCostGenerations,
      knownSpendToUsdMrrRate: knownSpendToUsdMrrRate == null ? null : Number(knownSpendToUsdMrrRate.toFixed(4)),
      paidUsdKnownSpend: Number(paidUsdKnownSpend.toFixed(2)),
      estimatedActivePlanMrrUsd: Number((mrrUsdMinor / 100).toFixed(2)),
      estimatedActivePlanMrrInr: Number((mrrInrMinor / 100).toFixed(2)),
      unknownCostGenerations,
      recent24hEvents: recentEvents.length,
      recent24hPrimaryCompletionRate,
      recent24hFallbackRate,
      recent24hP50LatencyMs,
      recent24hP95LatencyMs,
      note: "Known provider spend includes only generations with calibrated cost. Unknown-cost generations are shown separately. Paid contribution before unknown costs is an upper bound until all paid generations are priced. MRR is estimated from active subscription billing currency/amount; INR revenue remains separate from USD provider spend.",
    },
    alerts,
    fallbackReasons,
    trafficCosts,
    unknownCostImpact: providers.filter((row) => row.unknownCostCount > 0).map((row) => ({ provider: row.provider, unknownCostCount: row.unknownCostCount })),
    providers,
    events: events.slice(0, 250),
    costPolicy: {
      elevenlabs: "~$0.15 per generated minute from Cantoa's 2026-09-02 live test",
      stability: "~$0.26 per successful Stable Audio 3.0 generation from Cantoa's 2026-09-02 live test",
      murekaSoundtrack: "~$0.10 per video soundtrack from Cantoa's 2026-09-02 live test",
      murekaSong: `~$${MUREKA_OBSERVED_SONG_COST_USD.toFixed(3)} per successful song generation from observed Mureka billing: $2.90 / 18 generations (calibrated 2026-09-10)`,
    },
    guardrails: [
      "One primary provider request at a time; compatible fallback only after provider failure.",
      "Mureka song requests generate one output per provider call.",
      "Failed provider-backed audio restores reserved paid minutes or free-song entitlement.",
      "Explore is limited to two free songs per account, each capped at 2 minutes.",
      "Creator renews at 40 generation minutes; Studio renews at 120 generation minutes.",
      "Instrumental requests use cost-aware routing rather than automatically forcing Stable Audio.",
      "Re-exporting an existing song does not call a music-generation provider.",
    ],
  }, { headers: { "Cache-Control": "private, no-store" } });
}
