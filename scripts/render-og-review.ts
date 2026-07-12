import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { collectionCard, localOgMedia, matchCard, playerCard, storyCard, trustStrip } from "../lib/og-card";

async function main() {
  const player = playerCard({
  name: "Wayne Rooney",
  position: "Forward",
  goals: 253,
  apps: 559,
  firstYear: 2004,
  lastYear: 2017,
  media: process.argv.includes("--fallback") ? undefined : await localOgMedia("/media/players/wayne-rooney.webp", { treatment: "panel", position: "50% 25%" }),
  strip: trustStrip(),
});
  const playerFallback = playerCard({ name: "A Very Long Historical Player Name", position: "Player", goals: 0, apps: 1, firstYear: 1886, lastYear: 1886, strip: trustStrip() });

  const campNou = await localOgMedia("/media/journey/camp-nou.webp", { treatment: "full", position: "52% 45%" });
  if (!campNou) throw new Error("Camp Nou review media missing");
  const match = matchCard({ eyebrow: "UEFA CHAMPIONS LEAGUE · FINAL", home: "Manchester United", away: "FC Bayern Munich", score: "2–1", outcome: "W", date: "26 May 1999", goals: [{ minute: 6, addedTime: 0, side: "opponent" }, { minute: 90, addedTime: 1, side: "united" }, { minute: 90, addedTime: 3, side: "united" }], footnote: "Half-time 0–1", strip: trustStrip(), media: campNou });
  const story = storyCard({ chapter: "02", title: "Eleven days in May", claim: "The Treble's three must-wins: two comebacks, all decided from the bench.", marker: "16–26 MAY 1999", media: campNou, strip: trustStrip() });
  const collection = collectionCard({ eyebrow: "MATCH ARCHIVE", marker: "1886 TO TODAY", title: "Every match. One thread.", description: "Search the scores, scorers and turning points across United history.", strip: trustStrip() });
  await Promise.all([
    writeFile(join(process.cwd(), "output", "wayne-rooney-og.png"), Buffer.from(await player.arrayBuffer())),
    writeFile(join(process.cwd(), "output", "player-fallback-og.png"), Buffer.from(await playerFallback.arrayBuffer())),
    writeFile(join(process.cwd(), "output", "camp-nou-match-og.png"), Buffer.from(await match.arrayBuffer())),
    writeFile(join(process.cwd(), "output", "eleven-days-story-og.png"), Buffer.from(await story.arrayBuffer())),
    writeFile(join(process.cwd(), "output", "matches-collection-og.png"), Buffer.from(await collection.arrayBuffer())),
  ]);
}

void main();
