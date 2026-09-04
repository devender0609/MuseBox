export type MusicProvider = "elevenlabs" | "mureka" | "stability";

export type ProviderRequest = {
  prompt: string;
  duration: number;
  instrumental?: boolean;
  lyrics?: string;
  compositionPlan?: unknown;
  structured?: boolean;
  intent?: "song" | "background" | "soundtrack" | "alternate";
};

export type ProviderResult = {
  provider: MusicProvider;
  audio: ArrayBuffer;
  contentType: string;
  preferredProvider?: MusicProvider;
  attemptedProviders?: MusicProvider[];
  fallbackUsed?: boolean;
  routeReason?: string;
  latencyMs?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAudio(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("The generated audio could not be downloaded from the provider.");
  return {
    audio: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "audio/mpeg",
  };
}

function firstAudioUrl(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["url", "audio_url", "mp3_url", "wav_url", "stream_url"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && /^https:\/\//i.test(candidate)) return candidate;
  }
  for (const nested of ["choices", "songs", "results", "data"]) {
    const candidate = record[nested];
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const found = firstAudioUrl(item);
        if (found) return found;
      }
    }
  }
  return null;
}

export function availableMusicProviders() {
  return {
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY),
    mureka: Boolean(process.env.MUREKA_API_KEY),
    stability: Boolean(process.env.STABILITY_API_KEY),
  };
}

export function preferredProvider(request: ProviderRequest): MusicProvider {
  const available = availableMusicProviders();

  // Cost + workload aware routing, calibrated from Cantoa's live September 2026 tests:
  // - ordinary 1-minute ElevenLabs music generation: ~US$0.15
  // - Stable Audio 3.0 generation: 26 credits (~US$0.26 at the current credit purchase rate)
  // - Mureka remains the dedicated visual-soundtrack workflow in /api/soundtrack.
  // Therefore an Instrumental toggle alone must NOT force the more expensive Stable Audio path.
  // Stability is preferred when the request is specifically background/ambient/score-oriented,
  // where its workload fit can justify the higher per-generation cost.
  if (request.instrumental && request.intent === "background" && available.stability) return "stability";
  if (request.intent === "alternate" && available.mureka && request.lyrics?.trim()) return "mureka";
  if (available.elevenlabs) return "elevenlabs";
  if (request.instrumental && available.stability) return "stability";
  if (request.instrumental && available.mureka) return "mureka";
  if (available.mureka && request.lyrics?.trim()) return "mureka";
  throw new Error("No compatible music provider is configured on this deployment.");
}

export async function generateElevenLabs(request: ProviderRequest): Promise<ProviderResult> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ElevenLabs is not configured.");
  const headers = { "Content-Type": "application/json", "xi-api-key": key };
  let payload: Record<string, unknown> = {
    prompt: request.prompt,
    music_length_ms: request.duration * 1000,
    model_id: "music_v2",
    force_instrumental: Boolean(request.instrumental),
    store_for_inpainting: true,
  };
  if (request.compositionPlan && typeof request.compositionPlan === "object" && !Array.isArray(request.compositionPlan)) {
    payload = { composition_plan: request.compositionPlan, model_id: "music_v2", store_for_inpainting: true };
  } else if (request.structured && request.duration >= 30) {
    const planned = await fetch("https://api.elevenlabs.io/v1/music/plan", {
      method: "POST", headers,
      body: JSON.stringify({ prompt: request.prompt, music_length_ms: request.duration * 1000, model_id: "music_v2" }),
    });
    if (planned.ok) {
      const plan = (await planned.json()) as Record<string, unknown>;
      payload = { composition_plan: plan.composition_plan || plan, model_id: "music_v2", store_for_inpainting: true };
    }
  }
  const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
    method: "POST", headers, body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const raw = await response.text();
    const error = new Error(raw || "ElevenLabs could not generate this song.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return { provider: "elevenlabs", audio: await response.arrayBuffer(), contentType: "audio/mpeg" };
}

async function pollMureka(taskId: string, queryPath: "song" | "instrumental") {
  const key = process.env.MUREKA_API_KEY!;
  for (let attempt = 0; attempt < 45; attempt += 1) {
    await sleep(attempt === 0 ? 1200 : 3000);
    const response = await fetch(`https://api.mureka.ai/v1/${queryPath}/query/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${key}` }, cache: "no-store",
    });
    if (!response.ok) throw new Error("Mureka generation status could not be checked.");
    const data = await response.json() as Record<string, unknown>;
    const status = String(data.status || "");
    if (status === "succeeded") return data;
    if (["failed", "timeouted", "cancelled"].includes(status)) throw new Error(String(data.failed_reason || "Mureka generation failed."));
  }
  throw new Error("Mureka generation timed out before completion.");
}

