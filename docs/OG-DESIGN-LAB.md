# OpenGraph design direction and rollout plan

Status: first production slice implemented and visually verified.

## Production verification baseline (12 July 2026)

- `npm run og:review` renders the representative matrix, 300px thumbnails, and a contact sheet under `output/og-review/`.
- `npm run knip` passes.
- The production build compiles successfully, then stops in the repository's pre-existing video-plan type check: `scripts/validate-video-editions.ts:24` reads optional `fadeIn` from a narrow inferred clip union. The unrelated working change in `video/audio/plans.ts` was deliberately left untouched.
- Running-app probes return PNG responses for the root, Data, Matches, question, player, and match image routes. Dynamic record routes carry `public, max-age=300, s-maxage=86400, stale-while-revalidate=604800`; static collection routes are framework-cached in production and `no-store` in development.
- Utility pages intentionally inherit the root image through metadata rather than exposing their own `/opengraph-image` handler. `/opponents` redirects to Search, so a separate opponent collection card is not warranted.

The generated review PNGs remain build artifacts rather than committed fixtures. The script and its deterministic payloads are the durable fixture; this avoids binary churn while keeping every case reproducible.

## Decision

Adopt the **match-night poster with the answer-signal discipline** as the OpenGraph design direction.

The system should use relevant, licensed media as the emotional entry point while keeping one explicit answer, statistic, score, or claim as the payload. A compact evidence shape should remain where it helps the shared card carry meaning outside the page. This is a media-led evidence system, not a collection of atmospheric full-bleed photographs.

The answer-signal treatment remains the deterministic fallback whenever suitable media is missing, misleading, historically inappropriate, or unable to support readable text.

## Why this direction

The three explored directions were:

### 01 — Answer signal

The current evidence-card language, pushed harder. A question, one dominant figure, and a compact data shape do the work. It has the best comprehension, trust, repeatability, and production reliability, but is less likely to interrupt a busy social feed.

### 02 — Match-night poster

Archive media creates the emotional entry point while a hard statistic makes the promise concrete. It has the strongest feed presence and is the clearest visual step forward, but requires controlled crops, contrast, and fallbacks.

### 03 — Archive cover

A warm paper-like field, catalogue metadata, and monochrome historic imagery make each link feel collectible and strongly editorial. It is distinctive and trustworthy, but long dynamic titles and names strain the composition.

The approved direction combines the poster's distinctiveness with the signal card's clarity and resilience. The archive direction remains a useful influence for story and historical surfaces, but is not the base system.

## Core system

Do not create a different visual language for every route. Build one shared OpenGraph frame with controlled variants.

Every card must retain:

- Red Thread identity;
- one headline;
- one explicit payload: answer, figure, score, or claim;
- one evidence shape where useful;
- scope or provenance;
- the red thread rule or spine;
- a deterministic no-image fallback.

The renderer should support three treatments:

| Treatment | Composition | Use when |
| --- | --- | --- |
| Poster | Media carries roughly 60% of the frame | Strong, relevant, licensed media exists and the surface is editorial |
| Poster + signal | Media plus a fixed high-contrast data inset | Preferred general-purpose treatment |
| Signal fallback | Typography, figure, and evidence shape | Media is absent, weak, misleading, or fails to load |

The likely implementation is a shared payload and frame in `lib/og-card.tsx`:

```ts
type OgCardPayload = {
  kind: "brand" | "answer" | "match" | "entity" | "story";
  eyebrow: string;
  title: string;
  figure?: string;
  gloss?: string;
  visual?: QuestionVisual | MatchVisual | EntityVisual;
  media?: {
    src: string;
    position?: string;
    treatment?: "full" | "panel" | "texture";
  };
  context?: string;
  trustStrip: { lead: string; detail: string }[];
};
```

Extract branding, the media layer, scrim, safe zones, and trust strip into a common `OgFrame`. Existing route-level `opengraph-image.tsx` files should continue to own data fetching and turn route data into this shared payload.

## Surface strategy

### Questions and analytical answers

This is the flagship poster-plus-signal treatment.

- Use relevant contextual media behind one side of the composition.
- Keep the question as the headline.
- Keep the answer figure and mini-chart prominent.
- Preserve “Tested against the record” and the trust strip.
- Fall back to the current answer-signal card when no meaningful media exists.

The first production conversion should extend `questionCard()` because its existing data contract already contains a question, figure, gloss, visual, accent, and trust strip.

### Matches

Matches remain evidence-led rather than becoming generic stadium posters.

- Keep the scoreline as the dominant payload.
- Keep the goal timeline as the evidence signal.
- Use venue or match-specific media only when it is genuinely associated with the match.
- Use the full poster treatment for curated great nights and landmark finals.
- Use a restrained venue texture or signal-only fallback for ordinary historical matches.
- Never imply that a modern portrait or generic crowd photograph depicts a historical match.

### Players

Use a portrait panel instead of a full-bleed photograph.

- Give the portrait approximately 35–42% of the frame.
- Keep the name and primary statistic on the opposite side.
- Preserve the career-span bar.
- Include position and playing years as context.
- Use only locally cached, licensed portraits.
- Fall back to the signal treatment when the portrait is missing or unsuitable.

### Managers

Managers should share the entity composition used for players.

- Portrait panel on one side.
- Win rate and matches managed as the explicit payload.
- Preserve the W/D/L conviction bar and reign dates.
- Fall back to the signal treatment when imagery is unavailable.

