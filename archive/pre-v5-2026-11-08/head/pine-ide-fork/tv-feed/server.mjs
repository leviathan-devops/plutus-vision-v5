/**
 * tv-feed/server.mjs — THE TRADINGVIEW DATA FEED (a SEPARATE process, :9448).
 *
 * TradingView-API (Mathieu2301, ISC) speaks TradingView's websocket protocol and hands back OHLC
 * periods, symbol info and search results. It is a DATA SOURCE only: the chart UI is the
 * self-hosted Vela workbench (charts/workbench.js) — a TradingView outage costs the feed, never
 * the charts (they fall back to the operator-visible "fixture" provider by the operator's choice,
 * and the feed's failure is NAMED on the chart, never masked).
 *
 *   GET  /health                         → { ok, sessions, uptime_s }
 *   GET  /bars?symbol=FX:EURUSD&tf=1H&limit=500[&to=<ms>]
 *                                        → { ok, symbol, tf, bars:[{time(ms),open,high,low,close,volume}] ascending }
 *   GET  /search?q=eurusd                → { ok, results:[{ticker,description,type,exchange}] }
 *   GET  /symbol?symbol=FX:EURUSD        → { ok, info:{description,exchange,timezone,pricescale,type} }
 *   WS   /stream?symbol=FX:EURUSD&tf=1H  → {type:'bar', bar} on every update of the forming candle
 *
 * Every failure is a named code: BAD_REQUEST · TV_SYMBOL_ERROR · TV_TIMEOUT · TV_SEARCH_FAILED ·
 * SESSION_CAP. Nothing returns a substitute series.
 */
import http from 'node:http';
import { URL } from 'node:url';
import TV from '@mathieuc/tradingview';
import { WebSocketServer } from 'ws';

export const VERSION = '1.0.0';
const PORT = Number(process.env.TV_FEED_PORT) || 9448;
const HOST = '127.0.0.1';
const LOAD_TIMEOUT_MS = Number(process.env.TV_FEED_TIMEOUT_MS) || 15000;
const IDLE_CLOSE_MS = 5 * 60 * 1000;
const SESSION_CAP = 24;
const MAX_LIMIT = 5000;
const BARS_DEADLINE_MS = Number(process.env.TV_FEED_DEADLINE_MS) || 30000;
/** One overall deadline per request: a TradingView stall is a NAMED TV_TIMEOUT, never a held socket. */
function deadline(promise, ms, what) {
  let t;
  return Promise.race([promise, new Promise((_, rej) => { t = setTimeout(() => rej(err('TV_TIMEOUT', `${what}: no answer within ${ms}ms`)), ms); })]).finally(() => clearTimeout(t));
}

/** Vela / dashboard timeframe → TradingView resolution. Unknown → null (a named refusal). */
const TF = {
  '1': '1', '1m': '1', '3m': '3', '5': '5', '5m': '5', '15': '15', '15m': '15', '30': '30', '30m': '30',
  '45m': '45', '60': '60', '1h': '60', '1H': '60', '2h': '120', '2H': '120', '120': '120', '3H': '180',
  '4h': '240', '4H': '240', '240': '240', 'D': 'D', '1D': 'D', '1d': 'D', 'W': 'W', '1W': 'W', '1w': 'W', 'M': 'M', '1M': 'M',
};
export function tvResolution(tf) { return Object.prototype.hasOwnProperty.call(TF, String(tf)) ? TF[String(tf)] : null; }

/** A TradingView ticker is EXCHANGE:SYMBOL (letters, digits, ._!-). Anything else is refused. */
export function validSymbol(s) { return typeof s === 'string' && /^[A-Z0-9_]{1,24}:[A-Z0-9._!&-]{1,40}$/i.test(s); }

let client = new TV.Client();
const sessions = new Map(); // key → Session
/** THE ERRORED-CHART BOUND (measured 2026-09-30, /tmp/tvf-deferred.mjs): deleting an ERRORED chart —
 *  at once or 1.5 s later — poisons the whole TradingView-API client (every later request, even
 *  FX:EURUSD, became a 15 s TV_TIMEOUT). Errored charts are therefore never deleted. They are bounded
 *  instead: a NEGATIVE CACHE answers a recently failed symbol without creating a chart, and once
 *  ERRORED_CAP errored charts exist the client is REBUILT (all its native state released). */
