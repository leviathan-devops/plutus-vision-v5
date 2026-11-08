/**
 * charts/workbench.js — THE SELF-HOSTED CHART WORKBENCH (bundled → charts/workbench.bundle.js).
 *
 * A full, navigable, TradingView-style chart in any tab: Vela's own workspace (Apache-2.0) —
 * topbar (symbol search / timeframe / chart style / indicators), the drawing toolbar, the status
 * line, the bottom bar (ranges, clock, timezone), pan / zoom / crosshair, bar replay — with NO
 * TradingView page anywhere. Data comes through two providers the operator can switch between from
 * the symbol search (the `provider:` prefix is Vela's own grammar):
 *
 *   tv:EURUSD       the TradingView DATA feed (tv-feed/server.mjs :9448, TradingView-API in its own
 *                   process) — live, deep history, any TradingView symbol (tv:OANDA_XAUUSD).
 *   fixture:EURUSD  the pipeline's own bundled bars (:9430/api/v1/chart/bars) — offline, the exact
 *                   bars the canon study and the gate ran on (the SAME-BARS law).
 *
 * A failed load is NAMED on the chart by Vela's own error surface (the provider throws a coded
 * Error) — a dead feed is never papered over with the other provider's bars.
 *
 * mountWorkbench(host, opts) → { ws, chart, setMarket, getBars, getState, applyState, destroy }
 *   opts.storage  a VelaStorage ({get,set,remove}) — the per-agent workspace store plugs in here,
 *                 so each agent's drawings / indicators / symbol / timeframe persist with the agent.
 */
import { VelaWorkspace } from '@luxalgo/vela/workspace';

import { StationPineEngine } from './station-engine.js';
export const WORKBENCH_VERSION = '1.0.0';
const TV_FEED = 'http://127.0.0.1:9448';
const MAIN_API = 'http://127.0.0.1:9430';

/** The indexed instruments (Vela's symbol search is an eager index); anything else still loads
 *  by typing tv:EXCHANGE_SYMBOL (underscore for TradingView's colon, which is Vela's prefix char). */
export const TV_SYMBOLS = [
  ['EURUSD', 'FX:EURUSD', 'Euro / U.S. Dollar', 'forex'], ['GBPUSD', 'FX:GBPUSD', 'British Pound / U.S. Dollar', 'forex'],
  ['AUDUSD', 'FX:AUDUSD', 'Australian Dollar / U.S. Dollar', 'forex'], ['USDJPY', 'FX:USDJPY', 'U.S. Dollar / Japanese Yen', 'forex'],
  ['USDCHF', 'FX:USDCHF', 'U.S. Dollar / Swiss Franc', 'forex'], ['USDCAD', 'FX:USDCAD', 'U.S. Dollar / Canadian Dollar', 'forex'],
  ['NZDUSD', 'FX:NZDUSD', 'New Zealand Dollar / U.S. Dollar', 'forex'], ['EURGBP', 'FX:EURGBP', 'Euro / British Pound', 'forex'],
  ['EURJPY', 'FX:EURJPY', 'Euro / Japanese Yen', 'forex'], ['GBPJPY', 'FX:GBPJPY', 'British Pound / Japanese Yen', 'forex'],
  ['DXY', 'TVC:DXY', 'U.S. Dollar Index', 'index'], ['XAUUSD', 'OANDA:XAUUSD', 'Gold Spot / U.S. Dollar', 'commodity'],
  ['XAGUSD', 'OANDA:XAGUSD', 'Silver Spot / U.S. Dollar', 'commodity'], ['USOIL', 'TVC:USOIL', 'Crude Oil', 'commodity'],
  ['SPX', 'SP:SPX', 'S&P 500 Index', 'index'], ['NDX', 'NASDAQ:NDX', 'Nasdaq 100 Index', 'index'],
  ['US10Y', 'TVC:US10Y', 'U.S. 10Y Yield', 'bond'], ['BTCUSD', 'BITSTAMP:BTCUSD', 'Bitcoin / U.S. Dollar', 'crypto'],
  ['ETHUSD', 'BITSTAMP:ETHUSD', 'Ethereum / U.S. Dollar', 'crypto'],
].map(([ticker, tv, description, type]) => ({ ticker, tv, description, type }));
const TV_MAP = new Map(TV_SYMBOLS.map((s) => [s.ticker, s.tv]));

/** tv ticker → the TradingView id. EURUSD → FX:EURUSD (indexed), OANDA_XAUUSD → OANDA:XAUUSD. */
export function tvId(ticker) {
  const t = String(ticker || '').toUpperCase();
  if (TV_MAP.has(t)) return TV_MAP.get(t);
  const i = t.indexOf('_');
  if (i > 0) return t.slice(0, i) + ':' + t.slice(i + 1);
  return 'FX:' + t;
}

/** THE SAME-BARS LEDGER — every bar array a provider handed Vela, keyed provider:TICKER|tf, with
 *  the live forming bar patched in. Vela owns its canonical array privately; this is the exact copy
 *  of what it was fed, so a study run on "the chart's bars" runs on precisely these. */
export function barsKey(provider, ticker, timeframe) { return `${provider}:${String(ticker).toUpperCase()}|${timeframe}`; }
/** ONE ledger per workbench (never shared between the Pine Shell's and the backtest's charts), bounded:
 *  at most LEDGER_MARKETS markets (least-recently-written evicted) and LEDGER_BARS bars per market. */
const LEDGER_MARKETS = 12;
const LEDGER_BARS = 20000;
/** The history depth each market asks for = the ledger bound. MEASURED 2026-09-30: at 5000 (the feed's
 *  PER-REQUEST cap) every 1H chart stopped at 2025-12-09 although the feed serves older pages
 *  (to=2025-12-09 -> 2696 bars back to 2025-07-03): Vela walks a deeper request BACKWARD in bounded
 *  pages (each <= the feed cap, `to`-anchored) until the depth or the source's genesis. */
