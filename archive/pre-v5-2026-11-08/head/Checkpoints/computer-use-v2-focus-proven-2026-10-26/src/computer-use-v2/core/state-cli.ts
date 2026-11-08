// state-cli.ts - the bash core's binding to the scoped store (blueprint section 6).
//
//   bun state-cli.ts get <instanceRoot> <key>
//   bun state-cli.ts put <instanceRoot> <key> <value> [--db <path>]
//
// The store is the 7 verbatim files in ../scoped/. This file only calls them. Every write
// goes through the scope guard: the db path must be absolute, must not be a shared global
// directory, and must be CONTAINED in the instance root (by path.relative, never a string
// prefix). A violation exits 3 and prints SCOPE_VIOLATION - the write is refused, loudly.
//
// Exit: 0 ok, 1 not found / bad usage, 3 SCOPE_VIOLATION.
import * as path from "node:path";
import { getStoreDb, upsertRow } from "../scoped/scoped-store.js";
import { assertContained, assertNotSharedGlobal, ScopeGuardError } from "../scoped/scope-guard.js";

const [verb, root, key, value, ...rest] = process.argv.slice(2);
const refuse = (token: string, detail: string, code: number) => {
  console.error(`REFUSED  ${token}  —  ${detail}`);
  process.exit(code);
};
if (!verb || !root || !key) refuse("BAD_ARGS", "usage: state-cli.ts get|put <instanceRoot> <key> [value] [--db <path>]", 1);

try {
  const instanceRoot = assertNotSharedGlobal(root, "instance root");
  const i = rest.indexOf("--db");
  const dbPath = i >= 0 ? rest[i + 1] : path.join(instanceRoot, "fs", "state.db");
  assertContained(instanceRoot, dbPath, "state db");

  const schema = ["CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, data TEXT NOT NULL)"];
  getStoreDb({ dbPath, schema, id: "computer-use" });

  if (verb === "put") {
    if (value === undefined) refuse("BAD_ARGS", "put needs a value", 1);
    upsertRow("kv", "k", key, value);
    console.log(JSON.stringify({ ok: true, key, db: dbPath }));
  } else if (verb === "get") {
    const row = getStoreDb().query("SELECT data FROM kv WHERE k = ?").get(key) as { data: string } | null;
    if (!row) refuse("STATE_KEY_ABSENT", `no key '${key}' in ${dbPath}`, 1);
    console.log(JSON.stringify({ ok: true, key, value: row!.data, db: dbPath }));
  } else {
    refuse("BAD_VERB", `unknown state verb '${verb}'`, 1);
  }
} catch (e) {
  if (e instanceof ScopeGuardError) refuse("SCOPE_VIOLATION", e.message, 3);
  refuse("STATE_FAILED", String((e as Error).message ?? e), 1);
}