const NEG_TTL_MS = 10 * 60 * 1000;
const ERRORED_CAP = Number(process.env.TV_FEED_ERRORED_CAP) || 128;
const negative = new Map(); // symbol|res → { error, at }
const NEG_CAP = 1000;
let erroredCharts = 0;
let clientGen = 0;
function rebuildClient(why) {
  clientGen++;
  console.log(`[tv-feed] client rebuild #${clientGen} (${why})`);
  for (const s of [...sessions.values()]) {
    for (const ws of s.subs) { try { ws.send(JSON.stringify({ type: 'error', code: 'TV_FEED_RESTART', error: 'the feed client was rebuilt — reconnect' })); ws.close(1012, 'TV_FEED_RESTART'); } catch { /* gone */ } }
    s.subs.clear();
    // every PENDING load / paging wait on the orphaned session settles NOW (named), not on its timer
    s.dead = true;
    if (!s.error) s.error = err('TV_FEED_RESTART', 'the feed client was rebuilt — retry');
    if (s._reject) { s._reject(s.error); s._reject = null; s._resolve = null; if (s.ready_t) clearTimeout(s.ready_t); }
    if (s.waiters.length) { const w = s.waiters; s.waiters = []; for (const x of w) x.done(); }
    sessions.delete(s.key);
  }
  try { client.end(); } catch { /* already ended */ }
  client = new TV.Client();
  erroredCharts = 0;
}
const startedAt = Date.now();

function err(code, message, extra) { return Object.assign(new Error(message), { code }, extra || {}); }

/** TradingView periods (newest first, seconds) → Vela OHLCV (ascending, ms, de-duplicated). */
export function toBars(periods) {
  const seen = new Set();
  const out = [];
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i];
    if (!p || !Number.isFinite(p.time) || seen.has(p.time)) continue;
    if (![p.open, p.max, p.min, p.close].every(Number.isFinite)) continue; // a malformed period never becomes a bar
    seen.add(p.time);
    out.push({ time: p.time * 1000, open: p.open, high: p.max, low: p.min, close: p.close, volume: Number.isFinite(p.volume) ? p.volume : 0 });
  }
  return out;
}

class Session {
  constructor(symbol, res) {
    this.symbol = symbol; this.res = res; this.key = `${symbol}|${res}`;
    this.chart = new client.Session.Chart();
    this.ready = null; this.error = null; this.subs = new Set(); this.lastUsed = Date.now();
    this.waiters = []; // ONE onUpdate per session: extend() waits here (TV-API callbacks accumulate)
    this.chart.onError((...e) => {
      this.error = err('TV_SYMBOL_ERROR', `${symbol}: ${e.map(String).join(' ')}`);
      if (this._reject) { this._reject(this.error); this._reject = null; this._resolve = null; if (this.ready_t) clearTimeout(this.ready_t); }
      negative.delete(this.key);                                   // re-insert = newest (Map order is LRU order)
      negative.set(this.key, { error: this.error, at: Date.now() });
      while (negative.size > NEG_CAP) negative.delete(negative.keys().next().value); // bounded, oldest first
      if (!this.counted) { this.counted = true; erroredCharts++; } // TV-API fires onError more than once per chart
      if (this.waiters.length) { const w = this.waiters; this.waiters = []; for (const x of w) x.done(); } // paging fails FAST (extend rethrows)
      setTimeout(() => this.close(), 0); // an errored session leaves the pool (no cap leak; a retry re-probes)
    });
    this.chart.onUpdate(() => {
      if (this._resolve && this.chart.periods.length) { this._resolve(); this._resolve = null; this._reject = null; }
      // a history waiter resolves only when the page LANDED (the period count grew) — a live tick on
      // the forming bar also fires onUpdate and used to end paging early (tools/test/tv-feed.mjs C9)
      if (this.waiters.length) {
        const n = this.chart.periods.length;
        const ready = this.waiters.filter((w) => n > w.before);
        if (ready.length) { this.waiters = this.waiters.filter((w) => n <= w.before); for (const w of ready) w.done(); }
      }
      if (this.subs.size) {
        const p = this.chart.periods[0];
        const bar = p ? toBars([p])[0] : null;
        if (bar) { for (const ws of this.subs) { try { ws.send(JSON.stringify({ type: 'bar', symbol, tf: res, bar })); } catch { /* the socket's own close cleans up */ } } }
      }
    });
  }
  load(range) {
    this.lastUsed = Date.now();
    if (this.error) return Promise.reject(this.error);
    if (!this.ready) {
      this.ready = new Promise((resolve, reject) => {
        this._resolve = resolve; this._reject = reject;
        const t = setTimeout(() => { if (this._reject) { this._reject(err('TV_TIMEOUT', `${this.symbol} ${this.res}: no bars within ${LOAD_TIMEOUT_MS}ms`)); this._reject = null; this._resolve = null; } }, LOAD_TIMEOUT_MS);
        this.ready_t = t;
        this.chart.setMarket(this.symbol, { timeframe: this.res, range: Math.max(300, Math.min(MAX_LIMIT, range)) });
      }).finally(() => clearTimeout(this.ready_t));
      this.ready.catch(() => { this.ready = null; });
    }
    return this.ready;
  }
  /** Pull older history until `to` is covered or `limit` bars exist (TradingView pages by count). */
  async extend(limit, toMs) {
    for (let round = 0; round < 8; round++) {
      if (this.error) throw this.error; // a session that errored mid-paging is a NAMED failure, never a truncated ok
      const p = this.chart.periods;
      const needCount = p.length < limit;
      // EXACT, not a calendar estimate: markets have closed stretches (FX weekends), so N bars span
      // more than N × the resolution. Page until `limit` bars exist AT OR BEFORE `to`.
      const needTime = Number.isFinite(toMs) && p.reduce((n, x) => n + (x.time * 1000 <= toMs ? 1 : 0), 0) < limit;
      if (!needCount && !needTime) return;
      const before = p.length;
      await new Promise((resolve) => {
        const w = { before, done: () => { clearTimeout(t); resolve(); } };
        // 8 rounds x 2.5s = 20s: paging always finishes inside the 30s request deadline
        const t = setTimeout(() => { this.waiters = this.waiters.filter((x) => x !== w); resolve(); }, 2500);
        this.waiters.push(w);
        // an async rejection from TV-API is observed (a dropped socket must not crash the feed process)
        try { Promise.resolve(this.chart.fetchMore(Math.min(2000, Math.max(300, limit - before)))).catch((e) => { console.error(`[tv-feed] fetchMore ${this.key}: ${e && e.message}`); }); }
        catch (e) { console.error(`[tv-feed] fetchMore ${this.key}: ${e.message}`); }
      });
      if (this.error) throw this.error;
      if (this.chart.periods.length === before) return; // history exhausted
    }
  }
  close() {
    // MEASURED (tools/test/tv-feed.mjs ADV3c): TradingView-API's chart.delete() on an ERRORED session
    // stops later sessions from ever receiving their symbol error (every bad symbol after it became a
    // 15s TV_TIMEOUT). An errored session is therefore only dropped from the pool, never deleted.
    if (!this.error) { try { this.chart.delete(); } catch { /* already gone */ } }
    if (sessions.get(this.key) === this) sessions.delete(this.key);
  }
}

