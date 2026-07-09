/**
 * Persist the live Studio queue (temp) into content/copy-queue.json for git.
 * Usage: npm run copy:persist
 */
import path from "node:path";

import {
  COPY_QUEUE_PATH,
  COPY_QUEUE_RUNTIME_PATH,
  countByStatus,
  loadCopyQueue,
  persistCopyQueue,
  syncRuntimeQueueFromCommitted,
} from "../lib/copyCatalog";

const ROOT = process.cwd();

function main(): void {
  const queue = syncRuntimeQueueFromCommitted();
  persistCopyQueue(queue);
  // Keep runtime in sync with what we just wrote.
  const status = countByStatus(queue);
  console.log(
    `copy:persist → todo:${status.todo} rewritten:${status.rewritten} keep:${status.keep} skip:${status.skip}`,
  );
  console.log(`  runtime ${COPY_QUEUE_RUNTIME_PATH}`);
  console.log(`  → ${path.relative(ROOT, COPY_QUEUE_PATH)}`);
  // Touch-load to prove readable
  void loadCopyQueue(COPY_QUEUE_PATH);
}

main();
