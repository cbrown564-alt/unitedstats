"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtNum } from "@/lib/format";
import { buildSourceTree, type SourceFamily, type SourceUseCase, type SourceUsageRow } from "@/lib/sourceGroups";
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

function SourceKindBadge({ kind }: { kind: string }) {
  return (
    <span className="rounded border border-line/80 bg-panel-2/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
      {kind}
    </span>
  );
}

function UsageCount({ records, usageLabel }: { records: number; usageLabel: string }) {
  return (
    <span className="stat-num shrink-0 text-xs text-ink-dim">
      {fmtNum(records)}
      <span className="ml-1 font-sans font-normal text-ink-faint">{usageLabel}</span>
    </span>
  );
}

function ExampleLink({ example }: { example: SourceExample }) {
  return (
    <Link href={example.href} className="text-xs font-medium leading-snug text-devil-bright hover:underline">
      {example.label}
    </Link>
  );
}

function UseCaseRow({ useCase, example }: { useCase: SourceUseCase; example?: SourceExample }) {
  return (
    <li className="border-t border-line/50 first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 bg-panel px-4 py-3 sm:pl-10">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{useCase.label}</p>
          <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-ink-dim">{useCase.blurb}</p>
        </div>
        <div className="flex min-w-[10rem] shrink-0 flex-col items-end gap-1.5 text-right">
          <UsageCount records={useCase.records} usageLabel={useCase.usageLabel} />
          {example && <ExampleLink example={example} />}
        </div>
      </div>
    </li>
  );
}

function SourceFamilyRow({
  item,
  examplesByKey,
}: {
  item: SourceFamily;
  examplesByKey: Record<string, SourceExample>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-panel px-4 py-3 text-left text-sm transition-colors hover:bg-panel-2/50 focus-ring"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Chevron open={open} />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-ink">{item.label}</span>
            <SourceKindBadge kind={item.kind} />
          </div>
        </div>
        <span className="text-xs text-ink-faint">
          {item.useCases.length} use case{item.useCases.length === 1 ? "" : "s"}
        </span>
      </button>
      {open && (
        <div className="border-t border-line/70 bg-panel-2/20">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-line/50 px-4 py-3 sm:px-6">
            <p className="max-w-2xl text-sm leading-relaxed text-ink-dim">{item.summary}</p>
            {item.url && (
              <a
                href={item.url}
                className="shrink-0 text-xs font-semibold text-devil-bright hover:underline"
              >
                Open source →
              </a>
            )}
          </div>
          <ul>
            {item.useCases.map((useCase) => (
              <UseCaseRow
                key={useCase.sourceId}
                useCase={useCase}
                example={examplesByKey[useCase.id]}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function StandaloneSourceDetail({
  source,
  example,
}: {
  source: SourceUsageRow;
  example?: SourceExample;
}) {
  return (
    <div className="border-t border-line/70 bg-panel-2/30 px-4 py-4">
      {source.coverage && (
        <p className="max-w-3xl text-sm leading-relaxed text-ink">{source.coverage}</p>
      )}
      <div className={`flex flex-wrap items-start gap-x-8 gap-y-3 ${source.coverage ? "mt-3" : ""}`}>
        {example && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Example on file</p>
            <div className="mt-1.5">
              <ExampleLink example={example} />
            </div>
          </div>
        )}
        {source.url && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">Source</p>
            <a
              href={source.url}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-devil-bright hover:underline"
            >
              Open source →
            </a>
          </div>
        )}
      </div>
      {source.notes && (
        <p className="mt-3 max-w-3xl border-l-2 border-line/90 pl-3 text-xs leading-relaxed text-ink-dim">
          {source.notes}
        </p>
      )}
    </div>
  );
}

function StandaloneSourceRow({
  source,
  example,
}: {
  source: SourceUsageRow;
  example?: SourceExample;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-panel px-4 py-3 text-left text-sm transition-colors hover:bg-panel-2/50 focus-ring"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <Chevron open={open} />
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-ink">{source.label}</span>
            <SourceKindBadge kind={source.kind} />
          </div>
        </div>
        <UsageCount records={source.records} usageLabel={source.usageLabel} />
      </button>
      {open && <StandaloneSourceDetail source={source} example={example} />}
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
  const examplesByKey = Object.fromEntries(examples.map((e) => [e.use_case_id ?? e.source_id, e]));
  const tree = buildSourceTree(sources);

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {tree.map((item) =>
        item.type === "family" ? (
          <SourceFamilyRow key={item.id} item={item} examplesByKey={examplesByKey} />
        ) : (
          <StandaloneSourceRow key={item.source.id} source={item.source} example={examplesByKey[item.source.id]} />
        ),
      )}
    </ul>
  );
}
