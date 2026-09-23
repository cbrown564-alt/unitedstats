import { existsSync, rmSync } from "node:fs";
import path from "node:path";

// These film-production sources are kept in public for local rendering, but
// .vercelignore excludes them from the deployment source. A local Next export
// would otherwise copy them into out/ and overstate the site footprint.
const audio = path.join(process.cwd(), "out", "video", "audio");
if (existsSync(audio)) {
  rmSync(audio, { recursive: true, force: true });
  console.log("postbuild: removed working audio from out/video/audio");
}
