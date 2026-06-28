# Audience & Competitive Evidence Base

*Foundational research for positioning United Stats before a wider (Reddit) launch.*
*Compiled 2026-06-28. Owner: this is a living document — extend it, don't trust it blindly.*

---

## 0. How to read this, and what it's worth

This is an evidence base, not an opinion piece. Where a claim rests on a real
quote from a real person, it's quoted and attributed. Where we're reasoning
beyond the evidence, it's flagged **[inference]**. The goal is that anyone on
the team can challenge a recommendation by going back to the source.

**Method & honest caveats:**

- **Sources reached:** RedCafe (the original feedback thread + the FBref/Opta
  data-loss thread), UTDFORUM, BigSoccer, Tildes, a football-analytics
  Substack, aggregated App Store / comparison-site reviews for the big live
  apps, the prideofmanchester source guide, MUFCInfo, and a spread of
  landscape/traffic articles (Similarweb-derived figures, footymetrics,
  sportsdatacampus). Verbatim quotes below are pulled from these.
- **The Reddit gap (important):** the user specifically asked for Reddit, and
  Reddit is the single richest source for this audience (r/reddevils,
  r/soccer, r/footballanalytics, r/FantasyPL). **It could not be reached.**
  reddit.com is refused by the web-search crawler, by WebFetch, *and* by the
  Claude-in-Chrome browser extension (safety restriction) — all three. There
  is no clean automated path. To fill this layer, paste the thread URLs/text
  you care about and they'll be folded into Sections 4–7. Until then, treat
  Reddit-specific claims as **not yet evidenced**.
- **Numbers caveat:** traffic figures come from third-party estimators
  (Similarweb/Semrush) and vary wildly by methodology. They're directional,
  not gospel. Treated as orders-of-magnitude.

---

## 1. The headline: what this audience actually wants

Five needs recur across every source, and they map almost exactly onto United
Stats' existing bets — with two warnings.

1. **Depth and completeness over live-score speed.** The people who seek out
   *stats sites* (as opposed to score apps) want the long tail: every match,
   every season, the obscure record. United Stats' 6,027-match, 1886–present
   spine is squarely what this niche prizes.
2. **Free and accessible, with no paywall creep.** The defining community
   event of 2026 was FBref losing its advanced stats — and the reaction
   (Section 7) shows how fiercely fans value *free, open, exportable* data and
   how betrayed they feel when it's gated.
3. **Comparison and exploration that's *fast and legible*.** Repeatedly the
   praise for a site is about *layout for comparison*, not raw data volume.
   "The layout made it way easier to compare stats" is the whole game.
4. **Trustworthy, human-feeling presentation.** The clearest criticism United
   Stats has already received is that AI-generated copy makes it "feel like
   I'm browsing a prototype." Polish and a human voice read as credibility.
5. **Nostalgia / rediscovery, not just reference.** United fans don't only
   look things up — they want to *re-feel* history. The strongest organic
   reaction to United Stats was someone rediscovering a forgotten match.

The two warnings: **(a)** the bar for *search/lookup* correctness is high and
unforgiving (an accent breaks trust instantly); **(b)** "stats nerd" is a
broad church — analytics modelers, fantasy players, club historians and
casual nostalgists want different surfaces from the same data.

---

## 2. What exists already (the landscape)

Tiered by how directly each competes with United Stats. ✅ = United Stats is
already differentiated here; ⚠️ = a real competitor or a gap.

### Tier A — Manchester United–specific (the direct competitors)

| Site | What it is | State | Relevance |
|---|---|---|---|
| **stretfordend.co.uk** | The de-facto "United's official statistics site," nicknamed *"the Website of Dreams"* — every score, player records, managers, attendances. | ⚠️ **Defunct.** Domain is now parked *for sale*. | United Stats is its explicit successor. **An orphaned, nostalgic audience exists right now with nowhere to go.** This is the single biggest opening. |
| **MUFCInfo.com** | The serious incumbent: 6,026 competitive matches since 1886, 969 player profiles, 51 nations, hat-tricks/penalties/red cards, H2H, PWDL splits, "on this day." | ⚠️ Live, comprehensive, but **dated UX** — button navigation, static images, text/tabular only, no visualizations, weak search. | United Stats matches its *data depth* and beats it decisively on *design, search, and exploration*. This is the head-to-head benchmark. |
| **aboutmanutd.com** | 5,000+ fixtures; "any United team for any match going back to the Newton Heath days," trivia, history. | Live, niche. | Overlaps on lineups/history; old-school presentation. |
| **prideofmanchester.com** | Curated stats features (e.g. the definitive Ferguson-era record). | Live, editorial. | Editorial/curation angle, not a database. |
| **Official manutd.com / club app** | Current squad, fixtures, results, some history. | Live, well-resourced. | Strong on *now*, thin and shallow on *deep history*. Not a stats explorer. |

