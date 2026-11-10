import { existsSync, rmSync } from "node:fs";
import path from "node:path";

// These film-production sources are kept in public for local rendering. Next
// copies public/ into out/, which Cloudflare publishes as-is, so remove them
// before they reach the deployment or overstate the site footprint.
const audio = path.join(process.cwd(), "out", "video", "audio");
if (existsSync(audio)) {
  rmSync(audio, { recursive: true, force: true });
  console.log("postbuild: removed working audio from out/video/audio");
}