const FEED_DEPTH = LEDGER_BARS;
const ROOM_DEPTH = LEDGER_BARS;
function createLedger() { return new Map(); }
function remember(BARS, provider, ticker, timeframe, bars) {
  if (!BARS) return;
  const k = barsKey(provider, ticker, timeframe);
  const prev = BARS.get(k) || [];
  // a history page (older bars) merges with what is held; a refresh replaces the overlap
  const m = new Map(prev.map((b) => [b.time, b]));
  for (const b of bars) m.set(b.time, { ...b }); // the ledger owns its OWN objects (never the ones handed to Vela)
  BARS.delete(k); // re-insert = most recently written (Map order is the LRU order)
  BARS.set(k, [...m.values()].sort((a, b) => a.time - b.time).slice(-LEDGER_BARS));
  while (BARS.size > LEDGER_MARKETS) BARS.delete(BARS.keys().next().value);
}
/** A single bar is valid only with finite time + OHLC. */
function validBar(x) { return !!x && [x.time, x.open, x.high, x.low, x.close].every(Number.isFinite); }
function patchLive(BARS, provider, ticker, timeframe, bar) {
  if (!BARS || !validBar(bar)) return;
  const k = barsKey(provider, ticker, timeframe);
  let arr = BARS.get(k);
  if (!arr) { arr = []; BARS.set(k, arr); } // a live bar BEFORE history is kept — the ledger mirrors what the chart shows
  const last = arr[arr.length - 1];
  if (!last || bar.time > last.time) arr.push(bar);
  else if (last.time === bar.time) arr[arr.length - 1] = bar;
  else {
    // an out-of-order bar is placed by time (replace or insert) — the ledger never diverges from the chart
    let lo = 0, hi = arr.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (arr[mid].time < bar.time) lo = mid + 1; else hi = mid; }
    if (arr[lo].time === bar.time) arr[lo] = bar; else arr.splice(lo, 0, bar);
  }
  if (arr.length > LEDGER_BARS) arr.splice(0, arr.length - LEDGER_BARS); // the live path honours the cap too
  BARS.delete(k); BARS.set(k, arr); // a live tick makes this market the most recently used (LRU order)
}

