# Compare page rework plan

_Dated 2026-06-28. Compare is high-intent — one of the first things a football fan
does, and a surface that has surfaced genuinely novel findings (e.g. Best and
Ronaldo's peak seasons rhyming). It was, before this work, "visually and
conceptually underdeveloped": lazy metrics (assist totals shown across a
recording boundary, scored as if fair), lazy presentation (a static SVG, an
uninviting table), and a scoreline that reduced two careers to a count. This
document captures the in-flight rework and the plan for the rest._

> **Status: §1 committed; §3 in progress.** The "Done this round" baseline below is
> committed (`f78dcff` + follow-ups). §1's verification is complete and §3's
> data-backed metric depth (per-90, hat-tricks, best season, debut rhyme) is now
> built and verified — see the updated checkboxes. Remaining §3 work hinges on a
> player-honours data pass; §2 is largely human-eyeball polish; §4/§6 are deferred.

---

## Done this round (uncommitted — verify, then commit as the baseline)

**Data model (`lib/compare.ts`)**
- `CompareMetric.comparable?: boolean` — false when the two sides' coverage differs enough to make a like-for-like judgement misleading. Shown but never scored.
- `CompareMetric.rate?: { a, b, label, fmt }` — the per-game counterpart for the Total / Per-game toggle.
- `CareerSeason.assists` added; career signature carries `aCovered` / `bCovered`.
- `Comparison.rhymes?: { label, detail }[]` — convergences, surfaced as a callout.
- `assistCovered()` — a player's career is assist-covered when ≥ 80% of apps fall in seasons from 1987-88 (the curated lane's start) on.

**Builders**
- Players: Goals carries a per-appearance rate; Assists carries one **and** is `comparable: false` when either career predates 1987-88, with an honest per-pair note ("X predates assist recording… the gap is an artifact of the record, not the player"). Standalone "Goals per appearance" row removed.
- Managers / Eras: Points / Goals / Conceded are now totals with per-game rate forms; the standalone PPG / Goals-per-game / Conceded-per-game rows are folded in. Win rate, Matches, Trophies stay toggle-immune.
- `playerRhymes()` detects shared shirt number, same career-peak season (on the normalized `n` axis), and overlapping United careers.

