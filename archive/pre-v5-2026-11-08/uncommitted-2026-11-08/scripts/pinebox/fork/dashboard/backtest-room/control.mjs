#!/usr/bin/env node
/**
 * control.mjs — THE BACKTEST ROOM'S AGENT DRIVE SURFACE  (SHELL_ANCHOR §5.2 · W-S3 T3)
 * ------------------------------------------------------------------------------------
 * The room's ONE state authority: a local HTTP verb surface an agent (or the tab, or
 * the chart's "run a backtest" mode) drives. The tab is a CLIENT of this process —
 * one engine instance, one truth, no divergence.
 *
 * Port: PLUTUS_BACKTEST_PORT, else the first FREE of 9443 → 9446 → 9447 (9444/9445 = the VIL rail) (verified free
 * before binding). The bound port is published to ~/.plutus-dashboard/backtest-room.json
 * so any consumer can discover it instead of guessing.
 *
 * Bind 127.0.0.1 ONLY. No secrets in the repo, in the logs, or in a response: the canon
 * token is resolved by canon.mjs from the operator's own config files and is never echoed.
 *
 * Every mutating verb: require session → resolve room → engine call → persist
 * (canon route, or the NAMED fallback) → audit event → respond. A refusal carries its
 * engine CODE; there is no third state.
 *
 * Run:   node dashboard/backtest-room/control.mjs            (foreground)
 *        node dashboard/backtest-room/control.mjs --port 9446
 * Kill:  SIGTERM/SIGINT → the server closes cleanly (no orphan timers).
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ReplayRoom, ReplayError, CODES } from './replay.mjs';
import * as store from './store.mjs';
import * as canon from './canon.mjs';
import { loadBars, loadTvBars, loadTvBarsAnchored, availableCells, fixturePath, TV_PAIRS, TV_TIMEFRAMES } from './bars.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const DASH = path.resolve(HERE, '..');                       // dashboard/
const PORT_FILE = path.join(os.homedir(), '.plutus-dashboard', 'backtest-room.json');
const VERSION = '1.0.0';

const argv = process.argv.slice(2);
const argPort = (() => {
  const i = argv.indexOf('--port');
  if (i >= 0 && argv[i + 1]) return Number(argv[i + 1]);
  if (!process.env.PLUTUS_BACKTEST_PORT) return null;
  const v = Number(process.env.PLUTUS_BACKTEST_PORT);       // ta stage 2 D-103: a non-port was returned as NaN
  if (!Number.isInteger(v) || v < 1 || v > 65535) throw new Error(`BAD_CONFIG: PLUTUS_BACKTEST_PORT=${JSON.stringify(process.env.PLUTUS_BACKTEST_PORT)} is not a port`);
  return v;
})();
const PORT_CHAIN = [argPort, 9443, 9446, 9447].filter((p) => Number.isFinite(p) && p > 0);

// ────────────────────────────────────────────────────────────────── state
const { db, added, dbPath } = store.init();
const rooms = new Map();          // uid → {room, timers, startedMs, source, actor}
const sse = new Set();            // live SSE subscribers

const log = (...a) => console.log(`[backtest-room ${new Date().toISOString()}]`, ...a);

function publish() {
  try {
    fs.mkdirSync(path.dirname(PORT_FILE), { recursive: true });
    fs.writeFileSync(PORT_FILE, JSON.stringify({
      pid: process.pid, port: SERVER.address().port, version: VERSION,
      db: dbPath, started_at: new Date().toISOString(),
      endpoints: { health: '/health', verbs: '/verbs', room: '/room' },
    }, null, 2));
  } catch (err) { log('could not write the port file:', err.message); }
}

function broadcast(evt) {
  const line = `data: ${JSON.stringify(evt)}\n\n`;
  for (const res of sse) { try { res.write(line); } catch { /* dropped below */ } }
}

