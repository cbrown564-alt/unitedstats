import Link from "next/link";

/**
 * "Show the matches behind this" trail — every aggregate gets an evidence path.
 * On hover the underline is sewn in and fastened with a gold bead: the proof.
 */
export function EvidenceLink({ href, label = "Show the matches behind this →" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="sewn-link inline-block text-xs text-devil-bright focus-ring">
      {label}
    </Link>
  );
}
