import type { Metadata } from "next";
import "./globals.css";
import CantoaAnalytics from "@/components/cantoa-analytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://cantoamusic.com"),
  title: { default: "Cantoa — Turn Moments Into Music", template: "%s | Cantoa" },
  description: "Turn moments, stories, videos and ideas into original music. Create your first 2 music creations free with Cantoa.",
  applicationName: "Cantoa",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Cantoa — Turn Moments Into Music",
    description: "Turn moments, stories, videos and ideas into original music.",
    url: "https://cantoamusic.com",
    siteName: "Cantoa",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Cantoa — Turn Moments Into Music", description: "Turn moments, stories, videos and ideas into original music." },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
      <CantoaAnalytics />
    </html>
  );
}
