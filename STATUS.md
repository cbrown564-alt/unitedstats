# Status

Living project status for Red Thread (repo: **unitedstats**). Updated 2026-07-10.
The durable record of *what is done, what is closed, and what comes next*.
Product vocabulary and the bar a surface must clear remain in `CONTEXT.md` and
`PRODUCT.md`.

---

## Summary

The restraint pass cleared mechanical sprawl (loom routes dead, docs culled,
several surfaces reshaped) and shipped a real first-contact spark on the
homepage. **Phase 2 question expansion was attempted and did not work** — the
front door stays at four promoted myths, not a rebuilt catalogue. **`/explore`
is approved as-is** — no further reshape pass. **Mobile is complete** (Waves
0–2). **Phase 3a rediscovery engine is shipped** (charge × fadedness scoring,
entity rails, homepage/surprise integration, optional era bias). The three-chapter
**Stories** shelf is now published above Explore in the primary navigation; it is
a completed soul surface, not a parallel roadmap. The live-route copy rewrite
and restraint cleanup are complete; the remaining work is minor backlog and one
analytics scope decision.

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
| `/` homepage | Spark shipped (`TonightHero` + `lib/greatNights.ts`) — on-this-day tier + curated pool; rediscovery engine lives on entity pages and `/surprise` |
| `/data` | Acts I–III + developer appendix |
| `/analytics` | Elo + reliability + Monte Carlo replay (peaks/win-rate/attendance charts cut) |
| `/transfers` | Ledger + featured record deals |
| `/players` | Assists hidden by default; two leaderboards (apps + goals) |
| `/match/[id]` | Full-bleed sticky hero; mobile section tabs |
| `/seasons/[season]` | Prev/next merged into breadcrumb row |
| `/compare` | Curated debates + custom picker (custom picker accepted for now) |
| `/stories` | Shelf for three standalone, chrome-off `noindex` stories: Two No. 7s, Eleven days in May, and Fortress OT; legacy `/journey*` routes permanently redirect |

### Mobile — complete

Waves 0–2 merged (2026-07-01). Foundation + match filter sheet + match-detail
tabs + register cards + seasons cards + analytics chapter pager + match ledger
cards + TonightHero mobile polish. See `docs/MOBILE.md` § Completed phases.
Remaining items in that doc are optional polish, not blocking work.

### Clarity & docs (partial)

- `CONTEXT.md` and reconciled `PRODUCT.md` — nostalgist, soul+foundation, lens-not-loom
- `README.md` and `docs/ARCHITECTURE.md` refreshed to match shipped product (Jul 2026)

---

## Done — Phase 3a rediscovery engine (2026-07-03)

Charge × fadedness scoring in `lib/rediscovery.ts`; entity rails on season,
opponent, and player pages; homepage and `/surprise` consume the engine;
optional era bias via `?since=` + `EraPrompt`. Curated nights moved to
`lib/curatedNights.ts`. Tests in `tests/rediscovery.test.ts`.

## Done — Stories shelf (2026-07-10)

Three evidence-led standalone chapters are published at `/stories/[slug]` and
entered through `/stories`, which now precedes Explore in the desktop and mobile
navigation. Each chapter retains its chrome-off, `noindex` presentation and
light chapter cross-links; `/journey`, `/journey/treble`, and
`/journey/fortress` permanently redirect to their canonical story URLs.

The chapter shelf is deliberately complete at three stories. The stitched
time-journey and further chapters remain deferred until a distinct beat sheet
earns them (`docs/JOURNEY.md`). The Treble makes no unsupported cross-club
uniqueness claim.

## Done — Copy and restraint cleanup (2026-07-10)

The complete Tier A copy inventory (115 items) has been rewritten and passes the
strict smell gate. The old EntryChips registry and its tests are gone, as is the
opponent-page “All opponents” backtrail. The transient restraint-plan documents
were retired, with their remaining references removed. `docs/MOBILE.md` already
records Waves 0–2 as complete; its remaining ideas are explicitly optional.

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

## Next — minor backlog and one decision

- Decide whether analytics should retain the assist-partnership lane; either
  build it as a bounded player-page lens or explicitly drop it to `BACKLOG.md`.
- Keep the P1–P3 data and media items in `BACKLOG.md` moving only when they earn
  priority over record maintenance.

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
| `docs/HOMEPAGE.md` | TonightHero / spark design diary |
| `docs/MOBILE.md` | Mobile shipped phases |
| `BACKLOG.md` | Minor open bugs and polish |
