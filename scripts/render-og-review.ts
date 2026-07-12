import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { collectionCard, localOgMedia, matchCard, playerCard, questionCard, seasonPosterCard, storyCard, trustStrip } from "../lib/og-card";

async function main() {
  const outDir = join(process.cwd(), "output", "og-review");
  const thumbDir = join(outDir, "thumbs");
  await mkdir(thumbDir, { recursive: true });
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
  const longQuestion = questionCard({ question: "Which opponents have remained unusually difficult across the longest stretches of United history?", figure: "31.4%", gloss: "won across the full record", visual: { kind: "rows", bars: [{ label: "A very long opponent name", value: 11, valueText: "31.4%", highlight: true }, { label: "Liverpool", value: 9, valueText: "38.2%" }] }, strip: trustStrip() });
  const dense = questionCard({ question: "When do United score?", figure: "90+", gloss: "the decisive late window", visual: { kind: "columns", bars: Array.from({ length: 18 }, (_, i) => ({ label: `${i * 5}`, value: (i * 7) % 23 + 1, highlight: i === 17 })) }, strip: trustStrip() });
  const season = seasonPosterCard({ season: "1998–99", claim: "Champions. FA Cup winners. European champions.", marker: "THE TREBLE · 3 TROPHIES", results: Array.from({ length: 63 }, (_, i) => i % 9 === 0 ? "L" : i % 4 === 0 ? "D" : "W") as ("W" | "D" | "L")[], media: campNou, strip: trustStrip() });
  const cards = { "player-media": player, "player-missing": playerFallback, "match-unusual-score": match, "story-light-media": story, "collection": collection, "question-long": longQuestion, "chart-dense": dense, "season-1998-99": season };
  await Promise.all(Object.entries(cards).map(async ([name, response]) => {
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(join(outDir, `${name}.png`), buffer);
    await sharp(buffer).resize({ width: 300 }).png().toFile(join(thumbDir, `${name}.png`));
  }));
  const thumbs = await Promise.all(Object.keys(cards).map((name) => sharp(join(thumbDir, `${name}.png`)).extend({ bottom: 42, background: "#0c0b0a" }).composite([{ input: Buffer.from(`<svg width="300" height="42"><text x="12" y="28" fill="#f3ede8" font-size="16" font-family="Arial">${name}</text></svg>`), top: 158, left: 0 }]).png().toBuffer()));
  await sharp({ create: { width: 1200, height: 400, channels: 4, background: "#171311" } }).composite(thumbs.map((input, i) => ({ input, left: (i % 4) * 300, top: Math.floor(i / 4) * 200 }))).png().toFile(join(outDir, "contact-sheet.png"));
}

void main();
