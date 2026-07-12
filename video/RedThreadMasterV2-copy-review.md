# Red Thread Master V2 — full copy review

Scope: every fixed, viewer-facing line in `compositions/RedThreadFilm.tsx` (formerly `RedThreadMasterV2.tsx`), plus the templates that render data-driven copy and the optional caption track. Pure data values (player names, opponents, dates, scores, minutes, match IDs, and archive counts) are inventoried separately rather than rewritten as slogans.

## Recommended editorial direction

- Prefer concrete football language over abstract metaphors: *won on penalties*, *scored in the final*, *half-time leads*.
- Let each beat add a new fact. Avoid consecutive lines that restate the same idea.
- Keep the short, declarative rhythm, but use fragments only where they sharpen meaning.
- Use **goal** rather than **strike** when clarity matters, and reserve **receipt** for the final visual motif.

## 1. Persistent framing and opening timeline

| Current copy | Recommended | Alternative A | Alternative B | Review note |
|---|---|---|---|---|
| RED THREAD / 1886—NOW | **RED THREAD / 1886—NOW** | RED THREAD / THE UNITED RECORD | RED THREAD / 1886—PRESENT | Keep. “Now” is compact and alive. |
| NEWTON HEATH · 1886 | **NEWTON HEATH · 1886** | THE RECORD BEGINS · 1886 | 30 OCTOBER 1886 | Keep; strong historical locator. |
| The first XI. | **The first recorded XI.** | Eleven names start the story. | The XI that begins the record. | “The first XI” can sound like the club’s literal first-ever team; “recorded” states the archive claim. |
| One match begins the record. | **One match opens the archive.** | The record begins with one match. | Eleven names. One surviving match record. | Avoids repeating *record* immediately after “recorded XI.” |
| EUROPEAN CUP | **EUROPEAN CUP** | CHAMPIONS OF EUROPE | EUROPEAN FINAL | Keep as a timeline marker. |
| 1886 → 2008 | **1886 → 2008** | FOUR MATCHES · 122 YEARS | FROM NEWTON HEATH TO MOSCOW | Keep; the motion supplies the meaning. |
| WEMBLEY · 1968 | **WEMBLEY · 1968** | EUROPEAN CUP FINAL · 1968 | 29 MAY 1968 | Keep. |
| Level at ninety. Three in seven minutes. | **Level after 90. Three goals in seven minutes.** | 1–1 after 90. Then three in seven minutes. | Extra time: three goals in seven minutes. | Adds the missing noun and makes the turnaround immediately legible. |
| CAMP NOU · 1999 | **CAMP NOU · 1999** | EUROPEAN CUP FINAL · 1999 | 26 MAY 1999 | Keep. |
| The bench enters history. | **Two substitutes changed the final.** | The final turned from the bench. | Two substitutes. Two stoppage-time goals. | Current line is evocative but generic; recommendation names the mechanism. |
| USED SUBSTITUTES | **SCORING SUBSTITUTES** | SUBSTITUTES | FROM THE BENCH | More precise: the panel shows the two scorers, not every used substitute. |
| MOSCOW · 2008 | **MOSCOW · 2008** | CHAMPIONS LEAGUE FINAL · 2008 | 21 MAY 2008 | Keep. |
| Decided from the spot. | **Won on penalties.** | Settled in the shoot-out. | 1–1. Then 6–5 on penalties. | More direct and makes United’s outcome explicit. |
| SHOOT-OUT · AGGREGATE RECORD | **SHOOT-OUT · 6–5 ON PENALTIES** | PENALTY SHOOT-OUT | SEVEN TAKEN · SIX SCORED | “Aggregate record” is misleading here; this is a single-match shoot-out score. |
| 25′ · RONALDO | **25′ · RONALDO** | RONALDO · 25′ | 25′ · NO. 7 | Keep. |
| THE NUMBER SEVEN RETURNS | **UNITED’S NO. 7 SCORES** | GOAL IN THE FINAL | NO. 7 · FINAL GOAL | “Returns” asks the viewer to infer a connection that has not yet been presented. |
| Match date footer | **Keep exact date** | — | — | Data label; no rewrite needed. |
| Score + opponent | **Keep exact score and opponent** | — | — | Data label; use consistent en dashes for scores. |
| Player surnames + goal minutes | **Keep exact names and minutes** | — | — | Data label. |
| `/match/{match-id}` | **Keep exact route** | VIEW MATCH RECORD | OPEN THE MATCH | The route supports the archive/evidence idea; change only if a cleaner UI label is desired. |

