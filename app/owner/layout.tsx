import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner Console",
  robots: { index: false, follow: false, nocache: true },
};

export default function OwnerLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
