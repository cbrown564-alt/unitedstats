export async function register() {
  // Only the Node.js runtime reads the SQLite db; never load the fs-backed
  // downloader in the Edge runtime (middleware compiles instrumentation for edge
  // too). The dynamic import also keeps node:fs out of the edge bundle.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { downloadRuntimeDb, usesRuntimeDbBlob } = await import("./lib/download-db");
  if (usesRuntimeDbBlob()) {
    await downloadRuntimeDb();
  }
}
