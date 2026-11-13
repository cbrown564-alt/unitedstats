/**
 * A small stand-in for React Server Components, so pages written for the Next
 * App Router render unchanged under Astro.
 *
 * `resolveTree` walks a page's element tree on the server. It calls each
 * server component (awaiting async ones) until only host elements, fragments,
 * Suspense boundaries and client components remain. `"use client"` modules are
 * tagged at build time by the `rt-client-refs` Vite plugin (see
 * `src/rt/vite-plugin.mjs`). The resolved tree is rendered to HTML on the server
 * and also encoded (`encodeTree`), so the client can hydrate the same tree as one
 * React root. That is what Next does with its RSC payload, so context providers
 * that wrap server children (MatchCorrection, MatchesCatalog) keep working.
 */
import * as React from "react";
import { Fragment, Suspense, createElement, isValidElement, type ReactElement, type ReactNode } from "react";

export const CLIENT_REF = "$$rtClient";

const REACT_MEMO = Symbol.for("react.memo");
const REACT_FORWARD_REF = Symbol.for("react.forward_ref");
const REACT_LAZY = Symbol.for("react.lazy");

type AnyProps = Record<string, unknown> & { children?: ReactNode };

function clientId(type: unknown): string | undefined {
  if (type && (typeof type === "function" || typeof type === "object")) {
    return (type as Record<string, unknown>)[CLIENT_REF] as string | undefined;
  }
  return undefined;
}

function describe(type: unknown): string {
  if (typeof type === "function") return type.name || "anonymous";
  return String(type);
}

// Server components may call the hooks React Server Components allow (useId,
// useMemo, useCallback, use). Calling them outside a React render needs a
// dispatcher, installed only for the synchronous part of each call, as React's
// RSC renderer does.
type Dispatcher = Record<string, unknown>;
const internals = (React as unknown as Record<string, { H: Dispatcher | null }>)
  .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

export type ResolveContext = { ids: number };

function serverDispatcher(ctx: ResolveContext, name: string): Dispatcher {
  const unsupported = (hook: string) => () => {
    throw new Error(`Server component <${name}> calls ${hook}; mark its module "use client".`);
  };
  return {
    useId: () => `_S_${(ctx.ids++).toString(32)}_`,
    useMemo: (fn: () => unknown) => fn(),
    useCallback: (fn: unknown) => fn,
    useDebugValue: () => {},
    useContext: (c: { _currentValue?: unknown }) => c._currentValue,
    use: (u: { status?: string; value?: unknown; _currentValue?: unknown; then?: unknown }) => {
      if (typeof u?.then !== "function") return u?._currentValue;
      if (u.status === "fulfilled") return u.value;
      throw new Error(`Server component <${name}> calls use() on a pending promise; await it instead.`);
    },
    useState: unsupported("useState"),
    useReducer: unsupported("useReducer"),
    useEffect: unsupported("useEffect"),
    useLayoutEffect: unsupported("useLayoutEffect"),
    useInsertionEffect: unsupported("useInsertionEffect"),
    useRef: unsupported("useRef"),
    useSyncExternalStore: unsupported("useSyncExternalStore"),
    useTransition: unsupported("useTransition"),
    useDeferredValue: unsupported("useDeferredValue"),
    useImperativeHandle: unsupported("useImperativeHandle"),
    useOptimistic: unsupported("useOptimistic"),
    useActionState: unsupported("useActionState"),
  };
}

function callServerComponent(type: (p: AnyProps) => unknown, props: AnyProps, ctx: ResolveContext): unknown {
  const prev = internals.H;
  internals.H = serverDispatcher(ctx, describe(type));
  try {
    return type(props);
  } finally {
    internals.H = prev;
  }
}

/** Resolve server components; returns a tree of host + client elements only. */
export function resolveTree(node: unknown, ctx: ResolveContext = { ids: 0 }): Promise<unknown> {
  return resolveNode(node, ctx, "root");
}

async function resolveNode(node: unknown, ctx: ResolveContext, path: string): Promise<unknown> {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") return node;
  if (typeof node === "bigint") return node;
  if (node instanceof Promise) return resolveNode(await node, ctx, path);
  if (Array.isArray(node)) return Promise.all(node.map((n, i) => resolveNode(n, ctx, `${path}[${i}]`)));
  if (!isValidElement(node)) {
    if (typeof node === "object" && Symbol.iterator in (node as object)) {
      return resolveNode(Array.from(node as Iterable<unknown>), ctx, path);
    }
    if ((node as { $$typeof?: symbol }).$$typeof === REACT_LAZY) {
      const lazy = node as unknown as { _payload: unknown; _init: (p: unknown) => unknown };
      return resolveNode(lazy._init(lazy._payload), ctx, path);
    }
    return node;
  }

  const el = node as ReactElement<AnyProps>;
  const { type } = el;
  const props = el.props ?? {};

  if (typeof type === "string" || type === Fragment || type === Suspense) {
    return cloneWith(el, await resolveProps(props, ctx, `${path}>${typeof type === "string" ? type : "frag"}`));
  }

  if (clientId(type)) {
    // Client component: resolve the server elements in its props (children and
    // any element-valued prop), but leave its own render to React.
    return cloneWith(el, await resolveProps(props, ctx, `${path}>${describe(type)}`));
  }

  if (typeof type === "function") {
    if (type.prototype?.isReactComponent) {
      throw new Error(`Class component <${describe(type)}> rendered from a server component at ${path}; mark it "use client".`);
    }
    const out = await callServerComponent(type as (p: AnyProps) => unknown, props, ctx);
    return resolveNode(out, ctx, `${path}>${describe(type)}`);
  }

  if (type && typeof type === "object") {
    const t = type as { $$typeof?: symbol; type?: unknown; render?: (p: AnyProps, r: null) => unknown };
    if (t.$$typeof === REACT_MEMO) return resolveNode(createElement(t.type as never, props), ctx, path);
    if (t.$$typeof === REACT_FORWARD_REF && t.render) return resolveNode(await t.render(props, null), ctx, path);
    if (t.$$typeof === REACT_LAZY) {
      const lazy = t as unknown as { _payload: unknown; _init: (p: unknown) => unknown };
      return resolveNode(createElement(lazy._init(lazy._payload) as never, props), ctx, path);
    }
  }
  throw new Error(`Unsupported element type ${describe(type)} in server tree at ${path}`);
}

