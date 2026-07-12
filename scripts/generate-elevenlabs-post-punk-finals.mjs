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
const outputDir = resolve("public/video/audio/elevenlabs-post-punk-finals");
mkdirSync(outputDir, { recursive: true });

const sharedNegative = [
  "stadium crowd", "football chant", "sports anthem", "heroic", "triumphant",
  "epic trailer", "braam", "orchestral swell", "sentimental strings", "pub rock",
  "classic rock", "guitar solo", "large chorus", "EDM drop", "glossy synthwave",
];

const treatments = [
  {
    id: "post-punk-editorial",
    title: "Post-punk editorial transmission",
    thesis: "Voice as sparse punctuation: maximum caption space, personality concentrated at thresholds.",
    chunks: [
      { text:"[Instrumental intro]", duration_ms:18000, positive_styles:["minimal contemporary post-punk electronics","118 BPM","dry motorik drum machine","wiry mono synth bass","rare clipped guitar harmonics","small red-line electronic flickers","curious and wry","very sparse arrangement"], negative_styles:[...sharedNegative,"vocals","lyrics"], context_adherence:"high" },
      { text:"[Spoken-sung transmission]\nSixty-eight.\nTwo thousand eight.\nSeven returns.\nThe record turns.", duration_ms:20000, positive_styles:["detached low British spoken-sung voice","short factual transmissions with long gaps","taut post-punk electronics","broken rhythmic accents","dry intimate vocal","understated humour"], negative_styles:[...sharedNegative,"continuous singing","melodic chorus","busy lyrics"], context_adherence:"high" },
      { text:"[Spoken-sung transmission]\nEleven days.\nNo margin.\nThree nights turn.", duration_ms:16000, positive_styles:["firmer dry drum machine","wiry bass movement","voice clipped into three isolated statements","controlled building pressure","angular rhythmic withholding"], negative_styles:[...sharedNegative,"shouting","anthemic build","full rock band"], context_adherence:"high" },
      { text:"[Late-pressure breakdown]\nOne clock.\nSix strikes.\nThree recoveries.", duration_ms:20000, positive_styles:["mostly negative space","single low pulse","detached close voice","dry rim fragments","brief bass interruptions","tension without melodrama","one precise release"], negative_styles:[...sharedNegative,"driving beat","dense arrangement","alarm clock sound"], context_adherence:"high" },
      { text:"[Instrumental fortress]", duration_ms:10000, positive_styles:["low architectural synth resonance","skeletal motorik pulse returning","wiry harmonic overtone","quiet certainty","spacious modern post-punk"], negative_styles:[...sharedNegative,"vocals","melody","climax"], context_adherence:"high" },
      { text:"[Final transmission]\nSix thousand and twenty-eight matches.\nPull a thread.", duration_ms:6000, positive_styles:["dry close British voice","one warm unresolved bass interval","clean resonant tail","wry invitation rather than slogan"], negative_styles:[...sharedNegative,"sales voice","grand finale","fadeout"], context_adherence:"high" },
    ],
  },
  {
    id: "post-punk-song",
    title: "Post-punk red-line song",
    thesis: "A bolder authored song: recurring verbal hook, more colour and humour, greater competition risk.",
    chunks: [
      { text:"[Intro]\nFirst eleven on the paper.\nThen the line begins to run.", duration_ms:18000, positive_styles:["angular modern electronic post-punk","122 BPM","cool understated British vocalist","dry drum machine","rubbery mono bass","clipped guitar harmonics","playful restraint"], negative_styles:[...sharedNegative,"big hook","nostalgic rock"], context_adherence:"high" },
      { text:"[Verse]\nSixty-eight to two thousand eight,\nnumber seven keeps the date.\nFinal goal and season five—\nthe same red line, still alive.", duration_ms:20000, positive_styles:["spoken-sung rhythmic verse","wry factual lyric","broken electronic beat","short melodic bass answer","dry vocal","catchy but not pop-polished"], negative_styles:[...sharedNegative,"cheerful pop","singalong chorus","dense harmony"], context_adherence:"high" },
      { text:"[Refrain]\nEleven days. No margin.\nThree doors. Three turns.\nThe line holds.", duration_ms:16000, positive_styles:["firmer post-punk pulse","memorable clipped refrain","voice doubling only on the words the line holds","controlled momentum","sharp rhythmic gaps"], negative_styles:[...sharedNegative,"shouted chorus","power chords","victory mood"], context_adherence:"high" },
      { text:"[Breakdown]\nAfter eighty-five—\nthings become less certain.\nOne clock. Six strikes.\nYou may have noticed a pattern.", duration_ms:20000, positive_styles:["deadpan British spoken voice","almost no drums","low synth pulse","tiny guitar harmonic punctuation","dry humour","late-pressure tension"], negative_styles:[...sharedNegative,"comedy music","poetry slam","dramatic riser"], context_adherence:"high" },
      { text:"[Instrumental return]", duration_ms:10000, positive_styles:["motorik pulse returns in stripped form","wiry bass","one transformed vocal grain","architectural low resonance","forward motion not climax"], negative_styles:[...sharedNegative,"vocals","full band","triumphant cadence"], context_adherence:"high" },
      { text:"[Outro]\nSix thousand and twenty-eight matches.\nPick one.\nPull a thread.", duration_ms:6000, positive_styles:["close deadpan voice","single bass answer","clean abrupt-resonant ending","characterful invitation"], negative_styles:[...sharedNegative,"advertising slogan","grand ending","applause"], context_adherence:"high" },
    ],
  },
];

