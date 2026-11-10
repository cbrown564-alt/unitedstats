import Link from "next/link";
import { fmtNum } from "@/lib/format";
import { QueryLink } from "@/components/QueryLink";

const LINK = "rounded px-2 py-1 text-devil-bright hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-devil-bright";

/**
 * Newer / page X / Y / Older pagination. Renders nothing for a single page.
 * `hrefFor` maps a target page number to its URL so each caller keeps control
 * of the other query params (filters, sort, hash anchors).
 */
export function Pager({
  page,
  pages,
  hrefFor,
  className = "",
  queryOnly = false,
}: {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
  className?: string;
  queryOnly?: boolean;
}) {
  if (pages <= 1) return null;
  const PageLink = queryOnly ? QueryLink : Link;
  return (
    <nav className={`${className} flex items-center justify-between gap-3 rounded-lg border border-line bg-panel px-3 py-2 text-sm`.trim()}>
      {page > 1 ? <PageLink href={hrefFor(page - 1)} className={LINK}>Newer</PageLink> : <span />}
      <span className="stat-num text-ink-faint">page {page} / {fmtNum(pages)}</span>
      {page < pages ? <PageLink href={hrefFor(page + 1)} className={LINK}>Older</PageLink> : <span />}
    </nav>
  );
}
