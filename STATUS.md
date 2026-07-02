# Status

Living project status for Red Thread (repo: **unitedstats**). Updated 2026-07-02.
Supersedes the transient progress notes in `docs/RESTRAINT-PASS.md` for *what is
done, what is closed, and what comes next*. Product vocabulary and the bar a
surface must clear remain in `CONTEXT.md` and `PRODUCT.md`.

---

## Summary

The restraint pass cleared mechanical sprawl (loom routes dead, docs culled,
several surfaces reshaped) and shipped a real first-contact spark on the
homepage. **Phase 2 question expansion was attempted and did not work** — the
front door stays at four promoted myths, not a rebuilt catalogue. **`/explore`
is approved as-is** — no further reshape pass. **Mobile is complete** (Waves
0–2). The next major phase of work is the **rediscovery engine**, followed by
the **on-site copy rewrite** and a **cleanup** pass to retire scaffolding and
dead code.

---

## Done

### Data & pipeline

- **6,028 matches** (1886–present), **6,022** with validated United starting XIs
- Auto-update via GitHub Actions; optional Vercel Blob + path revalidation
- Public API (`/api/v1/*`) and flat exports (`/dataset/*`)
- Structured corrections workflow (`/corrections`, `/feedback`)

### Restraint pass — mechanical cuts

- `/history-changed`, `/collection`, `/embed` removed
- `/cut` fork builder retired — curated ladders only; fork URLs redirect to `/explore`
- `/opponents` index cut (redirect to `/search`); `/opponent/[id]` kept
- `/questions` index subsumed into `/explore`; four promoted myths on the front door
- Docs cull executed (narration docs gone; keep-list in `docs/`)

### Surfaces shipped or reshaped

| Surface | State |
|---|---|
| `/` homepage | Spark shipped (`TonightHero` + `lib/greatNights.ts`) — curated pool + on-this-day tier; not yet the computable rediscovery engine |
| `/data` | Acts I–III + developer appendix |
| `/analytics` | Elo + reliability + Monte Carlo replay (peaks/win-rate/attendance charts cut) |
| `/transfers` | Ledger + featured record deals |
| `/players` | Assists hidden by default; two leaderboards (apps + goals) |
| `/match/[id]` | Full-bleed sticky hero; mobile section tabs |
| `/seasons/[season]` | Prev/next merged into breadcrumb row |
| `/compare` | Curated debates + custom picker (custom picker accepted for now) |

### Mobile — complete

Waves 0–2 merged (2026-07-01). Foundation + match filter sheet + match-detail
tabs + register cards + seasons cards + analytics chapter pager + match ledger
cards + TonightHero mobile polish. See `docs/MOBILE.md` § Completed phases.
Remaining items in that doc are optional polish, not blocking work.

### Clarity & docs (partial)

- `CONTEXT.md` and reconciled `PRODUCT.md` — nostalgist, soul+foundation, lens-not-loom
- `README.md` and `docs/ARCHITECTURE.md` refreshed to match shipped product (Jul 2026)

---

## Closed — not continuing

| Item | Decision |
|---|---|
| **Phase 2 — expand the questions catalogue** | Attempted (decline, rivalries, Europe, Ferguson-vs-field, etc.). **Did not work** — wrong selection or wrong bar for the product. Front door stays at **four promoted myths** (`ferguson-era`, `treble`, `fortress`, `late-goals`). Archived slugs remain routable with `noindex`. |
| **`/explore` reshape** | **Approved as-is.** Three strips (questions, curated debates, curated cuts) are the intended Discover hub. No doorway collapse pass. |
| **`/history-changed` freshness loop** | Cut — out of product purpose (`CONTEXT.md` §2). |
| **Phase 4 chart consolidation** | Parked — no user-visible defect; revisit only if charts are touched broadly. |
| **Compare loom removal** | Deferred — curated debates + custom picker accepted; not on the critical path. |

---

## Next — three workstreams

In leverage order.

### 1. Rediscovery engine (Phase 3a) — **major phase**

**Why.** The homepage spark (`TonightHero`) proves the product can land emotionally,
but it is **hand-curated curation**, not the computable class described in
`docs/RESTRAINT-PASS.md` § Phase 3a and `CONTEXT.md` §6. The 2015 Europa League
jolt that validated the product was *forgotten + charged + in your era* — that
needs an engine, not a longer curated list.

**Spec (from restraint pass, still authoritative):**

Score every match by:

