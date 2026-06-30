export async function register() {
  // Only the Node.js runtime reads the SQLite db; never load the fs-backed
  // downloader in the Edge runtime (middleware compiles instrumentation for edge
  // too). The dynamic import also keeps node:fs out of the edge bundle.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { downloadRuntimeDb, usesRuntimeDbBlob } = await import("./lib/download-db");
  if (!usesRuntimeDbBlob()) return;
  try {
    // Prewarm /tmp with the fresh blob so the first request serves current data.
    await downloadRuntimeDb();
  } catch (err) {
    // Non-fatal: getDb() falls back to the bundled data/united.db. A bad or
    // missing blob must never block server startup or take the site down.
    console.error("[instrumentation] blob prewarm failed; using bundled united.db", err);
  }
}