// ────────────────────────────────────────────────────────────────── helpers
class HttpError extends Error {
  constructor(status, code, message, detail) {
    super(message);
    this.status = status; this.code = code; this.detail = detail || {};
  }
}
const need = (o, k, code = 'SESSION_REQUIRED') => {
  const v = o ? o[k] : undefined;
  if (v === undefined || v === null || v === '') {
    throw new HttpError(400, code, `${k} is required`, { got: JSON.stringify((o && o[k]) ?? null) });
  }
  return v;
};
const roomOf = (uid) => {
  const r = rooms.get(uid);
  if (!r) {
    throw new HttpError(404, CODES.SESSION_NOT_FOUND, `no live session ${JSON.stringify(uid)}`, {
      hint: 'POST /create first, or GET /sessions for the persisted ones',
    });
  }
  return r;
};

function stopTimer(entry) {
  if (entry && entry.timers) { clearInterval(entry.timers.play); entry.timers.play = null; }
}

/** the ONE persistence path. Canon columns → canon route (fallback named).
 *  NOTE the argument order is (uid, entry, ACTOR, VERB, detail) — a measured defect fix:
 *  the signature once read (verb, actor) while every call site passed (actor, verb),
 *  which wrote the verb into the actor column and vice versa. */
async function persist(uid, entry, actor, verb, detail) {
  const st = entry.room.status();
  store.syncSession(db, uid, st, { fills: entry.room.fills.length });
  store.syncFills(db, uid, st.symbol, st.timeframe, entry.room.fills, entry.room.closed);
  const agg = canon.canonAggregates(st, st.atEnd && !entry.room.positions.length ? 'COMPLETED' : 'RUNNING');
  const cr = await canon.canonPatchSession(uid, agg);
  let canonPath = 'ROUTE';
  if (!cr.ok) {
    canonPath = 'FALLBACK_DIRECT';
    store.syncCanonColumns(db, uid, agg);
    store.recordEvent(db, uid, 'system', 'CANON_API_UNAVAILABLE', cr, st);
  }
  store.recordEvent(db, uid, actor, verb, detail, st);
  return { st, canonPath, canon: cr };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 1e6) reject(new Error('body too large')); });
    req.on('end', () => {
      if (!b) return resolve({});
      try { resolve(JSON.parse(b)); } catch (e) { resolve({ __parseError: String(e), __raw: b.slice(0, 300) }); }
    });
    req.on('error', reject);
  });
}

// ────────────────────────────────────────────────────────────────── static
const STATIC_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/markdown' };

