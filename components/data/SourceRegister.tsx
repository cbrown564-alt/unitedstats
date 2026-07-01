"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtNum } from "@/lib/format";
import {
  buildSourceTree,
  formatSourceFacets,
  SOURCE_FACET_LABELS,
  type SourceTreeItem,
  type SourceUsageRow,
} from "@/lib/sourceGroups";
import type { SourceExample } from "@/lib/queries";

function Chevron({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden
      className={`h-3 w-3 shrink-0 text-devil-bright/80 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"} ${className}`}
    >
      <path
        d="m2.5 4.5 3.5 3.5 3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourceDetail({
  source,
  example,
}: {
  source: SourceUsageRow;
  example?: SourceExample;
}) {
  return (
    <div className="border-t border-line/70 bg-panel-2/40 px-4 py-3 text-sm">
      {source.coverage && <p className="text-ink-dim">{source.coverage}</p>}
      <dl className="mt-3 space-y-2 text-xs">
        <div>
          <dt className="uppercase tracking-[0.12em] text-ink-faint">Layers cited</dt>
          <dd className="mt-0.5 text-ink-dim">{formatSourceFacets(source.facets)}</dd>
        </div>
        {source.notes && (
          <div>
            <dt className="uppercase tracking-[0.12em] text-ink-faint">Notes</dt>
            <dd className="mt-0.5 text-ink-dim">{source.notes}</dd>
          </div>
        )}
        {example && (
          <div>
            <dt className="uppercase tracking-[0.12em] text-ink-faint">Example on file</dt>
            <dd className="mt-1">
              <Link href={`/match/${example.id}`} className="font-medium text-devil-bright hover:underline">
                {example.date} · {example.opponent_name}{" "}
                <span className="stat-num">
                  {example.gf}-{example.ga}
                </span>
              </Link>
              <span className="ml-1.5 text-ink-faint">
                ({SOURCE_FACET_LABELS[example.facet] ?? example.facet})
              </span>
            </dd>
          </div>
        )}
      </dl>
      {source.url && (
        <a
          href={source.url}
          className="mt-3 inline-block text-xs font-semibold text-devil-bright hover:underline"
        >
          Open source →
        </a>
      )}
    </div>
  );
}

function SourceRow({
  source,
  example,
  nested = false,
}: {
  source: SourceUsageRow;
  example?: SourceExample;
  nested?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className={nested ? "border-t border-line/50 first:border-t-0" : undefined}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-panel px-4 py-2.5 text-left text-sm transition-colors hover:bg-panel-2/50 focus-ring ${nested ? "pl-8" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Chevron open={open} />
          <div className="min-w-0">
            <span className="font-semibold">{source.label}</span>
            <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-dim">{source.kind}</span>
          </div>
        </div>
        <span className="stat-num shrink-0 text-xs text-ink-dim">{fmtNum(source.matches)} matches</span>
      </button>
      {open && <SourceDetail source={source} example={example} />}
    </li>
  );
}

function SourceGroupRow({
  item,
  examplesBySource,
}: {
  item: Extract<SourceTreeItem, { type: "group" }>;
  examplesBySource: Record<string, SourceExample>;
}) {
  const [groupOpen, setGroupOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setGroupOpen((v) => !v)}
        aria-expanded={groupOpen}
        className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-panel px-4 py-2.5 text-left text-sm transition-colors hover:bg-panel-2/50 focus-ring"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Chevron open={groupOpen} />
          <div className="min-w-0">
            <span className="font-semibold">{item.label}</span>
            <span className="ml-2 text-[11px] uppercase tracking-wider text-ink-dim">
              {item.sources.length} sources
            </span>
          </div>
        </div>
        <span className="stat-num shrink-0 text-xs text-ink-dim">{fmtNum(item.matches)} matches</span>
      </button>
      {groupOpen && (
        <div className="border-t border-line/70">
          <p className="bg-panel-2/30 px-4 py-2 text-xs text-ink-dim">{item.summary}</p>
          <ul>
            {item.sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                example={examplesBySource[source.id]}
                nested
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

export function SourceRegister({
  sources,
  examples,
}: {
  sources: SourceUsageRow[];
  examples: SourceExample[];
}) {
  const examplesBySource = Object.fromEntries(examples.map((e) => [e.source_id, e]));
  const tree = buildSourceTree(sources);

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {tree.map((item) =>
        item.type === "group" ? (
          <SourceGroupRow key={item.id} item={item} examplesBySource={examplesBySource} />
        ) : (
          <SourceRow key={item.source.id} source={item.source} example={examplesBySource[item.source.id]} />
        ),
      )}
    </ul>
  );
}
