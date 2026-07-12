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
const outputDir = resolve("public/video/audio/elevenlabs-convergence-bakeoff");
mkdirSync(outputDir, { recursive: true });

const picture = `A 30-second audition scored to a premium data film about Manchester United history, covering the 1998–99 Treble's three must-win matches and the transition into a tense Fergie-time clock. The moving red data line is the visual protagonist. Build three controlled rhythmic landings, then remove density for late-pressure negative space. Keep typography legible. No crowd, stadium ambience, sports anthem, heroic brass, trailer impacts, sentimental strings or victory fanfare.`;

const candidates = [
  {id:"a-uk-pulse-refined",title:"UK pulse · refined",family:"pure",vocal:false,thesis:"Is the broken electronic grid itself the identity?",prompt:`${picture} Instrumental forward-looking UK broken rhythm, 132 BPM felt in half-time. Ghost two-step percussion, rounded sub pressure, dry rim fragments, granular red-line flickers and rare non-lexical vocal grains used only as percussion. Minimal harmony. The beat repeatedly withholds its expected landing; no club drop, glossy synthwave or four-on-the-floor.`},
  {id:"b-time-loop-jazz-refined",title:"Time-loop jazz · refined",family:"pure",vocal:false,thesis:"Is human timing and cyclic intelligence the identity?",prompt:`${picture} Instrumental contemporary chamber jazz in a repeating seven-beat cycle. Muted bass clarinet, dry upright-bass harmonics, prepared piano and brushed snare fragments. No solos: the ensemble behaves like a precise clock that breathes. At the late-pressure transition, leave only bass clarinet key noise and one low pulse. No lounge, swing-era, big band or vintage pastiche.`},
  {id:"c-post-punk-refined",title:"Post-punk transmission · refined",family:"pure",vocal:true,thesis:"Is the dry Manchester-coded voice and attitude the identity?",prompt:`${picture} Taut minimal post-punk/electronic transmission at 118 BPM: dry motorik drum machine, wiry mono bass, clipped guitar harmonics and a detached low spoken-sung British voice. Lyrics only: "Eleven days / no margin / three nights turn / after eighty-five." Severe and contemporary, not nostalgic. Strip the voice and drums away for the final clock pressure. No pub rock, chant, anthem or large chorus.`},
  {id:"d-broken-meter",title:"Broken-meter data club",family:"cross",vocal:false,thesis:"UK pulse × time-loop jazz: programmed force with a living seven-beat cycle.",prompt:`${picture} Instrumental hybrid of sparse UK broken-beat electronics and contemporary chamber jazz. A 132 BPM electronic grid is interrupted by a seven-beat acoustic cycle: prepared-piano attacks, bass-clarinet breaths, sub bass and ghosted two-step drums. Crisp and nocturnal, with human microtiming inside machine precision. No solos, lounge mood, EDM drop or decorative glitch overload.`},
  {id:"e-red-line-transmission",title:"Red-line transmission",family:"cross",vocal:true,thesis:"UK pulse × post-punk: rhythm plus cultural voice, without retro costume.",prompt:`${picture} Minimal British electronic post-punk at 128 BPM: broken two-step percussion, taut synth bass, one dry guitar harmonic family and a cool understated spoken-sung voice. Lyrics only: "Eleven days / the line holds / three turns late / the record opens." The vocal arrives as short transmissions, never a full chorus. Modern, clipped and spacious; no retro revival, rock drive, club drop or chant.`},
  {id:"f-seventh-record",title:"The seventh record",family:"cross",vocal:true,thesis:"Time-loop jazz × post-punk: uneven live cycle with dry spoken attitude.",prompt:`${picture} Experimental post-punk chamber miniature in seven-beat cycles: dry upright bass, muted bass clarinet, prepared piano, skeletal drum machine and a close detached British spoken voice. Text only: "One clock. Six strikes. Three recoveries." The words cut across the meter like factual annotations. Angular, intelligent and restrained; no swing, poetry slam, pub rock, jazz solo or cinematic swell.`},
];

const manifest={provider:"ElevenLabs",model:"music_v2",durationSeconds:30,auditionWindow:"00:38–01:08",generatedAt:new Date().toISOString(),sourceTaste:["Deconstructed UK pulse","Time-loop jazz","Post-punk transmission"],candidates:[]};
for(const candidate of candidates){
  const output=resolve(outputDir,`${candidate.id}.mp3`);
  if(!existsSync(output)||force){
    console.log(`Generating ${candidate.id}…`);
    const response=await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_48000_192",{
      method:"POST",headers:{"xi-api-key":apiKey,"Content-Type":"application/json"},
      body:JSON.stringify({prompt:candidate.prompt,music_length_ms:30000,model_id:"music_v2",force_instrumental:!candidate.vocal,sign_with_c2pa:true}),
    });
    if(!response.ok)throw new Error(`${candidate.id} failed (${response.status}): ${await response.text()}`);
    writeFileSync(output,Buffer.from(await response.arrayBuffer()));
  }
  manifest.candidates.push({...candidate,file:`public/video/audio/elevenlabs-convergence-bakeoff/${candidate.id}.mp3`});
}
writeFileSync(resolve(outputDir,"manifest.json"),`${JSON.stringify(manifest,null,2)}\n`);
console.log(`Wrote ${candidates.length} convergence auditions.`);
