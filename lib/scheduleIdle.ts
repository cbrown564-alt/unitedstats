/**
 * Run a low-priority task when the browser is idle, with a timeout fallback
 * for browsers without `requestIdleCallback`.
 */
export function scheduleIdle(task: () => void, timeoutMs = 2000): () => void {
  if (typeof window === "undefined") return () => {};

  let cancelled = false;
  const run = () => {
    if (!cancelled) task();
  };

  const win = window;
  if (typeof win.requestIdleCallback === "function") {
    const id = win.requestIdleCallback(run, { timeout: timeoutMs });
    return () => {
      cancelled = true;
      win.cancelIdleCallback(id);
    };
  }

  const id = win.setTimeout(run, 1);
  return () => {
    cancelled = true;
    win.clearTimeout(id);
  };
}
