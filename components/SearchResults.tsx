"use client";

import Link from "next/link";
import type { SearchEntity, ShapedAnswer } from "@/lib/search";
import { highlight } from "@/lib/search/highlight";
import { KIND_LABELS } from "@/lib/search/examples";
import { AnswerCoverageTag } from "./AnswerCoverageTag";

/**
 * The shared, keyboard-driven results list rendered inside both the header
 * dropdown and the ⌘K palette. Shaped answers lead, then ranked entities; the
 * parent owns `active` (a flat index over shaped++entities) and passes it down so
 * the two surfaces share one keyboard model and one ARIA listbox contract.
 */
export function SearchResults({
  shaped,
  entities,
  query,
  active,
  listId,
  optionId,
  onSelect,
  onHover,
  footer,
}: {
  shaped: ShapedAnswer[];
  entities: SearchEntity[];
  query: string;
  active: number;
  listId: string;
  /** Builds the DOM id for option N, so the input can point aria-activedescendant at it. */
  optionId: (i: number) => string;
  onSelect: (href: string, entity?: SearchEntity) => void;
  onHover?: (i: number) => void;
  footer?: React.ReactNode;
}) {
  return (
    <>
    <ul id={listId} role="listbox" className="max-h-[70vh] overflow-y-auto">
      {shaped.map((s, i) => (
        <li key={s.title} id={optionId(i)} role="option" aria-selected={active === i}>
          <Link
            href={s.href}
            onClick={() => onSelect(s.href)}
            onMouseEnter={() => onHover?.(i)}
            className={`tap-target block px-4 py-2.5 border-b border-line ${active === i ? "bg-panel-2" : "hover:bg-panel-2"}`}
          >
            {s.tentative && (
              <div className="text-[10px] uppercase tracking-wider text-ink-faint">Did you mean</div>
            )}
            <div className="flex justify-between gap-3 text-sm">
              <span className="font-medium">{s.title}</span>
              <span className="shrink-0 text-xs text-devil-bright whitespace-nowrap">{s.hrefLabel}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="stat-num text-xs text-ink-dim">{s.summary}</span>
              {s.coverage && <AnswerCoverageTag coverage={s.coverage} />}
            </div>
          </Link>
        </li>
      ))}
      {entities.map((r, i) => {
        const idx = shaped.length + i;
        return (
          <li key={`${r.kind}-${r.href}`} id={optionId(idx)} role="option" aria-selected={active === idx}>
            <Link
              href={r.href}
              onClick={() => onSelect(r.href, r)}
              onMouseEnter={() => onHover?.(idx)}
              className={`tap-target flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:py-2 ${
                active === idx ? "bg-panel-2" : "hover:bg-panel-2"
              }`}
            >
              <span className="truncate">
                <span className="text-[10px] uppercase tracking-wider text-ink-faint mr-2 inline-block w-16 sm:w-20">
                  {KIND_LABELS[r.kind] ?? r.kind}
                </span>
                <span className="font-medium">{highlight(r.label, query)}</span>
              </span>
              <span className="stat-num text-xs text-ink-faint whitespace-nowrap">{r.detail}</span>
            </Link>
          </li>
        );
      })}
    </ul>
    {footer}
    </>
  );
}