/** A base URL without a trailing slash; the ws:// twin of an http(s):// base. */
function normBase(b) {
  const s = String(b).replace(/\/+$/, '');
  let u;
  try { u = new URL(s); } catch { throw coded('FEED_BAD_BASE', `not a URL: ${JSON.stringify(s).slice(0, 80)}`); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw coded('FEED_BAD_BASE', `${u.protocol} is not http(s)`);
  return s;
}
function wsBase(b) { const u = new URL(normBase(b)); u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:'; return u.toString().replace(/\/+$/, ''); }
/** A provider's reply must CARRY bars — anything else is a named failure, never a TypeError. */
function barsOf(list, code, what) {
  if (!Array.isArray(list)) throw coded(code, `${what}: the reply carried no bar array`);
  const out = [];
  for (const x of list) {
    if (!validBar(x)) continue;
    out.push({ time: x.time, open: x.open, high: x.high, low: x.low, close: x.close, volume: Number.isFinite(x.volume) ? x.volume : 0 });
  }
  // an EMPTY answer is named — never a blank chart with a cleared banner (and never an empty ledger entry)
  if (!out.length) throw coded(list.length ? code : 'NO_BARS', list.length ? `${what}: all ${list.length} bars malformed` : `${what}: the source returned no bars`);
  return out;
}

const TF_NAMES = { 1: '1m', 5: '5m', 15: '15m', 30: '30m', 60: '1h', 240: '4h', '1D': '1D', '1W': '1W' };
function tfName(tf) { return TF_NAMES[tf] || String(tf); }

function coded(code, message) { return Object.assign(new Error(`${code}: ${message}`), { code }); }

async function getJson(url, signal) {
  let r;
  // every provider call is bounded (the feed's own deadline is 30s): a hung load is named, not held
  // bounded on EVERY runtime: a manual AbortController when AbortSignal.timeout is absent
  // the 35s bound applies EVEN WITH a caller signal: the caller's abort is chained into our controller
  const ac = new AbortController();
  let timedOut = false;
  const tmo = setTimeout(() => { timedOut = true; ac.abort(); }, 35000);
  const onCallerAbort = () => ac.abort();
  if (signal) { if (signal.aborted) ac.abort(); else signal.addEventListener('abort', onCallerAbort, { once: true }); }
  let body = null;
  try {
    try { r = await fetch(url, { signal: ac.signal }); } catch (e) { throw coded('FEED_UNREACHABLE', `${url.split('?')[0]} — ${timedOut ? 'no answer in 35s' : e.name === 'AbortError' ? 'aborted by the caller' : e.message}`); }
    try { body = await r.json(); } catch { throw coded('FEED_BAD_REPLY', `${r.status} non-JSON from ${url.split('?')[0]}`); }
  } finally { clearTimeout(tmo); if (signal) signal.removeEventListener('abort', onCallerAbort); } // nothing outlives the call
  // a reply must be a JSON OBJECT (null / an array / a bare string is a named bad reply, never a TypeError)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw coded('FEED_BAD_REPLY', `${r.status} from ${url.split('?')[0]}: not a JSON object`);
  // a non-2xx that still claims success is not trusted
  if (r.status >= 300 && (body.ok === true || body.success === true)) throw coded('FEED_BAD_REPLY', `${r.status} from ${url.split('?')[0]} claimed success`);
  return { status: r.status, body };
}

const TIMEFRAMES = ['1', '5', '15', '30', '60', '240', '1D', '1W'];

export class TvFeedProvider {
  constructor({ base = TV_FEED, ledger = null, onStreamError = null } = {}) { this.base = normBase(base); this.ledger = ledger; this.onStreamError = onStreamError; this.streams = new Set(); }
  /** Close every live stream this provider opened (the workbench's destroy). */
  closeAll() { for (const u of [...this.streams]) { try { u(); } catch { /* closed */ } } this.streams.clear(); }
  info() {
    return { name: 'tv', displayName: 'TradingView feed', supportedTimeframes: TIMEFRAMES, capabilities: { enumerate: true, stream: true, symbolInfo: true } };
  }
  async listSymbols() { return TV_SYMBOLS.map(({ ticker, description, type }) => ({ ticker, description, type })); }
  async getBars(ticker, timeframe, range = {}) {
    const q = new URLSearchParams({ symbol: tvId(ticker), tf: String(timeframe), limit: String(Math.min(5000, range.limit || 1000)) });
    if (Number.isFinite(range.to)) q.set('to', String(range.to));
    const { status, body } = await getJson(`${this.base}/bars?${q}`, range.signal); // a caller's abort still ends it; the 35s bound always applies
    if (!body.ok) throw coded(body.code || 'TV_FEED_ERROR', `${tvId(ticker)} ${timeframe} — ${body.error} (HTTP ${status})`);
    let bars = barsOf(body.bars, 'TV_FEED_BAD_REPLY', `${tvId(ticker)} ${timeframe}`);
    // the range is clipped HERE too (the same contract as the fixture and the room — never trust the server alone)
    if (Number.isFinite(range.from)) bars = bars.filter((b) => b.time >= range.from);
    if (Number.isFinite(range.to)) bars = bars.filter((b) => b.time <= range.to);
    if (Number.isFinite(range.limit) && range.limit > 0) bars = bars.slice(-range.limit);
    remember(this.ledger, 'tv', ticker, timeframe, bars);
    return bars;
  }
  async getSymbolInfo(ticker) {
    const { body } = await getJson(`${this.base}/symbol?symbol=${encodeURIComponent(tvId(ticker))}&tf=1H`);
    if (!body.ok) return undefined;
    const i = body.info || {};
    const mintick = i.pricescale ? (i.minmov || 1) / i.pricescale : undefined;
    return { ticker, description: i.description, exchange: i.exchange, timezone: i.timezone, type: i.type, pricescale: i.pricescale, mintick, minTick: mintick };
  }
  subscribe(ticker, timeframe, onBar) {
    // every stream error carries ITS market: the workbench shows it only while that market is on screen
    const onErr = (e) => { if (!this.onStreamError) return; e.market = { ticker: String(ticker).toUpperCase(), timeframe: String(timeframe) }; this.onStreamError(e); };
    if (typeof onBar !== 'function') throw coded('STREAM_BAD_CALLBACK', 'subscribe(ticker, timeframe, onBar): onBar must be a function');
    // ONE socket per ticker|timeframe: a re-subscribe adds a listener, never a second socket
    const key = `${String(ticker).toUpperCase()}|${timeframe}`;
    this.shared = this.shared || new Map();
    const existing = this.shared.get(key);
    if (existing) {
      existing.listeners.add(onBar);
      return () => { existing.listeners.delete(onBar); if (!existing.listeners.size) existing.close(); };
    }
    const listeners = new Set([onBar]);
    // each listener is isolated: one throwing chart never starves the others on the shared socket
    const deliver = (bar) => {
      for (const f of [...listeners]) {
        try { f({ ...bar }); } catch (e) { onErr(coded('CHART_BAR_REJECTED', `${tvId(ticker)} ${timeframe}: a chart rejected a live bar — ${e && e.message}`)); }
      }
    };
    let ws = null; let closed = false; let timer = null; let tries = 0; let errors = 0; let junk = 0;
    let close = () => { closed = true; }; // replaced below; bound NOW so the first open() can call it (no TDZ)
    const MAX_TRIES = 20; // ~10 minutes of backoff, then the stream is named DEAD (history stays)
    const open = () => {
      timer = null;
      if (closed) return;
      try { ws = new WebSocket(`${wsBase(this.base)}/stream?symbol=${encodeURIComponent(tvId(ticker))}&tf=${encodeURIComponent(timeframe)}`); }
      catch (e) {
        // a malformed URL never becomes valid: NAMED and stopped (not retried forever); anything else backs off
        if (e && (e.name === 'SyntaxError' || e.code === 'FEED_BAD_BASE')) { const err = coded('TV_STREAM_BAD_URL', `${tvId(ticker)} ${timeframe}: ${e.message}`); close(); onErr(err); return; }
        tries++;
        if (tries > MAX_TRIES) { const err = coded('TV_STREAM_DEAD', `${tvId(ticker)} ${timeframe}: gave up after ${MAX_TRIES} attempts`); close(); onErr(err); return; }
        timer = setTimeout(open, Math.min(30000, 1000 * 2 ** Math.min(tries, 5))); return;
      }
      ws.onopen = () => { tries = 0; };
      // reported on the FIRST failure and then every 5th (throttled, never silent, never a flood)
      ws.onerror = () => { errors++; if (errors === 1 || errors % 5 === 0) onErr(coded('TV_STREAM_UNREACHABLE', `${tvId(ticker)} ${timeframe}: the live stream cannot connect — retrying with backoff`)); };
      // a malformed frame is COUNTED and named (first, then every 50th) — a stalled live stream is never silent
      const bad = (why) => { junk++; if (junk === 1 || junk % 50 === 0) onErr(coded('TV_STREAM_BAD_FRAME', `${tvId(ticker)} ${timeframe}: ${junk} malformed live frame(s) — ${why}`)); };
      ws.onmessage = (m) => {
        let d; try { d = JSON.parse(m.data); } catch { bad('not JSON'); return; }
        // the feed's named stream error (a rejected symbol, a client rebuild) reaches the chart's banner
        if (d && d.type === 'error') { onErr(coded(d.code || 'TV_STREAM_ERROR', `${tvId(ticker)} ${timeframe} live stream — ${d.error || 'closed'}`)); return; }
        if (!d || d.type !== 'bar') { bad(`frame type ${d && d.type}`); return; }
        if (!validBar(d.bar)) { bad('a bar without finite time/OHLC'); return; } // only a VALID bar reaches the ledger and the chart
        const bar = { time: d.bar.time, open: d.bar.open, high: d.bar.high, low: d.bar.low, close: d.bar.close, volume: Number.isFinite(d.bar.volume) ? d.bar.volume : 0 };
        patchLive(this.ledger, 'tv', ticker, timeframe, { ...bar }); // the ledger holds its OWN object;
        deliver(bar);                                                // each listener gets its own copy // a chart-side throw is the chart's defect: it propagates, never masked as a bad frame
      };
      // backoff 1s → 30s; a symbol the feed rejected (close 1011) is not retried into a storm
      ws.onclose = (ev) => {
        if (closed) return;
        // given up: the shared entry is CLOSED and evicted, so a later subscribe opens a fresh socket
        if (ev && ev.code === 1011 && tries > 2) { const err = coded('TV_STREAM_DEAD', `${tvId(ticker)} ${timeframe}: the feed keeps rejecting the live stream — the chart shows history only`); close(); onErr(err); return; }
        tries++;
        if (tries > MAX_TRIES) { const err = coded('TV_STREAM_DEAD', `${tvId(ticker)} ${timeframe}: gave up after ${MAX_TRIES} reconnects — the chart shows history only`); close(); onErr(err); return; }
        timer = setTimeout(open, Math.min(30000, 1000 * 2 ** Math.min(tries, 5)));
      };
    };
    open();
    close = () => { closed = true; if (timer) clearTimeout(timer); try { ws && ws.close(); } catch { /* already closed */ } this.streams.delete(close); this.shared.delete(key); listeners.clear(); };
    if (closed) return () => {}; // died on its very first open (a bad URL): never registered as a shared stream
    this.shared.set(key, { listeners, close });
    this.streams.add(close);
    return () => { listeners.delete(onBar); if (!listeners.size) close(); };
  }
}

/** The pipeline's bundled bars — the pairs/timeframes the fixture carries, nothing else. */
const FIXTURE = { EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', DXY: 'DXY' };
const FIXTURE_TF = { '15': '15m', '30': '30m', '60': '1H', '240': '4H', '15m': '15m', '30m': '30m', '1H': '1H', '4H': '4H' };

export class FixtureProvider {
  constructor({ base = MAIN_API, ledger = null } = {}) { this.base = normBase(base); this.ledger = ledger; }
  info() {
    return { name: 'fixture', displayName: 'Pipeline fixture (offline)', supportedTimeframes: ['15', '30', '60', '240'], capabilities: { enumerate: true, stream: false, symbolInfo: true } };
  }
  async listSymbols() {
    return Object.keys(FIXTURE).map((ticker) => ({ ticker, description: `${FIXTURE[ticker]} · the pipeline's bundled week`, type: ticker === 'DXY' ? 'index' : 'forex' }));
  }
  async getBars(ticker, timeframe, range = {}) {
    const pair = FIXTURE[String(ticker).toUpperCase()];
    const tf = FIXTURE_TF[String(timeframe)];
    if (!pair) throw coded('FIXTURE_SYMBOL_ABSENT', `${ticker} — the fixture carries ${Object.keys(FIXTURE).join(', ')}`);
    if (!tf) throw coded('FIXTURE_TF_ABSENT', `${timeframe} — the fixture carries 15/30/60/240`);
    const { status, body } = await getJson(`${this.base}/api/v1/chart/bars?pair=${encodeURIComponent(pair)}&timeframe=${encodeURIComponent(tf)}`);
    if (!body.success) throw coded(body.code || 'FIXTURE_ERROR', `${pair} ${tf} — ${body.error} (HTTP ${status})`);
    let bars = barsOf(body.data && body.data.bars, 'FIXTURE_BAD_REPLY', `${pair} ${tf}`);
    // the SAME range contract as the tv provider: a history page asks for bars before `to`
    if (Number.isFinite(range.from)) bars = bars.filter((b) => b.time >= range.from);
    if (Number.isFinite(range.to)) bars = bars.filter((b) => b.time <= range.to);
    if (Number.isFinite(range.limit) && range.limit > 0) bars = bars.slice(-range.limit);
    remember(this.ledger, 'fixture', ticker, timeframe, bars);
    return bars;
  }
  async getSymbolInfo(ticker) {
    const t = String(ticker).toUpperCase();
    return FIXTURE[t] ? { ticker: t, description: FIXTURE[t], mintick: t === 'DXY' ? 0.001 : 0.00001, minTick: t === 'DXY' ? 0.001 : 0.00001 } : undefined;
  }
}

/** THE BACKTEST ROOM (replay) — the chart shows EXACTLY the bars the engine has revealed
 *  (/bars?session= slices bars[..cursor] server-side: no lookahead can reach the chart). The tab
 *  pushes each newly revealed bar through push(); a seek BACKWARDS is a reload (setMarket). */
export class RoomProvider {
  constructor({ base, ledger = null } = {}) { this.base = base; this.ledger = ledger; this.subs = new Map(); this.aliases = new Map(); }
  /** A human ticker (REPLAY-EURUSD) → { uid, timeframe }. The room replays ONE timeframe (the session's). */
  alias(ticker, uid, timeframe) { this.aliases.set(String(ticker).toUpperCase(), { uid, timeframe: timeframe == null ? null : String(timeframe) }); return ticker; }
  entry(ticker) { const a = this.aliases.get(String(ticker).toUpperCase()); return a || { uid: String(ticker), timeframe: null }; }
  info() { return { name: 'room', displayName: 'Backtest room (replay)', capabilities: { enumerate: false, stream: true, symbolInfo: true } }; }
  roomBase() { const b = typeof this.base === 'function' ? this.base() : this.base; return b ? normBase(b) : b; }
  async getBars(ticker, timeframe, range = {}) {
    const b = this.roomBase();
    if (!b) throw coded('BACKTEST_ROOM_DOWN', 'no backtest room is serving (:9443/:9446/:9447)');
    const { uid, timeframe: roomTf } = this.entry(ticker); // an alias, or a raw session uid
    // the replay runs on ONE timeframe: another timeframe would relabel the session's bars — refused by name
    if (roomTf && String(timeframe) !== roomTf) throw coded('ROOM_TF_FIXED', `this replay runs on ${tfName(roomTf)} — the room replays only its own timeframe; switch the chart back to ${tfName(roomTf)}`);
    const { status, body } = await getJson(`${b}/bars?session=${encodeURIComponent(uid)}&lookback=100000`);
    if (!body.ok) throw coded(body.code || 'ROOM_ERROR', `${ticker} — ${body.error || 'bars refused'} (HTTP ${status})`);
    let bars = barsOf(body.bars, 'ROOM_BAD_REPLY', `session ${uid}`);
    if (Number.isFinite(range.from)) bars = bars.filter((x) => x.time >= range.from);
    if (Number.isFinite(range.to)) bars = bars.filter((x) => x.time <= range.to);
    if (Number.isFinite(range.limit) && range.limit > 0) bars = bars.slice(-range.limit);
    remember(this.ledger, 'room', ticker, timeframe, bars);
    return bars;
  }
  async getSymbolInfo(ticker) { return { ticker, description: `backtest replay · ${this.entry(ticker).uid}`, mintick: 0.00001, minTick: 0.00001 }; }
  subscribe(ticker, timeframe, onBar) {
    if (typeof onBar !== 'function') throw coded('STREAM_BAD_CALLBACK', 'subscribe(ticker, timeframe, onBar): onBar must be a function');
    const k = String(ticker).toUpperCase();
    const entry = { timeframe, onBar };
    if (!this.subs.has(k)) this.subs.set(k, new Set());
    this.subs.get(k).add(entry);
    return () => { const set = this.subs.get(k); if (set) set.delete(entry); };
  }
  /** Deliver newly revealed bars (ascending) to the live chart. Returns { delivered, errors } — never
   *  throws after a partial delivery (the caller always knows exactly what landed). */
  push(ticker, bars) {
    if (!Array.isArray(bars)) throw coded('ROOM_PUSH_BAD', 'push(ticker, bars): bars must be an array');
    const set = this.subs.get(String(ticker).toUpperCase());
    const errors = [];
    let delivered = 0;
    for (const bar of bars) {
      if (!validBar(bar)) continue;
      // only the replay's own timeframe receives its bars; each subscriber gets its OWN copy; one chart's
      // throw never starves another — every failure is RETURNED in errors (nothing is re-thrown)
      const roomTf = this.entry(ticker).timeframe;
      if (set) for (const e of set) {
        if (roomTf && String(e.timeframe) !== roomTf) continue;
        const copy = { time: bar.time, open: bar.open, high: bar.high, low: bar.low, close: bar.close, volume: Number.isFinite(bar.volume) ? bar.volume : 0 };
        patchLive(this.ledger, 'room', ticker, e.timeframe, { ...copy });
        try { e.onBar(copy); delivered++; } catch (err) { errors.push({ time: copy.time, error: String((err && err.message) || err) }); }
      }
    }
    return { delivered, errors, subscribers: set ? set.size : 0 };
  }
}


/** THE MT5 TAB - the BROKER'S OWN feed (the logged-in MT5 terminal via the dashboard bridge). The host injects the
 *  calls (window.plutus.mt5Bridge.rates / symbols): this module never opens a socket. The terminal serves the latest
 *  bars from position 0, so the chart holds MT5_DEPTH bars (the mobile app's own "Maximum bars limit" behaviour);
 *  the forming bar is polled every pollMs while the chart is subscribed. */
const MT5_TF = { '1': 'M1', '5': 'M5', '15': 'M15', '30': 'M30', '60': 'H1', '240': 'H4', '1D': 'D1', '1W': 'W1' };
const MT5_DEPTH = 5000;
export class Mt5Provider {
  constructor({ rates, symbols, ledger = null, pollMs = 1500 } = {}) {
    if (typeof rates !== 'function') throw coded('MT5_PROVIDER_BAD', 'Mt5Provider needs a rates({symbol,timeframe,count}) function');
    this.rates = rates; this.symbolsFn = symbols; this.ledger = ledger; this.pollMs = pollMs; this.digits = new Map();
  }
  info() { return { name: 'mt5', displayName: 'MT5 (broker feed)', capabilities: { enumerate: true, stream: true, symbolInfo: true } }; }
  async listSymbols() {
    if (typeof this.symbolsFn !== 'function') return [];
    const r = await this.symbolsFn();
    if (!r || !r.success) throw coded((r && r.code) || 'MT5_SYMBOLS_FAILED', (r && r.error) || 'the terminal returned no symbol list');
    return r.data.symbols.map((x) => ({ ticker: x.name, description: x.description || x.name, type: 'forex' }));
  }
  async fetch(ticker, timeframe, count) {
    const tf = MT5_TF[String(timeframe)];
    if (!tf) throw coded('MT5_TF_UNSUPPORTED', `MT5 has no ${timeframe} timeframe`);
    const r = await this.rates({ symbol: String(ticker), timeframe: tf, count });
    if (!r || !r.success) throw coded((r && r.code) || 'MT5_RATES_FAILED', `${ticker} ${tf} - ${(r && r.error) || 'no answer'}`);
    if (Number.isFinite(r.data.digits)) this.digits.set(String(ticker).toUpperCase(), r.data.digits);
    return barsOf(r.data.bars, 'MT5_BAD_REPLY', `${ticker} ${tf}`);
  }
  async getBars(ticker, timeframe, range = {}) {
    let bars = await this.fetch(ticker, timeframe, Math.min(MT5_DEPTH, Number.isFinite(range.limit) && range.limit > 0 ? range.limit : MT5_DEPTH));
    if (Number.isFinite(range.from)) bars = bars.filter((b) => b.time >= range.from);
    if (Number.isFinite(range.to)) bars = bars.filter((b) => b.time <= range.to);
    if (Number.isFinite(range.limit) && range.limit > 0) bars = bars.slice(-range.limit);
    remember(this.ledger, 'mt5', ticker, timeframe, bars);
    return bars;
  }
  async getSymbolInfo(ticker) {
    const d = this.digits.get(String(ticker).toUpperCase());
    const mintick = Number.isFinite(d) ? Math.pow(10, -d) : 0.00001;
    return { ticker, description: `${ticker} · MT5`, mintick, minTick: mintick, pricescale: Math.round(1 / mintick) };
  }
  subscribe(ticker, timeframe, onBar) {
    if (typeof onBar !== 'function') throw coded('STREAM_BAD_CALLBACK', 'subscribe(ticker, timeframe, onBar): onBar must be a function');
    let alive = true, busy = false;
    const tick = async () => {
      if (!alive || busy) return;
      busy = true;
      try {
        const bars = await this.fetch(ticker, timeframe, 2);
        for (const b of bars) { if (!alive) break; patchLive(this.ledger, 'mt5', ticker, timeframe, { ...b }); onBar({ ...b }); }
      } catch { /* the next tick retries; a dead feed is shown by the tab's own status */ } finally { busy = false; }
    };
    const t = setInterval(tick, this.pollMs);
    return () => { alive = false; clearInterval(t); };
  }
}

export const WORKBENCH_THEME = {
  background: '#0B0B0C', textColor: '#9A958C', gridColor: 'rgba(255,255,255,0.045)', borderColor: 'rgba(255,255,255,0.07)',
  upColor: '#7E9C82', downColor: '#9C6B6B', fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
};

/** A VelaStorage over any {get(key)->Promise<string|null>, set(key,val)} — e.g. the agent store. */
export function memoryStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  // async like every VelaStorage backend (the remote agent store is async)
  return { get: async (k) => (m.has(k) ? m.get(k) : null), set: async (k, v) => { m.set(k, v); }, remove: async (k) => { m.delete(k); }, dump: () => Object.fromEntries(m) };
}

/** Wrap a provider so a failed load is NAMED on the chart (Vela swallows provider throws and
 *  leaves a blank pane — a blank chart must never read as "no data"). */
function reporting(provider, report, seq) { // seq: ONE counter per workbench — the LATEST load owns the banner
  const getBars = provider.getBars.bind(provider);
  provider.getBars = async (ticker, timeframe, range) => {
    const mine = ++seq.n; // a slow failure of an abandoned market never covers the current chart
    try { const bars = await getBars(ticker, timeframe, range); if (mine === seq.n) report(null); return bars; }
    catch (e) { if (mine === seq.n) report(e); throw e; }
  };
  return provider;
}

export function mountWorkbench(host, opts = {}) {
  if (!host) throw coded('WORKBENCH_HOST_ABSENT', 'no host element');
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const banner = document.createElement('div');
  banner.className = 'plutus-wb-error';
  banner.setAttribute('role', 'alert');
  banner.style.cssText = 'position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);z-index:30;display:none;max-width:70%;'
    + 'padding:10px 14px;border:1px solid rgba(156,107,107,.55);background:rgba(20,12,12,.92);color:#D9B2B2;'
    + 'font:12px/1.45 Inter,Helvetica Neue,sans-serif;letter-spacing:.02em;border-radius:3px;pointer-events:none;text-align:center';
  let lastError = null;   // the LOAD state (history) — what loadBars / a study gate on
  let streamError = null; // the LIVE-STREAM state — shown on the banner, never mistaken for a failed load
  const seq = { n: 0 };
  const ledger = createLedger();
  let onError = typeof opts.onError === 'function' ? opts.onError : null;

  const room = reporting(new RoomProvider({ base: opts.roomBase || null, ledger }), (e) => report(e), seq);
  // ONE tv provider per workbench (Vela may call the factory more than once): its streams close on destroy
  let tvProvider = null;
  const report = (e) => {
    lastError = e ? { code: e.code || 'FEED_ERROR', message: e.message } : null;
    // a clean load clears the LOAD error — a still-dead live stream stays on the banner
    const shown = e || streamError;
    banner.style.display = shown ? 'block' : 'none';
    if (shown) banner.textContent = shown.message;
    if (onError) { try { onError(lastError); } catch { /* the host's handler */ } }
  };
  const reportStream = (e) => {
    streamError = e ? { code: e.code || 'TV_STREAM_ERROR', message: e.message } : null;
    if (e && !lastError) { banner.style.display = 'block'; banner.textContent = e.message; } // a load error keeps priority
  };
  const symbol = opts.symbol || 'tv:EURUSD';
  const timeframe = String(opts.timeframe || '60');
  // THE HISTORY DEPTH (measured 2026-09-30): Vela's default head is 500 bars — 1H reached back only to
  // 2026-09-01 ("a few weeks, then it cuts off"). The feed pages to mid-2025 on demand, so every market
  // asks for a real depth: the tv/fixture feed's own cap, the whole replay for the room.
  const depthFor = (sym) => {
    const p = String(sym || '').includes(':') ? String(sym).slice(0, String(sym).indexOf(':')).toLowerCase() : 'tv';
    return p === 'room' ? ROOM_DEPTH : p === 'mt5' ? MT5_DEPTH : FEED_DEPTH;
  };
  let mt5Provider = null;
  const ws = new VelaWorkspace(host, {
    layout: opts.layout ?? false,
    symbol, timeframe, bars: depthFor(symbol),
    theme: opts.theme || 'dark',
    providers: { tv: () => { if (!tvProvider) tvProvider = reporting(new TvFeedProvider({ ...(opts.tvFeed ? { base: opts.tvFeed } : {}), ledger, onStreamError: (e) => { const m = api.marketId(); if (!e.market || (m && m.provider === 'tv' && m.ticker.toUpperCase() === e.market.ticker && String(m.timeframe) === e.market.timeframe)) reportStream(e); } }), report, seq); return tvProvider; }, fixture: () => reporting(new FixtureProvider({ ...(opts.mainApi ? { base: opts.mainApi } : {}), ledger }), report, seq), room: () => room, ...(opts.mt5 ? { mt5: () => { if (!mt5Provider) mt5Provider = reporting(new Mt5Provider({ ...opts.mt5, ledger }), report, seq); return mt5Provider; } } : {}) },
    timeframes: TIMEFRAMES,
    drawingToolbar: opts.drawingToolbar ?? true,
    ...(opts.topbar ? { topbar: opts.topbar } : {}),
    indicatorPicker: opts.indicatorPicker ?? true,
    statusline: true, watermark: opts.watermark ?? true, bottombar: opts.bottombar ?? true,
    // Vela's BUILT-IN volume columns are not a removable indicator (no click, no delete) and the operator does not
    // want them: off by default. Volume stays one click away as a normal indicator (Indicators -> Volume).
    volume: opts.volume ?? false,
    autofocus: false,
    live: opts.live ?? true,
    persist: opts.storage ? (opts.persistKey || 'plutus-workbench') : false,
    ...(opts.storage ? { storage: opts.storage } : {}),
  });
  // Vela's OWN symbol / timeframe pickers switch the market internally: a market that lands shallower
  // than its depth is deepened in place (setMarket keeps every other field; a same-depth call is a no-op).
  // A REPLAY runs on ONE timeframe: Vela's range chips (ALL = 1W, 5Y = 1W…) switch the timeframe too, which a
  // room must refuse (ROOM_TF_FIXED) — so the chart goes straight back to the session's timeframe and, when the
  // chip asked for a COARSER one (zoom out), frames everything loaded instead (measured 2026-09-30: ALL blanked it).
  // Vela names coarse timeframes 'D' / 'W' / 'M' on the market (measured: ALL → timeframe "W")
  const normTf = (tf) => ({ D: '1D', W: '1W', M: '1M' }[String(tf)] || String(tf));
  const tfRank = (tf) => TIMEFRAMES.indexOf(normTf(tf));
  // no lock held across a promise (a setMarket whose load failed never settled and froze the old boolean):
  // an IDENTICAL correction is skipped for 1.5s; anything else is issued at once
  let lastFix = { key: '', at: 0 };
  const issue = (key, next) => {
    if (lastFix.key === key && Date.now() - lastFix.at < 1500) return;
    lastFix = { key, at: Date.now() };
    Promise.resolve(ws.chart.setMarket(next)).catch(() => { /* a superseded switch resolves silently */ });
  };
  const ensureDepth = () => {
    const m = ws.chart && ws.chart.market;
    if (!m || !m.symbol || m.offline) return;
    const sym = String(m.symbol);
    if (sym.toLowerCase().startsWith('room:')) {
      const roomTf = room.entry(sym.slice(5)).timeframe;
      if (roomTf && normTf(m.timeframe) !== normTf(roomTf)) {
        const zoomOut = tfRank(m.timeframe) > tfRank(roomTf);
        issue(`room|${sym}|${roomTf}|${zoomOut}`, { timeframe: roomTf, bars: ROOM_DEPTH, ...(zoomOut ? { visibleRange: 'ALL' } : {}) });
        return;
      }
    }
    const want = depthFor(sym);
    if (Number(m.bars) >= want) return;
    issue(`depth|${sym}|${normTf(m.timeframe)}|${want}`, { bars: want });
  };
  // market:changed / load:end are CHART events (the workspace re-emits some, not all): subscribe to both
  for (const src of [ws.chart, ws]) {
    if (!src || typeof src.on !== 'function') continue;
    try { src.on('market:changed', ensureDepth); src.on('load:end', ensureDepth); } catch { /* not an emitter of these */ }
  }
  host.appendChild(banner);
  // ONE-TIME: a layout persisted before the built-in volume was switched off carries it as a native
  // indicator ('volume') and restores it on every load (measured on TRADE, Pine and Backtest). Stripped
  // once per persisted layout (a marker in the SAME storage), so a Volume the operator adds later stays.
  if (!(opts.volume ?? false) && opts.storage && typeof opts.storage.get === 'function') {
    const marker = `${opts.persistKey || 'plutus-workbench'}.migrated.volume-off`;
    (async () => {
      try {
        if (await opts.storage.get(marker)) return;
        if (ws.chart && typeof ws.chart.ready === 'function') await ws.chart.ready();
        const raw = ws.getState();
        const st = typeof raw === 'string' ? JSON.parse(raw) : raw;
        let stripped = 0;
        for (const c of (st && st.charts) || []) {
          const n = c && c.indicators && c.indicators.natives;
          if (Array.isArray(n) && n.includes('volume')) { c.indicators.natives = n.filter((x) => x !== 'volume'); stripped++; }
        }
        if (stripped) await ws.applyState(typeof raw === 'string' ? JSON.stringify(st) : st);
        await opts.storage.set(marker, new Date().toISOString());
      } catch { /* a layout that cannot be read is left as it is */ }
    })();
  }
  const api = {
    version: WORKBENCH_VERSION, ws,
    /** Register the Pine engine on this workbench's chart (AGPL bundle loads separately). */
    ensurePineEngine() { if (!ws.chart) throw coded('WORKBENCH_NOT_READY', 'the chart is not mounted'); return ensurePineEngine(ws.chart); },
    /** The replay room provider (backtest tab): alias(ticker, uid) + push(ticker, newlyRevealedBars). */
    room,
    /** Drop same-bars ledger entries for a provider (superseded replay aliases). */
    forgetBars(provider, keep) {
      const keepPrefix = keep ? barsKey(provider, keep, '') : null; // 'room:TICKER|' — the delimiter included
      for (const k of [...ledger.keys()]) if (k.startsWith(provider + ':') && (!keepPrefix || !k.startsWith(keepPrefix))) ledger.delete(k);
    },
    /** This workbench's same-bars ledger (read-only view for probes). */
    ledgerKeys: () => [...ledger.keys()].map((k) => `${k}=${ledger.get(k).length}`),
    /** The live stream's last failure ({code, message}) or null — separate from the load state. */
    streamError: () => streamError,
    /** The last load failure ({code, message}) or null — the chart's named error state. */
    lastError: () => lastError,
    get chart() { return ws.chart; },
    /** The bars the ACTIVE chart is showing — the same-bars law's source for a study run. */
    /** The bars the chart shows (copies), or NULL when the chart is on no market yet — "not loaded" is
     *  never confused with "no bars" (a study must refuse to run on nothing). */
    getBars() {
      const id = api.marketId();
      if (!id) return null;
      const arr = ledger.get(barsKey(id.provider, id.ticker, id.timeframe));
      return arr ? arr.map((b) => ({ ...b })) : null;
    },
    /** The ACTIVE market as {provider, ticker, timeframe} (the gate row's identity). */
    marketId() {
      const m = ws.chart && ws.chart.market;
      if (!m || !m.symbol) return null;
      const sym = String(m.symbol);
      // the provider is Vela's own field; the ticker is the symbol minus EXACTLY that provider's prefix
      const provider = m.provider || (sym.includes(':') ? sym.slice(0, sym.indexOf(':')) : null);
      if (!provider) return null;
      const ticker = sym.startsWith(provider + ':') ? sym.slice(provider.length + 1) : sym;
      return { provider, ticker, timeframe: m.timeframe };
    },
    get market() { return ws.chart ? ws.chart.market : null; },
    setMarket(m) {
      if (!ws.chart) throw coded('WORKBENCH_NOT_READY', 'the chart is not mounted');
      const next = { ...(m || {}) };
      if (next.bars === undefined && !next.data) next.bars = depthFor(next.symbol || (ws.chart.market && ws.chart.market.symbol));
      return ws.chart.setMarket(next);
    },
    /** RE-LOAD the current market (measured 2026-10-01: Vela skips a same-market setMarket - a chart whose
     *  history load failed stays on its error banner forever). The requested depth alternates want <-> want+1:
     *  a real load either way (the providers cap at their own depth), and never shallower than depthFor. */
    reload() {
      if (!ws.chart || !ws.chart.market || !ws.chart.market.symbol) throw coded('WORKBENCH_NOT_READY', 'the chart is on no market');
      const want = depthFor(ws.chart.market.symbol);
      return ws.chart.setMarket({ bars: Number(ws.chart.market.bars) === want ? want + 1 : want });
    },
    getState() { return ws.getState(); },
    applyState(s) { return ws.applyState(s); },
    on(ev, fn) { return ws.on(ev, fn); },
    destroy() {
      try { ws.destroy && ws.destroy(); } catch { /* host removed */ }
      banner.remove();
      room.subs.clear();
      if (tvProvider) tvProvider.closeAll();
      tvProvider = null;
      ledger.clear();
      onError = null;
    },
  };
  return api;
}

if (typeof window !== 'undefined') window.PlutusWorkbench = { mountWorkbench, RoomProvider, Mt5Provider, barsKey, TvFeedProvider, FixtureProvider, memoryStorage, tvId, TV_SYMBOLS, WORKBENCH_THEME, version: WORKBENCH_VERSION, ensurePineEngine };
/** Register the 'pine' engine on a chart: a PASS-THROUGH to the Pine Station (charts/station-engine.js). The AGPL
 *  engine runs ONLY in the station process; the model crosses as JSON. Synchronous registration - no bundle import. */
export function ensurePineEngine(chart, stationBaseUrl) {
  if (!chart) return Promise.reject(coded('PINE_ENGINE_NO_CHART', 'no chart'));
  if (chart.__plutusPineEngine) return Promise.resolve(true);
  try {
    chart.registerEngine('pine', new StationPineEngine({ base: stationBaseUrl || 'http://127.0.0.1:9441' }));
  } catch (e) { return Promise.reject(e && e.code ? e : coded('PINE_ENGINE_REGISTER_FAILED', String((e && e.message) || e))); }
  chart.__plutusPineEngine = true;
  return Promise.resolve(true);
}
