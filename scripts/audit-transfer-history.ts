import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getDb } from "@/lib/db";
import { loadInflationIndices } from "@/lib/inflationIndices";
import {
  buildTransferA0Audit,
  renderTransferA0Markdown,
  renderTransferCandidateCsv,
} from "@/lib/transferResearch";

const outputDir = path.join(process.cwd(), "research", "transfer-history");
mkdirSync(outputDir, { recursive: true });

const audit = buildTransferA0Audit(getDb(), loadInflationIndices());
writeFileSync(
  path.join(outputDir, "a0-feasibility-audit.json"),
  `${JSON.stringify({ ...audit, candidates: undefined }, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  path.join(outputDir, "a0-feasibility-audit.md"),
  renderTransferA0Markdown(audit),
  "utf8",
);
writeFileSync(
  path.join(outputDir, "a0-candidate-cohort.csv"),
  renderTransferCandidateCsv(audit.candidates),
  "utf8",
);

console.log(
  `transfer A0 audit — ${audit.summary.candidateSignings} candidates, ` +
    `${audit.summary.knownFeeSignings} known-fee signings; descriptive gate open, modelling gate closed.`,
);
