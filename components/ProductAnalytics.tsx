"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analyticsDestination, trackProductEvent } from "@/lib/analytics";

export function ProductAnalytics() {
  const pathname = usePathname();
  useEffect(() => {
    const click = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-analytics-event]");
      if (!link) return;
      const name = link.dataset.analyticsEvent;
      if (name === "night_click" || name === "related_content_click") trackProductEvent(name, { from: pathname, ...analyticsDestination(link.href) });
    };
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [pathname]);
  return null;
}