async function resolveProps(props: AnyProps, ctx: ResolveContext, path: string): Promise<AnyProps> {
  const out: AnyProps = {};
  await Promise.all(
    Object.keys(props).map(async (k) => {
      out[k] = await resolveValue(props[k], ctx, `${path}.${k}`);
    }),
  );
  return out;
}

/** Props may hold elements anywhere (arrays of rows with a JSX cell, etc.). */
async function resolveValue(v: unknown, ctx: ResolveContext, path: string): Promise<unknown> {
  if (v == null || typeof v !== "object") return v;
  if (isValidElement(v) || v instanceof Promise) return resolveNode(v, ctx, path);
  if (Array.isArray(v)) return Promise.all(v.map((x, i) => resolveValue(x, ctx, `${path}[${i}]`)));
  if (Object.getPrototypeOf(v) === Object.prototype) {
    const o = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    await Promise.all(Object.keys(o).map(async (k) => void (out[k] = await resolveValue(o[k], ctx, `${path}.${k}`))));
    return out;
  }
  return v;
}

function cloneWith(el: ReactElement<AnyProps>, props: AnyProps): ReactElement {
  return el.key == null ? createElement(el.type, props) : createElement(el.type, { ...props, key: el.key });
}

// ---------------------------------------------------------------------------
// Encoding. JSON with tagged arrays:
//   ["$e", type, key, props]  element; type is a tag name, "$F" (Fragment),
//                             "$S" (Suspense) or ["$c", "module#export"]
//   ["$r", "module#export"]   a client component reference used as a value
//   ["$u"]                    undefined
//   ["$D", iso]               Date
//   ["$n", "NaN"|"Infinity"|"-Infinity"|"-0"]
//   ["$M", [[k, v], …]]       Map
//   ["$T", [v, …]]            Set
//   ["$a", ...items]          an array whose first item is a "$…" string
// ---------------------------------------------------------------------------

export function encodeTree(v: unknown, path = "root"): unknown {
  if (v === undefined) return ["$u"];
  if (v === null || typeof v === "boolean" || typeof v === "string") return v;
  if (typeof v === "number") {
    if (Number.isNaN(v)) return ["$n", "NaN"];
    if (!Number.isFinite(v)) return ["$n", v > 0 ? "Infinity" : "-Infinity"];
    if (Object.is(v, -0)) return ["$n", "-0"];
    return v;
  }
  if (typeof v === "function") {
    const id = clientId(v);
    if (id) return ["$r", id];
    throw new Error(`Function prop "${v.name || "anonymous"}" passed to a client component at ${path}`);
  }
  if (typeof v !== "object") throw new Error(`Cannot serialize ${typeof v} at ${path}`);
  if (Array.isArray(v)) {
    const items = v.map((x, i) => encodeTree(x, `${path}[${i}]`));
    return typeof items[0] === "string" && items[0].startsWith("$") ? ["$a", ...items] : items;
  }
  if (v instanceof Date) return ["$D", v.toISOString()];
  if (isValidElement(v)) {
    const el = v as ReactElement<AnyProps>;
    const id = clientId(el.type);
    const type =
      typeof el.type === "string" ? el.type : el.type === Fragment ? "$F" : el.type === Suspense ? "$S" : id ? ["$c", id] : null;
    if (type == null) throw new Error(`Unresolved element <${describe(el.type)}> at ${path}`);
    const props: Record<string, unknown> = {};
    for (const k of Object.keys(el.props ?? {})) props[k] = encodeTree(el.props[k], `${path}.${k}`);
    return ["$e", type, el.key ?? null, props];
  }
  if (v instanceof Map) return ["$M", [...v].map(([k, x], i) => [encodeTree(k, `${path}<k${i}>`), encodeTree(x, `${path}<${i}>`)])];
  if (v instanceof Set) return ["$T", [...v].map((x, i) => encodeTree(x, `${path}<${i}>`))];
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v as object)) out[k] = encodeTree((v as Record<string, unknown>)[k], `${path}.${k}`);
  return out;
}

/** Inline-safe JSON for a `<script type="application/json">` body. */
export function payloadJson(v: unknown): string {
  return JSON.stringify(v)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("\\u2028", "g"), "\\u2028")
    .replace(new RegExp("\\u2029", "g"), "\\u2029");
}
