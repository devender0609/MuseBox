import type { Metadata } from "next";
import MarketingLanding from "@/components/marketing-landing";
import { MARKETING_PAGES } from "@/lib/marketing-pages";

const page = MARKETING_PAGES["hindi-song"];

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  keywords: page.keywords,
  alternates: { canonical: `https://cantoamusic.com/${page.slug}` },
  openGraph: {
    title: `${page.title} | Cantoa`,
    description: page.description,
    url: `https://cantoamusic.com/${page.slug}`,
    siteName: "Cantoa",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: `${page.title} | Cantoa`, description: page.description },
};

export default function Page() {
  return <MarketingLanding page={page} />;
}
