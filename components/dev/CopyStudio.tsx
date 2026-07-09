/**
 * Copy Studio — local review UI for the launch voice rewrite.
 * Paste edits back into source TS/TSX; mark status here; re-run copy:extract to sync.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CopyItem,
  CopyQueueEntry,
  CopyQueueStatus,
  CopyTier,
} from "@/lib/copyTypes";
import {
  COPY_QUEUE_STATUSES,
  COPY_RUBRIC_CHECKS,
  countByStatus,
} from "@/lib/copyTypes";

type StudioProps = {
  items: CopyItem[];
  initialEntries: Record<string, CopyQueueEntry>;
};

type StatusFilter = CopyQueueStatus | "all";
type TierFilter = CopyTier | "all";

const STATUS_LABEL: Record<CopyQueueStatus, string> = {
  todo: "Todo",
  rewritten: "Rewritten",
  keep: "Keep",
  skip: "Skip",
};

const STATUS_TONE: Record<CopyQueueStatus, string> = {
  todo: "border-line text-ink-dim",
  rewritten: "border-win/40 text-win",
  keep: "border-europe/40 text-europe",
  skip: "border-line text-ink-faint",
};

function snippet(text: string, n = 96): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length <= n ? one : `${one.slice(0, n - 1)}…`;
}

type DetailProps = {
  item: CopyItem;
  siblings: CopyItem[];
  initialNotes: string;
  saving: boolean;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onSave: (id: string, patch: { status?: CopyQueueStatus; notes?: string | null }) => Promise<void>;
  onStatus: (status: CopyQueueStatus, notes: string) => Promise<void>;
  onError: (message: string | null) => void;
};

/** Remounted per item id so draft/notes initialize from catalog without sync effects. */
function CopyStudioDetail({
  item,
  siblings,
  initialNotes,
  saving,
  onSelect,
  onPrev,
  onNext,
  onSave,
  onStatus,
  onError,
}: DetailProps) {
  const [draft, setDraft] = useState(item.text);
  const [notes, setNotes] = useState(initialNotes);
  const [rubric, setRubric] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      onError("Clipboard unavailable — select the draft and copy manually.");
    }
  }

  return (
    <>
      <div className="rounded-lg border border-line bg-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="stat-num text-[11px] text-ink-faint">{item.id}</p>
            <p className="mt-1 text-xs text-ink-dim">
              <span className="text-ink">{item.file}</span>
              {" · "}
              {item.kind}
              {" · tier "}
              {item.tier}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.route ? (
              <a
                href={item.route}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-line bg-panel-2 px-2.5 py-1.5 text-xs text-devil-bright hover:border-devil/60"
              >
                Open surface →
              </a>
            ) : null}
            <button
              type="button"
              onClick={onPrev}
              className="rounded border border-line px-2.5 py-1.5 text-xs text-ink-dim hover:bg-panel-2"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded border border-line px-2.5 py-1.5 text-xs text-ink-dim hover:bg-panel-2"
            >
              Next
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-ink-dim" htmlFor="copy-draft">
                Draft (paste into source)
              </label>
              <button
                type="button"
                onClick={() => void copyDraft()}
                className="text-[11px] text-devil-bright hover:underline"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <textarea
              id="copy-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              className="w-full resize-y rounded border border-line bg-pitch px-3 py-2 font-sans text-sm leading-6 text-ink"
            />
            {draft !== item.text ? (
              <p className="mt-1 text-[11px] text-gold">
                Draft differs from catalog — paste into {item.file}, then mark rewritten and
                re-extract.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-ink-faint">Matches catalog text.</p>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-dim">Rubric</p>
            <ul className="space-y-2 rounded border border-line bg-pitch p-3">
              {COPY_RUBRIC_CHECKS.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-ink-dim">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={Boolean(rubric[c.id])}
                      onChange={(e) =>
                        setRubric((prev) => ({ ...prev, [c.id]: e.target.checked }))
                      }
                    />
                    <span>{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-ink-faint">
              Checklist is session-local. Persist judgment via status + notes.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium text-ink-dim" htmlFor="copy-notes">
            Notes
          </label>
          <textarea
            id="copy-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1.5 w-full resize-y rounded border border-line bg-pitch px-3 py-2 text-sm text-ink"
            placeholder="Optional — why keep / what changed"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {COPY_QUEUE_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={saving}
              onClick={() => void onStatus(s, notes)}
              className={`rounded border px-3 py-1.5 text-xs uppercase tracking-wide disabled:opacity-50 ${STATUS_TONE[s]} hover:bg-panel-2`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(item.id, { notes: notes.trim() ? notes : null })}
            className="rounded border border-line px-3 py-1.5 text-xs text-ink-dim hover:bg-panel-2 disabled:opacity-50"
          >
            Save notes
          </button>
        </div>
      </div>

      {siblings.length > 0 ? (
        <div className="rounded-lg border border-line bg-panel p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Same group
          </h2>
          <ul className="mt-3 space-y-3">
            {siblings.map((sib) => (
              <li key={sib.id}>
                <button type="button" onClick={() => onSelect(sib.id)} className="text-left">
                  <span className="stat-num text-[11px] text-devil-bright">{sib.id}</span>
                  <span className="ml-2 text-[11px] text-ink-faint">{sib.kind}</span>
                  <p className="mt-0.5 text-sm leading-5 text-ink-dim">{snippet(sib.text, 140)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

export function CopyStudio({ items, initialEntries }: StudioProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [tier, setTier] = useState<TierFilter>("A");
  const [status, setStatus] = useState<StatusFilter>("todo");
  const [group, setGroup] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const set = new Set(items.map((i) => i.group));
    return ["all", ...[...set].sort()];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (tier !== "all" && it.tier !== tier) return false;
      const st = entries[it.id]?.status ?? "todo";
      if (status !== "all" && st !== status) return false;
      if (group !== "all" && it.group !== group) return false;
      return true;
    });
  }, [items, entries, tier, status, group]);

  const activeId =
    selectedId && filtered.some((i) => i.id === selectedId)
      ? selectedId
      : (filtered[0]?.id ?? null);

  const selected = useMemo(
    () => (activeId ? items.find((i) => i.id === activeId) ?? null : null),
    [items, activeId],
  );

  const selectedIndex = activeId ? filtered.findIndex((i) => i.id === activeId) : -1;

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const siblings = useMemo(() => {
    if (!selected?.siblings?.length) return [];
    return selected.siblings
      .map((id) => byId.get(id))
      .filter((x): x is CopyItem => Boolean(x));
  }, [selected, byId]);

  const progress = useMemo(() => {
    const tierA = items.filter((i) => i.tier === "A");
    const counts = { done: 0, total: tierA.length };
    for (const it of tierA) {
      const st = entries[it.id]?.status ?? "todo";
      if (st === "rewritten" || st === "keep") counts.done += 1;
    }
    const all = countByStatus({ updatedAt: "", entries });
    return { tierA: counts, all };
  }, [items, entries]);

  const selectByOffset = useCallback(
    (delta: number) => {
      if (filtered.length === 0) return;
      const base = selectedIndex >= 0 ? selectedIndex : 0;
      const next = (base + delta + filtered.length) % filtered.length;
      setSelectedId(filtered[next].id);
    },
    [filtered, selectedIndex],
  );

  const saveEntry = useCallback(
    async (id: string, patch: { status?: CopyQueueStatus; notes?: string | null }) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch("/api/dev/copy-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...patch }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error ?? `save failed (${res.status})`);
        }
        const entry = (await res.json()) as CopyQueueEntry;
        setEntries((prev) => ({ ...prev, [id]: entry }));
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  const setStatusAndAdvance = useCallback(
    async (next: CopyQueueStatus, notes: string) => {
      if (!selected) return;
      const currentId = selected.id;
      await saveEntry(currentId, {
        status: next,
        notes: notes.trim() ? notes : null,
      });
      if (next === "rewritten" || next === "keep" || next === "skip") {
        const idx = filtered.findIndex((i) => i.id === currentId);
        const after = filtered.slice(idx + 1).find((i) => i.id !== currentId);
        const before = filtered.slice(0, idx).find((i) => i.id !== currentId);
        const prefer = after ?? before;
        if (prefer) setSelectedId(prefer.id);
      }
    },
    [selected, saveEntry, filtered],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT";
      if (e.key === "j" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectByOffset(1);
      } else if (e.key === "k" && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        selectByOffset(-1);
      } else if (e.key === "Escape" && typing) {
        (e.target as HTMLElement).blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectByOffset]);

  return (
    <div className="space-y-4">
      <header className="border-b border-line/80 pb-4">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-devil-bright">
          Dev · copy studio
        </p>
        <h1 className="display text-2xl sm:text-3xl">Voice rewrite queue</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-ink-dim">
          Review catalog strings against the rubric, paste rewrites into source, then mark status.
          Re-run <code className="stat-num text-xs">npm run copy:extract</code> to sync text;{" "}
          <code className="stat-num text-xs">npm run copy:persist</code> to commit queue progress.
          {" "}
          <kbd className="stat-num rounded border border-line px-1 text-[11px]">j</kbd>/
          <kbd className="stat-num rounded border border-line px-1 text-[11px]">k</kbd> next/prev.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-dim">
          <span>
            Tier A progress:{" "}
            <span className="stat-num text-ink">
              {progress.tierA.done}/{progress.tierA.total}
            </span>
          </span>
          <span className="text-ink-faint">·</span>
          <span>
            todo {progress.all.todo} · rewritten {progress.all.rewritten} · keep {progress.all.keep}{" "}
            · skip {progress.all.skip}
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-ink-faint">
          Tier
          <select
            className="mt-1 block rounded border border-line bg-panel px-2 py-1.5 text-sm text-ink"
            value={tier}
            onChange={(e) => setTier(e.target.value as TierFilter)}
          >
            <option value="all">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>
        <label className="text-xs text-ink-faint">
          Status
          <select
            className="mt-1 block rounded border border-line bg-panel px-2 py-1.5 text-sm text-ink"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            {COPY_QUEUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 text-xs text-ink-faint">
          Group
          <select
            className="mt-1 block w-full rounded border border-line bg-panel px-2 py-1.5 text-sm text-ink"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <p className="pb-1.5 text-xs text-ink-faint">
          Showing <span className="stat-num text-ink">{filtered.length}</span>
        </p>
      </div>

      {error ? (
        <p className="rounded border border-loss/50 bg-panel-2 px-3 py-2 text-sm text-ink">{error}</p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <div className="max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-panel">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-ink-faint">No items match these filters.</p>
          ) : (
            <ul className="divide-y divide-line/80">
              {filtered.map((it) => {
                const st = entries[it.id]?.status ?? "todo";
                const active = it.id === activeId;
                return (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(it.id)}
                      className={`w-full px-3 py-2.5 text-left transition-colors ${
                        active ? "bg-panel-2" : "hover:bg-panel-2/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="stat-num truncate text-[11px] text-ink-faint">{it.id}</span>
                        <span
                          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${STATUS_TONE[st]}`}
                        >
                          {STATUS_LABEL[st]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        {it.tier} · {it.kind} · {it.group}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-ink-dim">{snippet(it.text)}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          {!selected ? (
            <p className="rounded-lg border border-line bg-panel p-6 text-sm text-ink-faint">
              Select a string to review.
            </p>
          ) : (
            <CopyStudioDetail
              key={selected.id}
              item={selected}
              siblings={siblings}
              initialNotes={entries[selected.id]?.notes ?? ""}
              saving={saving}
              onSelect={setSelectedId}
              onPrev={() => selectByOffset(-1)}
              onNext={() => selectByOffset(1)}
              onSave={saveEntry}
              onStatus={setStatusAndAdvance}
              onError={setError}
            />
          )}
        </div>
      </div>
    </div>
  );
}
