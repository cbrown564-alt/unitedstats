import { bindings, defineConfig } from "cf/config";

export default defineConfig(({ mode }) => ({
  accountId: "e1909c4d4aec0a75a0a34fc15ee35482",
  worker: {
    name: mode === "production" ? "unitedstats" : "unitedstats-migration-preview",
    entrypoint: "./deploy/cloudflare-worker.ts",
    compatibilityDate: "2026-10-07",
    workersDev: true,
    env: { ASSETS: bindings.assets() },
    assets: { htmlHandling: "auto-trailing-slash", notFoundHandling: "none" },
    observability: { enabled: true, traces: { enabled: true, headSamplingRate: 0.01 } },
  },
}));