function staticCandidates(rel) {
  const base = rel.replace(/^\/+/, '');
  const out = [];
  if (base.startsWith('tabs/')) {
    out.push(path.join(DASH, 'renderer', base));                                        // my tabs dir (post-integration)
    out.push(path.join(HERE, '..', 'renderer', base));
  } else if (base === 'tokens.css') {
    out.push(path.join(DASH, 'renderer', 'tokens.css'));
  } else if (base.startsWith('backtest-room/') || base === 'room' || base === '') {
    out.push(path.join(HERE, base === 'room' || base === '' ? 'room.html' : base.replace(/^backtest-room\//, '')));
  } else {
    out.push(path.join(HERE, base));
  }
  return out;
}

// CONTAINMENT: a static candidate must resolve INSIDE one of these roots (the URL parser already collapses
// dot-segments - probed 404 for ../, %2e%2e/, ..%2f - this is the second wall, not the first).
const STATIC_ROOTS = [HERE, path.join(DASH, 'renderer')];   // SELF-CONTAINED: only the fork's own files
const inside = (p) => { const r = path.resolve(p); return STATIC_ROOTS.some((root) => { const rel = path.relative(root, r); return rel && !rel.startsWith('..') && !path.isAbsolute(rel); }); };
function serveStatic(res, rel) {
  for (const p of staticCandidates(rel)) {
    try {
      if (p && inside(p) && fs.existsSync(p) && fs.statSync(p).isFile()) {
        const ext = path.extname(p);
        res.writeHead(200, {
          'Content-Type': STATIC_TYPES[ext] || 'application/octet-stream',
          'Cache-Control': 'no-store',
          ...(res.__acao ? { 'Access-Control-Allow-Origin': res.__acao, Vary: 'Origin' } : {}),
        });
        res.end(fs.readFileSync(p));
        return true;
      }
    } catch { /* try the next candidate */ }
  }
  return false;
}

// ────────────────────────────────────────────────────────────────── the verb surface
const VERBS = {
  'GET /health': 'liveness + the bound port + the canon provenance + the available bar cells',
  'GET /verbs': 'this list — the documented drive surface for an agent',
  'GET /cells': 'the bar cells the rail can serve: [{pair, timeframe, bars}]',
  'POST /resume': 'rebuild a RUNNING session after a room restart: {session} — the recorded verb log re-driven, cursor-asserted (RESUME_DIVERGED on any mismatch)',
  'POST /create': 'create a room: {name, symbol, timeframe, startDate, endDate, startingBalance, barsSource?: fixture|tv, symbols[]?, strategy?, playbook?, actor?}',
  'GET /tv-cells': 'the TradingView-feed pairs + timeframes a barsSource:\'tv\' session can replay (deep history from :9448)',
  'GET /sessions': 'every persisted backtest session row (canon table + the room extension columns)',
  'GET /status?session=': 'the full room state: cursor, visibleBars, futureHidden, balance/equity, positions, orders, stats ENVELOPE',
  'POST /step': '{session, delta:+1|-1} → move the replay by exactly one bar',
  'POST /play': '{session, rate (bars/s, 0<rate<=100)} → start the play loop',
  'POST /pause': '{session} → stop the play loop',
  'POST /jump': '{session, ms|time|barIndex|bars} → jump (replays every bar in between, so fills are identical)',
  'POST /place': '{session, side:buy|sell, type:market|limit|stop, qty|riskPct, sl, tp, trailing, be, price?, note?, tag?} (sl/tp: a price | {mode:price|ticks|pct|r, value}; trailing/be: a distance)',
  'POST /modify': '{session, id, sl?, tp?, trailing?, be?, qty?} — an order (working) or a live position',
  'POST /close': '{session, pct:1..100, positionId?, reason?} → a partial or full close at the current bar close',
  'POST /cancel': '{session, id} → cancel a working order',
  'POST /note': '{session, text, tags?[], tradeId?} → the journal rail (per-trade or the session note)',
  'POST /finish': '{session, outcome?:COMPLETE|ABORTED} → close the session in the canon table + print the canon §11 summary',
  'GET /summary?session=': 'the canon §11 OUTPUT CONTRACT for this session',
  'GET /bars?session=&lookback=200': 'the VISIBLE window only — the future is never returned',
  'GET /fills?session=': 'the fill ledger rows from the DB',
  'GET /events?session=': 'the audit trail (actor, verb, cursor)',
  'GET /stream?session=': 'SSE: every state change, live (the operator watches an agent session here)',
  'GET /room': 'the standalone room page (the room outside the Electron shell)',
};

async function handle(req, res, u) {
  const { pathname, searchParams } = u;
  const method = req.method || 'GET';

  if (method === 'OPTIONS') {
    res.writeHead(204, cors(res));
    return res.end();
  }

  // ── static
  if (method === 'GET' && (pathname === '/room' || pathname === '/' || pathname.startsWith('/tabs/') || pathname === '/tokens.css' || pathname.startsWith('/backtest-room/'))) {
    if (serveStatic(res, pathname === '/' ? 'room' : pathname.slice(1))) return;
    return json(res, 404, { ok: false, code: 'STATIC_ABSENT', error: `no static file for ${pathname}`, tried: staticCandidates(pathname.slice(1)) });
  }

  // ── SSE
  if (method === 'GET' && pathname === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive',
      ...(res.__acao ? { 'Access-Control-Allow-Origin': res.__acao, Vary: 'Origin' } : {}),
    });
    res.write(`data: ${JSON.stringify({ type: 'hello', ts: Date.now() })}\n\n`);
    sse.add(res);
    req.on('close', () => sse.delete(res));
    return;
  }

  const body = method === 'POST' ? await readBody(req) : {};
  if (body.__parseError) throw new HttpError(400, 'BAD_JSON', 'the request body is not JSON', { why: body.__parseError });

  // ── GET verbs
  if (method === 'GET') {
    if (pathname === '/health') {
      let cs = null;
      let csErr = null;
      try { cs = canon.canonSpec(); } catch (e) { csErr = { code: e.code || 'CANON_READ_FAILED', error: e.message }; }
      return json(res, 200, {
        ok: true, service: 'plutus-backtest-room', version: VERSION,
        port: SERVER.address().port, pid: process.pid, uptime_s: Math.round(process.uptime()),
        db: { path: dbPath, added_columns: added },
        rooms: { live: rooms.size, uids: [...rooms.keys()] },
        canon: cs ? {
          source: cs.source, sha256: cs.sha, pip_value_usd_per_lot: cs.pipValueUsdPerLot,
          pairs: Object.keys(cs.pipSizes), cross_check: cs.crossCheck, read_at: cs.readAt,
        } : { error: csErr },
        canon_token_from: canon.canonToken().from,
        bars: { fixture: fixturePath(), cells: availableCells().map((c) => `${c.pair} ${c.timeframe}`) },
        disclaimer: 'Historical conditional frequencies with sample sizes. Not predictions, not advice.',
      });
    }
    if (pathname === '/verbs') return json(res, 200, { ok: true, service: 'plutus-backtest-room', verbs: VERBS });
    if (pathname === '/cells') return json(res, 200, { ok: true, cells: availableCells(), fixture: fixturePath() });
    if (pathname === '/tv-cells') return json(res, 200, { ok: true, pairs: TV_PAIRS, timeframes: TV_TIMEFRAMES, feed: process.env.PLUTUS_TV_FEED || 'http://127.0.0.1:9448' });
    if (pathname === '/sessions') return json(res, 200, { ok: true, sessions: store.listSessions(db, Number(searchParams.get('limit') || 50)) });

    const uid = searchParams.get('session');
    if (pathname === '/status') {
      const e = roomOf(need({ session: uid }, 'session'));
      return json(res, 200, { ok: true, canon_path: e.canonPath || null, status: e.room.status() });
    }
    if (pathname === '/bars') {
      const e = roomOf(need({ session: uid }, 'session'));
      const w = e.room.window(Number(searchParams.get('lookback') || 200));
      return json(res, 200, { ok: true, symbol: e.room.session.symbol, timeframe: e.room.session.timeframe, futureHidden: e.room.status().futureHidden, ...w });
    }
    if (pathname === '/summary') {
      const e = roomOf(need({ session: uid }, 'session'));
      return json(res, 200, { ok: true, summary: e.room.summary({ startedMs: e.startedMs, outcome: e.room.status().atEnd ? 'COMPLETE' : 'RUNNING' }) });
    }
    if (pathname === '/fills') return json(res, 200, { ok: true, fills: store.getFills(db, need({ session: uid }, 'session')) });
    if (pathname === '/events') return json(res, 200, { ok: true, events: store.getEvents(db, need({ session: uid }, 'session')) });
    throw new HttpError(404, 'NO_SUCH_ROUTE', `no GET route ${pathname}`, { see: '/verbs' });
  }

  if (method !== 'POST') throw new HttpError(405, 'BAD_METHOD', `${method} is not supported`, { see: '/verbs' });

  // ── POST /create
  if (pathname === '/create') {
    const symbol = String(body.symbol || 'EUR/USD');
    const timeframe = String(body.timeframe || '1H');
    const barsSource = body.barsSource === 'tv' ? 'tv' : 'fixture';
    let loaded;
    try {
      loaded = barsSource === 'tv'
        ? await loadTvBarsAnchored(symbol, timeframe, { to: body.endDate ? Date.parse(body.endDate) : undefined, createdAt: Date.now() })
        : await loadBars(symbol, timeframe);
    } catch (err) {
      throw new HttpError(400, err.code || 'BARS_UNAVAILABLE', err.message, { available: err.available, tried: err.tried });
    }
    const uid = body.session_uid || `bt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const spec = canon.specFor(symbol);
    let room;
    try {
      room = new ReplayRoom({
        bars: loaded.bars,
        session: {
          uid, name: body.name || `backtest ${new Date().toISOString().slice(0, 16)}`,
          symbol, timeframe,
          strategy: body.strategy || null, playbook: body.playbook || null,
          symbols: Array.isArray(body.symbols) && body.symbols.length ? body.symbols : [symbol],
          startDate: body.startDate ?? null, endDate: body.endDate ?? null,
          startingBalance: body.startingBalance ?? 10000,
        },
        spec,
      });
    } catch (err) {
      if (err instanceof ReplayError) throw new HttpError(400, err.code, err.message, err.detail);
      throw err;
    }
    const st = room.status();

    // the canon session row — through the CANON ROUTE (fallback named)
    const canonRow = {
      session_uid: uid, agent_id: body.actor === 'agent' ? 'plutus-backtest' : 'shell-backtest',
      agent_version: 'shell-backtest/1',
      trading_week: body.week || `${symbol} ${timeframe}`,
      pairs_traded: room.session.symbols,
      started_at: new Date().toISOString(), status: 'RUNNING',
    };
    const cr = await canon.canonCreateSession(canonRow);
    let canonPath = 'ROUTE';
    // the room's own extension columns (additive; the canon columns are the route's job)
    const row = {
      ...canonRow, name: room.session.name, strategy: room.session.strategy, playbook: room.session.playbook,
      symbol, timeframe, symbols: room.session.symbols,
      start_date: body.startDate ?? null, end_date: body.endDate ?? null,
      starting_balance: room.session.startingBalance,
      cursor: st.cursor, started_index: st.startIndex, bars_total: st.barsTotal, visible_bars: st.visibleBars,
      balance: st.balance, realized: st.realized, equity: st.equity,
      source: `${loaded.source} · ${spec.specSource}`,
    };
    let rowMode = null;
    try {
      rowMode = store.upsertSession(db, row).mode;
      store.setBarsSource(db, uid, barsSource, loaded.barsTo ?? null);
    } catch (err) {
      throw new HttpError(409, 'SESSION_INSERT_FAILED', err.message, { canon: cr });
    }
    if (!cr.ok) {
      canonPath = 'FALLBACK_DIRECT';
      const agg = canon.canonAggregates(st, 'RUNNING');
      store.syncCanonColumns(db, uid, agg);
      store.recordEvent(db, uid, 'system', 'CANON_API_UNAVAILABLE', cr, st);
    }
    store.recordEvent(db, uid, body.actor || 'human', 'create', { symbol, timeframe, bars: st.barsTotal }, st);

    rooms.set(uid, { room, timers: { play: null }, startedMs: Date.now(), source: loaded.source, canonPath, canonTokenFrom: cr.tokenFrom });
    const payload = { ok: true, canon_path: canonPath, canon_error: cr.ok ? null : cr.error, row_mode: rowMode, session: uid, status: store.getSession(db, uid) };
    broadcast({ type: 'created', session: uid, cursor: st.cursor, visibleBars: st.visibleBars });
    return json(res, 201, payload);
  }

  // ── POST /resume — a session that was RUNNING when the room restarted is rebuilt EXACTLY: the same bars,
  // the same config, then the recorded verb log re-driven in order (the engine is deterministic and its ids
  // are sequence-based). After every state verb the rebuilt cursor must equal the RECORDED cursor — a
  // mismatch is RESUME_DIVERGED (named, the session stays dead), never a silently different session.
  if (pathname === '/resume') {
    const ruid = String(need(body, 'session'));
    const live = rooms.get(ruid);
    if (live) return json(res, 200, { ok: true, session: ruid, resumed: false, status: live.room.status() });
    const row = store.getSession(db, ruid);
    if (!row) throw new HttpError(404, CODES.SESSION_NOT_FOUND, `no persisted session ${JSON.stringify(ruid)}`);
    if (row.status === 'COMPLETED') throw new HttpError(409, 'SESSION_COMPLETED', `${ruid} is finished — open it read-only, or create a new session`);
    let loaded;
    try {
      // the SAME source the session was created on — a tv session refetches at its recorded closed-bar anchor
      if (row.bars_source === 'tv') {
        const anchor = Number(row.bars_to);
        if (!Number.isFinite(anchor) || anchor <= 0) throw new HttpError(409, 'RESUME_ANCHOR_ABSENT', `${ruid} is a tv session with no closed-bar anchor (bars_to=${row.bars_to}) — it cannot be refetched deterministically`, { bars_to: row.bars_to });
        loaded = await loadTvBars(row.symbol, row.timeframe, { to: anchor });
      } else {
        loaded = await loadBars(row.symbol, row.timeframe);
      }
    } catch (err) { throw new HttpError(400, err.code || 'BARS_UNAVAILABLE', err.message, { available: err.available, tried: err.tried }); }
    let symbols = [row.symbol];
    try { const j = JSON.parse(row.symbols || '[]'); if (Array.isArray(j) && j.length) symbols = j; } catch { /* the primary symbol */ }
    let room;
    try {
      room = new ReplayRoom({
        bars: loaded.bars,
        session: {
          uid: ruid, name: row.name, symbol: row.symbol, timeframe: row.timeframe,
          strategy: row.strategy, playbook: row.playbook, symbols,
          startDate: row.start_date ?? null, endDate: row.end_date ?? null,
          startingBalance: row.starting_balance ?? 10000,
        },
        spec: canon.specFor(row.symbol),
      });
    } catch (err) {
      if (err instanceof ReplayError) throw new HttpError(400, err.code, err.message, err.detail);
      throw err;
    }
    const SKIP = new Set(['CANON_API_UNAVAILABLE', 'resume']); // bookkeeping rows (written with a post-verb status)
    const APPLY = {
      create: () => {},
      step: (x) => room.step(Number(x.delta)),
      'play-step': () => room.step(1),
      'play-end': () => room.pause(),
      play: (x) => { room.play(x.rate ?? 1); room.pause(); }, // the rate is state; the timer is not resumed
      pause: () => room.pause(),
      jump: (x) => room.jump(x),
      place: (x) => room.place(x),
      modify: (x) => room.modify(x.id, x),
      close: (x) => room.closePartial(x.pct ?? 100, { positionId: x.positionId, reason: x.reason || 'MANUAL', price: x.price }),
      cancel: (x) => room.cancel(x.id),
      note: (x) => room.note(x.text ?? '', { tradeId: x.tradeId, tags: x.tags }),
    };
    const events = store.allEventsAsc(db, ruid);
    let replayed = 0;
    for (const ev of events) {
      if (SKIP.has(ev.verb)) continue;
      const fn = APPLY[ev.verb];
      if (!fn) throw new HttpError(409, 'RESUME_UNKNOWN_VERB', `event #${ev.seq} '${ev.verb}' has no replay rule — the session is not resumed`, { seq: ev.seq, verb: ev.verb });
      let x = {};
      try { x = ev.detail ? JSON.parse(ev.detail) : {}; } catch { x = {}; }
      try { fn(x || {}); }
      catch (err) { throw new HttpError(409, 'RESUME_DIVERGED', `event #${ev.seq} '${ev.verb}' failed on replay: ${err.message}`, { seq: ev.seq, verb: ev.verb }); }
      if (ev.cursor !== null && ev.cursor !== undefined && room.cursor !== Number(ev.cursor)) {
        throw new HttpError(409, 'RESUME_DIVERGED', `event #${ev.seq} '${ev.verb}' recorded cursor ${ev.cursor}, the replay reached ${room.cursor}`, { seq: ev.seq, verb: ev.verb, expected: ev.cursor, got: room.cursor });
      }
      replayed++;
    }
    room.pause();
    rooms.set(ruid, { room, timers: { play: null }, startedMs: Date.now(), source: loaded.source, canonPath: 'ROUTE', canonTokenFrom: null });
    const st = room.status();
    store.syncSession(db, ruid, st, { fills: room.fills.length });
    store.recordEvent(db, ruid, body.actor || 'human', 'resume', { replayed, events: events.length }, st);
    broadcast({ type: 'status', session: ruid, status: st, verb: 'resume' });
    return json(res, 200, { ok: true, session: ruid, resumed: true, replayed, status: st });
  }

  // ── /delete runs BEFORE roomOf: a ghost (completed/db-only) session has no live entry and must
  // still be deletable. A live one is stopped + dropped from memory first; then the row and
  // everything it wrote (trades, events) die together. The operator's "no delete route" gap.
  if (pathname === '/delete') {
    const duid = need(body, 'session');
    if (!/^[A-Za-z0-9_.:-]{1,64}$/.test(String(duid))) throw new HttpError(400, 'BAD_SESSION_ID', `bad session id ${JSON.stringify(duid)}`);
    const dentry = rooms.get(String(duid)) || null;
    if (dentry) {
      stopTimer(dentry);
      try { dentry.room.pause(); } catch (e) { /* already stopped */ }
      rooms.delete(String(duid));
    }
    const counts = store.deleteSession(db, String(duid));
    if (!counts.session) throw new HttpError(404, CODES.SESSION_NOT_FOUND, `no session ${JSON.stringify(duid)} to delete`, { hint: 'GET /sessions lists the persisted ones' });
    broadcast({ type: 'removed', session: duid, deleted: counts });
    return json(res, 200, { ok: true, session: duid, deleted: counts });
  }

  // ── every other POST needs a session
  const uid = need(body, 'session');
  const entry = roomOf(uid);
  const actor = body.actor || 'human';
  let verbOut = null; // extra response fields a verb returns (e.g. /place -> the placed order)

  try {
    switch (pathname) {
      case '/step': {
        need(body, 'delta');
        entry.room.step(Number(body.delta));
        break;
      }
      case '/play': {
        entry.room.play(body.rate ?? 1);
        stopTimer(entry);
        const ms = Math.max(50, Math.round(1000 / entry.room.rate));
        entry.timers.play = setInterval(() => {
          try {
            if (!entry.room.playing) return stopTimer(entry);
            if (entry.room.cursor >= entry.room.endIndex) {
              stopTimer(entry);
              entry.room.pause();
              broadcast({ type: 'ended', session: uid, cursor: entry.room.cursor });
              persist(uid, entry, 'system', 'play-end', { reason: 'last bar of the session' }).then(() => broadcast({ type: 'status', session: uid, status: entry.room.status() }));
              return;
            }
            entry.room.step(1);
            broadcast({ type: 'status', session: uid, status: entry.room.status() });
            persist(uid, entry, 'system', 'play-step', { rate: entry.room.rate }).catch(() => {});
          } catch (err) {
            stopTimer(entry);
            entry.room.pause();
            broadcast({ type: 'error', session: uid, code: err.code || 'PLAY_ERROR', error: err.message });
          }
        }, ms);
        break;
      }
      case '/pause': {
        entry.room.pause();
        stopTimer(entry);
        break;
      }
      case '/jump': {
        entry.room.jump(body);
        break;
      }
      case '/place': {
        // a NEW market ticket fills now (the recorded body carries it, so resume replays it the same way)
        if (String(body.type || 'market').toLowerCase() === 'market' && body.marketFill == null) body.marketFill = 'now';
        verbOut = { order: entry.room.place(body).order };
        break;
      }
      case '/modify': {
        need(body, 'id', CODES.ORDER_NOT_FOUND);
        entry.room.modify(body.id, body);
        break;
      }
      case '/close': {
        entry.room.closePartial(body.pct ?? 100, { positionId: body.positionId, reason: body.reason || 'MANUAL', price: body.price });
        break;
      }
      case '/cancel': {
        need(body, 'id', CODES.ORDER_NOT_FOUND);
        entry.room.cancel(body.id);
        break;
      }
      case '/note': {
        entry.room.note(body.text ?? '', { tradeId: body.tradeId, tags: body.tags });
        break;
      }
      case '/finish': {
        stopTimer(entry);
        entry.room.pause();
        const summary = entry.room.summary({ startedMs: entry.startedMs, outcome: body.outcome || 'COMPLETE' });
        const st = entry.room.status();
        store.syncSession(db, uid, st, { fills: entry.room.fills.length });
        store.syncFills(db, uid, st.symbol, st.timeframe, entry.room.fills, entry.room.closed);
        const agg = canon.canonAggregates(st, 'COMPLETED');
        agg.completed_at = new Date().toISOString();
        const cr = await canon.canonPatchSession(uid, agg);
        let canonPath = 'ROUTE';
        if (!cr.ok) { canonPath = 'FALLBACK_DIRECT'; store.syncCanonColumns(db, uid, agg); store.recordEvent(db, uid, 'system', 'CANON_API_UNAVAILABLE', cr, st); }
        store.finishSession(db, uid, 'COMPLETED');
        store.recordEvent(db, uid, actor, 'finish', { outcome: summary.outcome }, st);
        entry.canonPath = canonPath;
        broadcast({ type: 'finished', session: uid, summary });
        return json(res, 200, { ok: true, canon_path: canonPath, summary, session: uid });
      }
      default:
        throw new HttpError(404, 'NO_SUCH_ROUTE', `no POST route ${pathname}`, { see: '/verbs' });
    }
  } catch (err) {
    if (err instanceof ReplayError) throw new HttpError(400, err.code, err.message, err.detail);
    throw err;
  }

  const { st, canonPath, canon: cr } = await persist(uid, entry, actor, pathname.slice(1), body);
  entry.canonPath = canonPath;
  broadcast({ type: 'status', session: uid, status: st, verb: pathname.slice(1), actor });
  return json(res, 200, Object.assign({ ok: true, canon_path: canonPath, canon_error: cr.ok ? null : cr.error, status: st }, verbOut || {}));
}

