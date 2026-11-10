"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

/** Keep Next's navigation and cache handling, but warm a destination only when
 * the reader hovers, focuses, or presses its link. Dense record lists use
 * prefetch={false} instead. */
export function IntentLink({ onPointerEnter, onPointerDown, onFocus, ...props }: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const [active, setActive] = useState(false);
  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onPointerEnter={(event) => { setActive(true); onPointerEnter?.(event); }}
      onPointerDown={(event) => { setActive(true); onPointerDown?.(event); }}
      onFocus={(event) => { setActive(true); onFocus?.(event); }}
    />
  );
}