Note: `ScoreStormSignature` contains copy for “STAMFORD BRIDGE · 1954 / Eleven goals. One night.”, but no current `featuredMatches` record uses that visual mode. It is source copy, not copy that appears in this render.

## 2. Best ↔ Ronaldo comparison

This is the clearest place to remove repetition. The current sequence says “Forty years. The same summit.” and immediately follows it with “Forty years apart.” The recommended sequence makes every card advance the comparison:

1. **Two No. 7s. Forty years apart.**
2. **Both became champions of Europe.**
3. **Both scored in the final.**
4. **Both won the Ballon d’Or.**
5. **Both peaked in season five.**

| Current copy | Recommended | Alternative A | Alternative B | Review note |
|---|---|---|---|---|
| 1968 ↔ 2008 | **1968 ↔ 2008** | BEST ↔ RONALDO | TWO ERAS · ONE NUMBER | Keep; the portraits and ledgers name the players. |
| Forty years. The same summit. | **Two No. 7s. Forty years apart.** | Forty years apart. Both wearing seven. | No. 7, then No. 7 again—forty years on. | Concrete, fluent, and sets up the comparison without the vague “summit.” |
| EUROPEAN CUP | **CHAMPIONS OF EUROPE** | EUROPEAN CROWN | THE TROPHY | “European Cup” is historically awkward as a shared label for 1968 and the 2008 Champions League era. |
| Forty years apart. | **Both became champions of Europe.** | Europe, won in both eras. | The same crown, forty years on. | Removes the duplicate time claim and adds the first shared achievement. |
| THE FINAL | **THE FINAL** | FINAL GOAL | ON THE NIGHT | Keep. |
| Both No. 7. Both scored. | **Both scored in the final.** | A goal in each final. | Both wore seven. Both found the net. | The recommended opener has already established the shirt number. |
| BALLON D’OR | **BALLON D’OR** | WORLD’S BEST | INDIVIDUAL PEAK | Keep. |
| Both won the Ballon d’Or. | **Both won the Ballon d’Or.** | Both ended the year with the Ballon d’Or. | Europe, then the Ballon d’Or. | Keep; clean and specific. |
| CLUB PEAK | **SEASON FIVE** | UNITED PEAK | PEAK SEASON | Makes the evidence category explicit. |
| Both peaked in their fifth United season. | **Both peaked in season five.** | Their biggest United seasons were both their fifth. | Fifth season. Career-best United return. | Shorter; the surrounding United context makes the club name unnecessary. |
| 1968 · BEST / 2008 · RONALDO | **1968 · BEST / 2008 · RONALDO** | BEST · 1968 / RONALDO · 2008 | — | Keep ledger headers. |
| 1968 · WON / 2008 · WON | **1968 · CHAMPIONS / 2008 · CHAMPIONS** | 1968 · WON / 2008 · WON | WINNERS / WINNERS | “Champions” reads more naturally beside the revised category. |
| BEST · 92′ / RONALDO · 25′ | **BEST · 92′ / RONALDO · 25′** | 92′ · BEST / 25′ · RONALDO | — | Keep exact evidence. |
| BEST · 1968 / RONALDO · 2008 | **BEST · 1968 / RONALDO · 2008** | 1968 WINNER / 2008 WINNER | — | Keep. |
| 32 GOALS · 53 GAMES / 42 GOALS · 49 GAMES | **32 GOALS · 53 GAMES / 42 GOALS · 49 GAMES** | 32 IN 53 / 42 IN 49 | — | Keep exact evidence. |
| Large “7” | **7** | NO. 7 | SEVEN | Keep; visual rather than explanatory copy. |
| ELEVEN DAYS IN MAY | **ELEVEN DAYS IN MAY** | MAY 1999 | THE TREBLE RUN-IN | Keep as the hand-off to the next act. |

