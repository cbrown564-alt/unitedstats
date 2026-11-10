# Stay on Next after the Astro /seasons spike

The architecture audit (`docs/reviews/architecture-audit-2026-11-10.md` §5) said to port `/seasons`
alone to Astro once the in-place fixes had landed, and to migrate only if the spike clearly beat
what was left. We ran it. We stay on Next.

## What was built

Branch `spike/astro-seasons` (worktree, not merged). Astro 7 static build, `@astrojs/react`. Page
components are imported unchanged. `next/link`, `next/navigation` and `next/dynamic` are
aliased to three small shims, and the page reuses the Next build's compiled CSS and fonts byte
for byte, so the comparison is about the framework only. The shell islands are the same
components: sidebar, command palette, slash shortcut, bottom nav and analytics, plus the
`JumpRail` scrollspy. The page renders identically and logs no console errors.

## Measured (same harness, `scripts/benchmark-lighthouse.mjs`, served with serve@14.2.7)

| /seasons | Next (after steps 1–3) | Astro spike |
| --- | --- | --- |
| HTML, gzip | 120 KiB (601 KiB markup + 929 KiB flight) | 62 KiB (609 KiB markup, no flight) |
| Script transferred | 153 KiB | 87 KiB |
| Requests | 19 | 29–31 |
| Mobile LCP, median of 6 interleaved runs | 1.53 s | 1.38 s |
| Mobile TBT, median of 6 interleaved runs | ~355 ms (52–1963) | ~188 ms (116–729) |
| Desktop LCP / score (quiet run) | 333 ms / 100 | 338 ms / 100 |

Quiet-machine Next mobile (the 3-run corpus in `output/performance/2026-11-10-after-steps-1-3`)
scored 99 with LCP 1516 ms and TBT 67 ms. The interleaved A/B ran while other sessions loaded
the machine (load average 7–27), so its TBT figures only rank the two builds; they are not
absolute values. Under that load TBT varied tenfold run to run on both builds.

Astro does less script work (≈125 ms vs ≈300 ms of evaluation on mobile). Style, layout and
"other" main-thread time is about the same on both builds, because both lay out the same
7,500-element page. Moving the islands from `client:load` to `client:idle` did not help.

## Decision

The spike wins on bytes, with half the HTML and 43% less script, and on mobile LCP by about
150 ms. That clears the two misses steps 1–3 left on this route: script just over 150 KiB, and
LCP 16 ms over 1.5 s. It does not clearly win where the user would notice: the Lighthouse score
is a tie on a quiet machine (99–100 on both), and TBT under load is too noisy to settle.

The port was mostly mechanical, but not entirely. Astro can only hydrate an island placed in an
`.astro` file, so any React server tree that nests a client component has to be split around it
(here, `SeasonsPart head|ledger` around `JumpRail`). Across about 40 interactive modules and
9,200 prerendered paths, that is the real cost. On top of it come losing client-side navigation
and the view-transition cross-fade, and re-homing OG images, the sitemap and the perf guards that
read `.next/`.

A gain of ~150 ms LCP and 66 KiB of script on one route does not justify that, so we stay on Next.

## Consequences

- The remaining `/seasons` levers are in-place. They are the lap glyphs (161 KiB of markup) and
  the 119 inline trophy SVGs (~58 KiB), which would also take LCP under 1.5 s on Next.
- Revisit this only if the Next runtime floor (~120 KiB) becomes the binding constraint across
  several routes. Then re-measure TBT on a quiet machine with the same interleaved method.
- The spike branch stays as a reference and is not maintained.
