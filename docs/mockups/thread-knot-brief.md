# Brief — the knot is the night

**File:** `thread-knot.html` (open in a browser; press **Replay** to re-run the motion)

## The problem

The front-door hero needs a monument that leaves a mark without licensed photography.
We chose **the Red Thread as the match clock** — kickoff at the top, full time at the
foot, a mark at each goal. Two in-app attempts failed:

1. **Beads on a hairline** — two dots low on a thin line. Read as "dots in a void."
2. **Pinched loops in the cramped hero lane** — at the real spacing (1999's goals are
   90+1′ and 90+3′, ~2 minutes apart on a 96-minute axis) the loops collapsed into an
   illegible blob at the foot.

The lesson: **the geometry is the whole thing, and it needs room.** So we explore it in
isolation, large, before porting the winner back into the hero.

## The goal

The thread should read as **thread tied into knots at the goals** — not dots on a rule.
Per the steer:

- The thread **loops/knots** where a goal happens; a bead sits in the knot.
- Beads and knots can be **translucent** and **almost on top of each other** — for 1999
  the two stoppage-time goals *should* overlap. **The overlap tells the story** (two
  goals, seconds apart, at the death). No clustering or dodging.
- **Labels either side** of the thread, so close knots don't fight.
- It must be **perfectly placed** — knots land on the exact minute, circles stay
  circular. (In the mockup the geometry is authored in a fixed viewBox and scaled whole.)

## The single example

Every panel is the same night, so we compare treatment not content:

> **1999 · United 2–1 Bayern Munich** — Sheringham 90+1′, Solskjær 90+3′ (winner, gold).
> Both goals in stoppage time → both knots fall near the foot, the top of the clock empty.

## What the variations move

| Axis | Range explored |
|---|---|
| **Size** | S (17) · M (24) · L (26–34) |
| **Shape** | Threaded ring · Luminous bead · Pendant teardrop · Interlocked double-knot |
| **Thread** | Taut (ruler) · Loose (hand-laid slack) |
| **Motion** | Bloom · Ignite · Settle · Cinch — all over a thread that *traces itself* top→foot, tying each knot in scoring order so the late winner is tied last |

## The six panels

1. **Threaded rings · taut** — thread passes through a loop at each goal; the two late loops straddle the line on opposite sides and overlap.
2. **Threaded rings · loose** — same rings on a hand-laid, gently slack thread.
3. **Big soft knots · overlap** — larger, heavier translucent loops so the overlap itself glows.
4. **Luminous beads · minimal** — no loops, just light; winner flares gold. The clean end of the range.
5. **Pendant loops** — teardrop loops hang off alternating sides and settle. More ornamental.
6. **The night's knot · single tangle** — both goals as one cinched double-knot (two interlocked rings), labelled either side.

## The decision

Pick a **direction** (or a hybrid — e.g. "rings, but loose, at the big size"), then we
tune that one and port it into `components/TonightHero.tsx`. Things to judge: does it
read as *tied*? does the 1999 overlap land? are the labels clear? and does it still work
when re-rolled to a spread-out night (a rout's ladder, a comeback's empty first half)?

> Reduced motion is respected (final state shown, no trace). Quality-floor checks come
> when we port the chosen direction back, not in the mockup.