## 3. The Treble: eleven days

| Current copy | Recommended | Alternative A | Alternative B | Review note |
|---|---|---|---|---|
| 1998–99 · THE TREBLE | **1998–99 · THE TREBLE** | THE TREBLE · MAY 1999 | 16–26 MAY 1999 | Keep. |
| Eleven days. No margin. | **Eleven days. No margin.** | Eleven days to win all three. | Three trophies. Eleven days. | Keep; this is one of the strongest lines. |
| Three games. Lose one, and it is gone. | **Three games. Lose one and the treble is gone.** | Three games. One defeat ends it. | Win all three—or lose the treble. | Name the referent instead of making “it” do the work. |
| DAY 1 · 16 MAY | **DAY 1 · 16 MAY** | 16 MAY · DAY 1 | LEAGUE DECIDER · 16 MAY | Keep. |
| THE LEAGUE | **PREMIER LEAGUE** | LEAGUE DECIDER | THE TITLE | Specific competition name. |
| BEHIND AFTER 26′ | **BEHIND AFTER 26′** | 0–1 AFTER 26′ | TRAILING AT HOME | Keep. |
| COLE / ON 46′ / WINNER · 48′ | **COLE / ON 46′ / WINNER · 48′** | COLE / HALF-TIME SUB / 48′ WINNER | OFF THE BENCH / COLE · 48′ | Keep the compact evidence stack. |
| FROM BEHIND. | **FROM BEHIND.** | TURNED AROUND. | TITLE WON. | Keep. |
| DAY 7 · 22 MAY | **DAY 7 · 22 MAY** | 22 MAY · DAY 7 | FA CUP FINAL · 22 MAY | Keep. |
| SIX DAYS LATER | **SIX DAYS LATER** | 6 DAYS LATER | SIX DAYS ON | Keep. |
| THE CUP | **FA CUP** | CUP FINAL | WEMBLEY | Specific competition name. |
| NINTH MINUTE | **NINTH MINUTE** | 9′ | KEANE OFF · 9′ | Keep unless the injury/forced substitution context should be explicit. |
| SHERINGHAM / ON 9′ / SCORED · 11′ | **SHERINGHAM / ON 9′ / SCORED · 11′** | SHERINGHAM / FORCED ON · 9′ / GOAL · 11′ | OFF THE BENCH / GOAL TWO MINUTES LATER | Keep; precise and fast. |
| FROM THE BENCH. AGAIN. | **FROM THE BENCH. AGAIN.** | ANOTHER SUBSTITUTE. ANOTHER GOAL. | THE BENCH DELIVERS AGAIN. | Keep. |
| DAY 11 · 26 MAY | **DAY 11 · 26 MAY** | 26 MAY · DAY 11 | EUROPEAN FINAL · 26 MAY | Keep. |
| FOUR DAYS LATER | **FOUR DAYS LATER** | 4 DAYS LATER | FOUR DAYS ON | Keep. |
| EUROPE | **CHAMPIONS LEAGUE** | EUROPEAN CUP FINAL | CAMP NOU | “Europe” is too broad beside named competitions. |
| NINETY MINUTES GONE | **90 MINUTES GONE** | TRAILING AT 90′ | 0–1 AT 90′ | Numeral scans faster and matches the score typography. |
| SHERINGHAM + SOLSKJÆR / BOTH SUBSTITUTES / 90+1′ · 90+3′ | **Keep as written** | TWO SUBSTITUTES / TWO STOPPAGE-TIME GOALS | SHERINGHAM · 90+1′ / SOLSKJÆR · 90+3′ | The current evidence stack is strong. |
| FROM BEHIND. AGAIN. | **TWO SUBSTITUTES. TWO GOALS.** | FROM THE BENCH. AGAIN. | TURNED IN THREE MINUTES. | The recommendation completes the bench thesis instead of repeating the Day 1 coda. |
| 6 DAYS / 4 DAYS | **6 DAYS / 4 DAYS** | SIX DAYS / FOUR DAYS | — | Keep consistent with the visual rail. |
| THE IMPOSSIBLE ELEVEN DAYS | **ELEVEN DAYS FOR THE TREBLE** | THE TREBLE IN ELEVEN DAYS | THREE FINALS IN ELEVEN DAYS | “Impossible” is generic hype; recommendation states the stakes. |
| Three must-wins. Two from behind. | **Three must-wins. Two comebacks.** | Three games. Two from behind. | Three wins. Two turnarounds. | More compact and less syntactically awkward. |
| Every match-winner came from the bench. | **Every winning goal came from the bench.** | Three winners. All from substitutes. | The bench supplied every winner. | “Winning goal” is the precise football term. |
| 11 DAYS · 3 WINS · 3 TROPHIES | **11 DAYS · 3 WINS · 3 TROPHIES** | 3 GAMES · 3 WINS · THE TREBLE | ELEVEN DAYS · ALL THREE | Keep. |

