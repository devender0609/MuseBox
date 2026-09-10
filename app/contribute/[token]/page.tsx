import type { Metadata } from "next";
import ContributionClient from "./contribution-client";
export const metadata: Metadata = { title: "Add a Memory", robots: { index: false, follow: false } };
export default async function ContributionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <main className="contribution-page"><ContributionClient token={token} /></main>;
}
