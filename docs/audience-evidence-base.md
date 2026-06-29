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
  data-loss thread), Reddit (r/reddevils, r/soccer, r/FantasyPL,
  r/sportsanalytics, r/FootballDataAnalysis, via Safari),
  UTDFORUM, BigSoccer, Tildes, a football-analytics Substack, aggregated App
  Store / comparison-site reviews for the big live apps, the prideofmanchester
  source guide, MUFCInfo, and a spread of landscape/traffic articles
  (Similarweb-derived figures, footymetrics, sportsdatacampus). Verbatim quotes
  below are pulled from these.
- **Reddit access caveat:** Reddit was reachable through the user's Safari
  session, but not through the automated web crawler / in-app browser path.
  This pass sampled high-signal threads from r/reddevils, r/soccer, and
  r/FantasyPL; it is not a full subreddit scrape. Treat the Reddit layer as
  qualitative launch-audience evidence, not a statistically representative
  survey.
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

The "my club first" motivation holds even in the hardcore analytics subs — the
entry point is almost always someone's own team:
> "I had the idea of analyzing data from my favorite football club as well as
> other teams."
> — HolidaySuccessful296, r/sportsanalytics, [best source of data thread](https://www.reddit.com/r/sportsanalytics/comments/1t0a4rg/best_source_of_data_for_football_analytics/)

### 4.2 The nostalgist / rediscoverer (the emotional core)
Doesn't arrive with a query — arrives to *re-feel* the club's history and gets
ambushed by a forgotten memory. The strongest organic reaction United Stats
got:
> *"surprise at forgotten historical details like the 2015 Europa League
> elimination."* — Superden, RedCafe (paraphrased from thread summary)

This segment is also the **orphaned stretfordend.co.uk audience** — people who
had a "Website of Dreams" and lost it.

Reddit adds a sharper version of this: historical stats are not only reference,
they reopen old debates with fresh evidence. In an r/reddevils thread of
historical midfielder reports, users immediately used the charts to re-litigate
Scholes, Keane, Carrick, Gerrard and Lampard:
> "Keanes passing accuracy is exceptional. What made him great (not just his
> tackling, leadership, defensive awareness etc.) was that he was always an
> outlet for other players."
> — MothsConrad, r/reddevils, [historical midfield reports](https://www.reddit.com/r/reddevils/comments/1o502x3/oc_historical_statistical_reports_of_united/)

> "Scholes having more tackles per game over 11 years than Gerrard and Lampard
> is low key hilarious."
> — WanderingEnigma, r/reddevils, [historical midfield reports](https://www.reddit.com/r/reddevils/comments/1o502x3/oc_historical_statistical_reports_of_united/)

### 4.3 The amateur analyst / content creator
Builds blogs, threads, videos, models off the data. Values *accessibility,
export, and historical depth*. The most articulate and loyal segment — and the
loudest when data disappears.
> *"I loved using fbref for looking at player stats and doing analysis on my
> own."* — hasanejaz88, RedCafe
> *"Really harms the small scale content creators too."* — SilentWitness, RedCafe

Reddit confirms this is not hypothetical. One r/reddevils poster built a
United striker-scouting workflow with FBref, Understat, PCA, K-means clusters,
distance scoring, charts, and a blog companion, then explicitly asked the
community to critique the method:
> "This method is a work in progress, and your feedback on the methodology
> employed to find an ideal striker would be worth a lot to me."
> — _respired_, r/reddevils, [data-driven striker post](https://www.reddit.com/r/reddevils/comments/1maqcv7/finding_an_ideal_striker_using_a_datadriven/)

> "The work done here is heavily influenced by discussions here on
> r/reddevils, and previous attempts at finding talent suitable for Manchester
> United from amateur analysts."
> — _respired_, r/reddevils, [data-driven striker post](https://www.reddit.com/r/reddevils/comments/1maqcv7/finding_an_ideal_striker_using_a_datadriven/)

The audience rewarded that kind of work, but also pushed on it:
> "Great work. Wish we had more of these analytical posts in this sub"
> — SolskjaerHasWonIt_, r/reddevils, [data-driven striker post](https://www.reddit.com/r/reddevils/comments/1maqcv7/finding_an_ideal_striker_using_a_datadriven/)

> "Your clusters don't seem particularly meaningfully separated. It'd be
> interesting to see how they separate on some of the original stats."
> — nathcun, r/reddevils, [data-driven striker post](https://www.reddit.com/r/reddevils/comments/1maqcv7/finding_an_ideal_striker_using_a_datadriven/)

### 4.4 The DIY data-keeper
Will literally build their own spreadsheets when no tool serves them — proof
of unmet demand United Stats can absorb.
> *"creating Excel spreadsheets of 1990s matches with player ratings from
> various sources."* — UTD_Since_1978, RedCafe (describing his own project)

After FBref lost advanced data, r/soccer users immediately imagined DIY and
open alternatives:
> "Pls tell me someone managed to scrap the data before it was gone"
> — lDistortionl, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)

> "I'd be interested in working on any open source project that would extract
> advanced statistics from broadcast football footage"
> — n-n_is_0, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)

> "Data stays free for everyone. Open source. Community owned."
> — LilNasReps, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)

### 4.5 The fantasy / betting pragmatist (adjacent)
Comes for *form, comparison, projection*; values a clean comparison view above
all. Less aligned with deep history, but a large adjacent pool.
> *"purely as its visually very simple to compare teams and current form."*
> — Richard Grantham, BigSoccer (on why he picks a site)

r/FantasyPL shows the pragmatic job clearly: not "give me a model," but "give
me free, usable raw data I can inspect myself":
> "I'd like to change that a bit this season, but I'm pretty unfamiliar with
> the resources that are available for free. I know there's sites like FFScout
> and review models, but I'm not at all interested in those. What's your go-to
> site to look up player and team data?"
> — theonewhoknock_s, r/FantasyPL, [free player-stats thread](https://www.reddit.com/r/FantasyPL/comments/1mlku47/whats_the_best_place_to_look_up_player_stats/)

> "If you're after raw data then https://fbref.com/en/"
> — Neown, r/FantasyPL, [free player-stats thread](https://www.reddit.com/r/FantasyPL/comments/1mlku47/whats_the_best_place_to_look_up_player_stats/)

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
   > "I would love to be able to see advanced stats from before 2018"
   > — Yandhi42, r/reddevils, [historical midfield reports](https://www.reddit.com/r/reddevils/comments/1o502x3/oc_historical_statistical_reports_of_united/)

   And the *structured* historical record United Stats actually holds —
   appearances, goals, lineups by season — is a named, unmet need even among
   builders, who note the raw source is too messy to use:
   > "historical soccer stats for club teams and national teams… by season and
   > club — appearances by player with goals scored and assists… Some of this
   > information is on Wikipedia but the information is not easy to extract."
   > — Comfortable_Roll_382, r/sportsanalytics, [historical-stats API thread](https://www.reddit.com/r/sportsanalytics/comments/1s4kbke/looking_for_api_with_historical_soccer_stats/)
6. **Mobile-tolerable, ad-tolerable.** The live-app complaints (Section 6) are
   overwhelmingly about ads and paywalls degrading a once-clean experience —
   a low bar United Stats can clear simply by *not* doing that.
7. **Era-aware comparison, not decontextualized charts.** Reddit users like
   historical stat graphics, but they will challenge the denominator:
   > "Why are they comparing these players' stats to data from 17/18 to
   > 22/23? Comparing the data to their peers at time is much more relevant,
   > given shifts in styles of play, level of competition, etc."
   > — dataminimizer, r/reddevils, [historical midfield reports](https://www.reddit.com/r/reddevils/comments/1o502x3/oc_historical_statistical_reports_of_united/)
8. **Metric honesty / limits.** The audience knows when an important thing is
   not measured:
   > "Unfortunately the most important defensive stat, for Carrick especially,
   > isn't measured here. And that's passes prevented. That was his genius."
   > — HamroveUTD, r/reddevils, [historical midfield reports](https://www.reddit.com/r/reddevils/comments/1o502x3/oc_historical_statistical_reports_of_united/)

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
  Reddit's version is even more visceral:
  > "A dark day for football data nerds"
  > — Sdub4, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)

  > "It's amazing how, in 2026, we're in a MUCH worse place in terms of
  > publicly accessible data/'advanced stats' compared to just 5 years ago."
  > — Albiceleste_D10S, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)

  > "Any alternatives? From what I have gathered in past years nothing came
  > even close to FBREF... truly a dark day"
  > — Reasonable-Weakness7, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)
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
- **Replacement products are already being tried.** In r/FantasyPL, one user
  launched an "alternative to FBref" around exactly the metrics people miss:
  > "If you used FBref for xG data, shot maps, set piece takers, or defensive
  > stats for your FPL picks, you've probably noticed most of that is gone now."
  > — no-ee, r/FantasyPL, [alternative-to-FBref thread](https://www.reddit.com/r/FantasyPL/comments/1sdw4ks/built_an_alternative_to_fbref_with_advanced_stats/)

  The same thread shows the business tension for open/deep data:
  > "Unfortunately data is really expensive (it's why I have a paid tier,
  > actually lose money on this!)."
  > — no-ee, r/FantasyPL, [alternative-to-FBref thread](https://www.reddit.com/r/FantasyPL/comments/1sdw4ks/built_an_alternative_to_fbref_with_advanced_stats/)

### The two self-inflicted gaps United Stats already heard about
These came directly from the RedCafe feedback thread and are the highest-ROI
fixes before a wider launch:

- **AI-generated copy reads as "unfinished."** The single most pointed
  criticism:
  > *"If I have one suggestion, it's to write your own copy. The AI generated
  > text makes it feel like I'm browsing a prototype."* — Jed I. Knight, RedCafe
  > *(elsewhere described as feeling like "dummy data")*
  **Why it matters:** for a credibility product, voice *is* trust. This is
  cheap to fix and disproportionately damaging if left. And it's not a
  United-fan quirk — the analytics subs punish AI-feel just as hard:
  > "Your website is AI slop. Tracker doesn't even work."
  > — Ok-Notice-5189, r/sportsanalytics, [a website-feedback thread](https://www.reddit.com/r/sportsanalytics/comments/1t3872x/i_created_a_football_website/)
  > (the builder conceded: "Its a vibe coded app")

  The flip side of the same value is a preference for restraint over a busy UI:
  > "I find it more enjoyable to read when there's just enough information on
  > the screen without too many visual distractions. As it stands, the site
  > feels a bit too colorful and busy."
  > — First_Ad8620, r/sportsanalytics, [same thread](https://www.reddit.com/r/sportsanalytics/comments/1t3872x/i_created_a_football_website/)
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
> "Fbref did always feel too good to be true, or at least too good to be free.
> Properly bummed me out"
> — SDShrew, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)
> "Good is barely allowed to exist in 2026, as is Free, so I suppose something
> good and free was always living on borrowed time. An enormous shame
> considering how much good content and insight we got off of fans and writers
> being able to access the data."
> — firewalkwithme-, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)
> "Stats can show you that difference, and yes that can inform opinions on
> player quality"
> — Albiceleste_D10S, r/soccer, [FBref/Stathead data removal thread](https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/)

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
   organic reaction was a rediscovery; engineer for more of them. Reddit's
   historical-stat threads show the same mechanism: give fans a chart, and
   they use it to remember, argue, and reinterpret players they already love.
5. **Bang the free/open/honest drum explicitly.** Post-FBref, "free forever,
   open data, corrections via PR, we tell you what we *don't* have" is a
   positioning the analytics segment is primed to love. Make the data-coverage
   ledger a *selling point*, not fine print.
6. **Set expectations on advanced metrics honestly.** Don't over-promise xG/
   xAssists the open data can't support pre-2012. Frame United Stats as the
   home of *historical completeness*, with modern advanced metrics where the
   data legitimately allows — and be loud about the boundary. Users will ask
   for "passes prevented"-style concepts; it is better to say "not measured"
   than to launder a weak proxy into a false claim.
7. **Right surface per segment.** Historian (browse/records), nostalgist
   (rediscovery/share), analyst (export/compare), fantasy (clean comparison).
   The data is one; the doors should be several.

### How a stats-community launch gets received (and how to land it)

Six "I built X" posts in r/sportsanalytics / r/FootballDataAnalysis show a
remarkably consistent reception pattern. Treat it as the launch playbook for any
analytics-leaning community (the room's stated norm is *"a preference for
articles that show their work, especially links to source data"*):

- **The first question is always "where's the data from?"** — *"How are you
  getting this data?"* / *"What're the data sources being scraped?… Appreciate
  the work re-democratizing the event data!"* (Betterpanosh, cjralphs). **Open
  with provenance.** Your source ledger + open dataset win this on arrival —
  put them in the first two sentences of the post.
- **They will find data errors, fast and specific** (a flipped group label, an
  off-by-one date). The builder who replied *"spot on, and a great catch —
  fixing now"* got showered with goodwill. **Pre-stage the "it's just JSON,
  corrections welcome / PR me" line** so reports become engagement, not
  embarrassment.
- **They interrogate method** — *"cross-reference your xG against other
  sources… good way to stress-test your own methodology"* (Fast-Mix-6074);
  *"you might be double-counting…"* (vaskov17). For United Stats that means
  **be explicit about era-context and what's measured** before they ask.
- **AI-feel is a kill-shot** (§6). Ship human copy first.
- **Don't pitch into the xG hole.** This crowd's acute need is recent advanced
  metrics for modelling/betting — which you don't have and can't fake. Pitch
  the thing they *also* lack and you uniquely own: a clean, free, structured,
  *complete* historical record of one club. The expensive-advanced-data
  treadmill (*"data is really expensive,"* *"afraid I'll get rate-limited by my
  source"*) is exactly the race you're not running.
- **Claim the values banner:** free forever, no login, no tracking, open data —
  *"nothing which tracks you and sells information about you. Fully free"*
  (GunnarAndersson) is a positioning this audience explicitly applauds.

(One quiet asset worth a mention: cross-source name matching is an
industry-wide nightmare — *"team names fuck you over when 5 diff websites have
5 diff variants… especially Spanish, German and French teams"* — so your clean
canonical entities + accent-aware search is a real, if invisible, strength.)

---

## 9. Open gaps in this evidence base (fill before treating as final)

- **Reddit breadth.** This pass reached r/reddevils, r/soccer, r/FantasyPL,
  r/sportsanalytics and r/FootballDataAnalysis. The last two are valuable for
  *launch-reception* and *data-credibility* signals but skew toward
  APIs/modelling/betting — so weight their "what fans want" signal lightly.
  Still unsampled: r/footballanalytics proper, club Discords, and older threads
  naming StretfordEnd/MUFCInfo directly. A fuller pass should cover those
  before treating Reddit as exhausted.
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
- Reddit / r/reddevils — *"Finding an ideal striker using a data-driven
  approach"*:
  https://www.reddit.com/r/reddevils/comments/1maqcv7/finding_an_ideal_striker_using_a_datadriven/
- Reddit / r/reddevils — *"[OC] Historical statistical reports of United
  midfielders inc. Scholes, Keane, Carrick"*:
  https://www.reddit.com/r/reddevils/comments/1o502x3/oc_historical_statistical_reports_of_united/
- Reddit / r/soccer — *"FBref & Stathead forced to remove advanced data by data
  provider"*:
  https://www.reddit.com/r/soccer/comments/1qig3gf/fbref_stathead_forced_to_remove_advanced_data_by/
- Reddit / r/FantasyPL — *"What's the best place to look up player stats
  (that's free)?"*:
  https://www.reddit.com/r/FantasyPL/comments/1mlku47/whats_the_best_place_to_look_up_player_stats/
- Reddit / r/FantasyPL — *"Built an alternative to FBref with advanced stats
  and scouting reports for every PL team"*:
  https://www.reddit.com/r/FantasyPL/comments/1sdw4ks/built_an_alternative_to_fbref_with_advanced_stats/
- Reddit / r/sportsanalytics — *"FBRef is dead!"*:
  https://www.reddit.com/r/sportsanalytics/comments/1qnth7w/fbref_is_dead/
- Reddit / r/sportsanalytics — *"Built a football/soccer database that replaces
  FBref after they lost Opta data"*:
  https://www.reddit.com/r/sportsanalytics/comments/1qprj59/built_a_footballsoccer_database_that_replaces/
- Reddit / r/sportsanalytics — *"Looking for API with historical soccer
  stats"*:
  https://www.reddit.com/r/sportsanalytics/comments/1s4kbke/looking_for_api_with_historical_soccer_stats/
- Reddit / r/sportsanalytics — *"Best source of data for football analytics"*:
  https://www.reddit.com/r/sportsanalytics/comments/1t0a4rg/best_source_of_data_for_football_analytics/
- Reddit / r/sportsanalytics — *"I created a football website"* (AI-slop /
  busy-UI feedback):
  https://www.reddit.com/r/sportsanalytics/comments/1t3872x/i_created_a_football_website/
- Reddit / r/sportsanalytics — *"My World Cup 2026 hobby project turned into a
  full prediction site"* (bug-handling reception):
  https://www.reddit.com/r/sportsanalytics/comments/1u1brtg/my_world_cup_2026_hobby_project_turned_into_a/
- Reddit / r/sportsanalytics — *"Made a website to show Statsbomb Open Data"*:
  https://www.reddit.com/r/sportsanalytics/comments/1sipg3s/made_a_website_to_show_statsbomb_open_data/
- Reddit / r/sportsanalytics — *"looking for football stat api (soccer)"*
  (cross-source name matching):
  https://www.reddit.com/r/sportsanalytics/comments/1tdgmq3/looking_for_football_stat_apisoccer/
- Reddit / r/sportsanalytics — *"I analyzed 100 Football Prediction Tools &
  Data Sites"*:
  https://www.reddit.com/r/sportsanalytics/comments/1p1zpef/i_analyzed_100_football_prediction_tools_data/
- Reddit / r/FootballDataAnalysis — *"FBRef rant"*:
  https://www.reddit.com/r/FootballDataAnalysis/comments/1rj26xq/fbref_rant/
- Reddit / r/FootballDataAnalysis — *"Best way to access football data?"*:
  https://www.reddit.com/r/FootballDataAnalysis/comments/1aoedub/best_way_to_access_football_data/
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