// ────────────────────────────────────────────────────────────────── http plumbing
// THE ORIGIN POLICY (audit fadbd53e, measured 2026-09-30: a preflight from https://evil.example to POST /place
// got 204 + ACAO '*', so ANY web page in any browser could drive the operator's backtest sessions on localhost).
// Allowed: no Origin (curl/agents/same-process), the renderer's file:// ('null'), and loopback pages. Anything
// else is REFUSED (403 ORIGIN_REFUSED) before a route runs - the tv-feed policy.
function originAllowed(o) {
  if (o == null || o === '') return true;
  if (o === 'null' || o.startsWith('file://')) return true;
  try { const h = new URL(o).hostname; return h === '127.0.0.1' || h === 'localhost' || h === '[::1]'; } catch { return false; }
}
const cors = (res) => ({
  ...(res && res.__acao ? { 'Access-Control-Allow-Origin': res.__acao, Vary: 'Origin' } : {}),
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Cache-Control': 'no-store',
});

function json(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...cors(res) });
  res.end(body);
}

const SERVER = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (!originAllowed(origin)) {
    res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ ok: false, code: 'ORIGIN_REFUSED', error: `origin ${String(origin).slice(0, 80)} may not drive the backtest room (loopback / file:// only)` }));
  }
  if (origin) res.__acao = origin;
  const u = new URL(req.url, 'http://127.0.0.1');
  handle(req, res, u).catch((err) => {
    const status = err instanceof HttpError ? err.status : 500;
    const payload = {
      ok: false,
      code: err.code || 'INTERNAL_ERROR',
      error: err.message,
      detail: err.detail || null,
    };
    if (status >= 500) payload.stack = String(err.stack || '').split('\n').slice(0, 4);
    if (status === 500) log('ERROR', req.method, req.url, err.message);
    json(res, status, payload);
  });
});