export async function generateMureka(request: ProviderRequest): Promise<ProviderResult> {
  const key = process.env.MUREKA_API_KEY;
  if (!key) throw new Error("Mureka is not configured.");
  const instrumental = Boolean(request.instrumental);
  const path = instrumental ? "instrumental/generate" : "song/generate";
  const preparedLyrics = (request.lyrics || "").slice(0, 5000).trim();
  if (!instrumental && !preparedLyrics) throw new Error("Mureka vocal generation requires prepared lyrics.");
  const payload = instrumental
    ? { model: "auto", n: 1, prompt: request.prompt.slice(0, 1024) }
    : { model: "auto", n: 1, prompt: request.prompt.slice(0, 1024), lyrics: preparedLyrics };
  const response = await fetch(`https://api.mureka.ai/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error((await response.text()) || "Mureka could not start generation.");
  const task = await response.json() as Record<string, unknown>;
  const taskId = String(task.id || "");
  if (!taskId) throw new Error("Mureka did not return a generation task id.");
  const completed = await pollMureka(taskId, instrumental ? "instrumental" : "song");
  const url = firstAudioUrl(completed);
  if (!url) throw new Error("Mureka completed the song but did not return a downloadable audio URL.");
  const result = await fetchAudio(url);
  return { provider: "mureka", ...result };
}

export async function generateStability(request: ProviderRequest): Promise<ProviderResult> {
  const key = process.env.STABILITY_API_KEY;
  if (!key) throw new Error("Stable Audio is not configured.");
  const form = new FormData();
  form.append("prompt", request.prompt.slice(0, 10000));
  form.append("output_format", "mp3");
  form.append("duration", String(Math.min(360, Math.max(3, request.duration))));
  const response = await fetch("https://api.stability.ai/v2beta/audio/stable-audio/text-to-audio", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, Accept: "audio/*" },
    body: form,
  });
  if (response.status === 200) return { provider: "stability", audio: await response.arrayBuffer(), contentType: response.headers.get("content-type") || "audio/mpeg" };
  if (response.status !== 202) throw new Error((await response.text()) || "Stable Audio could not start generation.");
  const queued = await response.json() as { id?: string };
  if (!queued.id) throw new Error("Stable Audio did not return a generation id.");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await sleep(3000);
    const result = await fetch(`https://api.stability.ai/v2beta/audio/results/${encodeURIComponent(queued.id)}`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "audio/*" }, cache: "no-store",
    });
    if (result.status === 202) continue;
    if (!result.ok) throw new Error((await result.text()) || "Stable Audio generation failed.");
    return { provider: "stability", audio: await result.arrayBuffer(), contentType: result.headers.get("content-type") || "audio/mpeg" };
  }
  throw new Error("Stable Audio generation timed out before completion.");
}

export function providerRouteReason(request: ProviderRequest, provider: MusicProvider) {
  if (provider === "stability" && request.instrumental && request.intent === "background") return "background/ambient instrumental workload";
  if (provider === "mureka" && request.intent === "alternate") return "alternate generation with prepared lyrics";
  if (provider === "elevenlabs" && request.instrumental) return "ordinary instrumental; calibrated lower cost than Stable Audio for standard song-length requests";
  if (provider === "elevenlabs") return "primary vocal/song generation";
  return "compatible configured fallback";
}

export async function generateWithRouter(request: ProviderRequest): Promise<ProviderResult> {
  const started = Date.now();
  const first = preferredProvider(request);
  const order: MusicProvider[] = first === "elevenlabs"
    ? ["elevenlabs", ...(request.instrumental ? ["stability", "mureka"] : ["mureka"])] as MusicProvider[]
    : first === "stability"
      ? ["stability", "elevenlabs", "mureka"]
      : ["mureka", "elevenlabs", ...(request.instrumental ? ["stability"] : [])] as MusicProvider[];
  let lastError: unknown;
  const attempted: MusicProvider[] = [];
  for (const provider of [...new Set(order)]) {
    try {
      let result: ProviderResult | null = null;
      if (provider === "elevenlabs" && process.env.ELEVENLABS_API_KEY) { attempted.push(provider); result = await generateElevenLabs(request); }
      if (provider === "mureka" && process.env.MUREKA_API_KEY && (request.instrumental || request.lyrics?.trim())) { attempted.push(provider); result = await generateMureka(request); }
      if (provider === "stability" && process.env.STABILITY_API_KEY && request.instrumental) { attempted.push(provider); result = await generateStability(request); }
      if (result) return {
        ...result,
        preferredProvider: first,
        attemptedProviders: attempted,
        fallbackUsed: result.provider !== first,
        routeReason: providerRouteReason(request, result.provider),
        latencyMs: Date.now() - started,
      };
    } catch (error) { lastError = error; }
  }
  const failure = lastError instanceof Error ? lastError : new Error("No configured music provider could complete this request.");
  Object.assign(failure, { preferredProvider: first, attemptedProviders: attempted, latencyMs: Date.now() - started });
  throw failure;
}
