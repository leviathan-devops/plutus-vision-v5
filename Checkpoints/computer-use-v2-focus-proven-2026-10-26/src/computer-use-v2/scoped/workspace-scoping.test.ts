// ═══ THE WORKSPACE-SCOPED-STATE TEST BATTERY ═══
// Pins: the binding guards (own/foreign/alias-forgery), the resolver tiers
// (explicit→sticky→auto-detect→cwd, the scorer laws), the db-path env chain
// (env → BUN_TEST → default, the lazy read), the store (singleton, the
// schema race, the row UPSERT, the write-retry ladder, the tx), the session
// state (the slice(-24) key, the mtime-latch budget reset), AP-4 (no key
// material in the observability).
import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'wss-bp-'));

import { ScopeBindingManager, assertAliasNamespace } from './scope-binding.js';
import { ScopeResolver, scoreProjectRoots } from './scope-resolver.js';
import { makeDbPath } from './db-path.js';
import { getStoreDb, closeStoreDb, upsertRow, runWithRetry, withImmediateTx } from './scoped-store.js';
import { sessionKey, readSessionState, tickSessionBudget } from './session-state.js';
import {
  ScopeGuardError, assertAbsolute, assertNotSharedGlobal, assertContained, assertIdentifier,
} from './scope-guard.js';

const STATE_DIR = '.teststate';

// ═══ THE BINDING ═══
describe('scope-binding — the ecosystem identity', () => {
  const mgr = new ScopeBindingManager();
  const t = mgr.register({
    ecosystem: 'alpha', stateDir: '.alpha', wavePrefix: 'alpha-', generateMode: 'sync',
    label: 'ALPHA', registry: { findWaveBySession: () => null }, tmpDir: '/tmp/alpha',
  });
  mgr.register({
    ecosystem: 'beta', stateDir: '.beta', wavePrefix: 'beta-', generateMode: 'async',
    label: 'BETA', registry: { findWaveBySession: () => ({ wave: 'beta-1', agent: 'x' }) }, tmpDir: '/tmp/beta',
  });

  test('ownsWave + isForeignWave by prefix', () => {
    expect(t.ownsWave('alpha-123')).toBe(true);
    expect(t.isForeignWave('beta-1')).toBe(true);
    expect(t.isForeignWave('garbage')).toBe(false); // not wave-like → not foreign
  });
  test('assertOwnWave LOUD-refuses the foreign id and NAMES the owner prefix', () => {
    expect(() => t.assertOwnWave('beta-1', 'kill')).toThrow(/beta-/);
    expect(() => t.assertOwnWave('beta-1', 'kill')).toThrow(/MUTUALLY EXCLUSIVE/);
  });
  test('assertOwnWave refuses the non-wave id with the exact-id remedy', () => {
    expect(() => t.assertOwnWave('blah', 'kill')).toThrow(/fully-qualified wave id/);
  });
  test('assertOwnSession refuses a session owned by the FOREIGN registry', () => {
    expect(() => t.assertOwnSession('ses_foreign', 'kill')).toThrow(/belongs to beta-1/);
  });
  test('THE ALIAS-FORGERY GUARD: an alias forging the foreign prefix is refused', () => {
    expect(() => assertAliasNamespace(t, 'beta-forged', ['alpha-', 'beta-'])).toThrow(/forges/);
    expect(() => assertAliasNamespace(t, 'alpha-ok', ['alpha-', 'beta-'])).not.toThrow();
  });
  test('statePath joins scopeRoot + stateDir', () => {
    expect(t.statePath('/proj', 'wave-spec.json')).toBe(path.join('/proj', '.alpha', 'wave-spec.json'));
  });
});

