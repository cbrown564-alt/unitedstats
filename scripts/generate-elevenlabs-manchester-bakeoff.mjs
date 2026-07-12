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
const outputDir = resolve("public/video/audio/elevenlabs-manchester-bakeoff");
mkdirSync(outputDir, { recursive: true });

const acts = [
  { role: "intro", duration_ms: 18000, text: "[Intro]\nFirst eleven on the paper.\nThen the line begins to run." },
  { role: "verse", duration_ms: 20000, text: "[Verse]\nSixty-eight to two thousand eight,\nnumber seven keeps the date.\nFinal goal and season five—\nthe same red line, still alive." },
  { role: "refrain", duration_ms: 16000, text: "[Refrain]\nEleven days. No margin.\nThree doors. Three turns.\nThe line holds." },
  { role: "pressure", duration_ms: 20000, text: "[Pressure verse]\nAfter eighty-five—\nthings become less certain.\nOne clock. Six strikes.\nYou may have noticed a pattern." },
  { role: "fortress", duration_ms: 10000, text: "[Fortress bridge — instrumental]" },
  { role: "outro", duration_ms: 6000, text: "[Outro]\nSix thousand and twenty-eight matches.\nPick one.\nPull a thread." },
];

const sharedNegative = [
  "stadium crowd", "football chant", "sports anthem", "heroic", "triumphant",
  "epic trailer", "braam", "orchestral swell", "sentimental strings", "pub rock",
  "classic rock", "guitar solo", "large chorus", "EDM drop", "glossy synthwave",
  "advertising jingle", "arena rock", "crowd noise", "applause", "tempo change",
  "complete silence", "unrelated instrumental interlude",
];

const candidates = [
  {
    id: "01-factory-machine-funk",
    title: "Factory machine-funk",
    tempo: "118 BPM",
    thesis: "The closest Mancunian evolution of the selected post-punk take: more physical bass and dub space.",
    palette: [
      "taut Manchester-coded post-punk machine-funk", "118 BPM maintained throughout",
      "melodic live electric bass played with precise restraint", "rigid dry drum machine",
      "clipped clean guitar harmonics", "cold economical mono-synth pulses",
      "subtle dub mixing and negative space", "cool understated low British spoken-sung vocalist",
      "wry intelligent character", "one continuous band and sound palette",
    ],
    negative: ["acid-house lead", "rave piano", "funk slap bass", "disco strings", "retro pastiche"],
  },
  {
    id: "02-hacienda-after-midnight",
    title: "Haçienda after midnight",
    tempo: "125 BPM",
    thesis: "Post-punk crosses into early Manchester acid-house club culture without becoming a rave pastiche.",
    palette: [
      "minimal post-punk and acid-house crossover", "125 BPM maintained throughout",
      "dry restrained four-on-the-floor kick", "rubbery monophonic acid bass sequence used sparingly",
      "metallic drum-machine percussion", "rare one-note warehouse piano punctuation",
      "tiny sampled guitar scratches", "cool understated low British spoken-sung vocalist",
      "dark intimate after-midnight club energy", "continuous hypnotic groove with generous space",
    ],
    negative: ["euphoric rave", "hands-in-the-air piano anthem", "screaming acid solo", "diva vocal", "festival build"],
  },
  {
    id: "03-baggy-data-groove",
    title: "Baggy data groove",
    tempo: "108 BPM",
    thesis: "A loose, sly early-1990s Manchester indie-dance reading that tests humour and swagger.",
    palette: [
      "restrained early-1990s Manchester indie-dance groove", "108 BPM maintained throughout",
      "loose swung sampled drum break", "rolling melodic bass guitar", "small wah-guitar flecks",
      "hazy psychedelic combo-organ punctuation", "subtle acid-house rhythmic influence",
      "dry laconic low British spoken-sung vocalist", "shambling confidence without sloppiness",
      "wry and nocturnal rather than cheerful", "one continuous rhythm section",
    ],
    negative: ["Britpop anthem", "jangly pop", "cheerful nostalgia", "extended wah solo", "busy organ solo", "funk parody"],
  },
  {
    id: "04-post-punk-ukg",
    title: "Post-punk × UK garage",
    tempo: "132 BPM",
    thesis: "The contemporary challenger: intimate post-punk language over a spacious broken UK club rhythm.",
    palette: [
      "forward-looking British post-punk and UK garage hybrid", "132 BPM with a spacious half-time feel maintained throughout",
      "ghosted two-step drums", "deep controlled sub bass", "wiry clipped guitar harmonics as rhythmic punctuation",
      "glassy microscopic samples", "intimate dry low British spoken-sung vocalist",
      "syncopated vocal phrasing with clear intelligible lyrics", "elegant sparse nocturnal production",
      "continuous pulse and consistent sound palette", "modern but not trend-chasing",
    ],
    negative: ["speed garage bass wobble", "pop garage", "chipmunk vocal", "grime shouting", "dubstep drop", "busy hi-hats"],
  },
  {
    id: "05-rainy-industrial-dub",
    title: "Rainy industrial dub",
    tempo: "98 BPM",
    thesis: "The architectural outlier: Manchester rain, warehouse space and pressure rendered as restrained dub.",
    palette: [
      "minimal rainy industrial dub and post-punk", "98 BPM maintained throughout",
      "huge but restrained rounded sub-bass notes", "dry rim clicks with short decaying echoes",
      "distant metallic room impacts", "degraded tape room tone", "rare detuned guitar harmonic",
      "very close low British nearly-spoken vocalist", "forensic calm and black negative space",
      "quiet pressure without melodrama", "continuous skeletal pulse with no full dropout",
    ],
    negative: ["reggae song", "offbeat skank guitar", "roots vocal", "dub siren", "trip-hop lounge", "cinematic drone"],
  },
];

