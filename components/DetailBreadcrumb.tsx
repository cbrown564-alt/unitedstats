import Link from "next/link";

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

/**
 * Thin orient line for deep-linked detail pages — sticky on mobile so a cold
 * visitor from a shared link knows where they landed.
 */
export function DetailBreadcrumb({ segments }: { segments: BreadcrumbSegment[] }) {
  if (segments.length === 0) return null;
  return (
    <nav className="detail-breadcrumb" aria-label="Breadcrumb">
      {segments.map((seg, i) => {
        const last = i === segments.length - 1;
        return (
          <span key={`${seg.label}-${i}`} className="inline-flex items-center">
            {i > 0 && <span className="mx-1.5 text-ink-faint/70" aria-hidden>/</span>}
            {seg.href && !last ? (
              <Link href={seg.href} className="hover:text-devil-bright focus-ring">
                {seg.label}
              </Link>
            ) : (
              <span className={last ? "text-ink-dim" : undefined}>{seg.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
