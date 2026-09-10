"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type ProviderRow = {
  provider: string;
  primaryRequests: number;
  attempts: number;
  completed: number;
  directCompletions: number;
  fallbackIns: number;
  fallbackOuts: number;
  failedFinalRequests: number;
  primaryCompletionRate: number | null;
  fallbackOutRate: number | null;
  recent24hPrimaryRequests: number;
  recent24hDirectCompletions: number;
  recent24hFallbackOuts: number;
  recent24hFallbackIns: number;
  recent24hPrimaryCompletionRate: number | null;
  recent24hFallbackOutRate: number | null;
  knownSpend: number;
  unknownCostCount: number;
  knownCostPerSuccess: number | null;
  pricedSuccessCoverage: number | null;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  health: "healthy" | "attention";
};

type EventRow = {
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
  latency_ms: number | null;
  status: string;
  error_code: string | null;
  request_summary: string | null;
  created_at: string;
};

type Analytics = {
  periodDays: number;
  generatedAt: string;
  providerAvailability: Record<string, boolean>;
  summary: {
    activeAccounts: number;
    exploreCount: number;
    creatorCount: number;
    studioCount: number;
    generationEvents: number;
    successfulGenerations: number;
    failedOrRefunded: number;
    fallbackGenerations: number;
    primaryCompletions: number;
    finalSuccessRate: number | null;
    primaryCompletionRate: number | null;
    fallbackRate: number | null;
    p50LatencyMs: number | null;
    p95LatencyMs: number | null;
    estimatedProviderSpend: number;
    paidTrafficSpend: number;
    nonPaidTrafficSpend: number;
    knownCostPerSuccess: number | null;
    exploreAcquisitionCostPerGenerator: number | null;
    exploreGeneratorCount: number;
    observedExploreToPaidConversions: number;
    observedExploreToPaidConversionRate: number | null;
    observedAcquisitionCostPerConversion: number | null;
    paidContributionBeforeUnknownCosts: number | null;
    knownCostMarginCeilingRate: number | null;
    paidUsdUnknownCostGenerations: number;
    knownSpendToUsdMrrRate: number | null;
    paidUsdKnownSpend: number;
    estimatedActivePlanMrrUsd: number;
    estimatedActivePlanMrrInr: number;
    unknownCostGenerations: number;
    recent24hEvents: number;
    recent24hPrimaryCompletionRate: number | null;
    recent24hFallbackRate: number | null;
    recent24hP95LatencyMs: number | null;
    note: string;
  };
  alerts: Array<{ level: "info" | "warning"; state: "current" | "historical" | "info"; message: string }>;
  trafficCosts: Array<{ label: string; successfulGenerations: number; knownCostGenerations: number; unknownCostGenerations: number; knownSpend: number; knownCostPerSuccess: number | null }>;
  unknownCostImpact: Array<{ provider: string; unknownCostCount: number }>;
  providers: ProviderRow[];
  events: EventRow[];
  costPolicy: Record<string, string>;
  guardrails: string[];
};

const money = (value: number | null | undefined) => value == null ? "—" : `$${Number(value).toFixed(2)}`;
const rupees = (value: number | null | undefined) => value == null ? "—" : `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const seconds = (value: number | null) => value == null ? "—" : value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`;
const percent = (value: number | null) => value == null ? "—" : `${Math.round(value * 100)}%`;
const providerLabel = (value: string) => value === "elevenlabs" ? "ElevenLabs" : value === "stability" ? "Stable Audio" : value === "mureka" ? "Mureka" : value;

