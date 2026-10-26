// ═══ SCOPED STORE — THE SHARED MASTER DB (the boilerplate extraction) ═══
// TRUE SOURCE: v4.4.2-wave-manager-async/Checkpoints/wave-manager-generate-
//   SHIP-APPROVED-v6/src/tools/wave-db.ts (167L) — verified line-level by
//   the master-db-race desk (every anchor below is the v6 line).
//
// THE 8-SESSION LAW (the winner wave-tracker.ts:182-194, verbatim): "the
// JSON read-modify-write COLLIDES across processes — each process loads the
// whole file + rewrites it on mutation → process A's persist clobbers B's
// rows and vice versa. THE FIX: SQLITE with WAL + the busy timeout +
// ROW-KEYED UPSERTS — each process upserts ITS wave's row (the wave primary
// key); the SQLite locking serializes the writers (one at a time, the busy
// timeout waits) — NO whole-file rewrite, NO lost rows."
//
// R2 (wave-db.ts:4): "CLEAN ORGANIZED SQLITE DB — the DB is the only writer,
// NO JSON fallback, NO dual-write" — the dual-write IS the race.
//
// THE LIFETIME: cached singleton → SELECT-1 health → close-on-sick → fresh
// open (WAL + busy_timeout=5000) → ensureSchema (CREATE IF NOT EXISTS + the
// 3-attempt retry with the busy re-arm) → CREATE + WAL run ONCE per process.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Database } from 'bun:sqlite';
import { assertIdentifier, assertIdentifiers, ScopeGuardError } from './scope-guard.js';

export interface ScopedStoreOptions {
  /** The resolved DB file path (from db-path.ts's makeDbPath). */
  dbPath: string;
  /** The CREATE TABLE IF NOT EXISTS statements — run ONCE per process. */
  schema: string[];
  /** The id for the logs. */
  id?: string;
}

let storeDb: Database | null = null;
let storeDbPath: string | null = null;

/** THE PATH-AWARE CACHED SINGLETON: one connection per process per resolved
 *  path. Every reuse health-checks (SELECT 1); a sick handle closes + reopens.
 *  A repointed path closes the old handle first. WAL + busy_timeout on every
 *  fresh open. The schema runs ONCE per process (CREATE IF NOT EXISTS is
 *  idempotent — the 7-process simultaneous first-open race is dead by
 *  construction), with the 3-attempt busy retry. */
export function getStoreDb(opts?: ScopedStoreOptions): Database {
  if (!opts && storeDb) return storeDb; // the common path: no re-spec, healthy
  const want = opts?.dbPath ?? storeDbPath;
  if (!want) throw new Error('[scoped-store] no dbPath: pass opts.dbPath on the first call');
  if (storeDb && storeDbPath === want) {
    try {
      storeDb.query('SELECT 1').get();
      return storeDb;
    } catch (_sick) {
      try { storeDb.close(); } catch (_c) { /* already closed */ }
      storeDb = null;
    }
  }
  if (storeDb) {
    try { storeDb.close(); } catch (_c) { /* already closed */ }
    storeDb = null;
  }
  fs.mkdirSync(path.dirname(want), { recursive: true });
  const fresh = new Database(want, { create: true });
  try {
    fresh.exec('PRAGMA journal_mode = WAL;');
    fresh.exec('PRAGMA busy_timeout = 5000;');
  } catch (_nonfatal) { /* some filesystems refuse WAL — non-fatal */ }
  if (opts?.schema?.length) {
    // THE SCHEMA-SETUP RACE REMEDY: idempotent DDL + the 3-attempt busy
    // retry with the busy_timeout re-arm (the winner wave-db.ts:19-73).
    //
    // HARDENING: this used to break + continue on ANY failure, so a store with
    // a MALFORMED schema was served anyway and every downstream write failed
    // mysteriously later (the crash-wearing-a-success-shape class). A
    // non-contention DDL failure is now FAIL-CLOSED — the handle is closed and a
    // named error is thrown. Contention still retries, preserving the boot
    // contract for the legitimate multi-process first-open race.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        for (const stmt of opts.schema) fresh.run(stmt);
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!/busy|locked/i.test(msg)) {
          try { fresh.close(); } catch (_c) { /* already closed */ }
          storeDb = null;
          throw new ScopeGuardError(
            `[scoped-store${opts.id ? ' ' + opts.id : ''}] schema setup FAILED (non-contention) — ` +
            `refusing to serve a store without its schema: ${msg}`,
          );
        }
        if (attempt === 2) {
          console.error(`[scoped-store${opts.id ? ' ' + opts.id : ''}] schema setup failed after 3 attempts (contention):`, msg);
          break; // boot continues; downstream fails WARN-soft (the v6 behavior)
        }
        try { fresh.exec('PRAGMA busy_timeout = 5000;'); } catch { /* re-arm best-effort */ }
      }
    }
  }
  storeDb = fresh;
  storeDbPath = want;
  return storeDb;
}

