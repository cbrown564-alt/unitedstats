# Archived question pages

Seven question pages remain **implemented and linkable** at `/questions/[slug]`, but they are **off the front door** as of July 2026. The active catalogue is four myths fans already argue about in the pub:

| Slug | Label | Status |
|------|-------|--------|
| `ferguson-era` | Ferguson era | **Active** |
| `treble` | The Treble | **Active** |
| `fortress` | Fortress OT | **Active** |
| `late-goals` | Fergie time | **Active** |

Everything below is **archived**.

## Where they came from

These pages were built in two waves during the “tested myths” phase of Red Thread:

1. **Front-door questions (early set)** — broad debates the explore carousel and homepage were meant to rotate through: Ferguson’s legacy, the Treble, Old Trafford as a fortress, and “Fergie time”. They share the same `AnswerThread` anatomy (visual station → answer → evidence → matches).

2. **Easter eggs (later set)** — registered in `lib/questions.ts` as linkable curiosities that did **not** take a homepage slot: European record, manager bounce, comebacks, unbeaten runs, cup specialists, own goals, and away-day travel. They let the codebase exercise more chart types and trails without crowding the discover strip.

All eleven slugs have matching modules in `components/QuestionModules.tsx`, headline figures in `lib/questionHeadlines.ts`, and (where applicable) OG card data in `lib/questionCardData.ts`. The data layer in `lib/trails.ts` and `lib/streaks.ts` is shared; archiving is a **product curation** change, not a deletion of analytics code.

## Archived slugs

| Slug | Label | Origin | Why archived |
|------|-------|--------|--------------|
| `europe` | United in Europe | Easter egg | Continental record is huge and overlaps narratively with the Treble and Ferguson-era pages; better served by season/match exploration than a standalone myth card. |
| `manager-bounce` | Manager bounce | Easter egg | Interesting but niche — a manager analytics cut, not a fan-memory myth. Ferguson-era already covers succession. |
| `comebacks` | Comeback kings | Easter egg | “Never write United off” overlaps Fergie time and the Treble (Barcelona). Kept as code reference; not a distinct front-door story. |
| `runs` | Unbeaten streaks | Easter egg | The unbeaten run is the Treble season — redundant with the active Treble page once intros were rewritten for fan familiarity. |
| `cup-specialists` | Cup specialists | Easter egg | Squad-level cup lean — useful analytics, weak as a myth fans already repeat. |
| `own-goals` | Own goals | Easter egg | Novelty punchline (“Own Goal on the leaderboard”). Fun, not core to the four-myth set. |
| `away-days` | Away days | Easter egg | Travel/geography visualisation — off-brand for “myth tested against the record”; maps live under matches/spatial elsewhere. |

## What “archived” means in code

- **`QUESTIONS`** in `lib/questions.ts` — only the four active slugs (explore, surprise, homepage rotation, related-trail coverage tests).
- **`ARCHIVED_QUESTIONS`** — same `QuestionMeta` shape; still in `questionBySlug()` and `questionSlugs()` so prerendered routes and old links work.
- **Sitemap** — only active slugs (`activeQuestionSlugs()`).
- **`/questions/[slug]` metadata** — archived pages get `robots: { index: false, follow: true }` and a visible archived notice on the page.
- **Related trails** — active questions only link to other **active** questions (plus cuts/debates). Archived pages keep trails that point back to active myths where possible.

## Restoring a question

1. Move its entry from `ARCHIVED_QUESTIONS` to `QUESTIONS` in `lib/questions.ts`.
2. Add a `RELATED` trail in `lib/related.ts` if missing.
3. Confirm `QuestionSignature` has a case if it should appear on `/explore`.
4. Remove the archived banner path in `app/questions/[slug]/page.tsx` for that slug (or re-archive later).

Modules and trail functions do not need to be recreated — they were left in place deliberately.