function sessionFor(symbol, res) {
  const key = `${symbol}|${res}`;
  const neg = negative.get(key);
  if (neg && Date.now() - neg.at < NEG_TTL_MS) throw neg.error; // a known-bad symbol creates NO chart
  if (neg) negative.delete(key);
  // soft cap: rebuild when no live stream would be interrupted; HARD cap (2x): rebuild regardless — the
  // streams get TV_FEED_RESTART and the workbench reconnects with backoff (the count is never unbounded)
  if (erroredCharts >= ERRORED_CAP && (erroredCharts >= 2 * ERRORED_CAP || ![...sessions.values()].some((x) => x.subs.size))) rebuildClient(`${erroredCharts} errored charts`);
  let s = sessions.get(key);
  if (!s) {
    if (sessions.size >= SESSION_CAP) {
      const idle = [...sessions.values()].filter((x) => !x.subs.size).sort((a, b) => a.lastUsed - b.lastUsed)[0];
      if (!idle) throw err('SESSION_CAP', `${SESSION_CAP} live chart sessions, none idle`);
      idle.close();
    }
    s = new Session(symbol, res);
    sessions.set(key, s);
  }
  return s;
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of negative) if (now - v.at > NEG_TTL_MS) negative.delete(k);
  for (const s of sessions.values()) if (!s.subs.size && now - s.lastUsed > IDLE_CLOSE_MS) s.close();
}, 30_000).unref();

/** CORS: the dashboard renderer (file:// → Origin 'null') and loopback pages only — never '*', so an
 *  ordinary web page the operator visits cannot read the feed. 'null' must be allowed for the file://
 *  renderer; an opaque-origin sandboxed iframe also presents 'null' — accepted residual: the feed serves
 *  public market data, no secret. */
