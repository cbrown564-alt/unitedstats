"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SearchEntity {
  kind: string;
  label: string;
  detail: string;
  href: string;
}

interface ShapedAnswer {
  title: string;
  summary: string;
  href: string;
  hrefLabel: string;
}

const KIND_LABELS: Record<string, string> = {
  player: "Player",
  manager: "Manager",
  opponent: "Opponent",
  season: "Season",
  competition: "Competition",
  match: "Match",
};

export function SearchCommand({ autoFocusKey = true }: { autoFocusKey?: boolean }) {
  const [q, setQ] = useState("");
  const [shaped, setShaped] = useState<ShapedAnswer[]>([]);
  const [entities, setEntities] = useState<SearchEntity[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // every navigable row, shaped answers first — keyboard order matches visual order
  const rows: { href: string }[] = [...shaped, ...entities];

  const onChange = (value: string) => {
    setQ(value);
    if (value.trim().length < 2) {
      setShaped([]);
      setEntities([]);
      setOpen(false);
    }
  };

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { shaped: ShapedAnswer[]; entities: SearchEntity[] };
        setShaped(data.shaped);
        setEntities(data.entities);
        setOpen(true);
        setActive(-1);
      } catch {
        // aborted or offline — keep previous results
      }
    }, 150);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  useEffect(() => {
    if (!autoFocusKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "SELECT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [autoFocusKey]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || rows.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      const target = rows[active === -1 ? 0 : active];
      if (target) {
        setOpen(false);
        router.push(target.href);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className="relative max-w-xl">
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => rows.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={'Search — try "record away at Arsenal", "late goals under Ferguson", or a name…'}
        aria-label="Search players, opponents, seasons, managers, and shaped questions"
        className="w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-devil"
      />
      {open && rows.length > 0 && (
        <div className="absolute z-40 mt-1 w-full border border-line rounded-lg bg-panel shadow-xl overflow-hidden">
          {shaped.map((s, i) => (
            <Link
              key={s.title}
              href={s.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2.5 border-b border-line ${active === i ? "bg-panel-2" : "hover:bg-panel-2"}`}
            >
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-medium">{s.title}</span>
                <span className="text-xs text-devil-bright whitespace-nowrap">{s.hrefLabel}</span>
              </div>
              <div className="stat-num text-xs text-ink-dim mt-0.5">{s.summary}</div>
            </Link>
          ))}
          {entities.map((r, i) => (
            <Link
              key={`${r.kind}-${r.href}`}
              href={r.href}
              onClick={() => setOpen(false)}
              className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${
                active === shaped.length + i ? "bg-panel-2" : "hover:bg-panel-2"
              }`}
            >
              <span className="truncate">
                <span className="text-[10px] uppercase tracking-wider text-ink-faint mr-2 inline-block w-20">
                  {KIND_LABELS[r.kind] ?? r.kind}
                </span>
                <span className="font-medium">{r.label}</span>
              </span>
              <span className="stat-num text-xs text-ink-faint whitespace-nowrap">{r.detail}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