// ═══ THE SCOPE RESOLVER ═══
describe('scope-resolver — the 3 tiers + the scorer', () => {
  test('TIER 1: an existing explicit projectToken wins + pins', () => {
    const proj = fs.mkdtempSync(path.join(TMP, 'proj1-'));
    fs.mkdirSync(path.join(proj, '.git'));
    const r = new ScopeResolver({ stateDir: STATE_DIR, readActivity: () => [] });
    expect(r.resolve('ses_a', proj)).toBe(proj);
    // TIER 2: the sticky cache — a later token-less resolve returns the PIN
    expect(r.resolve('ses_a')).toBe(proj);
  });
  test('TIER 3: auto-detect via the workdir anchor (weight ×2)', () => {
    const proj = fs.mkdtempSync(path.join(TMP, 'proj2-'));
    fs.mkdirSync(path.join(proj, '.git'));
    const r = new ScopeResolver({
      stateDir: STATE_DIR,
      readActivity: () => [{ workdir: proj }, { command: 'ls ' + proj + '/src' }],
    });
    expect(r.resolve('ses_b')).toBe(proj);
  });
  test('THE SCORER: state-dir dominance beats a deeper .git-only subpackage', () => {
    const proj = path.join(TMP, 'dom');
    const sub = path.join(proj, 'sub');
    fs.mkdirSync(sub, { recursive: true });
    fs.mkdirSync(path.join(proj, STATE_DIR));
    fs.mkdirSync(path.join(sub, '.git'));
    const paths = new Map<string, number>([[path.join(sub, 'a.ts'), 1]]);
    expect(scoreProjectRoots(paths, STATE_DIR)).toBe(proj); // the state-dir owner wins
  });
  test('THE SCORER: path-as-root (the candidate IS the root)', () => {
    const proj = fs.mkdtempSync(path.join(TMP, 'par-'));
    fs.mkdirSync(path.join(proj, '.git'));
    expect(scoreProjectRoots(new Map([[proj, 1]]), STATE_DIR)).toBe(proj);
  });
  test('LAST RESORT: cwd when nothing resolves', () => {
    const r = new ScopeResolver({ stateDir: STATE_DIR, readActivity: () => [], cwd: '/fallback' });
    expect(r.resolve('ses_none')).toBe('/fallback');
  });
});

// ═══ THE DB PATH CHAIN ═══
describe('db-path — the env chain', () => {
  const saved: Record<string, string | undefined> = {};
  const ENV = ['TEST_DB_DIR_A', 'TEST_DB_DIR_B'];
  afterEach(() => { for (const e of ENV) { if (saved[e] === undefined) delete process.env[e]; else process.env[e] = saved[e]; } });

  test('the env chain: first set wins', () => {
    for (const e of ENV) saved[e] = process.env[e];
    process.env.TEST_DB_DIR_A = '/dir-a';
    process.env.TEST_DB_DIR_B = '/dir-b';
    const p = makeDbPath({ envVars: ENV, defaultDir: '~/default', fileName: 'x.db' });
    expect(p()).toBe(path.join('/dir-a', 'x.db'));
    delete process.env.TEST_DB_DIR_A;
    expect(p()).toBe(path.join('/dir-b', 'x.db'));
  });
  test('BUN_TEST=1 → the dedicated test file', () => {
    for (const e of ENV) saved[e] = process.env[e];
    delete process.env.TEST_DB_DIR_A;
    delete process.env.TEST_DB_DIR_B;
    process.env.BUN_TEST = '1';
    const p = makeDbPath({ envVars: ENV, defaultDir: '~/default', fileName: 'x.db', testFile: 'bp-test-x.sqlite' });
    expect(p()).toBe(path.join(os.tmpdir(), 'bp-test-x.sqlite'));
    delete process.env.BUN_TEST;
  });
  test('the production default expands ~', () => {
    for (const e of ENV) saved[e] = process.env[e];
    delete process.env.TEST_DB_DIR_A;
    const p = makeDbPath({ envVars: ENV, defaultDir: '~/myapp', fileName: 'x.db' });
    expect(p()).toBe(path.join(os.homedir(), 'myapp', 'x.db'));
  });
});

