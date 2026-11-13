/**
 * Writes plugins/record-guard/record-index.json: every ID an editorial entry
 * may reference, and every slug that has code behind it. The record-guard
 * plugin bundles it into the Worker and rejects a save that names anything
 * else. Generated from data/united.db in prebuild; not committed.
 *
 *   npx tsx scripts/emdash/write-record-index.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { QUESTION_COMPONENTS } from "../../components/QuestionModules";
import { ERA_KEYS } from "../../lib/compare";
import { getDb } from "../../lib/db";
import { STORY_SLUGS } from "../../lib/journey";

const ids = (sql: string) => (getDb().prepare(sql).all() as { id: string }[]).map((r) => r.id).sort();

const index = {
  matches: ids("SELECT id FROM matches"),
  players: ids("SELECT id FROM players"),
  managers: ids("SELECT id FROM managers"),
  transfers: ids("SELECT id FROM transfers"),
  eras: [...ERA_KEYS].sort(),
  questions: Object.keys(QUESTION_COMPONENTS).sort(),
  stories: [...STORY_SLUGS].sort(),
};

const out = path.join(process.cwd(), "plugins", "record-guard", "record-index.json");
writeFileSync(out, JSON.stringify(index) + "\n");
console.log(`wrote ${path.relative(process.cwd(), out)}: ${Object.entries(index).map(([k, v]) => `${k} ${v.length}`).join(", ")}`);
