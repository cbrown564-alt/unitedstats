"use client";

import { useEffect, useState } from "react";

export type MobileShellTier = "phone" | "narrow" | "desktop";

const PHONE_QUERY = "(max-width: 639px)";
const NARROW_QUERY = "(min-width: 640px) and (max-width: 1023px)";

function readTier(): MobileShellTier {
  if (typeof window === "undefined") return "desktop";
  if (window.matchMedia(PHONE_QUERY).matches) return "phone";
  if (window.matchMedia(NARROW_QUERY).matches) return "narrow";
  return "desktop";
}

/** Phone (<sm), narrow shell (sm–lg), or desktop (lg+) for mobile chrome branching. */
export function useMobileShellTier(): MobileShellTier {
  const [tier, setTier] = useState<MobileShellTier>(readTier);

  useEffect(() => {
    const phone = window.matchMedia(PHONE_QUERY);
    const narrow = window.matchMedia(NARROW_QUERY);
    const update = () => setTier(readTier());
    update();
    phone.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      phone.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, []);

  return tier;
}