### Tier B — Historical / archival results databases (United Stats' true genre)

| Site | What it is | Notes |
|---|---|---|
| **11v11.com** | English league since 1872 + internationals; official site of the AFS (custodians of the historical record); **"league table on any date in history"** generator. | The gold standard for *historical results*. Functional, plain. Strong on the exact thing United Stats does (era-correct tables). |
| **RSSSF.org** | The deep archive — league & cup results worldwide, semi-structured text. | Beloved by hardcore historians; deliberately archaic, near-unusable UI. A *data* source, not an experience. |
| **statto.com** | Results, tables, every-season stats since 1871, comparison tools. | Historically beloved; coverage indexed but the rich interactive site has degraded over the years. A cautionary tale (see Section 7). |
| **Football-Data.co.uk** | CSV results + betting odds, top-5 leagues. | The data-export workhorse for analysts/students; "no advanced metrics or event data." |
| **engsoccerdata / openfootball (GitHub)** | Open results datasets 1871–present. | United Stats already builds on these — same provenance the open-data crowd trusts. |
| **English Football League Tables / soccerbase** | Archival tables/results. | Long-tail reference utilities. |

### Tier C — Advanced/analytics stats (adjacent; the "nerd" audience)

| Site | What it is | Notes |
|---|---|---|
| **FBref** (Sports Reference) | *Was* the free home of xG/xA/progressive passes + huge historical tables, easy export. | The community's love object — and the cautionary tale of 2026 (Section 7). Still strong on historical *traditional* stats; advanced stats removed. |
| **Understat** | Free xG, shot maps, top-5 leagues. | Narrow but loved for xG. |
| **StatsBomb / Hudl Open Data**, **SkillCorner** | Event/tracking open data on GitHub. | For builders and academics, JSON not a website. |
| **Opta / The Analyst** | The upstream data owner + its own editorial site. | "Clunkier interface"; the licensor whose decisions ripple through the whole ecosystem. |

### Tier D — Live scores + ratings (huge reach, different job)

| Site/App | What it is | Notes |
|---|---|---|
| **Transfermarkt** | "World's largest freely accessible football database" — market values, transfers, squad history, 1.3M player profiles, 27 languages. | The traffic giant (Section 3). Transfers/squad-history, not match-history depth. |
| **SofaScore** | Live scores, player ratings, attack momentum, shot maps. | Live-first; deep stats increasingly paywalled. |
| **FotMob** | Live scores + xG/lineups, "clean live experience," beloved app. | Live-first; ads/Plus creep. |
| **WhoScored** | Ratings + match stats, Opta-powered. | Ratings-first; thin history. |
| **FlashScore / LiveScore / 365Scores / OneFootball / ESPN** | Live scores + news at scale. | Speed and breadth; not exploration of deep history. |

**[inference]** United Stats sits in a genuine white space: the *depth and
historical completeness* of Tier B, the *design and exploration quality* of
the best Tier D apps, scoped to *one club* (Tier A) with an orphaned incumbent
audience. Nobody else occupies all three corners at once.

---

## 3. How popular are they (orders of magnitude)

Directional only — third-party estimates, methodologies differ.

- **Transfermarkt** — the giant. Reported "**up to 30M football fans per
  month**" by the company; third-party estimates range from ~23.5M visits
  (Mar 2026, Similarweb) to claims of 100M+; top-25 German website overall;
  ~9-minute average session. *Reach: massive. Job: transfers, not history.*
- **SofaScore** — global rank ~#1,378 (Similarweb), ahead of FBref; live-app
  scale.
