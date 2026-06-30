import { downloadRuntimeDb, usesRuntimeDbBlob } from "./lib/download-db";

export async function register() {
  if (usesRuntimeDbBlob()) {
    await downloadRuntimeDb();
  }
}
