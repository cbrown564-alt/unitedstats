"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Pickable, useMatchCorrection } from "@/components/match/MatchCorrection";

function usePickable(fieldPath: string) {
  const ctx = useMatchCorrection();
  return !!ctx?.pickMode && ctx.hasField(fieldPath);
}

/** Detail-card fact that can become a pick target or stay a navigation link. */
export function MatchDetailCard({
  fieldPath,
  label,
  value,
  href,
  mono = false,
}: {
  fieldPath: string;
  label: string;
  value: ReactNode;
  href?: string;
  mono?: boolean;
}) {
  const pickable = usePickable(fieldPath);
  const body = (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">{label}</div>
      <div
        className={`mt-1.5 break-words text-[15px] font-medium leading-snug text-ink ${mono ? "stat-num tabular-nums" : ""} ${href && !pickable ? "group-hover/detail:text-devil-bright" : ""}`}
      >
        {value}
      </div>
    </>
  );
  const base = "min-w-0 rounded-lg border border-line bg-panel px-4 py-3";

  if (pickable) {
    return (
      <Pickable fieldPath={fieldPath} className={`relative block w-full text-left ${base}`}>
        {body}
      </Pickable>
    );
  }

  return href ? (
    <Link href={href} className={`group/detail relative block ${base} transition-colors hover:border-devil/50 focus-ring`}>
      {body}
      <span aria-hidden className="absolute right-3 top-3 text-xs text-ink-faint opacity-0 transition-opacity group-hover/detail:opacity-100">
        →
      </span>
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
}

/** Flat lineup row — shirt or name field in pick mode. */
export function MatchLineupPick({
  shirtPath,
  namePath,
  shirt,
  name,
  playerHref,
  meta,
}: {
  shirtPath: string;
  namePath: string;
  shirt: ReactNode;
  name: ReactNode;
  playerHref?: string;
  meta?: ReactNode;
}) {
  const pickShirt = usePickable(shirtPath);
  const pickName = usePickable(namePath);

  const nameEl =
    playerHref && !pickName ? (
      <Link href={playerHref} className="flex-1 hover:text-devil-bright focus-ring">
        {name}
      </Link>
    ) : pickName ? (
      <Pickable fieldPath={namePath} className="flex-1 text-left">
        {name}
      </Pickable>
    ) : (
      <span className="flex-1">{name}</span>
    );

  const shirtEl = pickShirt ? (
    <Pickable fieldPath={shirtPath} className="stat-num w-6 shrink-0 text-left text-ink-faint">
      {shirt}
    </Pickable>
  ) : (
    <span className="stat-num w-6 text-ink-faint">{shirt}</span>
  );

  return (
    <li className="flex items-center gap-2 rounded border border-line bg-panel px-3 py-1.5">
      {shirtEl}
      {nameEl}
      {meta}
    </li>
  );
}
