/** `next/dynamic` for the Astro build: React.lazy inside a Suspense boundary. */
import { Suspense, lazy, useSyncExternalStore, type ComponentType, type ReactNode } from "react";

type Loader<P> = () => Promise<ComponentType<P> | { default: ComponentType<P> }>;
type Options = { ssr?: boolean; loading?: () => ReactNode };

const noopSubscribe = () => () => {};

export default function dynamic<P = Record<string, never>>(loader: Loader<P>, options: Options = {}): ComponentType<P> {
  const Lazy = lazy(async () => {
    const mod = await loader();
    return { default: (typeof mod === "function" ? mod : (mod as { default: ComponentType<P> }).default) as ComponentType<P> };
  });
  const fallback = options.loading ? options.loading() : null;
  function Dynamic(props: P) {
    // ssr:false renders the fallback on the server and in the hydration render.
    const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
    if (options.ssr === false && !mounted) return <>{fallback}</>;
    return (
      <Suspense fallback={fallback}>
        <Lazy {...(props as P & object)} />
      </Suspense>
    );
  }
  return Dynamic as ComponentType<P>;
}
