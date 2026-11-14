/**
 * `next/og` for the Astro build: satori renders the element to SVG and resvg
 * rasterises it to PNG, as @vercel/og does inside Next. OG routes prerender
 * in Node, so the native resvg binding is fine.
 */
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import type { ReactElement } from "react";

type Font = { name: string; data: ArrayBuffer | Buffer; weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900; style?: "normal" | "italic" };
type Options = { width?: number; height?: number; fonts?: Font[]; headers?: Record<string, string>; status?: number; debug?: boolean };

export class ImageResponse extends Response {
  constructor(element: ReactElement, options: Options = {}) {
    const width = options.width ?? 1200;
    const height = options.height ?? 630;
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const svg = await satori(element, { width, height, fonts: (options.fonts ?? []) as never, debug: options.debug });
        const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
        controller.enqueue(new Uint8Array(png));
        controller.close();
      },
    });
    super(body, {
      status: options.status ?? 200,
      headers: { "content-type": "image/png", "cache-control": "public, immutable, no-transform, max-age=31536000", ...options.headers },
    });
  }
}
