export type CostEstimate = { amount: number | null; basis: string };

export function estimateProviderCost(provider: string | null | undefined, requestedSeconds: number, requestType = "") : CostEstimate {
  const seconds = Math.max(0, Number(requestedSeconds) || 0);
  if (provider === "elevenlabs") {
    return { amount: Number(((seconds / 60) * 0.15).toFixed(4)), basis: "Observed Cantoa test: ~US$0.15 per generated minute (2026-09-02)" };
  }
  if (provider === "stability") {
    return { amount: 0.26, basis: "Observed Stable Audio 3.0 test: 26 credits ≈ US$0.26 per successful generation (2026-09-02)" };
  }
  if (provider === "mureka" && requestType === "video_soundtrack") {
    return { amount: 0.10, basis: "Observed Cantoa Mureka video-soundtrack test: ~US$0.10 per generation (2026-09-02)" };
  }
  if (provider === "mureka") {
    return { amount: null, basis: "Mureka song-generation cost not yet calibrated in Cantoa live tests" };
  }
  return { amount: null, basis: "No calibrated provider cost available" };
}
