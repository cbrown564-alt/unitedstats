import Link from "next/link";

export const metadata = { title: "Red Thread brand lab" };

type DirectionId = "threadline" | "trail" | "archive" | "signal";

const directions: {
  id: DirectionId;
  name: string;
  position: string;
  note: string;
  compact: string;
}[] = [
  {
    id: "threadline",
    name: "Threadline",
    position: "Quiet, editorial, most ownable",
    note: "A continuous red rule becomes the logo mark, selected state, timeline, evidence connector, and citation device.",
    compact: "Red line plus two evidence ticks",
  },
  {
    id: "trail",
    name: "Trail mark",
    position: "Best mobile collapse",
    note: "The R and T are implied by one threaded path. It is less literal than a monogram and cleaner than a badge.",
    compact: "Threaded RT glyph",
  },
  {
    id: "archive",
    name: "Archive spine",
    position: "Most serious and source-led",
    note: "A match ledger spine with a red thread running through dated rows. This leans into trust, provenance, and records.",
    compact: "Ledger spine",
  },
  {
    id: "signal",
    name: "Match signal",
    position: "Most football-native",
    note: "A red line crosses a pitch-like field and resolves into a proof dot. More energetic, still restrained.",
    compact: "Thread over pitch ticks",
  },
];

const nav = ["Discover", "Matches", "Seasons", "People", "Data"];

