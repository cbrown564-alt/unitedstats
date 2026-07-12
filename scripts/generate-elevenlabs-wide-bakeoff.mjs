import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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
const outputDir = resolve("public/video/audio/elevenlabs-wide-bakeoff");
const ffmpeg = resolve("node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe");
const ffprobe = resolve("node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe");
mkdirSync(outputDir, { recursive: true });

function enforceDuration(path, seconds) {
  const duration = Number(execFileSync(ffprobe, ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",path], {encoding:"utf8"}).trim());
  if (duration <= seconds + 0.05) return duration;
  const temp = `${path}.trimmed.mp3`;
  execFileSync(ffmpeg, ["-y","-i",path,"-t",String(seconds),"-codec:a","libmp3lame","-b:a","192k",temp], {stdio:"ignore"});
  renameSync(temp,path);
  return seconds;
}

const context = `A 20-second creative audition for an artful data film about Manchester United history. Picture: a fine red line travels between George Best in 1968 and Cristiano Ronaldo in 2008 while concise typography reveals that both wore number 7, scored in a European final, won the Ballon d'Or, and peaked in season five. This is a taste experiment, not a final mix. Make one complete miniature with a clean ending.`;

const candidates = [
  { id:"01-electroacoustic-thread", family:"score", vocal:"none", title:"Electroacoustic thread", thesis:"Transform one tactile source into the whole identity.", prompt:`${context} Instrumental electroacoustic miniature at 86 BPM. One close felt-piano pluck is stretched into a warm granular ribbon, clipped into a soft pulse, and returned as a resonant tail. Precise, spacious, curious. No orchestra, trailer language or stock documentary sentiment.` },
  { id:"02-dub-space", family:"score", vocal:"none", title:"Dub-space architecture", thesis:"Treat silence and stereo depth as active narrative material.", prompt:`${context} Instrumental abstract dub production at 78 BPM, stripped of reggae song signifiers: isolated rounded sub notes, short filtered spring-like echoes, tiny dry rim events and enormous negative space. The red line feels suspended in deep black space. No offbeat skank, vocals or club drop.` },
  { id:"03-deconstructed-garage", family:"hybrid", vocal:"chops", title:"Deconstructed UK pulse", thesis:"Test contemporary British rhythmic identity without becoming a sports promo.", prompt:`${context} Forward-looking broken UK electronic rhythm around 132 BPM half-time: ghosted two-step percussion, soft sub pressure, glassy micro-samples and tiny non-lexical human vocal chops used as rhythm. Elegant and sparse, not a dancefloor drop; leave air around every visual fact.` },
  { id:"04-vocal-canon", family:"vocal", vocal:"sung", title:"Numbers canon", thesis:"Let voices embody repetition across forty years.", prompt:`${context} Minimal a cappella chamber canon with two intimate mixed voices, dry and close, no choir grandeur. Lyrics only: "Seven / forty years / seven / the line returns / nineteen sixty-eight / two thousand eight". Interlocking whispered-sung cells, restrained dynamics, precise rhythm, ending on an unresolved unison.` },
  { id:"05-art-pop-hook", family:"song", vocal:"sung", title:"Art-pop fact hook", thesis:"See whether the facts can become a memorable song rather than accompaniment.", prompt:`${context} Minimal angular art-pop micro-song at 102 BPM with dry drum machine, rubbery mono bass and one cool understated lead vocalist. Lyrics: "Number seven, forty years / same final light, a different year / season five, the thread appears." Catchy but intelligent, no stadium chorus, no rock guitars, no triumphal lift.` },
  { id:"06-spoken-data-poem", family:"vocal", vocal:"spoken", title:"Spoken data poem", thesis:"Make language contrapuntal rather than duplicate the captions literally.", prompt:`${context} Sparse electronic spoken-word piece. A calm, intimate British voice delivers: "A number repeats. A final echoes. The fifth season rises. Forty years fold into one red line." Underneath: low sine pulse, single-note prepared piano, dry spatial clicks. No announcer voice, hype, rhyme scheme or cinematic swell.` },
  { id:"07-post-punk-broadcast", family:"song", vocal:"spoken-sung", title:"Post-punk transmission", thesis:"Test grit, Manchester-adjacent cultural energy and editorial distance.", prompt:`${context} Taut minimal post-punk/electronic transmission at 118 BPM: dry motorik drum machine, wiry bass synth, clipped guitar harmonics used very sparingly, detached spoken-sung voice. Lyrics: "Sixty-eight / two thousand eight / seven returns / the record turns." Arch, modern and controlled; no pub rock, anthem or retro pastiche.` },
  { id:"08-soulful-counterfactual", family:"song", vocal:"sung", title:"Intimate soul memory", thesis:"Explore genuine human feeling without the prestige-documentary ensemble that failed.", prompt:`${context} Intimate futuristic soul miniature at 74 BPM: close unshowy singer, soft electric-piano fragments, sub bass and almost no drums. Lyrics: "I saw the line come back again / forty years, the same red thread." Emotionally warm but unsentimental, no gospel, belting, choir, strings or inspirational cadence.` },
  { id:"09-operatic-statistics", family:"vocal", vocal:"sung", title:"Operatic statistic", thesis:"Use radical scale contrast: monumental voice against minimal data graphics.", prompt:`${context} Experimental contemporary operatic miniature: one low baritone and one high soprano sing isolated numbers and words across silence: "seven / sixty-eight / eight / five". Underneath only a dark sustained electronic overtone and two low impacts. Severe, sculptural and modern; no lush orchestra, vibrato excess, choir or heroic climax.` },
  { id:"10-vocoder-machine", family:"vocal", vocal:"processed", title:"Machine-readable chorus", thesis:"Turn the database itself into the apparent speaker.", prompt:`${context} Minimal vocoder electro miniature at 110 BPM. An androgynous synthetic voice calmly intones "number seven / European final / Ballon d'Or / season five" over a clean sequenced bass and pin-point electronic percussion. Clinical but seductive, playful not robotic parody; no EDM drop or retro-futurist cheese.` },
  { id:"11-terrace-deconstruction", family:"vocal", vocal:"group", title:"Deconstructed terrace breath", thesis:"Touch football culture directly, but abstract the crowd beyond cliché.", prompt:`${context} Experimental vocal sound sculpture made from four close human voices, breaths, foot stamps and consonants. No recognisable chant and no stadium ambience. The group gradually forms the words "seven" and "again" from fragmented syllables, then disappears into one shared breath. Intimate, uncanny, rhythmic, non-triumphal.` },
  { id:"12-jazz-time-loop", family:"score", vocal:"none", title:"Time-loop jazz", thesis:"Test intelligence, surprise and human timing through a non-obvious genre lens.", prompt:`${context} Instrumental contemporary chamber-jazz miniature in an uneven 7-beat cycle: muted bass clarinet, dry upright bass harmonics, brushed snare fragments and sparse prepared piano. The cycle folds elegantly rather than swinging. Cerebral, nocturnal and taut; no lounge mood, solos, brass section or vintage pastiche.` },
];

const manifest = { provider:"ElevenLabs", model:"music_v2", durationSeconds:20, auditionWindow:"00:18–00:38", generatedAt:new Date().toISOString(), candidates:[] };
for (const candidate of candidates) {
  const output = resolve(outputDir, `${candidate.id}.mp3`);
  if (!existsSync(output) || force) {
    console.log(`Generating ${candidate.id}…`);
    const response = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192", {
      method:"POST",
      headers:{"xi-api-key":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({prompt:candidate.prompt,music_length_ms:20000,model_id:"music_v2",force_instrumental:candidate.vocal==="none",sign_with_c2pa:true}),
    });
    if (!response.ok) throw new Error(`${candidate.id} failed (${response.status}): ${await response.text()}`);
    writeFileSync(output, Buffer.from(await response.arrayBuffer()));
  }
  const actualDurationSeconds=enforceDuration(output,20);
  manifest.candidates.push({...candidate,actualDurationSeconds,file:`public/video/audio/elevenlabs-wide-bakeoff/${candidate.id}.mp3`});
}
writeFileSync(resolve(outputDir,"manifest.json"),`${JSON.stringify(manifest,null,2)}\n`);
console.log(`Wrote ${candidates.length} wide-aperture auditions.`);