## 4. Fergie-time sequence

| Current copy | Recommended | Alternative A | Alternative B | Review note |
|---|---|---|---|---|
| FERGIE TIME | **FERGIE TIME** | AFTER 85′ | THE LATE TURN | Keep; familiar and immediately legible. |
| The same late shape. | **Three matches. The same late turn.** | Three times, 0–1 became 2–1. | The same comeback, decades apart. | “Shape” is abstract; recommendation previews the evidence. |
| ONE SHARED COUNTDOWN | **ONE SHARED COUNTDOWN** | THREE MATCHES · ONE CLOCK | FROM 86′ TO 90+7′ | Keep. |
| Eleven minutes. Six strikes. No release. | **Eleven minutes. Six goals. Three turnarounds.** | One clock. Six goals. Three 2–1 wins. | From 86′ to 90+7′: six goals. | “No release” is atmospheric but unclear; recommendation tells the viewer what the six events mean. |
| LIVE CLOCK | **LIVE CLOCK** | SHARED CLOCK | MATCH CLOCK | Keep. |
| MATCH / SCORE | **MATCH / SCORE** | FIXTURE / SCORE | NIGHT / SCORE | Keep UI labels. |
| THE SAME CLOCK KEEPS FINDING A WAY TO 2–1. | **THREE CLOCKS. ONE FINAL SCORE: 2–1.** | EVERY MATCH ENDS 2–1. | THREE COMEBACKS. THREE 2–1 WINS. | Removes the strained personification and states the pattern. |
| `{count} RECORDED GOALS AFTER 85′` | **Keep as written** | `{count} LATE GOALS IN THE ARCHIVE` | EVERY RECORDED GOAL AFTER 85′ | Strong quantitative reveal. |
| The same late finish. | **Now open the full late-goal record.** | Three matches become the whole archive. | The pattern opens into the full record. | Current line repeats “same late shape” without adding information. |
| Three nights. Then every late goal in the record. | **Three matches, set against every late goal in the archive.** | Three comebacks. Then the complete late-goal record. | Three nights. One much larger pattern. | “Matches” is more literal; “archive” matches the product positioning. |
| Dynamic years, opponents, deficit states, scorers, clocks and scores | **Keep exact data** | — | — | Do not editorialise these labels; they are the evidence. |

## 5. Old Trafford fortress

| Current copy | Recommended | Alternative A | Alternative B | Review note |
|---|---|---|---|---|
| OLD TRAFFORD · HOME LEAGUE | **OLD TRAFFORD · HOME LEAGUE** | HOME LEAGUE RECORD | OLD TRAFFORD · AT HALF-TIME | Keep. |
| At Old Trafford, a lead held. | **At Old Trafford, the half-time lead held.** | Ahead at half-time. Never beaten. | A half-time lead became a fortress. | Adds the condition that defines the sample. |
| 395 times ahead at half-time. | **395 half-time leads.** | Ahead at half-time, 395 times. | 395 home league matches led at the break. | Current syntax is slightly laboured. |
| Only three needed rescuing. | **Only three slipped behind—and all three recovered.** | Three leads were lost. No matches were. | Only three turned dangerous. All three were rescued. | Explains exactly what makes the three highlighted matches special. |
| MATCHES / WINS / DRAWS / DEFEATS | **MATCHES / WINS / DRAWS / DEFEATS** | PLAYED / WON / DRAWN / LOST | MATCHES / WON / DRAWN / LOST | Keep; standard and clear. |
| Fell behind. Rescued. | **Lead lost. Defeat avoided.** | Fell behind. Fought back. | Behind, then level. | More precise: these three matches finished as draws. |
| Dynamic years, opponents and final scores | **Keep exact data** | — | — | Evidence labels. |

