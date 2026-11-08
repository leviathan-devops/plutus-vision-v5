/**
 * store.mjs — the room's SQLite persistence (SHELL_ANCHOR §5.2 · W-S3 T1)
 * ---------------------------------------------------------------------------
 * Driver: `node:sqlite` (Node 22.5+; this host is 24.13.1) — deliberately NOT
 * better-sqlite3, whose native build in this repo is compiled for the ELECTRON
 * ABI (the package's own postinstall runs electron-rebuild), so a plain `node`
 * process cannot require it. node:sqlite is built in and ABI-free.
 *
 * The DB is the dashboard's own (~/.plutus-dashboard/data.db, WAL, also open by
 * the Electron app) → WAL + busy_timeout so a concurrent writer never fails a
 * fill write. Session truth = `backtest_sessions` (shipped, empty); the fill
 * ledger + audit trail are created here (schema.sql, idempotent).
 *
 * CLI:  node store.mjs --init        apply the schema and print the census
 *       node store.mjs --sessions    the session rows
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';

const HERE = path.dirname(new URL(import.meta.url).pathname);
// SELF-CONTAINED: the room's database is the INSTANCE's - pinebox passes PLUTUS_DASHBOARD_DB=<instance>/room.db. Unset is a launch
// error, refused by name: there is no default database (a host-wide ~/.plutus-dashboard belonged to another program)
if (!process.env.PLUTUS_DASHBOARD_DB) { console.error('REFUSED  ROOM_DB_UNAVAILABLE  —  PLUTUS_DASHBOARD_DB is not set - start the room through pinebox (stages/room.sh passes <instance>/room.db)'); process.exit(2); }
export const DB_PATH = process.env.PLUTUS_DASHBOARD_DB;

/** the columns the room ADDS to the shipped backtest_sessions table */
export const SESSION_COLUMNS = [
  ['name', 'TEXT'], ['strategy', 'TEXT'], ['playbook', 'TEXT'],
  ['symbol', 'TEXT'], ['timeframe', 'TEXT'], ['symbols', 'TEXT'],
  ['start_date', 'TEXT'], ['end_date', 'TEXT'], ['starting_balance', 'REAL'],
  ['cursor', 'INTEGER'], ['started_index', 'INTEGER'], ['exit_index', 'INTEGER'],
  ['balance', 'REAL'], ['realized', 'REAL'], ['equity', 'REAL'],
  ['bars_total', 'INTEGER'], ['visible_bars', 'INTEGER'], ['fills', 'INTEGER'],
  ['session_notes', 'TEXT'], ['tags', 'TEXT'], ['source', 'TEXT'],
  ['last_activity_at', 'TEXT'], ['finished_at', 'TEXT'],
  // the bar source a resume must reuse: 'fixture' (the canon week) | 'tv' (the feed, anchored at bars_to)
  ['bars_source', 'TEXT'], ['bars_to', 'INTEGER'],
];

export function setBarsSource(db, uid, source, barsTo) {
  db.prepare('UPDATE backtest_sessions SET bars_source=?, bars_to=? WHERE session_uid=?').run(source, barsTo ?? null, uid);
}

export function open() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA busy_timeout = 8000');
  db.exec('PRAGMA synchronous = NORMAL');
  return db;
}

export function init(db = open()) {
  db.exec(fs.readFileSync(path.join(HERE, 'schema.sql'), 'utf8'));
  const have = new Set(db.prepare('PRAGMA table_info(backtest_sessions)').all().map((c) => c.name));
  const added = [];
  for (const [name, type] of SESSION_COLUMNS) {
    if (have.has(name)) continue;
    db.exec(`ALTER TABLE backtest_sessions ADD COLUMN ${name} ${type}`);
    added.push(name);
  }
  return { db, added, dbPath: DB_PATH };
}

export function close(db) {
  try { db.close(); } catch { /* already closed */ }
}

// ────────────────────────────────────────────────────────────────── sessions
export function createSession(db, row) {
  db.prepare(`INSERT INTO backtest_sessions
    (session_uid, agent_id, agent_version, trading_week, pairs_traded, started_at, status,
     name, strategy, playbook, symbol, timeframe, symbols, start_date, end_date, starting_balance,
     cursor, started_index, bars_total, visible_bars, balance, realized, equity, fills, source,
     last_activity_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))`)
    .run(
      row.session_uid, row.agent_id || 'manual', row.agent_version || 'shell-backtest/1',
      row.trading_week || null, JSON.stringify(row.symbols || []), row.started_at,
      row.status || 'RUNNING',
      row.name, row.strategy || null, row.playbook || null, row.symbol, row.timeframe,
      JSON.stringify(row.symbols || []), row.start_date || null, row.end_date || null,
      row.starting_balance ?? null, row.cursor ?? null, row.started_index ?? null,
      row.bars_total ?? null, row.visible_bars ?? null, row.balance ?? null,
      row.realized ?? null, row.equity ?? null, 0, row.source || null,
    );
  return getSession(db, row.session_uid);
}

