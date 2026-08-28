import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MuseBox — Play a World",
  description: "Turn any idea into an original musical world you can touch, perform and share.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