function corsOrigin(req) {
  const o = req && req.headers && req.headers.origin;
  if (!o) return null;
  // 'file://' = the Electron renderer's WebSocket (MEASURED: location.origin === 'file://'; its fetch sends
  // 'null') — refusing it broke the chart's own live stream (a regression of the ADV18 origin rule)
  if (o === 'null' || o === 'file://' || /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(o)) return o;
  return null;
}
function send(res, status, body, req) {
  const o = corsOrigin(req);
  res.writeHead(status, { 'content-type': 'application/json', ...(o ? { 'access-control-allow-origin': o, vary: 'Origin' } : {}), 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}
function fail(res, e, req) {
  const status = e.code === 'BAD_REQUEST' ? 400 : e.code === 'TV_SYMBOL_ERROR' ? 404 : e.code === 'SESSION_CAP' ? 429 : 502;
  send(res, status, { ok: false, code: e.code || 'TV_FEED_ERROR', error: e.message }, req);
}

function parseMarket(u) {
  const symbol = String(u.searchParams.get('symbol') || '').toUpperCase();
  const tf = String(u.searchParams.get('tf') || '1H');
  if (!validSymbol(symbol)) throw err('BAD_REQUEST', `symbol must be EXCHANGE:SYMBOL, got ${JSON.stringify(symbol).slice(0, 60)}`);
  const res = tvResolution(tf);
  if (!res) throw err('BAD_REQUEST', `unknown timeframe ${JSON.stringify(tf).slice(0, 20)}`);
  return { symbol, tf, res };
}

const server = http.createServer(async (req, res) => {
  const sendFor = (status, body) => send(res, status, body, req);
  let u;
  try { u = new URL(req.url, `http://${HOST}`); } catch (e) { return sendFor(400, { ok: false, code: 'BAD_REQUEST', error: 'malformed request target' }); }
  // a CORS preflight is answered (204 + the allowed origin), never a 400
  if (req.method === 'OPTIONS') { const o = corsOrigin(req); res.writeHead(204, { ...(o ? { 'access-control-allow-origin': o, 'access-control-allow-methods': 'GET', 'access-control-allow-headers': 'content-type', vary: 'Origin' } : {}) }); return res.end(); }
  try {
    if (req.method !== 'GET') throw err('BAD_REQUEST', 'GET only');
    if (u.pathname === '/health') {
      return sendFor(200, { ok: true, service: 'plutus-tv-feed', version: VERSION, pid: process.pid, port: PORT, uptime_s: Math.round((Date.now() - startedAt) / 1000), sessions: [...sessions.keys()], negative: negative.size, erroredCharts, clientGen });
    }
    if (u.pathname === '/bars') {
      const { symbol, tf, res: r } = parseMarket(u);
      const rawLimit = u.searchParams.get('limit');
      if (rawLimit !== null && (!/^[0-9]{1,5}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > MAX_LIMIT)) throw err('BAD_REQUEST', `limit must be an integer 1-${MAX_LIMIT}`);
      const limit = rawLimit === null ? 500 : Number(rawLimit);
      const to = u.searchParams.has('to') ? Number(u.searchParams.get('to')) : NaN;
      // epoch MILLISECONDS: 1e11..1e14 (1973..5138) — a seconds value (~1.8e9) is refused by name, never an
      // empty 'ok'; pre-2001 12-digit ms (deep daily history) is valid
      if (u.searchParams.has('to') && (!/^[0-9]{12,14}$/.test(u.searchParams.get('to')) || !Number.isFinite(to) || to < 1e11)) throw err('BAD_REQUEST', 'to must be epoch MILLISECONDS');
      const s = sessionFor(symbol, r);
      await deadline(s.load(limit).then(() => s.extend(limit, to)), BARS_DEADLINE_MS, `${symbol} ${tf}`);
      let bars = toBars(s.chart.periods);
      if (Number.isFinite(to)) bars = bars.filter((b) => b.time <= to);
      bars = bars.slice(-limit);
      const i = s.chart.infos || {};
      // fewer bars than asked = TradingView's history for this market ran out: said so, never implied complete
      return sendFor(200, { ok: true, symbol, tf, resolution: r, count: bars.length, complete: bars.length >= limit, bars, info: { description: i.description || null, exchange: i.exchange || null, timezone: i.timezone || null, pricescale: i.pricescale || null } });
    }
    if (u.pathname === '/symbol') {
      const { symbol } = parseMarket(u);
      const s = sessionFor(symbol, '60'); // symbol info is timeframe-independent: ONE session per symbol, never one per tf
      await s.load(300);
      const i = s.chart.infos || {};
      return sendFor(200, { ok: true, symbol, info: { description: i.description, exchange: i.exchange, timezone: i.timezone, pricescale: i.pricescale, minmov: i.minmov, type: i.type } });
    }
    if (u.pathname === '/search') {
      const q = String(u.searchParams.get('q') || '').trim();
      if (!q || q.length > 40) throw err('BAD_REQUEST', 'q: 1-40 chars');
      let found;
      try { found = await deadline(TV.searchMarketV3(q), LOAD_TIMEOUT_MS, `search ${q}`); } catch (e) { throw e.code === 'TV_TIMEOUT' ? e : err('TV_SEARCH_FAILED', e.message); }
      const results = (found || []).slice(0, 40).map((m) => ({ ticker: `${m.exchange}:${m.symbol}`, description: m.description, type: m.type, exchange: m.exchange }));
      return sendFor(200, { ok: true, q, results });
    }
    sendFor(404, { ok: false, code: 'NOT_FOUND', error: u.pathname });
  } catch (e) { fail(res, e, req); }
});

const wss = new WebSocketServer({ noServer: true });
/** A refused upgrade gets a real HTTP status line before the socket closes (never a bare destroy). */
function refuseUpgrade(socket, status, reason) {
  try { socket.write(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`); } catch { /* gone */ }
  socket.destroy();
}
server.on('upgrade', (req, socket, head) => {
  let m;
  try {
    const u = new URL(req.url, `http://${HOST}`);
    if (u.pathname !== '/stream') throw err('BAD_REQUEST', 'ws path');
    m = parseMarket(u);
  } catch { refuseUpgrade(socket, 400, 'Bad Request'); return; }
  // the same origin rule as HTTP: absent (a node client), 'null' (the file:// renderer) or loopback only
  if (req.headers.origin && !corsOrigin(req)) { refuseUpgrade(socket, 403, 'Forbidden'); return; }
  wss.handleUpgrade(req, socket, head, (ws) => {
    let s;
    try { s = sessionFor(m.symbol, m.res); } catch (e) {
      // a negative-cached symbol (or the cap) is NAMED on the socket, then closed like a failed load
      try { ws.send(JSON.stringify({ type: 'error', code: e.code || 'TV_FEED_ERROR', error: e.message })); } catch { /* closed */ }
      ws.close(e.code === 'SESSION_CAP' ? 1013 : 1011, String(e.code || 'TV_FEED_ERROR').slice(0, 60)); return;
    }
    // the subscription is registered only once the market LOADED (a slow/bad stream never pins SESSION_CAP)
    // a socket error is handled (never an unhandled 'error' event); a dead peer is found by ping/pong
    ws.on('error', (e) => { console.error(`[tv-feed] stream ${m.symbol} ${m.res}: ${e.message}`); });
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    s.load(300).then(() => {
      // the session may have been ORPHANED by a rebuild / idle-close while loading: never subscribe to a dead one
      if (s.dead || sessions.get(s.key) !== s) { try { ws.send(JSON.stringify({ type: 'error', code: 'TV_FEED_RESTART', error: 'the feed client was rebuilt — reconnect' })); ws.close(1012, 'TV_FEED_RESTART'); } catch { /* gone */ } return; }
      if (ws.readyState === 1) s.subs.add(ws);
    }).catch((e) => {
      try { ws.send(JSON.stringify({ type: 'error', code: e.code || 'TV_FEED_ERROR', error: e.message })); } catch { /* closed */ }
      try { ws.close(1011, String(e.code || 'TV_FEED_ERROR').slice(0, 60)); } catch { /* closed */ }
    });
    ws.on('close', () => { s.subs.delete(ws); s.lastUsed = Date.now(); });
  });
});

// a request the HTTP parser itself rejects is answered 400 explicitly (not left to the runtime's default)
server.on('clientError', (e, socket) => { if (socket.writable) { try { socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n'); } catch { /* gone */ } } else socket.destroy(); });
// a dead stream peer never pins a session's subs (and so never blocks idle-close / the rebuild)
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { try { ws.terminate(); } catch { /* gone */ } continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch { /* gone */ }
  }
}, 30_000).unref();
// the feed is its own process: a stray rejection is NAMED in its log, never a silent crash of every consumer
process.on('unhandledRejection', (e) => { console.error(`[tv-feed] UNHANDLED_REJECTION: ${(e && e.stack) || e}`); });
server.on('error', (e) => { console.error(`[tv-feed] ${e.code === 'EADDRINUSE' ? 'PORT_IN_USE' : e.code}: ${e.message}`); process.exit(2); });
server.listen(PORT, HOST, () => console.log(`[tv-feed] v${VERSION} on http://${HOST}:${PORT} pid=${process.pid}`));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => { for (const s of sessions.values()) s.close(); try { client.end(); } catch { /* gone */ } process.exit(0); });