// ═══ THE STORE ═══
describe('scoped-store — the singleton + the writes', () => {
  const DB = path.join(TMP, 'store.sqlite');
  const SCHEMA = ['CREATE TABLE IF NOT EXISTS rows (id TEXT PRIMARY KEY, data TEXT, status TEXT, updated_at INTEGER)'];
  afterEach(() => closeStoreDb());

  test('the singleton: the same handle across calls; the schema created once', () => {
    const d1 = getStoreDb({ dbPath: DB, schema: SCHEMA });
    const d2 = getStoreDb();
    expect(d1).toBe(d2);
    const tables = d1.query("SELECT name FROM sqlite_master WHERE type='table' AND name='rows'").all();
    expect(tables.length).toBe(1);
  });
  test('the row UPSERT: no clobber between rows; the same row updates', () => {
    upsertRow('rows', 'id', 'a', '{"n":1}', { status: 'running', updated_at: 1 });
    upsertRow('rows', 'id', 'b', '{"n":2}', { status: 'running', updated_at: 2 });
    upsertRow('rows', 'id', 'a', '{"n":10}', { status: 'done', updated_at: 3 });
    const db = getStoreDb();
    expect(db.query("SELECT data FROM rows WHERE id='a'").get()).toEqual({ data: '{"n":10}' });
    expect(db.query('SELECT COUNT(*) c FROM rows').get()).toEqual({ c: 2 });
  });
  test('runWithRetry survives a stale handle (close + reopen)', () => {
    closeStoreDb(); // the next call reopens through the retry path
    expect(() => runWithRetry('INSERT INTO rows (id, data) VALUES (?, ?)', ['c', '{}'], 3, 't')).not.toThrow();
  });
  test('withImmediateTx: the commit path', async () => {
    const r = await withImmediateTx((db) => {
      db.run("INSERT INTO rows (id, data) VALUES ('tx', '{}')");
      return db.query("SELECT COUNT(*) c FROM rows").get();
    });
    expect((r as { c: number }).c).toBeGreaterThanOrEqual(3);
  });
});

// ═══ THE SESSION STATE ═══
describe('session-state — the budget latch', () => {
  const SP = path.join(TMP, 'planning-state.json');
  beforeEach(() => { try { fs.unlinkSync(SP); } catch { /* absent */ } });

  test('the session key is slice(-24)', () => {
    expect(sessionKey('ses_00b413134ffe21xTrRGN9WzPTj')).toBe('b413134ffe21xTrRGN9WzPTj'.slice(-24));
  });
  test('the mtime latch: an edited plan resets the budget to 1', () => {
    expect(tickSessionBudget(SP, 'ses_x', 1000)).toBe(1);
    expect(tickSessionBudget(SP, 'ses_x', 1000)).toBe(2);
    expect(tickSessionBudget(SP, 'ses_x', 2000)).toBe(1); // the plan EDITED → fresh
  });
  test('sessions are isolated by key; the state round-trips', () => {
    tickSessionBudget(SP, 'ses_x', 1000); // the beforeEach wiped the file — re-tick
    tickSessionBudget(SP, 'ses_y', 1000);
    const st = readSessionState(SP);
    expect(Object.keys(st).length).toBe(2); // ses_x + ses_y
    expect(st[sessionKey('ses_y')].wavesGenerated).toBe(1);
  });
});

