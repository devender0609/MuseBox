export type CantoaPlan = "Explore" | "Creator" | "Studio" | "Owner";

export type CantoaFeature =
  | "gift_page"
  | "advanced_language"
  | "my_sound"
  | "social_video"
  | "lyric_video"
  | "creator_pack"
  | "advanced_revision"
  | "wav_export"
  | "stems"
  | "memory_movie"
  | "jingle_pack";

const FEATURE_PLANS: Record<CantoaFeature, CantoaPlan[]> = {
  gift_page: ["Explore", "Creator", "Studio", "Owner"],
  advanced_language: ["Explore", "Creator", "Studio", "Owner"],
  my_sound: ["Explore", "Creator", "Studio", "Owner"],
  social_video: ["Explore", "Creator", "Studio", "Owner"],
  lyric_video: ["Explore", "Creator", "Studio", "Owner"],
  creator_pack: ["Creator", "Studio", "Owner"],
  advanced_revision: ["Creator", "Studio", "Owner"],
  wav_export: ["Creator", "Studio", "Owner"],
  stems: ["Creator", "Studio", "Owner"],
  memory_movie: ["Studio", "Owner"],
  jingle_pack: ["Studio", "Owner"],
};

export function planAllowsFeature(plan: string | null | undefined, feature: CantoaFeature) {
  return FEATURE_PLANS[feature].includes((plan || "Explore") as CantoaPlan);
}

export function minimumPlanForFeature(feature: CantoaFeature) {
  if (FEATURE_PLANS[feature].includes("Explore")) return "Explore";
  if (FEATURE_PLANS[feature].includes("Creator")) return "Creator";
  return "Studio";
}
