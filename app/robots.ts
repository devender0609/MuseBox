import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/share/"],
    },
    sitemap: "https://cantoamusic.com/sitemap.xml",
    host: "https://cantoamusic.com",
  };
}