export function closeStoreDb(): void {
  if (storeDb) {
    try { storeDb.close(); } catch (_c) { /* already closed */ }
    storeDb = null;
    // THE LAST-KNOWN-PATH LAW: the path SURVIVES the close — a no-opts
    // getStoreDb() reopens at the same path (the v6 const-path behavior,
    // generalized). Only an explicit repoint changes it.
  }
}

/** THE ROW-KEYED UPSERT HELPER — the anti-clobber write. Each process upserts
 *  ITS row (the PK); the SQLite locking serializes the writers. NO whole-file
 *  rewrite exists in this module. */
export function upsertRow(table: string, pkColumn: string, pk: string | number, dataJson: string, extra?: Record<string, string | number>): void {
  const cols = extra ? Object.keys(extra) : [];
  // THE IDENTIFIER CHOKEPOINT (hardening): table/column names are INTERPOLATED
  // into the statement text — they cannot be bound as parameters. An unvalidated
  // identifier is a SQL injection. Refused fail-closed, by name.
  assertIdentifier(table, 'upsertRow(table)');
  assertIdentifier(pkColumn, 'upsertRow(pkColumn)');
  assertIdentifiers(cols, 'upsertRow(extra column)');
  const placeholders = ['?', '?', ...cols.map(() => '?')];
  const updates = ['data = excluded.data', ...cols.map((c) => `${c} = excluded.${c}`)];
  const sql = `INSERT INTO ${table} (${pkColumn}, data${cols.length ? ', ' + cols.join(', ') : ''}) VALUES (${placeholders.join(', ')})
    ON CONFLICT(${pkColumn}) DO UPDATE SET ${updates.join(', ')}`;
  getStoreDb().run(sql, [pk, dataJson, ...cols.map((c) => (extra as Record<string, string | number>)[c])]);
}

/** THE WRITE-RETRY LADDER (the winner wave-tracker.ts:218-234): 3 attempts;
 *  on throw close the (stale) handle + busy-wait 50×(n+1)ms + retry; after
 *  the last: WARN — the in-memory state stays live, the caller decides. */
/** THE WRITE-RETRY LADDER (the winner wave-tracker.ts:218-234): 3 attempts;
 *  on throw close the (stale) handle + busy-wait 50×(n+1)ms + retry; after
 *  the last: WARN — the in-memory state stays live, the caller decides.
 *
 *  HARDENING (two defects fixed here):
 *   1. RETRY CLASS. This used to retry ANY error 3×, while withImmediateTx
 *      retried only /busy|locked/. Two paths, two policies — a permanent error
 *      (constraint violation, syntax, closed handle) was retried pointlessly and
 *      the real cause surfaced three attempts late. Both paths are now busy-only.
 *   2. OBSERVABLE OUTCOME. This used to return void and console.error on failure,
 *      so a caller could not distinguish a persisted row from a lost one (the
 *      silent-data-loss class). It now RETURNS whether the write landed.
 *      The caller decides; nothing is silently swallowed. */
export function runWithRetry(sql: string, params: (string | number | null)[], attempts = 3, id = ''): boolean {
  const tag = `[scoped-store${id ? ' ' + id : ''}]`;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      getStoreDb().run(sql, params as never);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/busy|locked/i.test(msg)) {
        // A non-contention error will not resolve by waiting — fail LOUD, now.
        console.error(`${tag} persist FAILED (non-contention — not retried):`, msg);
        return false;
      }
      lastErr = e;
      closeStoreDb();
      const wait = 50 * (attempt + 1);
      const until = Date.now() + wait;
      while (Date.now() < until) { /* the bounded busy-wait */ }
      void until;
    }
  }
  console.error(`${tag} persist failed after ${attempts} attempts (the in-memory state stays live):`, lastErr instanceof Error ? lastErr.message : String(lastErr));
  return false;
}

/** THE IMMEDIATE TRANSACTION (the winner wave-db.ts:103-127) — for the
 *  multi-row read-modify-write the row-UPSERT cannot cover. BEGIN IMMEDIATE
 *  grabs the write lock upfront; busy/locked → ROLLBACK + close + sleep +
 *  retry 3×; non-busy → rethrow LOUD. */
export async function withImmediateTx<T>(fn: (db: Database) => T, attempts = 3, id = ''): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const db = getStoreDb();
      db.exec('BEGIN IMMEDIATE;');
      try {
        const result = fn(db);
        db.exec('COMMIT;');
        return result;
      } catch (e) {
        try { db.exec('ROLLBACK;'); } catch (_r) { /* the tx is already dead */ }
        throw e;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/busy|locked/i.test(msg)) throw e; // non-busy → LOUD immediately
      lastErr = e;
      closeStoreDb();
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
  throw new Error(`[scoped-store${id ? ' ' + id : ''}] the transaction failed after ${attempts} attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}