Players and managers should share one portrait-stat renderer rather than developing separate visual systems.

### Opponents

Do not introduce club crests or arbitrary opponent photography.

- Keep “United v [opponent]” as the headline.
- Use the W/D/L record as the visual payload.
- Use a ground image only when it is licensed, locally cached, and relevant.
- Otherwise enlarge the result bar into the graphical anchor.
- Preserve the existing no-club-crest policy.

Opponent cards will naturally be more signal-led than player or story cards.

### Seasons

Treat the season spine as the image for most seasons.

- Lead with the season identifier.
- Use win percentage or a defining achievement as the payload.
- Enlarge the result spine into a poster-like graphical field.
- Add archive media only for curated landmark seasons.

The 1998–99 season merits an authored poster. Every season does not need one.

### Stories and Journey chapters

These are the most cinematic surfaces and can use the strongest poster treatment.

- Use full-bleed curated chapter media.
- Keep the editorial headline short.
- Include one concrete date, score, figure, or claim.
- Add a story or chapter marker.
- Retain a small evidence cue rather than a full chart.

### Homepage and section indexes

Use authored, stable cards representing the collection rather than a particular record.

- Homepage: brand promise and total match coverage.
- Players: portrait archive and total player count.
- Managers: succession or timeline composition.
- Seasons: league-finish or result-spine composition.
- Matches: match-history skyline.
- Data: coverage matrix and open-dataset promise.

These are identity cards for an entire collection, not previews of a single database row.

### Search, feedback, corrections, and utility pages

Do not create bespoke posters for low-value sharing surfaces. These pages should inherit the root brand card until usage shows that dedicated cards would be worthwhile.

## Media selection policy

Media resolution must be deterministic:

```text
route-specific curated image
        ↓
licensed entity or venue image
        ↓
section-level contextual image
        ↓
signal-only fallback
```

Every eligible media record should carry:

- a local path;
- licensing and source information;
- a focal position for the wide crop;
- suitability for a 1200 × 630 composition;
- its permitted treatment;
- optional date or era constraints.

The fallback is a normal successful result, not an error. A weak or historically misleading photograph is worse than a clear signal card.

## Layout and content guardrails

- Keep meaningful content inside approximately 72–80px outer safe zones.
- Permit at most two headline lines.
- Use one dominant figure, not a metric grid.
- Use one evidence shape.
- Apply a fixed, tested scrim rather than guessing text contrast dynamically.
- Keep important image content out of the text region through authored focal positioning.
- Ensure the meaning survives at approximately 300px-wide unfurl size.
- Do not place essential text at the extreme bottom edge.
- Preserve the trust strip: match count, coverage honesty, and open dataset.
- Do not use official marks, crest-like geometry, replica badges, or unlicensed club imagery.
- Do not use imagery that falsely implies a time, place, person, or event.

## Rollout plan

### Phase 1 — Shared frame and questions ✓

1. Extract `OgFrame` from `lib/og-card.tsx`.
2. Add the typed media payload and deterministic fallback.
3. Preserve all existing route contracts.
4. Convert `questionCard()` to poster plus signal.
5. Test real short, long, positive, and negative answers.

This is the first implementation slice because it creates a visible improvement while exercising the most complete existing card payload.

### Phase 2 — Entity cards ✓ (players and managers)

1. Add the shared portrait-stat composition.
2. Convert player and manager cards.
3. Keep the existing career and W/D/L evidence shapes.
4. Add missing, failed, dark, and awkward-crop image cases.
5. Keep opponent and season cards primarily graphical.

### Phase 3 — Matches ✓ (curated registry established for Wembley 1968, Camp Nou 1999, and Moscow 2008)

1. Add optional media support to `matchCard()`.
2. Enable it initially only for a small curated set of great nights.
3. Preserve the scoreline and goal timeline as the primary content.
4. Expand media use only after historical relevance and fallback behaviour are proven.

### Phase 4 — Stories and collection cards ✓

1. Add authored cards for Stories and Journey chapters.
2. Add stable cards for the homepage and high-value section indexes.
3. Reuse the same frame and media policy.
4. Leave utility pages on the root card unless a sharing need is demonstrated.

### Phase 5 — Automated visual QA (review renderer established)

Generate a representative review set and validate:

- long names and questions;
- missing and failed images;
- dark and light source media;
- awkward focal points;
- unusual scores and long opponent names;
- sparse and dense charts;
- 300px thumbnail legibility;
- text safety at 1200 × 630;
- route fallbacks and caching headers.

The production system is ready only when the fallback path is as deliberate and legible as the image-led path.

## Prototype and validation record

The exploration remains available in:

- `app/dev/og-lab/page.tsx` — dev-only route at `/dev/og-lab`;
- `components/dev/OgDesignLab.tsx` — responsive three-direction comparison;
- `public/og-design-comparison.html` — standalone scored decision sheet.

The initial lab introduced no production metadata or OG route changes. At that point:

- `npm run lint` passed with the repo's existing 18 warnings and no errors;
- `npm run knip` passed;
- `npx tsc --noEmit --allowImportingTsExtensions` passed;
- plain `npx tsc --noEmit` was blocked by five existing test imports ending in `.ts`, unrelated to the lab.

Each production phase must add its own rendered-card review and run the current repository checks rather than relying on these historical results.
