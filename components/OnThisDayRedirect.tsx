"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OnThisDayRedirect() {
  const router = useRouter();

  useEffect(() => {
    const now = new Date();
    const monthDay = `${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    router.replace(`/on-this-day/${monthDay}`);
  }, [router]);

  return (
    <p className="text-sm text-ink-dim">
      Opening today&apos;s page…
    </p>
  );
}
