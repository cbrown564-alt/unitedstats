"use client";

import { useReportWebVitals } from "next/web-vitals";

const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT;
const debug = process.env.NEXT_PUBLIC_DEBUG_WEB_VITALS === "1";

export function WebVitals() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      ...metric,
      path: window.location.pathname,
      search: window.location.search,
    });

    if (debug) console.info("[web-vitals]", metric);
    if (!endpoint) return;

    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      } else {
        void fetch(endpoint, {
          method: "POST",
          body,
          keepalive: true,
          headers: { "content-type": "application/json" },
        });
      }
    } catch {
      // Metrics reporting must never affect navigation or interactivity.
    }
  });

  return null;
}
