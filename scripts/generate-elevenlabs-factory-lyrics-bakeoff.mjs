import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const split = line.indexOf("=");
    if (split < 1) continue;
    const key = line.slice(0, split).trim();
    const value = line.slice(split + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(resolve(".env"));
loadEnv(resolve(".env.local"));
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("ELEVENLABS_API_KEY is required.");

const force = process.argv.includes("--force");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyId = onlyArg?.slice("--only=".length);
const outputDir = resolve("public/video/audio/elevenlabs-factory-lyrics-bakeoff");
mkdirSync(outputDir, { recursive: true });

const factoryPalette = [
  "taut Manchester-coded post-punk machine-funk", "118 BPM maintained throughout",
  "melodic live electric bass played with precise restraint", "rigid dry drum machine",
  "clipped clean guitar harmonics", "cold economical mono-synth pulses",
  "subtle dub mixing and negative space", "cool understated low British spoken-sung vocalist",
  "wry intelligent character", "one continuous band and sound palette",
];

const sharedNegative = [
  "stadium crowd", "football chant", "sports anthem", "heroic", "triumphant",
  "epic trailer", "orchestral swell", "sentimental strings", "pub rock", "classic rock",
  "guitar solo", "large chorus", "EDM drop", "glossy synthwave", "advertising jingle",
  "arena rock", "crowd noise", "applause", "tempo change", "complete silence",
  "unrelated instrumental interlude", "acid-house lead", "rave piano", "funk slap bass",
  "disco strings", "retro pastiche", "cheerful pop", "earnest indie belting",
];

const sets = [
  {
    id: "01-ledger",
    title: "The ledger",
    voice: "Factual, spare and editorial",
    thesis: "Treat the archive as the lyricist: short verified statements, almost no metaphor.",
    acts: [
      { role: "intro", duration_ms: 18000, text: "[Intro]\nEighteen eighty-six.\nEleven names on paper.\nThe line starts here." },
      { role: "verse", duration_ms: 20000, text: "[Verse]\nSixty-eight. Two thousand eight.\nSeven at either end.\nA final goal. A golden ball.\nBoth peak in season five." },
      { role: "refrain", duration_ms: 16000, text: "[Refrain]\nEleven days. Three must-wins.\nEvery winner from the bench.\nNo margin." },
      { role: "pressure", duration_ms: 20000, text: "[Pressure verse]\nAfter eighty-five, the clock distorts.\nEleven minutes. Six goals.\nThree matches turn.\nThe record keeps the proof." },
      { role: "fortress", duration_ms: 10000, text: "[Fortress bridge — instrumental]" },
      { role: "outro", duration_ms: 6000, text: "[Outro]\nSix thousand and twenty-eight matches.\nPick one.\nPull a thread." },
    ],
  },
  {
    id: "02-red-line",
    title: "The red line",
    voice: "Poetic, nocturnal and image-led",
    thesis: "Let the recurring line carry memory, pressure and recurrence while the picture supplies exact detail.",
    acts: [
      { role: "intro", duration_ms: 18000, text: "[Intro]\nPaper remembers eleven names.\nRed wakes\nand starts to travel." },
      { role: "verse", duration_ms: 20000, text: "[Verse]\nForty years across one line.\nSeven calls to number seven.\nEurope waits beneath the lights.\nSeason five—the thread pulls tight." },
      { role: "refrain", duration_ms: 16000, text: "[Refrain]\nEleven days beneath one sky.\nThree doors closing.\nStill the line refuses." },
      { role: "pressure", duration_ms: 20000, text: "[Pressure verse]\nThe clocks run thin after eighty-five.\nSix sparks in eleven minutes.\nNight bends three times.\nThe line comes home." },
      { role: "fortress", duration_ms: 10000, text: "[Fortress bridge — instrumental]" },
      { role: "outro", duration_ms: 6000, text: "[Outro]\nSix thousand and twenty-eight doors.\nChoose one.\nPull a thread." },
    ],
  },
  {
    id: "03-right-on-time",
    title: "Right on time",
    voice: "Hook-led, clipped and sly",
    thesis: "Build a recurring verbal hook from match pressure without tipping into a chant or anthem.",
    acts: [
      { role: "intro", duration_ms: 18000, text: "[Intro]\nWrite eleven. Start the line.\nRed to red\nand time to time." },
      { role: "verse", duration_ms: 20000, text: "[Verse]\nSeven then and seven now.\nFinal goal. The golden crown.\nSeason five, the signal's clear.\nForty years and back again." },
      { role: "refrain", duration_ms: 16000, text: "[Refrain]\nNo margin. Hold the line.\nThree games. Three wins.\nOff the bench—\nright on time." },
      { role: "pressure", duration_ms: 20000, text: "[Pressure verse]\nEighty-five. The pressure climbs.\nSix goals. Eleven minutes.\nThree late turns. The line returns.\nRight on time." },
      { role: "fortress", duration_ms: 10000, text: "[Fortress bridge — instrumental]" },
      { role: "outro", duration_ms: 6000, text: "[Outro]\nSix thousand and twenty-eight.\nPick one.\nPull a thread." },
    ],
  },
];

function stylesFor(set, role) {
  const voiceDirection = {
    "01-ledger": ["precise factual diction", "short declarative phrases", "restrained editorial authority"],
    "02-red-line": ["intimate image-led phrasing", "slightly more melodic but still spoken-sung", "dark poetic restraint"],
    "03-right-on-time": ["crisp syncopated phrasing", "dry recurring verbal hook", "catchy but understated and unsentimental"],
  }[set.id];
  const actDirection = {
    intro: ["music begins immediately", "vocal enters naturally without a free-time preamble"],
    verse: ["same exact band continues", "rhythmic spoken-sung verse", "every word remains clear"],
    refrain: ["same groove becomes slightly firmer", "memorable clipped refrain", "minimal voice double on the final phrase only"],
    pressure: ["same groove reduces in density but never stops", "deadpan delivery and controlled late pressure"],
    fortress: ["instrumental only", "same exact instruments continue sparsely", "low architectural tension", "no climax"],
    outro: ["same groove continues under the close vocal", "clean band cutoff after the final word", "short unresolved natural tail"],
  }[role];
  return [...factoryPalette, ...voiceDirection, ...actDirection];
}

const manifest = {
  provider: "ElevenLabs",
  model: "music_v2",
  durationSeconds: 90,
  generatedAt: new Date().toISOString(),
  fixedSound: "Factory machine-funk at 118 BPM",
  reference: "public/video/audio/elevenlabs-manchester-bakeoff/01-factory-machine-funk.mp3",
  sets: [],
};

for (const set of sets) {
  const output = resolve(outputDir, `${set.id}.mp3`);
  const compositionPlan = set.acts.map((act) => ({
    text: act.text,
    duration_ms: act.duration_ms,
    positive_styles: stylesFor(set, act.role),
    negative_styles: [...sharedNegative, ...(act.role === "fortress" ? ["vocals", "lyrics"] : [])],
    context_adherence: "high",
  }));
  if ((!onlyId || set.id === onlyId) && (!existsSync(output) || force)) {
    console.log(`Generating ${set.id}…`);
    const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ composition_plan: { chunks: compositionPlan }, model_id: "music_v2", sign_with_c2pa: true }),
    });
    if (!response.ok) throw new Error(`${set.id} failed (${response.status}): ${await response.text()}`);
    writeFileSync(output, Buffer.from(await response.arrayBuffer()));
  }
  manifest.sets.push({ ...set, file: `public/video/audio/elevenlabs-factory-lyrics-bakeoff/${set.id}.mp3`, compositionPlan });
}

writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const rows = [
  {
    number: "R",
    title: "Original lyrics",
    voice: "Selected Factory machine-funk treatment",
    thesis: "The current lyric and sound reference.",
    src: "../elevenlabs-manchester-bakeoff/01-factory-machine-funk.mp3",
  },
  ...sets.map((set, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: set.title,
    voice: set.voice,
    thesis: set.thesis,
    src: `${set.id}.mp3`,
  })),
];

const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UnitedStats · Factory lyric test</title><style>
:root{color-scheme:dark;--bg:#090909;--fg:#f2efe9;--muted:#9d9992;--line:#292825;--red:#d92c2c}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 Arial,sans-serif}main{width:min(1080px,calc(100% - 32px));margin:auto;padding:52px 0 76px}header{display:grid;grid-template-columns:1.2fr .8fr;gap:42px;padding-bottom:28px;border-bottom:1px solid var(--line)}h1{font-size:clamp(38px,6vw,68px);line-height:.96;letter-spacing:-.05em;font-weight:500;margin:0}header p{margin:0;color:var(--muted);align-self:end}.rows{margin-top:34px;border-top:1px solid var(--line)}article{display:grid;grid-template-columns:42px minmax(250px,.9fr) minmax(320px,1.2fr);gap:18px;align-items:center;padding:24px 0;border-bottom:1px solid var(--line)}.id{font:12px monospace;color:var(--red)}h2{font-size:16px;font-weight:500;margin:0 0 3px}.voice{display:block;font:12px monospace;color:var(--muted);margin-top:6px}.note{margin:7px 0 0;color:var(--muted);font-size:13px}audio{width:100%;height:34px;filter:grayscale(1)}footer{margin-top:30px;color:var(--muted)}@media(max-width:700px){header{grid-template-columns:1fr}article{grid-template-columns:30px 1fr}article audio{grid-column:2}}
</style></head><body><main><header><h1>One sound.<br>Three voices.</h1><p>Factory machine-funk stays fixed at 118 BPM. Compare factual density, imagery, hooks and the way each lyric leaves room for the picture.</p></header><section class="rows">${rows.map((row) => `<article><span class="id">${row.number}</span><div><h2>${row.title}</h2><span class="voice">${row.voice}</span><p class="note">${row.thesis}</p></div><audio controls preload="metadata" src="${row.src}"></audio></article>`).join("")}</section><footer>Start with the original reference, then listen for the lyric voice—not stochastic differences in performance. The final words remain “Pull a thread.” in every set.</footer></main></body></html>\n`;
writeFileSync(resolve(outputDir, "index.html"), index);
console.log(`Wrote ${sets.length} Factory lyric treatments.`);