function stylesFor(candidate, role) {
  const actDirection = {
    intro: ["music begins immediately", "vocal enters naturally without a free-time preamble"],
    verse: ["same exact band continues", "rhythmic spoken-sung verse", "every word remains clear"],
    refrain: ["same groove becomes slightly firmer", "memorable clipped refrain", "subtle voice double only on the line holds"],
    pressure: ["same groove reduces in density but never stops", "deadpan delivery and dry comic timing", "controlled late pressure"],
    fortress: ["instrumental only", "same exact instruments continue sparsely", "low architectural tension", "no climax"],
    outro: ["same groove continues under the close vocal", "clean band cutoff after the final word", "short unresolved natural tail"],
  }[role];
  return [...candidate.palette, ...actDirection];
}

const generatedAt = new Date().toISOString();
const manifest = {
  provider: "ElevenLabs",
  model: "music_v2",
  durationSeconds: 90,
  generatedAt,
  fixedElements: "Exact lyrics, six acts, act durations, deadpan British delivery, continuous groove, abrupt-resonant ending.",
  reference: "public/video/audio/elevenlabs-post-punk-finals/post-punk-song-continuous-take-5.mp3",
  candidates: [],
};

for (const candidate of candidates) {
  const output = resolve(outputDir, `${candidate.id}.mp3`);
  if ((!onlyId || candidate.id === onlyId) && (!existsSync(output) || force)) {
    console.log(`Generating ${candidate.id}…`);
    const composition_plan = {
      chunks: acts.map((act) => ({
        text: act.text,
        duration_ms: act.duration_ms,
        positive_styles: stylesFor(candidate, act.role),
        negative_styles: [...sharedNegative, ...candidate.negative, ...(act.role === "fortress" ? ["vocals", "lyrics"] : [])],
        context_adherence: "high",
      })),
    };
    const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ composition_plan, model_id: "music_v2", sign_with_c2pa: true }),
    });
    if (!response.ok) throw new Error(`${candidate.id} failed (${response.status}): ${await response.text()}`);
    writeFileSync(output, Buffer.from(await response.arrayBuffer()));
  }
  manifest.candidates.push({
    ...candidate,
    file: `public/video/audio/elevenlabs-manchester-bakeoff/${candidate.id}.mp3`,
    compositionPlan: acts.map((act) => ({
      text: act.text,
      duration_ms: act.duration_ms,
      positive_styles: stylesFor(candidate, act.role),
      negative_styles: [...sharedNegative, ...candidate.negative, ...(act.role === "fortress" ? ["vocals", "lyrics"] : [])],
      context_adherence: "high",
    })),
  });
}

writeFileSync(resolve(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const rows = [
  {
    number: "R",
    title: "Selected post-punk take",
    tempo: "122 BPM",
    thesis: "The signed-off reference: continuous take 5.",
    src: "../elevenlabs-post-punk-finals/post-punk-song-continuous-take-5.mp3",
  },
  ...candidates.map((candidate, index) => ({
    number: String(index + 1).padStart(2, "0"),
    title: candidate.title,
    tempo: candidate.tempo,
    thesis: candidate.thesis,
    src: `${candidate.id}.mp3`,
  })),
];

const index = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UnitedStats · Same song, different Manchester</title><style>
:root{color-scheme:dark;--bg:#090909;--fg:#f2efe9;--muted:#9d9992;--line:#292825;--red:#d92c2c}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 Arial,sans-serif}main{width:min(1080px,calc(100% - 32px));margin:auto;padding:52px 0 76px}header{display:grid;grid-template-columns:1.2fr .8fr;gap:42px;padding-bottom:28px;border-bottom:1px solid var(--line)}h1{font-size:clamp(38px,6vw,68px);line-height:.96;letter-spacing:-.05em;font-weight:500;margin:0}header p{margin:0;color:var(--muted);align-self:end}.rows{margin-top:34px;border-top:1px solid var(--line)}article{display:grid;grid-template-columns:42px minmax(230px,.9fr) minmax(320px,1.2fr);gap:18px;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}.id{font:12px monospace;color:var(--red)}h2{font-size:16px;font-weight:500;margin:0 0 3px}.tempo{font:12px monospace;color:var(--muted);margin-left:7px}.note{margin:0;color:var(--muted);font-size:13px}audio{width:100%;height:34px;filter:grayscale(1)}footer{margin-top:30px;color:var(--muted)}@media(max-width:700px){header{grid-template-columns:1fr}article{grid-template-columns:30px 1fr}article audio{grid-column:2}}
</style></head><body><main><header><h1>Same song.<br>Different Manchester.</h1><p>Lyrics, six-act timing and ending are fixed. Compare only tempo, rhythmic language, instrumentation, vocal phrasing and atmosphere.</p></header><section class="rows">${rows.map((row) => `<article><span class="id">${row.number}</span><div><h2>${row.title}<span class="tempo">${row.tempo}</span></h2><p class="note">${row.thesis}</p></div><audio controls preload="metadata" src="${row.src}"></audio></article>`).join("")}</section><footer>Reference first, then audition 01–05 in order. Listen once for immediate character and once for how well the words survive the new groove.</footer></main></body></html>\n`;
writeFileSync(resolve(outputDir, "index.html"), index);
console.log(`Wrote ${candidates.length} Manchester bake-off treatments.`);
