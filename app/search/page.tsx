import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/SearchPageClient";

const SEARCH_DESCRIPTION =
  "Search players, matches, seasons, managers, and opponents across United's full record since 1886.";

export const metadata: Metadata = {
  title: "Search",
  description: SEARCH_DESCRIPTION,
  alternates: { canonical: "/search" },
  openGraph: {
    type: "website",
    title: "Search · Red Thread",
    description: SEARCH_DESCRIPTION,
    url: "/search",
  },
  twitter: { card: "summary_large_image", title: "Search", description: SEARCH_DESCRIPTION },
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageClient />
    </Suspense>
  );
}
