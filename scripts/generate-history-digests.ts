import path from "node:path";
import {
  HISTORY_DIGEST_DIR,
  allHistoryDigestMatchIds,
  latestHistoryDigestMatchIds,
  writeHistoryDigests,
} from "../lib/historyDigests";

interface Args {
  all: boolean;
  latest: number | null;
  matchIds: string[];
  outDir: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { all: false, latest: null, matchIds: [], outDir: HISTORY_DIGEST_DIR };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") args.all = true;
    else if (a === "--latest") args.latest = Number(argv[++i] ?? "0");
    else if (a === "--match") args.matchIds.push(argv[++i] ?? "");
    else if (a === "--out") args.outDir = path.resolve(argv[++i] ?? HISTORY_DIGEST_DIR);
    else throw new Error(`unknown argument "${a}"`);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const ids = args.all
    ? allHistoryDigestMatchIds()
    : args.latest != null
      ? latestHistoryDigestMatchIds(args.latest)
      : args.matchIds;
  if (ids.length === 0) {
    console.log("history-digests: no match ids requested; wrote 0");
    return;
  }
  const written = writeHistoryDigests(ids, args.outDir);
  console.log(`history-digests: wrote ${written.length} digest(s) to ${args.outDir}`);
  for (const id of written) console.log(` - ${id}`);
}

main();

