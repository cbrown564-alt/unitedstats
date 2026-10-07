import { defineWranglerConfig } from "wrangler/experimental-config";

// cf uses Wrangler only to package the existing Next.js static export.
export default defineWranglerConfig({ assetsDirectory: "./out" });