/** THE ROOM'S OWN columns — the additive extension set only. The canon's canonical
 *  columns (total_trades / win_rate / profit_factor / total_pnl_pips / max_drawdown_pips)
 *  are written through the CANON ROUTE by canon.mjs; `syncCanonColumns` below is the
 *  NAMED fallback used only when that route is unavailable. */
export function syncSession(db, uid, st, counts = {}) {
  db.prepare(`UPDATE backtest_sessions SET
      cursor=?, visible_bars=?, balance=?, realized=?, equity=?, fills=?,
      bars_total=?, session_notes=?, tags=?, last_activity_at=datetime('now')
    WHERE session_uid=?`).run(
    st.cursor, st.visibleBars, st.balance, st.realized, st.equity,
    counts.fills ?? st.recentFills.length,
    st.barsTotal, st.sessionNotes ?? '', JSON.stringify(st.tags || []), uid,
  );
}

/** the canon columns, written DIRECTLY — the fallback path only (canon route down).
 *  Callers MUST record the named event `CANON_API_UNAVAILABLE` beside this call.
 *  Units: win_rate is the canon's FRACTION (stats.mjs). */
export function syncCanonColumns(db, uid, agg) {
  db.prepare(`UPDATE backtest_sessions SET
      status=COALESCE(?, status), total_trades=?, win_rate=?, profit_factor=?,
      total_pnl_pips=?, max_drawdown_pips=?, last_activity_at=datetime('now')
    WHERE session_uid=?`).run(
    agg.status ?? null, agg.total_trades ?? null, agg.win_rate ?? null, agg.profit_factor ?? null,
    agg.total_pnl_pips ?? null, agg.max_drawdown_pips ?? null, uid,
  );
}

export function finishSession(db, uid, status = 'COMPLETED') {
  db.prepare(`UPDATE backtest_sessions SET status=?, completed_at=datetime('now'),
      finished_at=datetime('now'), last_activity_at=datetime('now') WHERE session_uid=?`)
    .run(status, uid);
  return getSession(db, uid);
}

/** DELETE a session row and everything it wrote (trades, events). The room + the canon route are the
 * only writers of these three tables for a uid, so deleting by uid is authoritative. Returns per-table
 * counts; `session: 0` means the uid did not exist (the caller decides the refusal — the route raises
 * SESSION_NOT_FOUND). The operator's "no delete route" gap, closed 2026-10-02. */
export function deleteSession(db, uid) {
  const out = { session: 0, trades: 0, events: 0 };
  try { out.events = db.prepare('DELETE FROM backtest_events WHERE session_uid=?').run(uid).changes; } catch (e) { /* table key may predate this room */ }
  try { out.trades = db.prepare('DELETE FROM backtest_trades WHERE session_uid=?').run(uid).changes; } catch (e) { /* ditto */ }
  out.session = db.prepare('DELETE FROM backtest_sessions WHERE session_uid=?').run(uid).changes;
  return out;
}

/** INSERT or UPDATE the row. REQUIRED because the canon route (POST /api/v1/backtest-sessions)
 *  may have already created the canon row before the room's extension columns are written —
 *  an unconditional INSERT would collide on session_uid (measured). */
export function upsertSession(db, row) {
  const exists = db.prepare('SELECT 1 AS x FROM backtest_sessions WHERE session_uid=?').get(row.session_uid);
  if (exists) {
    db.prepare(`UPDATE backtest_sessions SET
        name=?, strategy=?, playbook=?, symbol=?, timeframe=?, symbols=?, start_date=?, end_date=?,
        starting_balance=?, cursor=?, started_index=?, bars_total=?, visible_bars=?,
        balance=?, realized=?, equity=?, source=?, last_activity_at=datetime('now')
      WHERE session_uid=?`).run(
      row.name, row.strategy ?? null, row.playbook ?? null, row.symbol, row.timeframe,
      JSON.stringify(row.symbols || []), row.start_date ?? null, row.end_date ?? null,
      row.starting_balance ?? null, row.cursor ?? null, row.started_index ?? null,
      row.bars_total ?? null, row.visible_bars ?? null, row.balance ?? null,
      row.realized ?? null, row.equity ?? null, row.source ?? null, row.session_uid,
    );
    return { mode: 'UPDATED', row: getSession(db, row.session_uid) };
  }
  createSession(db, row);
  return { mode: 'INSERTED', row: getSession(db, row.session_uid) };
}

export function getSession(db, uid) {
  const r = db.prepare('SELECT * FROM backtest_sessions WHERE session_uid=?').get(uid);
  return r ? { ...r } : null;
}

export function listSessions(db, limit = 50) {
  return db.prepare(`SELECT session_uid, name, symbol, timeframe, status, start_date, cursor,
      visible_bars, total_trades, win_rate, profit_factor, balance, realized, fills,
      started_at, last_activity_at, agent_id
    FROM backtest_sessions ORDER BY id DESC LIMIT ?`).all(limit).map((r) => ({ ...r }));
}

