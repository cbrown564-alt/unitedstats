type UmamiWindow = Window & {
  umami?: { track: (name: string, data?: Record<string, string | number | boolean>) => void };
};

/** Only bounded product metadata is sent. Never send search text or arbitrary URLs. */
export function trackProductEvent(name: string, properties: Record<string, string | number | boolean> = {}) {
  try { (window as UmamiWindow).umami?.track(name, properties); } catch { /* Analytics must never interrupt navigation. */ }
}

export function analyticsDestination(href: string): Record<string, string> {
  const url = new URL(href, "https://utdred.com");
  const legacy = url.pathname.match(/^\/(match|player|opponent)\/([^/]+)$/);
  const kind = url.searchParams.get("kind") ?? legacy?.[1];
  const id = url.searchParams.get("id") ?? legacy?.[2];
  return {
    path: url.pathname,
    ...(kind && ["match", "player", "opponent"].includes(kind) && id ? { kind, id } : {}),
  };
}

export function redactAnalyticsUrl(value: string): string {
  const url = new URL(value, "https://utdred.com");
  url.search = "";
  url.hash = "";
  return url.toString();
}