export default function OwnerConsole() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [message, setMessage] = useState("Loading owner analytics…");
  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState<Record<string, string>>({});
  const [periodDays, setPeriodDays] = useState(30);
  const [planFilter, setPlanFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const token = useCallback(async () => {
    const client = getSupabaseBrowser();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const accessToken = await token();
    if (!accessToken) {
      setMessage("Sign in to your Cantoa owner account first.");
      setLoading(false);
      return;
    }
    const response = await fetch(`/api/owner/analytics?days=${periodDays}`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Owner analytics could not be loaded.");
      setAnalytics(null);
    } else {
      setAnalytics(data);
      setMessage("");
    }
    setLoading(false);
  }, [token, periodDays]);

  useEffect(() => { void load(); }, [load]);

  const filteredEvents = analytics?.events.filter((event) => {
    if (planFilter !== "all" && (event.plan || "Other/Unknown") !== planFilter) return false;
    if (providerFilter !== "all" && (event.provider || "unknown") !== providerFilter) return false;
    if (statusFilter !== "all" && event.status !== statusFilter) return false;
    return true;
  }) || [];

  const routingTest = async (kind: string) => {
    const accessToken = await token();
    if (!accessToken) return;
    setRouting((current) => ({ ...current, [kind]: "Checking…" }));
    const response = await fetch("/api/owner/routing-test", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ kind }),
    });
    const data = await response.json().catch(() => ({}));
    setRouting((current) => ({ ...current, [kind]: response.ok ? `${providerLabel(data.provider)} · ${data.reason}` : data.error || "Unavailable" }));
  };

  return (
    <main className="owner-console">
      <header className="owner-topbar">
        <div><a href="/" className="owner-brand">Cantoa</a><span>Owner Console</span></div>
        <div><a href="/">← Back to Studio</a><div className="owner-period-switch" aria-label="Analytics period">{[1,7,30].map((days) => <button key={days} className={periodDays === days ? "active" : ""} onClick={() => setPeriodDays(days)} disabled={loading}>{days === 1 ? "24h" : `${days}d`}</button>)}</div><button onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button></div>
      </header>

      <section className="owner-hero">
        <p>BUSINESS CONTROL</p>
        <h1>Provider, cost & generation health.</h1>
        <span>Owner-only diagnostics for the selected window. Final success, primary-route reliability, fallback use and known provider cost are reported separately.</span>
      </section>

      {message && <section className="owner-message"><b>{message}</b>{message.includes("supabase-setup.sql") && <span>Run the indicated SQL section once, then refresh this page.</span>}</section>}

      {analytics && <>
        <section className="owner-kpis">
          <article><span>US/global active-plan MRR</span><b>{money(analytics.summary.estimatedActivePlanMrrUsd)}</b><small>{analytics.summary.creatorCount} Creator · {analytics.summary.studioCount} Studio total</small></article>
          <article><span>Known provider spend · {analytics.periodDays === 1 ? "24h" : `${analytics.periodDays}d`}</span><b>{money(analytics.summary.estimatedProviderSpend)}</b><small>{analytics.summary.unknownCostGenerations ? `${analytics.summary.unknownCostGenerations} successful generation${analytics.summary.unknownCostGenerations === 1 ? "" : "s"} still unpriced` : "All successful generations in this window are calibrated"}</small></article>
          <article><span>Final generation success</span><b>{percent(analytics.summary.finalSuccessRate)}</b><small>{analytics.summary.failedOrRefunded} failed/refunded · includes compatible fallbacks</small></article>
          <article><span>Primary-route completion</span><b>{percent(analytics.summary.primaryCompletionRate)}</b><small>30d: {percent(analytics.summary.fallbackRate)} fallback · Last 24h: {percent(analytics.summary.recent24hPrimaryCompletionRate)} primary / {percent(analytics.summary.recent24hFallbackRate)} fallback</small></article>
        </section>

        <section className="owner-kpis owner-kpis-secondary">
          <article><span>India active-plan MRR</span><b>{rupees(analytics.summary.estimatedActivePlanMrrInr)}</b><small>Kept separate from USD rather than using a guessed FX rate</small></article>
          <article><span>Generation latency</span><b>{seconds(analytics.summary.p50LatencyMs)}</b><small>P50 · P95 {seconds(analytics.summary.p95LatencyMs)}</small></article>
          <article><span>Fallback completions</span><b>{analytics.summary.fallbackGenerations}</b><small>{analytics.summary.successfulGenerations} total successful generations</small></article>
          <article><span>Active accounts</span><b>{analytics.summary.activeAccounts}</b><small>{analytics.summary.exploreCount} Explore · {analytics.summary.creatorCount} Creator · {analytics.summary.studioCount} Studio</small></article>
        </section>

        {analytics.alerts.length > 0 && <section className="owner-alerts" aria-label="Cost and reliability alerts">
          {analytics.alerts.map((alert) => <article key={alert.message} className={`owner-alert alert-${alert.level} alert-state-${alert.state}`}><b>{alert.state === "current" ? "Current issue" : alert.state === "historical" ? "Historical issue" : "Owner note"}</b><span>{alert.message}</span></article>)}
        </section>}


        <section className="owner-panel">
          <div className="owner-panel-head"><div><p>TRAFFIC ECONOMICS</p><h2>Where provider spend is coming from</h2></div><small>Owner/test traffic is separated from customer traffic. Unknown-cost generations are never treated as $0.</small></div>
          <div className="owner-economics-summary">
            <article><span>Paid traffic known spend</span><b>{money(analytics.summary.paidTrafficSpend)}</b><small>Creator + Studio generation cost in this window</small></article>
            <article><span>Explore + owner/test spend</span><b>{money(analytics.summary.nonPaidTrafficSpend)}</b><small>Useful for seeing how much testing and free acquisition cost</small></article>
            <article><span>Known cost / priced generation</span><b>{analytics.summary.knownCostPerSuccess == null ? "—" : `$${analytics.summary.knownCostPerSuccess.toFixed(3)}`}</b><small>{analytics.summary.unknownCostGenerations ? "Based only on calibrated provider costs" : "All successful generations priced"}</small></article>
            <article><span>Paid memberships</span><b>{analytics.summary.creatorCount + analytics.summary.studioCount}</b><small>{analytics.summary.creatorCount} Creator · {analytics.summary.studioCount} Studio</small></article>
          </div>
          <div className="owner-economics-summary owner-economics-decision">
            <article><span>Explore acquisition cost / generator</span><b>{analytics.summary.exploreAcquisitionCostPerGenerator == null ? "—" : `$${analytics.summary.exploreAcquisitionCostPerGenerator.toFixed(3)}`}</b><small>{analytics.summary.exploreGeneratorCount} unique Explore generator{analytics.summary.exploreGeneratorCount === 1 ? "" : "s"} in this window</small></article>
            <article><span>Observed Explore → paid</span><b>{analytics.summary.observedExploreToPaidConversionRate == null ? "—" : percent(analytics.summary.observedExploreToPaidConversionRate)}</b><small>{analytics.summary.observedExploreToPaidConversions} current paid member{analytics.summary.observedExploreToPaidConversions === 1 ? "" : "s"} also generated on Explore in this window</small></article>
            <article><span>Observed acquisition cost / conversion</span><b>{analytics.summary.observedAcquisitionCostPerConversion == null ? "—" : money(analytics.summary.observedAcquisitionCostPerConversion)}</b><small>Explore known spend ÷ observed Explore→paid conversions; directional, not attribution</small></article>
            <article className={analytics.summary.paidContributionBeforeUnknownCosts != null && analytics.summary.paidContributionBeforeUnknownCosts < 0 ? "metric-negative" : "metric-positive"}><span>Paid contribution before unknown costs</span><b>{money(analytics.summary.paidContributionBeforeUnknownCosts)}</b><small>{analytics.summary.knownCostMarginCeilingRate == null ? "No USD paid MRR" : `${percent(analytics.summary.knownCostMarginCeilingRate)} known-cost margin ceiling · ${analytics.summary.paidUsdUnknownCostGenerations} paid generation${analytics.summary.paidUsdUnknownCostGenerations === 1 ? "" : "s"} still unpriced · excludes Stripe, tax and infra`}</small></article>
          </div>
          <div className="owner-traffic-grid">
            {analytics.trafficCosts.map((row) => <article key={row.label}>
              <div><b>{row.label}</b><span>{row.successfulGenerations} success{row.successfulGenerations === 1 ? "" : "es"}</span></div>
              <strong>{money(row.knownSpend)}</strong>
              <small>{row.unknownCostGenerations ? `${row.unknownCostGenerations} unpriced · ` : ""}{row.knownCostPerSuccess == null ? "No successful cost yet" : `$${row.knownCostPerSuccess.toFixed(3)} known cost/priced success`}</small>
            </article>)}
          </div>
        </section>

        {analytics.summary.unknownCostGenerations > 0 && <section className="owner-panel owner-unknown-cost">
          <div className="owner-panel-head"><div><p>UNKNOWN-COST IMPACT</p><h2>What is preventing a complete margin calculation</h2></div><small>Known spend is a floor until these provider costs are calibrated.</small></div>
          <div className="owner-unknown-grid">
            <article><span>Unpriced successful generations</span><b>{analytics.summary.unknownCostGenerations}</b><small>These are excluded from known spend rather than counted as $0.</small></article>
            <article><span>Known provider spend floor</span><b>{money(analytics.summary.estimatedProviderSpend)}</b><small>Actual provider spend is at least this amount for the selected window.</small></article>
            <article><span>Providers blocking full cost</span><b>{analytics.unknownCostImpact.length}</b><small>{analytics.unknownCostImpact.map((row) => `${providerLabel(row.provider)}: ${row.unknownCostCount}`).join(" · ") || "None"}</small></article>
            <article><span>Known spend / USD MRR</span><b>{analytics.summary.knownSpendToUsdMrrRate == null ? "—" : percent(analytics.summary.knownSpendToUsdMrrRate)}</b><small>{analytics.summary.knownSpendToUsdMrrRate == null ? "Shown only for 30d when INR MRR is zero" : "All known provider spend ÷ active USD MRR; includes Explore and Owner/Test traffic"}</small></article>
          </div>
        </section>}

        <section className="owner-panel">
          <div className="owner-panel-head"><div><p>PROVIDER HEALTH</p><h2>Routing truth & cost snapshot</h2></div><small>{analytics.summary.generationEvents} logged events · {analytics.summary.unknownCostGenerations} unpriced successful generations</small></div>
          <div className="owner-provider-grid">
            {analytics.providers.map((row) => <article key={row.provider}>
              <div><b>{providerLabel(row.provider)}</b><span className={!analytics.providerAvailability[row.provider] ? "provider-off" : row.health === "healthy" ? "provider-live" : "provider-watch"}>{!analytics.providerAvailability[row.provider] ? "Not configured" : row.health === "healthy" ? "Healthy" : "Attention"}</span></div>
              <small className="provider-recent">Last 24h: {row.recent24hDirectCompletions}/{row.recent24hPrimaryRequests} direct · {row.recent24hFallbackOuts} fallback out · {row.recent24hFallbackIns} fallback in</small>
              <dl>
                <div><dt>Primary requests</dt><dd>{row.primaryRequests}</dd></div>
                <div><dt>Actual attempts</dt><dd>{row.attempts}</dd></div>
                <div><dt>Completed here</dt><dd>{row.completed}</dd></div>
                <div><dt>Primary completion</dt><dd>{percent(row.primaryCompletionRate)}</dd></div>
                <div><dt>Fallbacks out</dt><dd>{row.fallbackOuts}</dd></div>
                <div><dt>Fallbacks in</dt><dd>{row.fallbackIns}</dd></div>
                <div><dt>Known spend</dt><dd>{row.unknownCostCount > 0 && row.knownSpend === 0 ? "Unknown" : money(row.knownSpend)}</dd>{row.unknownCostCount > 0 && <small>{row.unknownCostCount} unpriced</small>}</div>
                <div><dt>Known cost / priced success</dt><dd>{row.knownCostPerSuccess == null ? "—" : `$${row.knownCostPerSuccess.toFixed(3)}`}</dd><small>{row.pricedSuccessCoverage == null ? "No completions" : `${percent(row.pricedSuccessCoverage)} cost coverage`}</small></div>
                <div><dt>P50 / P95 latency</dt><dd>{seconds(row.p50LatencyMs)} / {seconds(row.p95LatencyMs)}</dd></div>
              </dl>
            </article>)}
          </div>
        </section>

        <section className="owner-two-col">
          <article className="owner-panel">
            <div className="owner-panel-head"><div><p>DRY TEST</p><h2>Routing diagnostics</h2></div><small>No provider charge</small></div>
            <div className="routing-tests">
              {[["vocal","Vocal song"],["instrumental","Ordinary instrumental"],["background","Ambient/background"],["alternate","Alternate vocal"]].map(([kind,label]) => <div key={kind}>
                <button onClick={() => void routingTest(kind)}>{label}</button><span>{routing[kind] || "Run test to see expected provider."}</span>
              </div>)}
            </div>
          </article>
          <article className="owner-panel">
            <div className="owner-panel-head"><div><p>COST POLICY</p><h2>Current calibrated assumptions</h2></div></div>
            <ul className="owner-policy-list">
              <li><b>ElevenLabs</b><span>{analytics.costPolicy.elevenlabs}</span></li>
              <li><b>Stable Audio</b><span>{analytics.costPolicy.stability}</span></li>
              <li><b>Mureka video</b><span>{analytics.costPolicy.murekaSoundtrack}</span></li>
              <li><b>Mureka songs</b><span>{analytics.costPolicy.murekaSong}</span></li>
            </ul>
          </article>
        </section>

        <section className="owner-panel">
          <div className="owner-panel-head"><div><p>COST CONTROLS</p><h2>Guardrails currently enforced</h2></div></div>
          <div className="owner-guardrails">{analytics.guardrails.map((item) => <div key={item}><span>✓</span><p>{item}</p></div>)}</div>
        </section>

        <section className="owner-panel owner-log-panel">
          <div className="owner-panel-head"><div><p>GENERATION LOG</p><h2>Latest activity</h2></div><small>Prompts are stored only as a compact 160-character operational preview; lyrics are not logged.</small></div>
          <div className="owner-log-filters">
            <label>Plan<select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}><option value="all">All plans</option><option value="Explore">Explore</option><option value="Creator">Creator</option><option value="Studio">Studio</option></select></label>
            <label>Provider<select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}><option value="all">All providers</option><option value="elevenlabs">ElevenLabs</option><option value="stability">Stable Audio</option><option value="mureka">Mureka</option></select></label>
            <label>Status<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option><option value="success">Success</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></label>
            <span>{filteredEvents.length} shown</span>
          </div>
          <div className="owner-table-wrap">
            <table className="owner-table">
              <thead><tr><th>Time</th><th>Request</th><th>Route</th><th>Plan</th><th>Duration</th><th>Cost</th><th>Latency</th><th>Status</th></tr></thead>
              <tbody>{filteredEvents.map((event) => <tr key={event.id}>
                <td>{new Date(event.created_at).toLocaleString()}</td>
                <td><b>{event.request_type.replaceAll("_"," ")}</b><small>{event.request_summary || "No prompt preview"}</small></td>
                <td><b>{event.provider ? providerLabel(event.provider) : "—"}</b><small>Preferred: {event.preferred_provider ? providerLabel(event.preferred_provider) : "—"}{event.attempted_providers?.length ? ` · Tried: ${event.attempted_providers.map(providerLabel).join(" → ")}` : ""}</small>{event.fallback_used && <small className="fallback-note">Fallback used{event.error_code ? ` · ${event.error_code.slice(0, 120)}` : ""}</small>}</td>
                <td>{event.plan || "—"}</td>
                <td>{event.requested_seconds}s</td>
                <td>{event.estimated_cost_usd == null ? "Unknown" : money(event.estimated_cost_usd)}</td>
                <td>{seconds(event.latency_ms)}</td>
                <td><span className={`owner-status status-${event.status}`}>{event.status}</span>{!event.fallback_used && event.error_code && <small>{event.error_code.slice(0,120)}</small>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>

        <p className="owner-footnote">{analytics.summary.note} Generated {new Date(analytics.generatedAt).toLocaleString()}.</p>
      </>}
    </main>
  );
}
