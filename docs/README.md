# Red Thread documentation

Read `PRODUCT.md` and `DESIGN.md` at the repository root before changing the experience. Use this index to find the owner for a durable concern.

## Canonical owners

| Concern | Owner | Update when |
| --- | --- | --- |
| Audience, promise, product model | [`../PRODUCT.md`](../PRODUCT.md) | The intended product or editorial bar changes |
| Visual and interaction system | [`../DESIGN.md`](../DESIGN.md) | A durable design rule or token changes |
| Application architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) | A technical boundary or route strategy changes |
| Canonical data and semantics | [`DATA-MODEL.md`](DATA-MODEL.md) | A schema, identity, or aggregate rule changes |
| Sources, coverage, and limitations | [`SOURCE-AUDIT.md`](SOURCE-AUDIT.md) | Evidence or coverage changes |
| Update and release pipeline | [`PIPELINE.md`](PIPELINE.md) | Ingest, validation, build, or deployment changes |
| Brand name and voice | [`BRANDING.md`](BRANDING.md) | Durable naming or voice guidance changes |
| Corrections | [`CORRECTIONS.md`](CORRECTIONS.md) | The correction contract changes |
| Video production | [`../video/README.md`](../video/README.md) | The video workflow or canonical release changes |

## Active experience references

- [`POST-LAUNCH-IMPLEMENTATION-PLAN.md`](POST-LAUNCH-IMPLEMENTATION-PLAN.md) owns the active post-launch phase order, implementation scope, and exit gates.
- [`HOMEPAGE.md`](HOMEPAGE.md), [`JOURNEY.md`](JOURNEY.md), and [`DETAIL-PAGE-PLAN.md`](DETAIL-PAGE-PLAN.md) own their named experience areas.
- [`MOBILE.md`](MOBILE.md) owns mobile behavior.
- [`COPY-RUBRIC.md`](COPY-RUBRIC.md) owns editorial copy review.
- [`PERF.md`](PERF.md) owns performance budgets and checks.
- Dated reviews and incidents are evidence records. They do not replace the canonical owner documents.

When documents conflict, current code and tests own implemented behavior; the canonical document for the concern owns intended behavior. Resolve the conflict explicitly rather than keeping both claims active.