export default function LogoLabPage() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden border-b border-line pb-8">
        <div className="pointer-events-none absolute inset-x-0 top-8 h-px bg-devil-bright/35" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-devil-bright">
              Brand direction
            </p>
            <HeroWordmark />
            <p className="mt-5 max-w-2xl text-base leading-7 text-ink-dim">
              Follow the evidence through United history. The brand is not a crest and not a stats portal:
              it is one red thread from question to answer to the matches behind it.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">Promise</p>
            <p className="mt-3 text-2xl font-semibold leading-tight text-ink">
              Ask a question. Follow the red thread to every match behind the answer.
            </p>
            <div className="mt-5">
              <ThreadRule />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionIntro
          title="Logo Directions"
          body="The useful motif is the thread itself: thin, continuous, evidence-led. The wordmark stays calm so the product can stay dense."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {directions.map((direction) => (
            <DirectionCard key={direction.id} direction={direction} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionIntro
          title="Header Fit"
          body="On desktop, the red thread can stretch into the nav. On mobile, it collapses to a tiny mark without giving up the identity."
        />
        <div className="grid gap-4">
          <HeaderMock id="threadline" title="Recommended: Threadline" />
          <HeaderMock id="trail" title="Mobile-forward: Trail mark" />
          <HeaderMock id="archive" title="Trust-forward: Archive spine" />
        </div>
      </section>

      <section className="space-y-4">
        <SectionIntro
          title="Product Feel"
          body="The identity should show up where the product earns trust: answer cards, evidence trails, citations, and post-match history changes."
        />
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <AnswerSurface />
          <ShareSurface />
        </div>
      </section>

      <section className="rounded-lg border border-line bg-panel p-5">
        <div className="grid gap-5 md:grid-cols-[16rem_minmax(0,1fr)] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">Initial verdict</p>
            <h2 className="mt-2 display text-2xl">Threadline wins</h2>
          </div>
          <p className="text-sm leading-6 text-ink-dim">
            It has the best balance: distinctive enough to rename the product, restrained enough for the current app,
            and flexible enough to become the evidence trail, chart annotation, selected nav state, and share-card signature.
          </p>
        </div>
      </section>
    </div>
  );
}

function SectionIntro({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
      <div>
        <h2 className="display text-2xl">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-dim">{body}</p>
      </div>
      <Link href="/" className="hidden text-sm text-devil-bright hover:underline sm:block">
        Back home
      </Link>
    </div>
  );
}

function HeroWordmark() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4">
        <ThreadMark id="threadline" size="large" />
        <div className="min-w-0">
          <h1 className="display text-5xl leading-none sm:text-7xl">
            <span className="text-devil-bright">Red</span> Thread
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="h-px min-w-10 flex-1 bg-devil-bright" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-dim">
              United history, evidenced
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DirectionCard({ direction }: { direction: (typeof directions)[number] }) {
  return (
    <article className="flex min-w-0 flex-col justify-between gap-6 rounded-lg border border-line bg-panel p-5">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <BrandLockup id={direction.id} mode="full" />
          <div className="rounded-md border border-line bg-pitch px-3 py-2">
            <BrandLockup id={direction.id} mode="compact" />
          </div>
        </div>
        <div>
          <h3 className="display text-xl">{direction.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-devil-bright">
            {direction.position}
          </p>
          <p className="mt-4 text-sm leading-6 text-ink-dim">{direction.note}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <p className="text-xs text-ink-faint">Compact: {direction.compact}</p>
        <ThreadSample id={direction.id} />
      </div>
    </article>
  );
}

function HeaderMock({ id, title }: { id: DirectionId; title: string }) {
  return (
    <article className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-4 p-4">
        <div className="hidden sm:block">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Desktop</p>
          <div className="flex h-14 items-center gap-4 rounded-md border border-line bg-pitch px-4">
            <BrandLockup id={id} mode="responsive" />
            <div className="hidden h-px w-16 bg-devil-bright/70 lg:block" aria-hidden />
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden text-sm">
              {nav.map((item, index) => (
                <span
                  key={item}
                  className={[
                    "rounded-md px-2.5 py-1.5 text-ink-dim",
                    index === 0 ? "text-ink shadow-[inset_0_-1px_0_var(--color-devil-bright)]" : "",
                  ].join(" ")}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex h-10 w-80 items-center rounded-md border border-line bg-panel px-3 text-ink-faint">
              Ask United’s history...
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Mobile, 390px</p>
          <div className="flex h-14 max-w-[390px] items-center gap-2 rounded-md border border-line bg-pitch px-3">
            <BrandLockup id={id} mode="compact" />
            <div className="scrollbar-none flex min-w-0 flex-1 gap-1 overflow-hidden text-sm">
              {nav.slice(0, 3).map((item, index) => (
                <span
                  key={item}
                  className={[
                    "rounded-md px-2 py-1.5 text-ink-dim",
                    index === 0 ? "text-ink" : "",
                  ].join(" ")}
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-devil-bright">
              <SearchIcon />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function AnswerSurface() {
  const rows = [
    ["Definition", "Timed United goals, 85th minute onward"],
    ["Coverage", "Strong: timed goals from 1907 onward"],
    ["Evidence", "3,214 matches in scope"],
  ];

  return (
    <article className="relative overflow-hidden rounded-lg border border-line bg-panel p-5">
      <div className="absolute inset-x-0 top-0 h-px bg-devil-bright" aria-hidden />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div>
          <BrandLockup id="threadline" mode="full" />
          <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">
            Answer thread
          </p>
          <h3 className="mt-3 display text-3xl leading-tight">
            Do United really score late?
          </h3>
          <p className="mt-4 max-w-xl text-sm leading-6 text-ink-dim">
            Yes. The strongest edge is in the final five minutes of normal time, with stoppage time
            making the modern effect look sharper.
          </p>
          <div className="mt-6 space-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 border-t border-line pt-3 text-sm">
                <span className="text-ink-faint">{label}</span>
                <span className="text-ink">{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-md border border-line bg-pitch p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Thread</p>
          <div className="mt-4 space-y-4">
            {["Question", "Answer", "Definition", "Coverage", "Matches"].map((item, index) => (
              <div key={item} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
                <div className="relative flex justify-center">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-devil-bright" />
                  {index < 4 && <span className="absolute top-4 h-8 w-px bg-devil-bright/55" aria-hidden />}
                </div>
                <span className={index === 1 ? "font-semibold text-ink" : "text-sm text-ink-dim"}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function ShareSurface() {
  return (
    <article className="rounded-lg border border-line bg-panel p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-faint">Share card</p>
      <div className="mt-4 overflow-hidden rounded-md border border-line bg-pitch">
        <div className="p-4">
          <BrandLockup id="trail" mode="full" />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-devil-bright">
            History changed
          </p>
          <h3 className="mt-2 display text-2xl leading-tight">
            First away win at Brighton by three goals.
          </h3>
          <p className="mt-3 text-sm leading-6 text-ink-dim">
            Brighton 0-3 United, 24 May 2026. The evidence set contains every away match at Brighton.
          </p>
        </div>
        <div className="border-t border-line px-4 py-3">
          <ThreadRule />
          <p className="mt-3 text-xs text-ink-faint">redthread.example/match/2026-05-24-brighton-a</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-ink-faint">
        <span className="rounded border border-line py-2">Card</span>
        <span className="rounded border border-line py-2">Citation</span>
        <span className="rounded border border-line py-2">CSV</span>
      </div>
    </article>
  );
}

function BrandLockup({ id, mode }: { id: DirectionId; mode: "compact" | "full" | "responsive" }) {
  const showWord = mode !== "compact";
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center gap-2.5 text-ink",
        mode === "responsive" ? "[&_.brand-word]:hidden sm:[&_.brand-word]:inline" : "",
      ].join(" ")}
      aria-label="Red Thread"
    >
      <ThreadMark id={id} size="small" />
      {showWord && (
        <span className="brand-word display text-base leading-none">
          <span className="text-devil-bright">Red</span> Thread
        </span>
      )}
    </span>
  );
}

function ThreadMark({ id, size }: { id: DirectionId; size: "small" | "large" }) {
  const px = size === "large" ? 58 : 34;
  if (id === "trail") return <TrailGlyph px={px} />;
  if (id === "archive") return <ArchiveGlyph px={px} />;
  if (id === "signal") return <SignalGlyph px={px} />;
  return <ThreadlineGlyph px={px} />;
}

function ThreadlineGlyph({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 58 58" fill="none" aria-hidden>
      <rect x="1" y="1" width="56" height="56" rx="14" fill="#161312" stroke="#2c2522" />
      <path d="M12 31C18 22 25 39 31 29C36 21 41 22 46 27" stroke="#ff3b1f" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 17v24M40 17v24" stroke="#f3ede8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="46" cy="27" r="4" fill="#ff3b1f" />
    </svg>
  );
}

function TrailGlyph({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 58 58" fill="none" aria-hidden>
      <rect x="1" y="1" width="56" height="56" rx="14" fill="#0c0b0a" stroke="#2c2522" />
      <path d="M18 40V18h13c7 0 10 3 10 8 0 4-2 7-7 8l8 6" stroke="#f3ede8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 32c8-10 18 9 28-7" stroke="#ff3b1f" strokeWidth="4" strokeLinecap="round" />
      <path d="M35 18h13" stroke="#ff3b1f" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function ArchiveGlyph({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 58 58" fill="none" aria-hidden>
      <rect x="1" y="1" width="56" height="56" rx="14" fill="#161312" stroke="#2c2522" />
      <path d="M17 16h24M17 24h24M17 32h24M17 40h24" stroke="#f3ede8" strokeWidth="3" strokeLinecap="round" />
      <path d="M28 13v32" stroke="#ff3b1f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="28" cy="24" r="3.5" fill="#ff3b1f" />
    </svg>
  );
}

function SignalGlyph({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 58 58" fill="none" aria-hidden>
      <rect x="1" y="1" width="56" height="56" rx="29" fill="#161312" stroke="#2c2522" />
      <path d="M15 16v26M43 16v26M22 29h14" stroke="#f3ede8" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 36c9-16 22 8 34-14" stroke="#ff3b1f" strokeWidth="4" strokeLinecap="round" />
      <circle cx="46" cy="22" r="4" fill="#ff3b1f" />
    </svg>
  );
}

function ThreadSample({ id }: { id: DirectionId }) {
  if (id === "archive") {
    return (
      <div className="flex w-44 items-center gap-2 rounded-md border border-line bg-pitch px-3 py-2">
        <span className="h-7 w-px bg-devil-bright" />
        <div className="grid flex-1 gap-1">
          <span className="h-px bg-ink-dim/70" />
          <span className="h-px bg-ink-dim/45" />
          <span className="h-px bg-ink-dim/70" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex w-44 items-center gap-2 rounded-md border border-line bg-pitch px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-devil-bright" />
      <span className="h-px flex-1 bg-devil-bright" />
      <span className="h-2 w-2 rounded-full bg-devil-bright" />
      <span className="h-px flex-1 bg-devil-bright/45" />
      <span className="h-2 w-2 rounded-full border border-devil-bright" />
    </div>
  );
}

function ThreadRule() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <span className="h-2 w-2 rounded-full bg-devil-bright" />
      <span className="h-px flex-1 bg-devil-bright" />
      <span className="h-2 w-2 rounded-full bg-devil-bright" />
      <span className="h-px w-10 bg-devil-bright/45" />
      <span className="h-2 w-2 rounded-full border border-devil-bright" />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.4" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