## 6. Final match snapshot and call to action

Approved override: replace the designed 1999 “match receipt” with a real mobile capture of the 16 October 1954 league match at Chelsea. The phone view travels from the Chelsea 5–6 United scoreline through the eleven-goal matchflow to the recorded starting XI. The public destination is the site root, `www.utdstats.com`, rather than the Vercel deployment or `/stories`.

| Current copy | Recommended | Alternative A | Alternative B | Review note |
|---|---|---|---|---|
| MATCH RECEIPT | **MATCH RECEIPT** | THE MATCH RECORD | EVIDENCE · MATCH 1999-05-26 | Keep; it pays off the evidence motif visually. |
| 26 MAY 1999 | **26 MAY 1999** | CAMP NOU · 1999 | — | Keep. |
| BAYERN / 1–2 / UNITED | **BAYERN / 1–2 / UNITED** | BAYERN 1 / UNITED 2 | — | Keep. |
| EUROPEAN CUP FINAL · CAMP NOU | **EUROPEAN CUP FINAL · CAMP NOU** | CHAMPIONS LEAGUE FINAL · CAMP NOU | CAMP NOU · EUROPEAN FINAL | Historically, the official 1999 competition name was UEFA Champions League; “European Cup” is acceptable only if it is an intentional house style. |
| 90+1′ SHERINGHAM · SUBSTITUTE / 90+3′ SOLSKJÆR · SUBSTITUTE | **Keep as written** | SHERINGHAM · 90+1′ / SOLSKJÆR · 90+3′ | TWO SUBSTITUTES · TWO GOALS | The receipt already makes the thesis concrete. |
| `/match/1999-05-26-bayern-munich-n` | **Keep exact route** | OPEN MATCH RECORD | VIEW THE EVIDENCE | Keep if the product really exposes this route. |
| THE EVIDENCE IS THE DOOR | **EVERY THREAD LEADS TO A MATCH** | FOLLOW THE EVIDENCE | OPEN THE MATCH RECORD | Current line mixes metaphors and does not explain the action. |
| Pull a thread. | **Pull a thread.** | Follow the thread. | Open the record. | Keep; strongest expression of the concept. |
| `unitedstats.vercel.app/stories ↗` | **Keep current live URL** | UNITEDSTATS / STORIES | EXPLORE THE STORIES ↗ | Verify domain before final render. |
| Every claim leads back to its receipt. | **Every claim comes with its match receipt.** | Every claim leads back to the match. | Every thread ends at the evidence. | Tighter link between the claim and the receipt shown beside it. |
| RED THREAD · AN INDEPENDENT HISTORICAL ARCHIVE | **RED THREAD · AN INDEPENDENT HISTORICAL ARCHIVE** | RED THREAD · THE UNITED MATCH ARCHIVE | AN INDEPENDENT ARCHIVE OF UNITED HISTORY | Keep. |
| 6,028 MATCHES, CONNECTED | **6,028 MATCHES, CONNECTED** | 6,028 MATCHES · ONE RECORD | 6,028 MATCHES · FOLLOW THE THREADS | Keep; strong closing scale statement. |

## 7. Optional burned captions

The caption track should mirror the agreed visual copy rather than create a second script. Exact duplicates can be generated from shared constants later; for now, these are the recommended caption lines.

