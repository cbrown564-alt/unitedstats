// Astro generates its types into .astro/; a reference is the documented way to load them.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />

/** The Worker's bindings (wrangler.jsonc). Only the middleware reads them, through a narrow cast. */
declare module "cloudflare:workers" {
  export const env: unknown;
}