// ═══ THE PRODUCTION-RUNTIME HARDENING (the scope-guard chokepoint) ═══
// Every test here pins ONE fix. A fix without a pin is not a fix.
describe('hardening — the scope-guard chokepoint', () => {
  // ── the guard primitives ─────────────────────────────────────────────────
  test('assertAbsolute refuses a relative path (the cross-workspace spill)', () => {
    expect(() => assertAbsolute('relative/dir', 't')).toThrow(ScopeGuardError);
    expect(assertAbsolute('/abs/dir', 't')).toBe('/abs/dir');
  });

  test('assertNotSharedGlobal refuses the shared global roots and the bare home', () => {
    for (const r of ['/', '/tmp', '/home', '/var', '/etc', '/root']) {
      expect(() => assertNotSharedGlobal(r, 't')).toThrow(/SHARED GLOBAL/);
    }
    expect(() => assertNotSharedGlobal(os.homedir(), 't')).toThrow(/home directory itself/);
    // a DESCENDANT of a shared root is a legitimate project (mkdtemp lives in /tmp)
    expect(assertNotSharedGlobal('/tmp/proj-abc', 't')).toBe('/tmp/proj-abc');
  });

  test('assertContained is CONTAINMENT not a string prefix', () => {
    expect(assertContained('/a/b', '/a/b/c.txt', 't')).toBe('/a/b/c.txt');
    expect(() => assertContained('/a/b', '/a/bc/c.txt', 't')).toThrow(/escapes/); // the /a/bc sibling
    expect(() => assertContained('/a/b', '/a', 't')).toThrow(/escapes/);
    expect(() => assertContained('/a/b', '/a/b', 't')).toThrow(/IS the parent/);
  });

  test('assertIdentifier refuses anything that is not a bare SQL identifier', () => {
    expect(assertIdentifier('rows_2', 't')).toBe('rows_2');
    for (const bad of ['rows; DROP TABLE x', 'id--', 'a b', '1row', '', 'a.b']) {
      expect(() => assertIdentifier(bad, 't')).toThrow(ScopeGuardError);
    }
  });

  // ── the store: SQL identifier injection ──────────────────────────────────
  test('upsertRow refuses an injected table / column identifier', () => {
    expect(() => upsertRow('rows; DROP TABLE rows--', 'id', 'x', '{}')).toThrow(/scope-guard/);
    expect(() => upsertRow('rows', 'id; --', 'x', '{}')).toThrow(/scope-guard/);
    expect(() => upsertRow('rows', 'id', 'x', '{}', { 'ev il': 1 })).toThrow(/scope-guard/);
  });

  // ── the store: the retry ladder ──────────────────────────────────────────
  test('runWithRetry reports the OUTCOME instead of swallowing it', () => {
    const db = path.join(TMP, 'retry.sqlite');
    getStoreDb({ dbPath: db, schema: ['CREATE TABLE IF NOT EXISTS rows (id TEXT PRIMARY KEY, data TEXT)'] });
    expect(runWithRetry('INSERT INTO rows (id, data) VALUES (?, ?)', ['ok', '{}'])).toBe(true);
    // a non-contention failure is NOT retried and IS reported (was: silent + 3 retries)
    expect(runWithRetry('INSERT INTO no_such_table (id) VALUES (?)', ['x'])).toBe(false);
    closeStoreDb();
  });

  test('a non-contention SCHEMA failure is fail-closed (was: serve-anyway WARN-soft)', () => {
    const db = path.join(TMP, 'badschema.sqlite');
    expect(() => getStoreDb({ dbPath: db, schema: ['THIS IS NOT VALID SQL'] })).toThrow(/schema setup FAILED/);
    closeStoreDb();
  });

  // ── db-path: the env tier is the untrusted tier ──────────────────────────
  test('the env tier refuses a shared-global dir and a relative dir', () => {
    const saved = process.env.TEST_DB_DIR_H;
    try {
      process.env.TEST_DB_DIR_H = '/tmp';
      expect(() => makeDbPath({ envVars: ['TEST_DB_DIR_H'], defaultDir: '~/x', fileName: 'a.db' })())
        .toThrow(/SHARED GLOBAL/);
      process.env.TEST_DB_DIR_H = 'relative/dir';
      expect(() => makeDbPath({ envVars: ['TEST_DB_DIR_H'], defaultDir: '~/x', fileName: 'a.db' })())
        .toThrow(/not an absolute path/);
      delete process.env.TEST_DB_DIR_H;
      expect(() => makeDbPath({ envVars: ['TEST_DB_DIR_H'], defaultDir: '~/x', fileName: 'a.db' })()).not.toThrow();
    } finally {
      if (saved === undefined) delete process.env.TEST_DB_DIR_H; else process.env.TEST_DB_DIR_H = saved;
    }
  });

  // ── the resolver: the token is a scope root ──────────────────────────────
  test('the resolver refuses a relative or shared-global projectToken', () => {
    const r = new ScopeResolver({ stateDir: STATE_DIR, readActivity: () => [], cwd: '/fallback' });
    expect(() => r.resolve('ses_h1', 'relative/proj')).toThrow(/scope-guard/);
    expect(() => r.resolve('ses_h2', '/tmp')).toThrow(/SHARED GLOBAL/);
  });

  test('the resolver refuses a shared-global cwd last resort', () => {
    expect(() => new ScopeResolver({ stateDir: STATE_DIR, readActivity: () => [], cwd: '/tmp' })).toThrow(/SHARED GLOBAL/);
  });

  // ── the binding: statePath containment ───────────────────────────────────
  test('statePath refuses a `..` escape and a shared-global scope root', () => {
    const mgr = new ScopeBindingManager();
    const b = mgr.register({
      ecosystem: 'gamma', stateDir: '.gamma', wavePrefix: 'gamma-', generateMode: 'sync',
      label: 'GAMMA', registry: { findWaveBySession: () => null }, tmpDir: '/tmp/gamma',
    });
    const proj = fs.mkdtempSync(path.join(TMP, 'g-'));
    expect(b.statePath(proj, 'wave-spec.json')).toBe(path.join(proj, '.gamma', 'wave-spec.json'));
    expect(() => b.statePath(proj, '../../escape.json')).toThrow(/escapes/);
    expect(() => b.statePath('/tmp', 'wave-spec.json')).toThrow(/SHARED GLOBAL/);
  });
});
