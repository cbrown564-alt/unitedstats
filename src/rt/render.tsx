/**
 * Render one App Router page module to the parts Document.astro prints:
 * head tags, body HTML, and the hydration payload.
 */
import { Fragment, createElement, type ComponentType, type ReactNode } from "react";
import { renderToReadableStream } from "react-dom/server";
import { metadata as rootMetadata } from "@/app/layout";
import NotFoundPage, { metadata as notFoundMetadata } from "@/app/not-found";
import { ProductAnalytics } from "@/components/ProductAnalytics";
import { SiteShell } from "@/components/SiteShell";
import { encodeTree, payloadJson, resolveTree } from "./flight";
import { renderHead, resolveHead, type Metadata } from "./metadata";
import { CSR_BAILOUT, NavContext, NotFoundSignal, RedirectSignal, type NavState } from "./nav";
import { ogFilesFor } from "./og-files";
import { nextParams } from "./routes";

export { pathFor, staticPaths } from "./routes";

type Params = Record<string, string | string[]>;

export type PageModule = {
  default: ComponentType<{ params: Promise<Params>; searchParams: Promise<Record<string, string>> }>;
  metadata?: Metadata;
  generateMetadata?: (props: { params: Promise<Params>; searchParams: Promise<Record<string, string>> }) => Promise<Metadata> | Metadata;
};

export type RenderedPage =
  | { kind: "page"; status: 200 | 404; head: string; html: string; payload: string; chromeOff: boolean }
  | { kind: "redirect"; status: 307 | 308; location: string };

const pageProps = (params: Params) => ({ params: Promise.resolve(params), searchParams: Promise.resolve({}) });

async function toHtml(node: ReactNode): Promise<string> {
  let failure: unknown;
  const stream = await renderToReadableStream(node, {
    onError(error) {
      const digest = (error as { digest?: string })?.digest;
      if (digest === CSR_BAILOUT) return CSR_BAILOUT;
      failure ??= error;
      return undefined;
    },
  });
  await stream.allReady;
  const html = await new Response(stream).text();
  if (failure) throw failure;
  return html;
}

function shell(page: ReactNode): ReactNode {
  return createElement(Fragment, null, createElement(SiteShell, null, page), createElement(ProductAnalytics));
}

async function build(route: string, nav: NavState, meta: Metadata, page: ReactNode, status: 200 | 404): Promise<RenderedPage> {
  const tree = await resolveTree(shell(page));
  const html = await toHtml(createElement(NavContext, { value: nav }, tree as ReactNode));
  const og = ogFilesFor(route, nav.pathname);
  return {
    kind: "page",
    status,
    head: renderHead(resolveHead(rootMetadata as Metadata, meta, og, { rootSegment: route === "/", notFound: status === 404 })),
    html,
    payload: payloadJson({ nav, ...encodeTree(tree) }),
    chromeOff: nav.pathname.startsWith("/stories/"),
  };
}

export async function renderNotFound(pathname: string): Promise<RenderedPage> {
  return build("/_not-found", { pathname, params: {} }, notFoundMetadata as Metadata, createElement(NotFoundPage), 404);
}

/** `route` is the app/ path pattern, e.g. "/match/[id]". */
export async function renderPage(
  mod: PageModule,
  route: string,
  astroParams: Record<string, string | undefined>,
  pathname: string,
): Promise<RenderedPage> {
  const params = nextParams(astroParams);
  const props = pageProps(params);
  try {
    const meta = (mod.generateMetadata ? await mod.generateMetadata(props) : mod.metadata) ?? {};
    return await build(route, { pathname, params }, meta, createElement(mod.default, props), 200);
  } catch (error) {
    if (error instanceof RedirectSignal) return { kind: "redirect", status: error.status, location: error.location };
    if (error instanceof NotFoundSignal) return renderNotFound(pathname);
    throw error;
  }
}