- **FotMob** — ~8.9M monthly visits (web; app installs much larger).
- **SoFIFA** — ~12.8M (cited as a Transfermarkt-adjacent comparator).
- **FBref** — ~2M monthly visits (Sept 2024), global rank ~#3,468. *Smaller
  than the live apps, but the analytics community's center of gravity — its
  influence vastly exceeds its raw traffic.*
- **MUFCInfo / 11v11 / RSSSF / statto** — no reliable public figures; these
  are long-tail, loyal-niche sites, not mass-traffic properties.

**Read-across for United Stats:** the *mass* audience lives in live apps and
Transfermarkt. United Stats is not competing for that — it's competing for the
**high-intent, high-session-time niche** (the FBref/11v11/MUFCInfo kind of
visit: someone who came to *explore*, and stays for a long session). The
positive tells from the RedCafe thread — *"I'm going to be spending so much
time exploring"* — are exactly the session-depth signal this niche produces.

---

## 4. Who the audience is (segments, with evidence)

These are the people who seek out a *stats site*. Five segments, overlapping.
Each has a representative voice.

### 4.1 The club historian / "statto" (the core)
The reason this genre exists. Wants completeness, the obscure record, "on this
day," era-correct context. United Stats' bullseye.
> *"For all you stattos, autists and 'football is me life' types."*
> — Finport Red, UTDFORUM (sharing United Stats)

### 4.2 The nostalgist / rediscoverer (the emotional core)
Doesn't arrive with a query — arrives to *re-feel* the club's history and gets
ambushed by a forgotten memory. The strongest organic reaction United Stats
got:
> *"surprise at forgotten historical details like the 2015 Europa League
> elimination."* — Superden, RedCafe (paraphrased from thread summary)

This segment is also the **orphaned stretfordend.co.uk audience** — people who
had a "Website of Dreams" and lost it.

### 4.3 The amateur analyst / content creator
Builds blogs, threads, videos, models off the data. Values *accessibility,
export, and historical depth*. The most articulate and loyal segment — and the
loudest when data disappears.
> *"I loved using fbref for looking at player stats and doing analysis on my
> own."* — hasanejaz88, RedCafe
> *"Really harms the small scale content creators too."* — SilentWitness, RedCafe

### 4.4 The DIY data-keeper
Will literally build their own spreadsheets when no tool serves them — proof
of unmet demand United Stats can absorb.
> *"creating Excel spreadsheets of 1990s matches with player ratings from
> various sources."* — UTD_Since_1978, RedCafe (describing his own project)

### 4.5 The fantasy / betting pragmatist (adjacent)
Comes for *form, comparison, projection*; values a clean comparison view above
all. Less aligned with deep history, but a large adjacent pool.
> *"purely as its visually very simple to compare teams and current form."*
> — Richard Grantham, BigSoccer (on why he picks a site)

**[inference]** United Stats' natural launch beachhead is 4.1 + 4.2 + 4.3 —
United-supporting historians, nostalgists and creators — concentrated exactly
in the communities the team is about to post to (RedCafe, r/reddevils). 4.5 is
expansion, not launch.

---

## 5. What they consider *essential* (the table stakes)

Synthesized from what people praise unprompted and what they refuse to live
without.

1. **Completeness / "every match."** The headline promise of the genre. ✅
   United Stats leads here.
2. **Free + exportable, no paywall.** Non-negotiable for the analyst segment;
   violating it is the cardinal sin (Section 7). ✅ United Stats ships CC-BY-SA
   exports.
3. **A comparison/exploration layout that's legible at a glance.** Praised
   over raw data depth, repeatedly:
   > *"the layout made it way easier to compare stats vs pretty much every
   > other site I've come across."* — quadrant, RedCafe (on FBref)
   > *"like soccerstats.com but with a much better user interface."*
   > — Xerxster, BigSoccer
4. **Search/lookup that just works.** The fastest trust-breaker when it
   doesn't — a single accent did it:
   > *"If you search for 'Forlan' … you get no results because it's
   > technically 'Forlán'."* — DOTA, RedCafe
5. **Historical depth that the live apps don't have.** The explicit reason
   this niche exists alongside SofaScore/FotMob.
