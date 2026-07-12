# OpenGraph design lab — handoff

Status: exploration scaffolded, production OG renderer unchanged.

## What prompted this

The current OpenGraph cards in `lib/og-card.tsx` are structurally sound but visually restrained: dark surface, red rail, Archivo/Plex Mono typography, one evidence shape, and a small trust strip. The site now has a much richer media library, so the next design question is whether shared links should feel more like evidence cards, match-night media, or editorial archive objects.

## What was added

- `app/dev/og-lab/page.tsx`
  - Dev-only route at `/dev/og-lab`.
  - Returns `404` in production.
  - No production metadata or OG route was changed.
- `components/dev/OgDesignLab.tsx`
  - Responsive comparison surface for three 1200 × 630 card directions.
  - Uses existing brand tokens and two real local images from `public/media/journey/`.
  - Includes a compare-all view plus single-direction focus buttons.
  - Includes a provisional recommendation and explicit tradeoffs.

## Directions in the lab

### 01 — Answer signal

The current evidence-card language, pushed harder. A question, one dominant figure, and a compact data shape do the work. This is the clearest and most feasible production path, but the media remains secondary.

### 02 — Match-night poster

Full-bleed Old Trafford imagery with a hard statistic and short editorial line over it. This is the biggest visual step-change and best use of the recent media investment. The main risk is contrast and crop quality across dynamic cards.

### 03 — Archive cover

A warm paper-like field, grid lines, catalogue metadata, and a monochrome historic image. This makes each shared link feel collectible and strongly editorial. The constraint is that long dynamic titles will have less room.

## Current recommendation

Start with the poster direction, but borrow the answer-signal discipline:

1. Use a real image or media crop as the emotional anchor.
2. Keep one finding or figure as the explicit payload.
3. Keep one small evidence shape or timeline so the card is not just atmosphere.
4. Preserve the existing trust strip: match count, coverage honesty, and open dataset.

The likely production direction is therefore a media-led card with a data inset, not a pure full-bleed image and not a return to plain text cards.

## Validation so far

- `npm run lint` passes with the repo's existing 18 warnings and no errors.
- `npm run knip` passes.
- `npx tsc --noEmit --allowImportingTsExtensions` passes.
- Plain `npx tsc --noEmit` is currently blocked by five existing test imports that end in `.ts`; this is unrelated to the new files.

## Screenshot follow-up

The visual QA pass is not yet complete. The repo's `scripts/shot.mjs` helper waits for `networkidle`, but this app keeps an analytics connection open in development. The first capture also hit port `3000`, which belongs to the Remotion studio. The existing Next dev process is on port `3002` but became unresponsive after stale browser connections, and a clean `3990` launch was blocked by the existing Next dev lock.

When resuming, use a clean Next preview process and capture:

```powershell
node scripts\shot.mjs http://localhost:<clean-port>/dev/og-lab output\playwright\og-lab-desktop.png 1440 1200 true
node scripts\shot.mjs http://localhost:<clean-port>/dev/og-lab output\playwright\og-lab-mobile.png 390 844 true
```

If `networkidle` still times out, use the same Playwright capture with `waitUntil: "domcontentloaded"` or `"commit"` after confirming the clean port serves the Next app, not Remotion.

## Next experiment

The most useful next step is to replace the hard-coded sample payloads with one real question, one real match, and one real story image, then compare:

- title legibility at social-feed thumbnail size,
- image crop and overlay contrast,
- whether the finding survives without the surrounding page context,
- whether the card can be reused for question, match, player, and story routes without becoming generic.

Only after that comparison should `lib/og-card.tsx` and the route-level `opengraph-image.tsx` files be changed.
