import type { MetadataRoute } from "next";
import { MARKETING_SLUGS } from "@/lib/marketing-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://cantoamusic.com", changeFrequency: "weekly", priority: 1 },
    ...MARKETING_SLUGS.map((slug) => ({
      url: `https://cantoamusic.com/${slug}`,
      changeFrequency: "monthly" as const,
      priority: slug === "birthday-song" || slug === "wedding-song" ? 0.9 : 0.8,
    })),
  ];
}
