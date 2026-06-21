"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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

/**
 * Highlight the parts of `text` that match the query tokens. Folds both sides
 * (diacritics stripped, lowercased) so the highlight tracks what actually
 * matched on the server — "solskjaer" lights up the "Solskjær" in the label.
 */
function highlight(text: string, query: string): ReactNode {
  const tokens = query
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return text;
  const folded = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  // Mark every character covered by a token's prefix match against the folded text.
  const hit = new Array<boolean>(text.length).fill(false);
  for (const tok of tokens) {
    let from = 0;
    for (;;) {
      const at = folded.indexOf(tok, from);
      if (at === -1) break;
      for (let i = at; i < at + tok.length && i < text.length; i++) hit[i] = true;
      from = at + tok.length;
    }
  }
  const parts: ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const on = hit[i];
    let j = i;
    while (j < text.length && hit[j] === on) j++;
    const chunk = text.slice(i, j);
    parts.push(on ? <mark key={i} className="bg-transparent text-devil-bright font-semibold">{chunk}</mark> : chunk);
    i = j;
  }
  return parts;
}

export function SearchCommand({
  autoFocusKey = true,
  autoFocusOnMount = false,
  compact = false,
  placeholder,
  onNavigate,
}: {
  autoFocusKey?: boolean;
  /** Focus the input as soon as it mounts (used by the mobile header panel). */
  autoFocusOnMount?: boolean;
  /** Slimmer styling and shorter placeholder for the persistent header search. */
  compact?: boolean;
  placeholder?: string;
  /** Fired when a result is chosen, so a wrapping panel can close itself. */
  onNavigate?: () => void;
}) {
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
    if (autoFocusOnMount) inputRef.current?.focus();
  }, [autoFocusOnMount]);

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
        onNavigate?.();
        router.push(target.href);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} className={`relative ${compact ? "w-full" : "max-w-xl"}`}>
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => rows.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={
          placeholder ??
          (compact
            ? "Search…"
            : 'Search — try "record away at Arsenal", "late goals under Ferguson", or a name…')
        }
        aria-label="Search players, opponents, seasons, managers, and shaped questions"
        className={
          compact
            ? "w-full rounded-md border border-line bg-panel px-3 py-1.5 text-sm placeholder:text-ink-faint focus:border-devil focus:outline-none"
            : "w-full bg-panel border border-line rounded-lg px-4 py-2.5 text-sm placeholder:text-ink-faint focus:outline-none focus:border-devil"
        }
      />
      {open && rows.length > 0 && (
        <div
          className={`absolute right-0 z-40 mt-1 w-full overflow-hidden rounded-lg border border-line bg-panel shadow-xl ${
            compact ? "sm:w-96" : ""
          }`}
        >
          {shaped.map((s, i) => (
            <Link
              key={s.title}
              href={s.href}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
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
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className={`flex items-center justify-between gap-3 px-4 py-2 text-sm ${
                active === shaped.length + i ? "bg-panel-2" : "hover:bg-panel-2"
              }`}
            >
              <span className="truncate">
                <span className="text-[10px] uppercase tracking-wider text-ink-faint mr-2 inline-block w-20">
                  {KIND_LABELS[r.kind] ?? r.kind}
                </span>
                <span className="font-medium">{highlight(r.label, q)}</span>
              </span>
              <span className="stat-num text-xs text-ink-faint whitespace-nowrap">{r.detail}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