- **Charge** — knockout exits (esp. European upsets), derby/rivalry results,
  extreme scorelines, comebacks/collapses, giant-killings, streak-enders, late
  drama, big-crowd nights. Reuse existing helpers (comebacks module, late-goal
  detection, streaks, rivalry data) where they exist.
- **× Fadedness** — age band ~5–30 years (living-memory zone); exclude
  canonical-fame nights everyone already knows (Treble final, etc.).
- **× Your era** *(optional unlock)* — single value: *"Following United since ___?"*
  via URL param or `localStorage`; no account, no tracking. Biases rolls into
  the reader's own living memory.

Frame output as a **recognition prompt** ("Do you remember…?"), not a fixture row.

**Wire without new routes:**

| Surface | Integration |
|---|---|
| Entity pages | "You might have forgotten…" rail — highest-charge faded night from that season / opponent / player history |
| Homepage | Extend or replace curated-pool fallback with engine-driven rolls; keep on-this-day tier when it clears the spectacle floor |
| `/surprise` | Nostalgia mode — engine-driven match nights instead of (or alongside) curated facts |

**Proto today:** `lib/greatNights.ts` (two-tier: on-this-day + `CURATED_NIGHTS`).
The engine should grow from or alongside this module — not a parallel system.

**Honest limit:** The exact personal jolt cannot be guaranteed. The win is
*only ever* serving forgotten + charged + in-your-era matches, raising hit-rate
from calendar lottery to high. Grade coverage honestly where charge factors
need modern event data.

**Definition of done for this phase:**

- Charge × fadedness scoring implemented and tested against a sample of known
  "charged faded" nights (including 2015 Europa exit class).
- Entity-page rediscovery rail live on at least season, opponent, and player pages.
- Homepage and `/surprise` consume the engine (curated pool becomes fallback or
  seed list, not the only source).
- Optional era bias shipped with a clear, guardrail-safe UX.

---

### 2. On-site copy rewrite

**Why.** Audience evidence ranked templated connective copy as the **#1
pre-launch credibility fix** — same disease as the 6,200-line docs already cut.
The question *format* and data voice are fine; the *connective tissue* between
modules reads as AI-generated prototype.

**Scope:**

- Plain, human voice across page deks, section intros, and `QuestionModules` copy
- Keep coverage grades and provenance language — those are trust, not decoration
- Register: product with atmosphere (`DESIGN.md`); not punditry, not liturgy

**Out of scope:** Rewriting `PRODUCT.md` / `CONTEXT.md` (already reconciled).

**Definition of done:** A pass over the live routes a first-time visitor hits
(home, explore, one question depth page, match, player, data) with no
remaining "spine / front door / red thread" templated cadence in user-visible copy.

---

### 3. Cleanup

**Why.** Close the restraint pass properly: remove scaffolding, dead code, and
stale docs so the repo reflects decisions above.

| Item | Action |
|---|---|
| `docs/RESTRAINT-PASS.md` | Delete when rediscovery + copy are done (pass's own definition of done) |
| `docs/RESTRAINT-PASS-PHASE2-REVIEW.md` | Delete with restraint scaffolding |
| `lib/entryPoints.ts` | Remove module + tests (dead since EntryChips cut) |
| `/opponent/[id]` "All opponents" footer trail | Remove per `CONTEXT.md` §4 (discover via search/matches) |
| `docs/ARCHITECTURE.md` "836 lineups" class drift | Already fixed Jul 2026 — keep in sync on future data milestones |
| `docs/MOBILE.md` status header | Mark complete / move wishlist items to `BACKLOG.md` if still wanted |
| Analytics supply-lines Act III | **Decide:** build assist-partnership barbell (`CONTEXT.md` §4) or explicitly drop from scope and note in `BACKLOG.md` |

**Definition of done:** Knip clean; no references to deleted restraint docs;
`STATUS.md` remains the single progress doc until the next major phase completes.

---

## Open backlog (minor)

See `BACKLOG.md` for P1–P3 items (player media gaps, strict media CI, pre-war OG
scorer display, player page Tableau block). These run parallel to the three
workstreams above, not ahead of them.

---

## References

| Doc | Role |
|---|---|
| `PRODUCT.md` | Product definition and promise |
| `CONTEXT.md` | Nostalgist, soul+foundation, lens-not-loom, surface verdicts |
| `docs/RESTRAINT-PASS.md` | Phase 3a spec (transient — delete after cleanup) |
| `docs/HOMEPAGE.md` | TonightHero / spark design diary |
| `docs/MOBILE.md` | Mobile shipped phases |
| `BACKLOG.md` | Minor open bugs and polish |
