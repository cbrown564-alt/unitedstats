# Red Thread Branding

## Decision

The public brand is **Red Thread**.

The product remains an independent Manchester United history and evidence system. The old working name, UnitedStats, should be treated as an internal/repository-era name unless a legacy URL, stable ID, or technical contract explicitly requires it.

## Brand Thesis

Red Thread is the evidence trail through United history.

The name carries three meanings at once:

- United red.
- The thread of history from Newton Heath to today.
- The path from a claim to the matches, definitions, coverage, and sources behind it.

The brand should feel forensic but warm: a floodlit archive with one clear red line running through it.

## Positioning

Category:

> A club-history evidence engine.

Short descriptor:

> United history, evidenced.

Core promise:

> Ask a question. Follow the red thread to every match behind the answer.

Longer positioning:

> Red Thread turns Manchester United's complete match record into sourced answers, fair comparisons, and discovery trails, with every number linked to the matches behind it.

## Why The Rename

The strategy report identified a risk in the UnitedStats name: it sounds generic, table-oriented, and easy to confuse with either "United States" or the crowded category of "Manchester United stats" pages.

Red Thread moves the product away from "another statistics database" and toward the product's real wedge:

- answer-first discovery;
- evidence behind every claim;
- historical continuity;
- creator-ready citations and share cards;
- trust through definitions, coverage, and source trails.

## Logo System

Primary direction: **Threadline**.

The Threadline mark is a compact, dark square containing:

- two pale evidence ticks;
- one continuous red thread crossing between them;
- a red proof dot where the thread resolves.

The mark should never look like a club crest, official badge, mascot, or live-score app icon. It is a proof/trail mark.

### Primary Lockup

Use:

> Red Thread

Treatment:

- "Red" in the primary red accent.
- "Thread" in ink.
- Uppercase display treatment where the surrounding UI is already uppercase.
- Mark to the left of the wordmark.

### Compact Mark

Use the Threadline mark alone when space is tight:

- mobile sticky header;
- favicon/app icon exploration;
- dense chart or card signature;
- small embed chrome.

Do not use an "RT" monogram as the default. The thread is more distinctive and less generic.

## Visual Language

The thread is the identity system, not only the logo.

Use the red thread motif for:

- selected navigation underline;
- answer-step progress;
- evidence trails from answer to definition to coverage to matches;
- timeline annotations;
- citation and share-card rules;
- source/provenance connectors;
- "history changed" digest signatures.

Avoid using the thread as random decoration. It should imply connection, proof, route, or continuity.

## Color

Use the existing palette as the base:

```css
--color-pitch: #0c0b0a;
--color-panel: #161312;
--color-panel-2: #1f1a18;
--color-line: #2c2522;
--color-ink: #f3ede8;
--color-ink-dim: #a89c94;
--color-ink-faint: #6f645d;
--color-devil-bright: #ff3b1f;
--color-gold: #f5c518;
```

Brand red is `--color-devil-bright`. It should carry identity, links, selected states, proof dots, and thread lines.

Keep the overall palette restrained. Red Thread should not become an all-red interface.

## Typography

The current Archivo display/sans and IBM Plex Mono numeric system still fits.

Use display uppercase for:

- brand lockup;
- major page titles;
- section labels with real hierarchy;
- share-card headlines.

Use mono for:

- dates;
- counts;
- records;
- scores;
- percentages;
- citable IDs;
- API or source references.

Do not let brand typography reduce data readability.

## Voice

Voice should be:

- precise;
- curious;
- evidence-led;
- historically aware;
- independent.

Good language:

- "Follow the evidence."
- "Every match behind the answer."
- "Coverage shown where it changes the interpretation."
- "United history, evidenced."
- "Ask a question."
- "Show the matches."
- "Cite this answer."

Avoid:

- "Proves" when the evidence is partial.
- "Official" or anything that suggests club affiliation.
- Generic "stats database" language as the primary framing.
- Hot-take punditry.
- Over-romantic heritage copy that hides the data contract.

## Product Vocabulary

Preferred:

- Thread: an answer trail from question to evidence.
- Evidence: the match set, definition, source, and coverage behind a claim.
- Answer: the first clear finding in a question-led page.
- Cut: a reusable slice of the record.
- Record: stable historical fact or aggregate.
- Coverage: how complete the relevant data facet is.
- Source: where a fact/facet came from.

Use carefully:

- Proof: useful in product copy, but avoid implying certainty when coverage is partial.
- Archive: good for historical depth, but should not be the lead category.
- Stats: acceptable in SEO/contextual copy, not the brand centre.

## Header Rules

Desktop:

- Show Threadline mark plus Red Thread wordmark.
- Keep the mark compact.
- Let navigation and search remain the main utility.

Mobile:

- Collapse to the Threadline mark only.
- Preserve accessible label "Red Thread".
- Prioritize nav and search space.

The header should never become a large brand billboard. The homepage hero can carry brand expression; sticky chrome should stay efficient.

## Social And Share Cards

OG/share cards should carry:

- Red Thread wordmark;
- a strong answer/finding;
- scope or date;
- evidence/trust strip;
- red thread rule or left spine.

Cards must not be context-free viral stats. They should carry enough scope to remain defensible when shared away from the site.

## Non-Affiliation

Always preserve clear non-affiliation language where appropriate:

> Not affiliated with Manchester United FC.

Do not use official club marks, crest-like shapes, replica badge geometry, player imagery without rights, or official-media styling.

## Technical Naming

Do not break stable technical contracts for the sake of branding.

Allowed to remain unchanged:

- repository name;
- package name;
- existing deployed domain until a migration is planned;
- citable ID prefixes such as `us:`;
- old internal comments where they explain historical decisions;
- data filenames and API paths.

Should use Red Thread:

- page metadata;
- header/footer;
- share citations;
- OG card branding;
- embed titles;
- llms.txt public source name;
- public API attribution;
- user-facing correction copy.

## Current Implementation

Live implementation:

- Brand component: `components/Brand.tsx`
- Header/footer usage: `components/SiteShell.tsx`
- Brand lab: `app/logo-lab/page.tsx`
- Metadata: `app/layout.tsx`
- OG card brand text: `lib/og-card.tsx`
- Public attribution: `lib/api.ts`, `lib/llms.ts`, dataset manifest (`scripts/export-dataset.ts`)
- App icons: `app/icon.svg` (vector), `app/favicon.ico` (legacy), `app/apple-icon.png` (iOS), regenerated from the Threadline mark by `scripts/gen-icons.mjs`

## Open Follow-Ups

- Decide whether the homepage headline should shift from "Every match Manchester United ever played" toward "Ask United's history."
- Consider renaming top-level "Explore" to "Discover" if the IA follows the strategy report.
- Decide whether docs `PRODUCT.md` and `DESIGN.md` should be rewritten from UnitedStats to Red Thread or preserved as historical context.
- Plan any domain migration separately; do not mix it with the visual rename.
