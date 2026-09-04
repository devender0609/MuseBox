import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

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
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18430730512"
        strategy="afterInteractive"
      />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-18430730512');
        `}
      </Script>
    </html>
  );
}
