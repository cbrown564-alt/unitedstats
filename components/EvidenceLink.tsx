import Link from "next/link";

/** "Show the matches behind this" trail — every aggregate gets an evidence path. */
export function EvidenceLink({ href, label = "Show the matches behind this →" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="text-xs text-devil-bright hover:underline inline-block">
      {label}
    </Link>
  );
}
