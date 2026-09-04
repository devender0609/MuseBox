"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type ProviderRow = {
  provider: string;
  requests: number;
  successful: number;
  failures: number;
  fallbackCount: number;
  estimatedSpend: number;
  averageLatencyMs: number | null;
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
    estimatedProviderSpend: number;
    estimatedActivePlanMrrUsd: number;
    estimatedActivePlanMrrInr: number;
    unknownCostGenerations: number;
    note: string;
  };
  alerts: Array<{ level: "info" | "warning"; message: string }>;
  providers: ProviderRow[];
  events: EventRow[];
  costPolicy: Record<string, string>;
  guardrails: string[];
};

const money = (value: number | null | undefined) => value == null ? "—" : `$${Number(value).toFixed(2)}`;
const rupees = (value: number | null | undefined) => value == null ? "—" : `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const seconds = (value: number | null) => value == null ? "—" : value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`;

export default function OwnerConsole() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [message, setMessage] = useState("Loading owner analytics…");
  const [loading, setLoading] = useState(true);
  const [routing, setRouting] = useState<Record<string, string>>({});

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
    const response = await fetch("/api/owner/analytics", { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(data.error || "Owner analytics could not be loaded.");
      setAnalytics(null);
    } else {
      setAnalytics(data);
      setMessage("");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { void load(); }, [load]);

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
    setRouting((current) => ({ ...current, [kind]: response.ok ? `${data.provider} · ${data.reason}` : data.error || "Unavailable" }));
  };

  const successRate = useMemo(() => {
    if (!analytics?.summary.generationEvents) return "—";
    return `${Math.round((analytics.summary.successfulGenerations / analytics.summary.generationEvents) * 100)}%`;
  }, [analytics]);

  return (
    <main className="owner-console">
      <header className="owner-topbar">
        <div>
          <a href="/" className="owner-brand">Cantoa</a>
          <span>Owner Console</span>
        </div>
        <div>
          <a href="/">← Back to Studio</a>
          <button onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
        </div>
      </header>

      <section className="owner-hero">
        <p>BUSINESS CONTROL</p>
        <h1>Provider, cost & generation health.</h1>
        <span>Owner-only diagnostics for the last 30 days. Provider costs are calibrated estimates, not provider invoices.</span>
      </section>

      {message && <section className="owner-message"><b>{message}</b>{message.includes("supabase-setup.sql") && <span>Run the new v18.5 SQL section once, then refresh this page.</span>}</section>}

      {analytics && <>
        <section className="owner-kpis">
          <article><span>US/global active-plan MRR</span><b>{money(analytics.summary.estimatedActivePlanMrrUsd)}</b><small>{analytics.summary.creatorCount} Creator · {analytics.summary.studioCount} Studio total</small></article>
          <article><span>India active-plan MRR</span><b>{rupees(analytics.summary.estimatedActivePlanMrrInr)}</b><small>Kept separate from USD rather than using a guessed FX rate</small></article>
          <article><span>Estimated provider spend</span><b>{money(analytics.summary.estimatedProviderSpend)}</b><small>Calibrated successful generations</small></article>
          <article><span>Generation success</span><b>{successRate}</b><small>{analytics.summary.failedOrRefunded} failed/refunded · {analytics.summary.fallbackGenerations} fallbacks</small></article>
        </section>

        {analytics.alerts.length > 0 && <section className="owner-alerts" aria-label="Cost and reliability alerts">
          {analytics.alerts.map((alert) => <article key={alert.message} className={`owner-alert alert-${alert.level}`}><b>{alert.level === "warning" ? "Cost / reliability watch" : "Owner note"}</b><span>{alert.message}</span></article>)}
        </section>}

        <section className="owner-panel">
          <div className="owner-panel-head"><div><p>PROVIDER HEALTH</p><h2>Routing & cost snapshot</h2></div><small>{analytics.summary.generationEvents} logged events · {analytics.summary.activeAccounts} active accounts · {analytics.summary.unknownCostGenerations} uncalibrated cost</small></div>
          <div className="owner-provider-grid">
            {analytics.providers.map((row) => <article key={row.provider}>
              <div><b>{row.provider === "elevenlabs" ? "ElevenLabs" : row.provider === "stability" ? "Stable Audio" : "Mureka"}</b><span className={analytics.providerAvailability[row.provider] ? "provider-live" : "provider-off"}>{analytics.providerAvailability[row.provider] ? "Configured" : "Not configured"}</span></div>
              <dl>
                <div><dt>Requests</dt><dd>{row.requests}</dd></div>
                <div><dt>Successful</dt><dd>{row.successful}</dd></div>
                <div><dt>Failures</dt><dd>{row.failures}</dd></div>
                <div><dt>Fallbacks</dt><dd>{row.fallbackCount}</dd></div>
                <div><dt>Est. spend</dt><dd>{money(row.estimatedSpend)}</dd></div>
                <div><dt>Avg. latency</dt><dd>{seconds(row.averageLatencyMs)}</dd></div>
              </dl>
            </article>)}
          </div>
        </section>

        <section className="owner-two-col">
          <article className="owner-panel">
            <div className="owner-panel-head"><div><p>DRY TEST</p><h2>Routing diagnostics</h2></div><small>No provider charge</small></div>
            <div className="routing-tests">
              {[['vocal','Vocal song'],['instrumental','Ordinary instrumental'],['background','Ambient/background'],['alternate','Alternate vocal']].map(([kind,label]) => <div key={kind}>
                <button onClick={() => void routingTest(kind)}>{label}</button>
                <span>{routing[kind] || "Run test to see expected provider."}</span>
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
          <div className="owner-table-wrap">
            <table className="owner-table">
              <thead><tr><th>Time</th><th>Request</th><th>Provider</th><th>Plan</th><th>Duration</th><th>Cost</th><th>Latency</th><th>Status</th></tr></thead>
              <tbody>{analytics.events.map((event) => <tr key={event.id}>
                <td>{new Date(event.created_at).toLocaleString()}</td>
                <td><b>{event.request_type.replaceAll('_',' ')}</b><small>{event.request_summary || "No prompt preview"}</small></td>
                <td><b>{event.provider || "—"}</b>{event.fallback_used && <small>Fallback from {event.preferred_provider}</small>}</td>
                <td>{event.plan || "—"}</td>
                <td>{event.requested_seconds}s</td>
                <td>{money(event.estimated_cost_usd)}</td>
                <td>{seconds(event.latency_ms)}</td>
                <td><span className={`owner-status status-${event.status}`}>{event.status}</span>{event.error_code && <small>{event.error_code.slice(0,90)}</small>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>

        <p className="owner-footnote">{analytics.summary.note} Generated {new Date(analytics.generatedAt).toLocaleString()}.</p>
      </>}
    </main>
  );
}