| Frames | Current caption | Recommended caption | Alternative | Review note |
|---:|---|---|---|---|
| 24–130 | 1886 — the first XI | **1886 — the first recorded XI** | 1886 — the record begins | Align with opening claim. |
| 150–265 | 1968 — level at ninety | **1968 — level after 90** | 1968 — three extra-time goals | Align terminology. |
| 285–395 | 1999 — the bench enters history | **1999 — two substitutes changed the final** | 1999 — two stoppage-time goals from the bench | More specific. |
| 415–500 | 2008 — decided from the spot | **2008 — won on penalties** | 2008 — 6–5 in the shoot-out | More direct. |
| 530–700 | 1968 ↔ 2008 — forty years. The same summit. | **1968 ↔ 2008 — two No. 7s, forty years apart** | Best and Ronaldo — forty years apart | This should be the single consolidated comparison opener. |
| 715–800 | Forty years apart. | **Both became champions of Europe.** | Champions of Europe in both eras. | Remove duplicate. |
| 802–890 | Both No. 7. Both scored. | **Both scored in the final.** | A goal in each final. | Number is already established. |
| 892–980 | Both won the Ballon d’Or. | **Both won the Ballon d’Or.** | Europe, then the Ballon d’Or. | Keep. |
| 984–1120 | Both peaked in their fifth United season. | **Both peaked in season five.** | Their biggest United seasons were both their fifth. | Shorten. |
| 1145–1205 | Eleven days. No margin. | **Eleven days. No margin.** | Three games to win the treble. | Keep. |
| 1210–1560 | 1998–99 — three must-wins from the bench | **1998–99 — three must-wins, every winning goal from the bench** | Three games. Three bench-supplied winners. | Current line can imply the matches themselves came “from the bench.” |
| 1570–1670 | Three must-wins. Every winner from the bench. | **Three wins. Every winning goal from the bench.** | Three winners. All from substitutes. | “Winning goal” is precise. |
| 1620–1680 | Fergie time — the same late shape | **Fergie time — three matches, the same late turn** | Three times, 0–1 became 2–1 | More concrete. |
| 1680–2040 | Eleven minutes. Six strikes. No release. | **Eleven minutes. Six goals. Three turnarounds.** | One clock. Six goals. Three wins. | Clarifies the pattern. |
| 2040–2160 | The same late finish. | **Then the full late-goal record.** | Now open the full archive. | Advances the story. |
| 2230–2410 | Only three needed rescuing | **Only three slipped behind—and all three recovered** | Three leads lost. No defeats. | Exact finding. |
| 2510–2630 | 6,028 matches — pull a thread | **6,028 matches. Pull a thread.** | Pull a thread through 6,028 matches. | Punctuation gives the CTA more force. |
| 2630–2700 | Every claim leads back to its receipt | **Every claim comes with its match receipt.** | Every claim leads back to the match. | Align with closing line. |

### Caption timing issue

The 1570–1670 caption overlaps the 1620–1680 caption. Because `CaptionBurn` uses `find()`, the earlier caption wins during the overlap; **“Fergie time — the same late shape” is only visible from frames 1670–1680 (about one-third of a second)**. The final caption pass should remove that overlap or intentionally combine the hand-off into one line.

## Proposed final spine for approval

This is the smallest high-impact set I would approve first:

1. **The first recorded XI.** / **One match opens the archive.**
2. **Level after 90. Three goals in seven minutes.**
3. **Two substitutes changed the final.**
4. **Won on penalties.**
5. **Two No. 7s. Forty years apart.**
6. **Both became champions of Europe.**
7. **Both scored in the final.**
8. **Both won the Ballon d’Or.**
9. **Both peaked in season five.**
10. **Eleven days. No margin.** / **Three games. Lose one and the treble is gone.**
11. **Three must-wins. Two comebacks.** / **Every winning goal came from the bench.**
12. **Three matches. The same late turn.**
13. **Eleven minutes. Six goals. Three turnarounds.**
14. **Three clocks. One final score: 2–1.**
15. **Now open the full late-goal record.**
16. **395 half-time leads.** / **Only three slipped behind—and all three recovered.**
17. **Every thread leads to a match.** / **Pull a thread.**
18. **Every claim comes with its match receipt.**