// ────────────────────────────────────────────────────────────────── bind (the free-port chain)
function bind(chain, i = 0) {
  if (i >= chain.length) {
    log(`FATAL: none of ${chain.join(', ')} could be bound`);
    process.exit(1);
  }
  const port = chain[i];
  const onError = (err) => {
    if (err.code === 'EADDRINUSE') {
      log(`port ${port} is taken → trying the next`);
      SERVER.removeListener('error', onError);
      bind(chain, i + 1);
    } else {
      log('FATAL bind error:', err.message);
      process.exit(1);
    }
  };
  SERVER.once('error', onError);
  SERVER.listen(port, '127.0.0.1', () => {
    SERVER.removeListener('error', onError);
    publish();
    log(`LISTENING on 127.0.0.1:${SERVER.address().port}  (db ${dbPath}, ${added.length} columns added this boot)`);
    log(`canon constants read from ${(() => { try { return canon.canonSpec().source; } catch (e) { return 'ABSENT: ' + e.message; } })()}`);
    log('verbs: GET /verbs · POST /create · POST /step · POST /place · POST /close · GET /stream');
  });
}
bind(PORT_CHAIN);

function shutdown(sig) {
  log(`${sig} → closing`);
  for (const [, e] of rooms) stopTimer(e);
  for (const r of sse) { try { r.end(); } catch { /* gone */ } }
  SERVER.close(() => { store.close(db); process.exit(0); });
  setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
