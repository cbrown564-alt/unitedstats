import { analyticsDestination, trackProductEvent } from "@/lib/analytics";
/** Query text stays local; only selection and result availability are measured. */
export function logSearchClick(_q: string, href: string, resultCount: number): void {
  trackProductEvent("search_selection", { ...analyticsDestination(href), result_count: resultCount });
}