**Presentation (`components/CompareTable.tsx`, `components/charts/CareerDuelChart.tsx`)**
- Interactive career duel: Recharts (lazy, `ssr:false`), shared career-season axis, synced dual tooltip (both players' season + goals/per-app + apps), prominent peak dots, and **every point clickable** → that player's `/matches?player=…&season=…`. `rate` prop rescales y-axis total ⇄ per-app.
- Static `CareerArcDuel` **kept** for the `/explore` preview slide (`ComparisonHero`) — a client chart would flash blank there; the SVG is the right tool for SSR preview.
- Total / Per-game toggle is a URL param (`?rate=per-game`), so it is shareable and drives scoreline + chart + measures consistently.
- Measures strip → two-sided diverging bars (a tug-of-war), leader win-tinted, with a "coverage differs" pill on non-comparable rows.
- "Where they rhymed" callout band between the signature and the measures.
- Scoreline and verdict are rate-aware: in per-game the crafted total-mode headline is dropped for the honest "Leads X–Y" / "Level at X–Y" summary (the total headline would otherwise contradict a rate-based scoreline).

**Verified on the dev server** (before the last verdict edit): all four mode/param combos return 200; the peak-season rhyme fires for Ronaldo vs Best; assists are correctly flagged "coverage differs" for Rooney vs Charlton; the toggle rescales players and managers; rate labels render.

**Tests**: `tests/golden.test.ts` updated — asserts the "Matches" rename, Points+rate on managers, **and** that Rooney-vs-Charlton assists are `comparable: false`. All 139 tests pass; knip clean; lint clean on touched files (the two remaining lint errors are pre-existing `react-hooks/set-state-in-effect` in untouched files).

---

## 1. Finish the in-flight batch (do this first)

- [x] Verify the rate-aware verdict edit (`components/CompareTable.tsx`) actually renders — curl Ronaldo-vs-Best in both modes and confirm total shows the "out-scored" headline while per-game shows "Level at X–Y" (that pair flips: Best leads totals 2–0, level on per-game 1–1). — **Verified:** total → "George Best out-scored Cristiano Ronaldo 179–145."; per-90 (`?rate=per-game`) → "Level at 2–2 across 4 measures." (the count grew once hat-tricks + Best season landed, §3).
- [x] Full `npm test`, `npm run lint`, `npm run knip`, and a `next build` to confirm the lazy client chart chunk wires cleanly into the statically-rendered compare page. — **Green:** 139 tests pass; lint shows only the 2 pre-existing `react-hooks/set-state-in-effect` errors in untouched files; knip clean; `next build` succeeds with `/compare` prerendered.
- [x] Commit as the baseline ("Compare: coverage-honest metrics, total/per-game toggle, interactive career duel, rhymes"). — **Committed** as `f78dcff` (plus `b1a0103` for the click affordance and `f3142b1` for per-90).

---

## 2. Visual review & polish (the work hasn't been *seen* yet — only curl'd)

Everything above was verified by text match, not by looking at it. Sit with the running page and refine:

- [ ] **Diverging bars on mobile** — the `grid-cols-[2.5rem_1fr_1fr_2.5rem]` row may crowd on narrow screens; check value columns don't clip 3-4 digit totals + the "—". — _Inspected: the live grid is `grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,1fr)_2.5rem]`. A 4-char `stat-num` at `text-sm` is ~34px, fits the 40px cell; the `minmax(0,1fr)` bar columns shrink rather than letting values overflow. Widest real value (Ferguson, ~1450) fits. No change; worth one eyeball check on a 320px viewport._
- [ ] **Chart rendering** — peak dots visible above the curve; tooltip legible over both series; height (240) feels right beside the scoreboard; the `connectNulls` gap on Ronaldo's career break (2009→2021) reads correctly. — _Inspected in code: peak dots are r=4.5 with a panel-coloured stroke (sit above the curve given the top margin); tooltip renders both series with a synced cursor. The career arc is built **contiguously** from `playerSplitsBySeason` (`lib/compare.ts:164`), so Ronaldo's United seasons form one continuous array — there is no in-array null, and `connectNulls` is effectively a safety no-op. The 2009→2021 break reads as a single career-season step, the intended simplification. Visual feel (height/legibility) still wants a human eye._
- [x] **Clickable-point discoverability** — currently cursor-only. Consider a one-line caption ("Click a point to open that season") or a `<title>` on the svg, matching the `InspectableBarChart` "Click a bar to open its evidence" convention. — **Done:** added an SVG `<title>` (matching `InspectableBarChart.tsx:152`) *and* a visible Archivist-register caption beneath the chart (`CareerDuelChart.tsx`). Both live in the client component and surface on hydration.
- [ ] **Rhymes band** layout on mobile (it's a 2-col grid that collapses) and tone — the detail prose is mechanical ("Ronaldo's best was 2007-08 (42 goals); Best's, 1967-68 (32)"); tune per `docs/COPY-VOICE.md`. — _Layout: collapses to 1 col under `sm:` (fine on mobile). Tone: left as-is deliberately — `COPY-VOICE.md` §3 (Opta framing) says "the number and its scope are the entire payload… no adjectives," so the bare detail prose is **correct per the spec**; editorializing it would violate the doc. The "Where they rhymed" eyebrow is the only romantic note and stays._
- [ ] **Bar contrast** — win-yellow vs `ink-dim/30`; confirm the leader reads at a glance without overpowering. — _Deffered: a pure visual judgment; the leader uses `bg-win` + `text-win font-semibold` against `bg-ink-dim/30` neutrals, which is structurally a strong-enough distinction. Needs a human eye._

---

## 3. Players-mode metric depth (the "lazy in choosing what to present" complaint)

Coverage-gating fixed the worst case (assists across the boundary). The metric set itself is still thin:

- [ ] **Player honours / medals** — managers and eras carry trophy metrics; players have none. If the data supports it (league medals, cup winners' medals per player), add a honours metric or signature. — _Not yet investigated; needs a medal-attribution data pass (no per-player honours table today). Deferred._
- [x] **Per-90 vs per-appearance** — "per game" currently divides by appearances, but the football-standard rate is **per 90 minutes**. Decide: is per-appearance honest enough (minutes data is sparse historically), or do we add per-90 where minutes exist (modern era only, coverage-gated)? **Resolved & built:** minutes are *not* sparse — they derive from the lineup record for the whole dataset (starter → `sub_off` or full match; sub → final whistle minus `sub_on`; 90, or 120 when `aet=1`). Substitution counts per decade track the actual sub-rule history (1 from '65, 2 from '87, 3 from '95, 5 from '20), so the record is faithful, not gappy; pre-1965 there were no subs, so every starter played 90′ and minutes are trivially exact. **Replaced** per-appearance with per-90 (Total / Per 90 toggle), since per-90 strictly dominates per-app where they diverge (modern sub appearances) and ranks identically where they don't (pre-1965). The mode-aware label stays "Per game" for managers/eras (team-level). One honest floor, documented in code: a withdrawn starter in the pre-modern recording era with no `sub_off` is assumed to play the full match — a small (~5%), one-directional minutes overcount; stoppage time is not held per match, so durations are nominal 90/120 (standard — FBref/Opta do the same). Sane check: Ronaldo 0.49 G/90 vs Best 0.38 (per-90 credits Ronaldo where totals flatter Best); the Ronaldo-vs-Best verdict now flips total→per-90 from "out-scored" to "Level 1–1".
- [x] **More dimensions**: debut age, career length, hat-tricks, single-season peaks (the chart shows peaks but no metric captures "best season"). Each should pass the same coverage-honesty test. — **Resolved:** _debut age_ is out (`players.born` is empty across the dataset — no birth dates to age from); _career length_ is already carried by the side sublabel (year span) so a separate metric is redundant. **Built** the two scoring-depth dimensions the data does carry: **Hat-tricks** (count of 3+ goal matches, match-attributed, complete for every curated pair — Rooney 8, Charlton 7, Best 4, Ronaldo 3) and **Best season** (peak single-season goal return, with a note naming the season — the metric the peak dots only hinted at). Both derive from the same match-event record as the career arc, so they need no coverage gate; the global coverage note already covers match-attribution.
- [x] Apply the rhymes idea further: shared team-mates, same debut season, same number of trophies. — **Built** the data-backed one: _same debut season_ (a `first_year` match) now fires as a "Same debut season" rhyme. _Same number of trophies_ is blocked on the player-honours data pass above; _shared team-mates_ would need a heavier overlap query and is deferred.

---

## 4. Managers & eras signatures (deferred this round)

Scope explicitly limited the interactive work to players. The other two signatures are still static:

- [ ] **Eras skyline** → interactive (hover a season for the finish + squad context; click to open that season's matches). Same Recharts/lazy pattern.
- [ ] **Managers trophy cabinet** is already decent; lower priority. Could add hover on the glyph row.
- [ ] Rhymes for managers/eras: shared decade, shared players (a Busby Babe who also played under McGuinness), same title count.

---

## 5. Data discrepancy worth flagging (not a compare-page task)

- **George Best's `primary_shirt` is 11 in the record, not 7.** He is *associated* with #7, but the dataset attributes his most-used shirt as 11. This suppresses the "Both wore #7" rhyme for Ronaldo vs Best — the detector is correct given the data. Investigate shirt-number attribution in `lib/queries.ts` (the `primary_shirts` CTE) separately; if corrected, the rhyme lights up automatically.
- **Peak-season: the memory was #4, the data says #5.** Ronaldo's 4th season (2006-07) was 23 goals; his 5th (2007-08) was 42. Best's 5th (1967-68) was 32. The rhyme is real — at season 5, not 4. The feature surfaced the truth; no action, but worth knowing the detector corrects a plausible misremembering.

---

## 6. Accessibility

- [ ] Chart points are mouse-only (Recharts dots aren't keyboard-focusable). Add a keyboard path to open a season (e.g. an off-chart accessible list, or tabbable dots). The toggle is already a real link (good).
- [ ] Confirm the chart `aria-label` + the scoreboard reads sensibly to a screen reader (the scoreline is decorative-ish; the verdict carries the meaning).

---

## Decisions to lock before resuming

1. **Per-game denominator**: per-appearance (current) vs per-90 (football-standard, data-permitting). Determines whether §3 stays small or grows a data prerequisite. — **Locked → per-90.** Built; per-appearance replaced. Minutes derive cleanly across the whole dataset (no coverage gate needed). See §3 above.
2. **How far into managers/eras interactivity** this effort should reach — players was the high-value target; the other two are diminishing returns and the audit's stance was "keep them."
3. **Rhymes tone** — keep factual (current) or make more evocative, on the metaphor budget (`docs/SCOPE-AUDIT.md` Phase 4).