const manifest={provider:"ElevenLabs",model:"music_v2",durationSeconds:90,generatedAt:new Date().toISOString(),pictureActs:["00:00–00:18 archive","00:18–00:38 rhyme","00:38–00:54 Treble","00:54–01:14 Fergie time","01:14–01:24 fortress","01:24–01:30 receipt"],treatments:[]};
for(const treatment of treatments){
  const output=resolve(outputDir,`${treatment.id}.mp3`);
  if(!existsSync(output)||force){
    console.log(`Generating ${treatment.id}…`);
    const response=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192",{
      method:"POST",headers:{"xi-api-key":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({composition_plan:{chunks:treatment.chunks},model_id:"music_v2",sign_with_c2pa:true}),
    });
    if(!response.ok)throw new Error(`${treatment.id} failed (${response.status}): ${await response.text()}`);
    writeFileSync(output,Buffer.from(await response.arrayBuffer()));
  }
  manifest.treatments.push({...treatment,file:`public/video/audio/elevenlabs-post-punk-finals/${treatment.id}.mp3`});
}

const bridgeOutput=resolve(outputDir,"post-punk-song-fortress-bridge.mp3");
if(!existsSync(bridgeOutput)||force){
  console.log("Generating post-punk-song-fortress-bridge…");
  const response=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192",{
    method:"POST",headers:{"xi-api-key":apiKey,"Content-Type":"application/json"},
    body:JSON.stringify({
      prompt:"An exactly 11-second instrumental bridge for an angular modern electronic post-punk song at 122 BPM. Skeletal motorik drum-machine pulse, wiry mono bass, one clipped guitar-harmonic family and a tiny transformed non-lexical vocal grain. Low architectural tension and quiet forward motion, designed to sit beneath dense data typography before a final close spoken line. Begin immediately but sparsely; end cleanly without a cadence. No lead vocal, lyrics, crowd, anthem, rock drive, orchestral swell, riser, trailer impact or climax.",
      music_length_ms:11000,model_id:"music_v2",force_instrumental:true,sign_with_c2pa:true,
    }),
  });
  if(!response.ok)throw new Error(`fortress bridge failed (${response.status}): ${await response.text()}`);
  writeFileSync(bridgeOutput,Buffer.from(await response.arrayBuffer()));
}
manifest.fortressBridge={file:"public/video/audio/elevenlabs-post-punk-finals/post-punk-song-fortress-bridge.mp3",timeline:"01:14–01:25",purpose:"Fill the unintended full-silence gap while preserving the final vocal landing."};
writeFileSync(resolve(outputDir,"manifest.json"),`${JSON.stringify(manifest,null,2)}\n`);
console.log("Wrote two full-length post-punk treatments.");