// ────────────────────────────────────────────────────────────────── fills
export function insertFill(db, uid, symbol, timeframe, f, settled = null) {
  const trade_uid = `${uid}:${f.positionId}:${f.seq}:${f.kind}`;
  db.prepare(`INSERT OR REPLACE INTO backtest_trades
    (trade_uid, session_uid, position_id, order_id, seq, symbol, timeframe, side, kind, reason,
     qty, price, pct_of_position, pnl, r_multiple, position_pnl, position_bars, qty_remaining,
     sl, tp, bar_index, bar_time, bar_iso, note, tags)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    trade_uid, uid, f.positionId, f.orderId ?? null, f.seq, symbol, timeframe, f.side, f.kind,
    f.reason ?? null, f.qty, f.price, f.pctOfPosition ?? null, f.pnl ?? 0,
    settled?.r ?? null, settled?.pnl ?? null, settled?.bars ?? null, f.qtyRemaining ?? null,
    settled?.sl0 ?? null, settled?.tp ?? null, f.barIndex, f.time, f.iso,
    settled?.note ?? null, settled?.tags ? JSON.stringify(settled.tags) : null,
  );
  return trade_uid;
}

/** rewrite the WHOLE ledger for a session from the engine's fill list.
 *  Idempotent per (position, seq, kind) via trade_uid; a rewind that drops
 *  fills removes their rows first so the ledger can never hold a future bar. */
export function syncFills(db, uid, symbol, timeframe, fills, closed) {
  const byPos = new Map((closed || []).map((c) => [c.id, c]));
  const maxSeq = (db.prepare('SELECT COALESCE(MAX(seq),0) n FROM backtest_trades WHERE session_uid=?').get(uid)?.n) ?? 0;
  const keep = new Set(fills.map((f) => f.seq));
  if (fills.length < maxSeq) {
    const rows = db.prepare('SELECT seq FROM backtest_trades WHERE session_uid=?').all(uid);
    for (const r of rows) if (!keep.has(r.seq)) db.prepare('DELETE FROM backtest_trades WHERE session_uid=? AND seq=?').run(uid, r.seq);
  }
  let n = 0;
  for (const f of fills) {
    insertFill(db, uid, symbol, timeframe, f, f.kind === 'exit' ? byPos.get(f.positionId) : null);
    n++;
  }
  return n;
}

export function getFills(db, uid, limit = 500) {
  return db.prepare('SELECT * FROM backtest_trades WHERE session_uid=? ORDER BY seq ASC LIMIT ?')
    .all(uid, limit).map((r) => ({ ...r }));
}


// ────────────────────────────────────────────────────────────────── events
export function recordEvent(db, uid, actor, verb, detail, st) {
  const seq = (db.prepare('SELECT COALESCE(MAX(seq),0)+1 AS n FROM backtest_events WHERE session_uid=?').get(uid)?.n) ?? 1;
  db.prepare(`INSERT INTO backtest_events (session_uid, seq, actor, verb, detail, cursor, visible_bars)
    VALUES (?,?,?,?,?,?,?)`).run(
    uid, seq, actor || 'human', verb,
    detail == null ? null : (typeof detail === 'string' ? detail : JSON.stringify(detail)),
    st?.cursor ?? null, st?.visibleBars ?? null,
  );
  return seq;
}

/** EVERY event of a session, oldest first — the replay log a /resume re-drives. */
export function allEventsAsc(db, uid) {
  return db.prepare('SELECT * FROM backtest_events WHERE session_uid=? ORDER BY seq ASC').all(uid).map((r) => ({ ...r }));
}

export function getEvents(db, uid, limit = 200) {
  return db.prepare('SELECT * FROM backtest_events WHERE session_uid=? ORDER BY seq DESC LIMIT ?')
    .all(uid, limit).map((r) => ({ ...r }));
}

// ────────────────────────────────────────────────────────────────── CLI
if (process.argv[1] && process.argv[1].endsWith('store.mjs')) {
  const arg = process.argv[2] || '--init';
  const { db, added, dbPath } = init();
  if (arg === '--init') {
    console.log(JSON.stringify({
      db: dbPath,
      added_columns: added,
      tables: db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map((r) => r.name),
      bt_trades_columns: db.prepare('PRAGMA table_info(backtest_trades)').all().map((c) => c.name),
      bt_sessions_columns: db.prepare('PRAGMA table_info(backtest_sessions)').all().map((c) => c.name),
      sessions: db.prepare('SELECT COUNT(*) c FROM backtest_sessions').get().c,
      trades: db.prepare('SELECT COUNT(*) c FROM backtest_trades').get().c,
    }, null, 2));
  } else if (arg === '--sessions') {
    console.log(JSON.stringify(listSessions(db, 20), null, 2));
  } else if (arg === '--events' && process.argv[3]) {
    console.log(JSON.stringify(getEvents(db, process.argv[3], 40), null, 2));
  } else {
    console.log('usage: node store.mjs [--init|--sessions|--events <uid>]');
  }
  close(db);
}