6. **Mobile-tolerable, ad-tolerable.** The live-app complaints (Section 6) are
   overwhelmingly about ads and paywalls degrading a once-clean experience —
   a low bar United Stats can clear simply by *not* doing that.

---

## 6. What they're missing / complain about (the gaps = the opportunity)

Pain points in existing tools, each an opening.

- **Paywall / ad creep on the live apps.** The dominant complaint about
  SofaScore and FotMob: *"Ads became too much,"* "advanced data moves behind
  the paywall," "deep stats now gated," limited notification control,
  occasional data errors. The thing people loved (free depth, clean UI) is
  being eroded. **Opportunity: be the clean, free, depth-first antidote.**
- **The FBref hole.** Advanced/historical free analytics took a body blow in
  2026; *"Nothing compared to the ease, accessibility and historical data of
  fbref"* (hasanejaz88). There is now a wandering, slightly grief-stricken
  analytics audience. **United Stats can't replace xG, but it can own
  *historical completeness, beautifully*.**
- **Dated UX on the historical/club sites.** MUFCInfo, 11v11, RSSSF, statto
  are *comprehensive but ugly/clunky*. The recurring praise pattern in the
  data is "same data, better interface." **United Stats' entire wedge.**
- **Fragmented sources.** The DIY-spreadsheet behaviour (4.4) and the
  prideofmanchester "here are six different sites" guide show the data is
  *scattered*. **Opportunity: be the single, trustworthy, well-designed home.**
- **Specific feature asks already surfaced for United Stats** (RedCafe):
  per-90 / advanced rate metrics (*"xAssists per 90 mins"* — Mike Smalling,
  half-joking but directional), and community/discussion (*a forum* —
  SuperiorXI). Note United Stats' own data ledger already flags assists as
  source-limited pre-2012-13, so advanced-metric asks must be set against
  honest coverage limits.

### The two self-inflicted gaps United Stats already heard about
These came directly from the RedCafe feedback thread and are the highest-ROI
fixes before a wider launch:

- **AI-generated copy reads as "unfinished."** The single most pointed
  criticism:
  > *"If I have one suggestion, it's to write your own copy. The AI generated
  > text makes it feel like I'm browsing a prototype."* — Jed I. Knight, RedCafe
  > *(elsewhere described as feeling like "dummy data")*
  **Why it matters:** for a credibility product, voice *is* trust. This is
  cheap to fix and disproportionately damaging if left.
- **Search robustness (accents, nicknames, misspellings).** Already being
  fixed post-feedback, but it's the trust-breaker — must be solid before
  thousands arrive. (DOTA quote above.)

### Colour / readability
Minor but real: red-for-wins read as "bad form" to United eyes
(*"makes us look like we're in shit form"* — the_cliff, RedCafe); resolved by
moving to gold-for-wins, which doubles as colourblind-safe and on-brand. A
good worked example of *fan-eye* testing beating designer intuition.

---

## 7. Evidence: the FBref/Opta episode (why "free + open" is sacred)

This deserves its own section because it's the clearest, most recent (Jan 2026)
window into what this audience values — and it validates United Stats'
open-data, "corrections welcome, it's just JSON" ethos.

**What happened:** Opta/Stats Perform terminated FBref's access to advanced
data; xG, xA, progressive passes, shot-creating actions all vanished overnight.

**How the community reacted (verbatim):**
> *"This is a terrible blow to statistically inclined football fans and amateur
> analysts."* — williams_482, Tildes
> *"a huge strike to data democratization in football analytics."*
> — Ricardo Heredia (analytics Substack)
> *"Cutting off access to regular people just as football statistics are
> starting to become mainstream …"* — williams_482, Tildes
> *"Nothing even close"* [exists elsewhere] — goldenboy, RedCafe
> *"data … has helped me find players like Yan Diomande before I heard anyone
> mainstream talking about him."* — BenitoSTARR, RedCafe

**The lesson for United Stats:** the moat isn't a single metric — it's being
the *free, open, durable, well-designed* home for the data. United Stats'
licence-aware honesty (it openly documents *why* pre-2012 assists are blank
rather than faking them) is exactly the integrity this audience rewards. Lead
with it.

---

## 8. Implications for United Stats — before the Reddit launch

