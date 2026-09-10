import { adminSupabase, authenticatedUser } from "@/lib/supabase";
import { estimateProviderCost } from "@/lib/provider-costs";

export type GenerationEvent = {
  requestType: string;
  provider?: string | null;
  preferredProvider?: string | null;
  attemptedProviders?: string[];
  fallbackUsed?: boolean;
  requestedSeconds: number;
  chargedMinutes: number;
  latencyMs?: number | null;
  status: "success" | "failed" | "refunded";
  errorCode?: string | null;
  requestSummary?: string | null;
  plan?: string | null;
};

export function compactRequestSummary(value: unknown) {
  if (typeof value !== "string") return null;
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) return null;
  return compact.slice(0, 160);
}

export async function logGenerationEvent(request: Request, event: GenerationEvent) {
  try {
    const admin = adminSupabase();
    if (!admin) return;
    const user = await authenticatedUser(request);
    const estimate = estimateProviderCost(event.provider, event.requestedSeconds, event.requestType);
    await admin.from("generation_events").insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      plan: event.plan || null,
      request_type: event.requestType.slice(0, 80),
      provider: event.provider || null,
      preferred_provider: event.preferredProvider || null,
      attempted_providers: event.attemptedProviders || [],
      fallback_used: Boolean(event.fallbackUsed),
      requested_seconds: Math.max(0, Math.round(event.requestedSeconds || 0)),
      charged_minutes: Number((event.chargedMinutes || 0).toFixed(4)),
      estimated_cost_usd: estimate.amount,
      cost_basis: estimate.basis,
      latency_ms: event.latencyMs == null ? null : Math.max(0, Math.round(event.latencyMs)),
      status: event.status,
      error_code: event.errorCode ? event.errorCode.slice(0, 160) : null,
      request_summary: compactRequestSummary(event.requestSummary),
    });
  } catch {
    // Observability must never block a user's generation.
  }
}