Ordered by leverage. **[inference]** throughout, grounded in the evidence above.

1. **Rewrite the AI copy in a human voice first.** It's the one criticism that
   recurs and the cheapest credibility win. Don't post wider until the prose
   reads like a person wrote it. *(Already on the team's radar per the thread.)*
2. **Harden search before traffic arrives.** Accents, nicknames, misspellings,
   partial matches. The first thing a new visitor does is search their
   favourite player; one miss and trust is gone.
3. **Lead the pitch with the orphaned-incumbent story.** "The modern successor
   to stretfordend.co.uk" + "everything MUFCInfo has, finally beautiful" is a
   message that lands because the audience *already feels the loss*. Name the
   predecessors — it signals you're one of them.
4. **Make the nostalgia/rediscovery surface a front-door feature.** "On this
   day," "this forgotten match," shareable history cards. The single best
   organic reaction was a rediscovery; engineer for more of them.
5. **Bang the free/open/honest drum explicitly.** Post-FBref, "free forever,
   open data, corrections via PR, we tell you what we *don't* have" is a
   positioning the analytics segment is primed to love. Make the data-coverage
   ledger a *selling point*, not fine print.
6. **Set expectations on advanced metrics honestly.** Don't over-promise xG/
   xAssists the open data can't support pre-2012. Frame United Stats as the
   home of *historical completeness*, with modern advanced metrics where the
   data legitimately allows — and be loud about the boundary.
7. **Right surface per segment.** Historian (browse/records), nostalgist
   (rediscovery/share), analyst (export/compare), fantasy (clean comparison).
   The data is one; the doors should be several.

---

## 9. Open gaps in this evidence base (fill before treating as final)

- **Reddit (the big one).** r/reddevils, r/soccer, r/footballanalytics,
  r/FantasyPL — unreached (tool-blocked, see §0). This is where the launch
  audience actually lives; their verbatim voices belong in §4–§7. *Next step:
  paste thread URLs/text and they'll be integrated.*
- **Hard traffic numbers** for the niche/club sites (MUFCInfo, 11v11) — none
  public; left as qualitative.
- **Live-app review quotes** are aggregated/representative, not single-attributed
  — fine for sentiment, not for naming individuals.
- **No primary survey of United Stats' own early users** beyond the RedCafe
  thread. The thread is small-N but unusually high-signal (it's the exact
  audience).

---

## 10. Sources

- RedCafe — *"FAO: United Stats lovers"* feedback thread:
  https://www.redcafe.net/threads/fao-united-stats-lovers.492426/
- RedCafe — *"Fbref: Opta Pull Data Support"*:
  https://www.redcafe.net/threads/fbref-opta-pull-data-support.491087/
- UTDFORUM — *"Manchester United Stats website"*:
  https://www.utdforum.com/forum/threads/manchester-united-stats-website.368040/
- BigSoccer — *"Looking for football statistic sites"*:
  https://www.bigsoccer.com/threads/looking-for-football-statistic-sites.2085774/
- Tildes — *"Opta removes all advanced statistical data from fbref.com"*:
  https://tildes.net/~sports.football/1sa6/
- Ricardo Heredia — *"Farewell FBref Advanced Stats"* (Substack):
  https://ricardoheredia.substack.com/p/farewell-fbref-advanced-stats-when
- The IX Sports — FBref advanced-stats loss / women's-soccer impact:
  https://www.theixsports.com/the-ix-soccer/fbrefs-loss-advanced-stats-womens-soccer-data-accessibility/
- prideofmanchester — MUFC stats information sources:
  https://www.prideofmanchester.com/sport/mufcstats-informationsources.htm
- MUFCInfo.com (competitor characterization): https://www.mufcinfo.com/
- sportsdatacampus — *14 free football data websites*:
  https://english-programs.sportsdatacampus.com/free-football-data-websites/
- footymetrics — *Top 15 best football stats websites 2026*:
  https://www.footymetrics.com/blog/best-football-stats-websites
- Similarweb / Semrush traffic estimates (Transfermarkt, FBref, SofaScore, FotMob)
- Wikipedia — Transfermarkt (reach/scale figures)
- saashub / alternativeto / unstar / insideformation — live-app review sentiment
