/**
 * bars.mjs — the room's BAR SOURCE (SHELL_ANCHOR §8 THE ZERO-TV LAW · W-S3 T1)
 * ---------------------------------------------------------------------------
 * The room replays the SHELL'S OWN bars. Resolution order (first hit wins):
 *   1. PLUTUS_BARS_FIXTURE                     — an explicit fixture file
 *   2. http://127.0.0.1:9430/api/v1/chart/bars — the running shell's own rail
 *      (the sanctioned source: the API serves the pipeline's bundled cells)
 *   3. the fixture file on disk                — the same document the API reads,
 *      found by the candidate list below (the API's own default path is relative
 *      to ITS checkout, which differs from this worktree's root)
 * Never the network, never TradingView, never a fabricated series.
 */
import fs from 'node:fs';
import path from 'node:path';

const API = process.env.PLUTUS_API || 'http://127.0.0.1:9430';
const HERE = path.dirname(new URL(import.meta.url).pathname);

const FIXTURE_CANDIDATES = [
  process.env.PLUTUS_BARS_FIXTURE,
  path.resolve(HERE, '..', '..', 'fixtures', 'bars', '2026-07-06.json'),   // SELF-CONTAINED: the fork's own bundled week
].filter(Boolean);

let _doc = null;
let _docFrom = null;

function findFixture() {
  for (const p of FIXTURE_CANDIDATES) {
    try {
      if (fs.existsSync(p)) return p;
    } catch { /* keep walking */ }
  }
  // last resort: scan the PLUTUS tree for a bars fixture directory
  const roots = [path.resolve(HERE, '..', '..', 'fixtures', 'bars')];   // only Pinebox's own tree, never a host path
  for (const r of roots) {
    try {
      const files = fs.readdirSync(r).filter((f) => f.endsWith('.json')).sort();
      if (files.length) return path.join(r, files[files.length - 1]);
    } catch { /* not here */ }
  }
  return null;
}

function fixtureDoc() {
  if (_doc) return _doc;
  const p = findFixture();
  if (!p) return null;
  _doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  _docFrom = p;
  return _doc;
}

function normalize(bars) {
  return bars
    .map((b) => ({
      time: Number(b.time ?? b.timestamp),
      open: Number(b.open),
      high: Number(b.high),
      low: Number(b.low),
      close: Number(b.close),
      volume: Number(b.volume || 0),
    }))
    .filter((b) => Number.isFinite(b.time) && Number.isFinite(b.close))
    .sort((a, b) => a.time - b.time);
}

/** every cell the source can serve: [{pair, timeframe, bars, symbol, first, last, firstIso, lastIso}] */
export function availableCells() {
  const doc = fixtureDoc();
  if (!doc) return [];
  return (doc.cells || []).map((c) => {
    const bars = (c.bars || []).slice().sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    const first = bars.length ? Number(bars[0].timestamp) : null;
    const last = bars.length ? Number(bars[bars.length - 1].timestamp) : null;
    return {
      pair: c.pair,
      timeframe: c.timeframe,
      symbol: c.symbol || c.pair,
      exchange: c.exchange || null,
      bars: bars.length,
      first, last,
      firstIso: first ? new Date(first).toISOString() : null,
      lastIso: last ? new Date(last).toISOString() : null,
    };
  });
}

export function fixturePath() {
  fixtureDoc();
  return _docFrom;
}

/**
 * @returns {Promise<{pair,symbol,timeframe,bars,source,provenance,anchorMs,anchorLabel}>}
 * @throws {Error} with .code = BARS_UNAVAILABLE | CELL_ABSENT
 */
export async function loadBars(pair = 'EUR/USD', timeframe = '1H') {
  // 1 · the live shell rail
  try {
    const url = `${API}/api/v1/chart/bars?pair=${encodeURIComponent(pair)}&timeframe=${encodeURIComponent(timeframe)}`;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(url, { signal: ctl.signal });
    clearTimeout(t);
    const j = await r.json().catch(() => null);
    if (j && j.success && j.data && Array.isArray(j.data.bars) && j.data.bars.length) {
      const bars = normalize(j.data.bars);
      if (!bars.length) throw Object.assign(new Error('rail returned 0 usable bars'), { code: 'BARS_UNAVAILABLE' });
      return {
        pair: j.data.pair || pair, symbol: j.data.symbol || pair, timeframe: j.data.timeframe || timeframe,
        bars, source: `rail ${API}/api/v1/chart/bars`, provenance: j.data.provenance || null,
        anchorMs: j.data.anchorMs ?? null, anchorLabel: j.data.anchorLabel ?? null,
      };
    }
    if (j && j.code === 'CHART_CELL_ABSENT') {
      throw Object.assign(new Error(j.error || 'no bars cell'), { code: 'CELL_ABSENT', available: j.available || [] });
    }
  } catch (err) {
    if (err.code === 'CELL_ABSENT') throw err;
    // the rail is down or unusable → fall through to the file
  }

  // 2 · the fixture file on disk
  const doc = fixtureDoc();
  if (!doc) {
    throw Object.assign(
      new Error(`bars unavailable: the rail ${API} did not answer and no bars fixture was found (tried ${FIXTURE_CANDIDATES.join(', ')})`),
      { code: 'BARS_UNAVAILABLE', tried: FIXTURE_CANDIDATES },
    );
  }
  const cell = (doc.cells || []).find((c) => c.pair === pair && c.timeframe === timeframe);
  if (!cell) {
    throw Object.assign(
      new Error(`no bars cell for pair=${pair} timeframe=${timeframe}`),
      { code: 'CELL_ABSENT', available: (doc.cells || []).map((c) => `${c.pair} ${c.timeframe}`) },
    );
  }
  const bars = normalize(cell.bars || []);
  if (!bars.length) throw Object.assign(new Error(`cell ${pair} ${timeframe} has 0 bars`), { code: 'BARS_UNAVAILABLE' });
  return {
    pair, symbol: cell.symbol || pair, timeframe,
    bars, source: `fixture ${_docFrom}`, provenance: doc.provenance || null,
    anchorMs: doc.anchorMs ?? null, anchorLabel: doc.anchorLabel ?? null,
  };
}

// ─────────────────────────────────────────────────────────── THE TV FEED SOURCE (explicit, never a fallback)
// A session created with barsSource:'tv' replays DEEP history from the dashboard's own TradingView feed
// process (:9448). It is chosen by the operator, never substituted for a missing fixture; a down feed is
// a NAMED refusal. DETERMINISM (resume): only CLOSED bars are used and the session records the last one's
// time (bars_to); a resume refetches at that fixed anchor, so the replay sees the same series.
const TV_FEED = process.env.PLUTUS_TV_FEED || 'http://127.0.0.1:9448';
/**
 * THE INSTRUMENT TABLE — every asset the dashboard's pickers advertise, each with the TradingView id the
 * dashboard's OWN feed serves. The ids were DERIVED from the feed (:9448 /search) and verified against its
 * /bars (each returned real bars) — never from memory:
 *
 *   GET :9448/search?q=XAGUSD → OANDA:XAGUSD   GET :9448/search?q=BTCUSD  → Bitstamp:BTCUSD
 *   GET :9448/search?q=EURJPY → OANDA:EURJPY   GET :9448/search?q=TVC:US10Y → TVC:US10Y
 *   GET :9448/search?q=NASDAQ:NDX → NASDAQ:NDX GET :9448/search?q=TVC:DXY  → TVC:DXY
 *   GET :9448/search?q=SP:SPX  → SP:SPX        GET :9448/search?q=TVC:USOIL → TVC:USOIL
 * (the app's own tickers for those instruments are in charts/workbench.js TV_SYMBOLS: USOIL, SPX, NDX, US10Y…)
 *
 * `pair` is the room's own code — what POST /create and the /tv-cells dropdown take. `codes` are the OTHER
 * spellings the dashboard's symbol surfaces emit for the SAME instrument: the chart-provider tickers and the
 * broker-style renderings the operator read off the picker (SPXSPI, NDXNAS, USYUSY, USOILC, DXYUSD, DXYDXY).
 * A symbol in NONE of these tables is still refused by NAME (TV_SYMBOL_UNKNOWN) — never guessed.
 */
const INSTRUMENTS = [
  { pair: 'EUR/USD', id: 'FX:EURUSD', codes: ['EURUSD'] },
  { pair: 'GBP/USD', id: 'FX:GBPUSD', codes: ['GBPUSD'] },
  { pair: 'AUD/USD', id: 'FX:AUDUSD', codes: ['AUDUSD'] },
  { pair: 'USD/JPY', id: 'FX:USDJPY', codes: ['USDJPY'] },
  { pair: 'USD/CHF', id: 'FX:USDCHF', codes: ['USDCHF'] },
  { pair: 'USD/CAD', id: 'FX:USDCAD', codes: ['USDCAD'] },
  { pair: 'NZD/USD', id: 'FX:NZDUSD', codes: ['NZDUSD'] },
  { pair: 'EUR/GBP', id: 'FX:EURGBP', codes: ['EURGBP'] },
  { pair: 'EUR/JPY', id: 'FX:EURJPY', codes: ['EURJPY'] },
  { pair: 'GBP/JPY', id: 'FX:GBPJPY', codes: ['GBPJPY'] },
  { pair: 'DXY', id: 'TVC:DXY', codes: ['DXYUSD', 'DXYDXY'] },
  { pair: 'XAU/USD', id: 'OANDA:XAUUSD', codes: ['XAUUSD'] },
  { pair: 'XAG/USD', id: 'OANDA:XAGUSD', codes: ['XAGUSD'] },
  { pair: 'USOIL', id: 'TVC:USOIL', codes: ['USOILC'] },
  { pair: 'SPX', id: 'SP:SPX', codes: ['SPXSPI'] },
  { pair: 'NDX', id: 'NASDAQ:NDX', codes: ['NDXNAS'] },
  { pair: 'US10Y', id: 'TVC:US10Y', codes: ['USYUSY'] },
  { pair: 'BTC/USD', id: 'BITSTAMP:BTCUSD', codes: ['BTCUSD'] },
  { pair: 'ETH/USD', id: 'BITSTAMP:ETHUSD', codes: ['ETHUSD'] },
];

/** one spelling-normaliser for every surface: EUR/USD, EURUSD, eur-usd all mean the same instrument */
const norm = (s) => String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, '');

export const TV_IDS = {};
/** normalised spelling → TradingView id (the pair, the chart ticker and every alias, one table) */
const TV_LOOKUP = new Map();
/** every NON-pair spelling → id (the chart tickers + the broker-style codes), for auditing the picker */
export const PICKER_ALIASES = {};
for (const i of INSTRUMENTS) {
  TV_IDS[i.pair] = i.id;
  TV_LOOKUP.set(norm(i.pair), i.id);
  for (const c of i.codes) { TV_LOOKUP.set(norm(c), i.id); PICKER_ALIASES[c] = i.id; }
}

/**
 * THE PICKER'S OWN ROWS. The chart's symbol picker is fed by Vela's `feed.symbols()`, which flatMaps the
 * descriptor list of EVERY registered provider (charts/workbench.bundle.js `symbolsOf`) — measured in
 * charts/workbench.js: the tv provider (TV_SYMBOLS, 19 tickers) + the fixture provider (FIXTURE: EURUSD,
 * GBPUSD, DXY) → 22 rows, no dedupe. EVERY one must resolve here, or the operator picks an asset the room
 * cannot replay (the measured single-bar/dead-end defect).
 */
export const PICKER_CODES = [
  'EURUSD', 'GBPUSD', 'AUDUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY',
  'DXY', 'XAUUSD', 'XAGUSD', 'USOIL', 'SPX', 'NDX', 'US10Y', 'BTCUSD', 'ETHUSD',
  'EURUSD', 'GBPUSD', 'DXY',
];

export const TV_PAIRS = Object.keys(TV_IDS);
export const TV_TIMEFRAMES = ['5m', '15m', '30m', '1H', '4H', '1D'];
const TF_MS = { '5m': 300000, '15m': 900000, '30m': 1800000, '1H': 3600000, '4H': 14400000, '1D': 86400000 };

export function tvIdFor(pair) {
  const raw = String(pair == null ? '' : pair).trim();
  if (!raw) return null;
  if (TV_IDS[raw]) return TV_IDS[raw];                 // the room's pair form, verbatim
  const hit = TV_LOOKUP.get(norm(raw));                // a chart ticker / broker alias / a pair spelled loosely
  if (hit) return hit;
  const up = raw.toUpperCase();
  return /^[A-Z0-9_]{1,24}:[A-Z0-9._!&-]{1,40}$/.test(up) ? up : null;  // an explicit EXCHANGE:SYMBOL
}

/** @param {{to?: number, createdAt?: number}} o  to = the fixed anchor (resume); createdAt = drop bars still forming */
/** A NEW tv session: find the last CLOSED bar, then fetch with THAT as the anchor — the exact request a resume
 *  re-issues (to = bars_to, limit 5000). Fetching "latest 5000, drop the forming one" and later "5000 up to the
 *  anchor" are different windows (off by one bar — measured: the resume diverged at the first recorded step). */
export async function loadTvBarsAnchored(pair, timeframe, o = {}) {
  // BOTH legs bypass the resume cache, deliberately. The second leg carries no `createdAt`, so it WOULD
  // qualify for it — and that is exactly the trap: serving it from cache collapses "5000 up to the anchor,
  // fetched again" into "5000 up to the anchor, served from an earlier fetch", which is the off-by-one-bar
  // divergence this function's own comment warns causes a resume to diverge at its first recorded step.
  // Caught by tools/test/anchored-cache.mjs (CREATE_two_round_trips_are_not_collapsed: measured 2,1).
  const id = tvIdFor(pair);
  const probe = await fetchTvWindow(id, timeframe, { to: o.to, createdAt: o.createdAt ?? Date.now() });
  return fetchTvWindow(id, timeframe, { to: probe.barsTo });
}


/**
 * THE RESUME WINDOW CACHE (2026-10-02, the operator: "GBPUSD replay 5+s latency so far. fix.").
 * Measured: the room holds 5 sessions in memory but 15 in the DB, so most asset switches land on a
 * DB-only session and must `POST /resume` — which refetches 5000 bars from the TV feed EVERY time.
 * Measured `POST /resume` at **1422ms** with `GET /status` before it at 0ms: the fetch IS the latency.
 *
 * WHY IT IS SAFE: a resume's window is IMMUTABLE. `{to: anchor}` is a request for a FIXED window ending
 * at a FIXED anchor — the same call returns the same bars forever (the feed serves history, not a moving
 * window). `loadTvBarsAnchored` is deliberately NOT cached: it issues two round trips with DIFFERENT
 * args, and collapsing them would change what a create loads. A create (no `to`) is never cached either.
 *
 * Bounded LRU + in-flight sharing: N switches on one asset cost ONE fetch, and the cache cannot grow
 * without limit.
 */
const ANCHORED_CACHE = new Map();
const ANCHORED_CACHE_MAX = 24;      // the room holds 15 sessions today; 24 leaves headroom
const ANCHORED_INFLIGHT = new Map();

export async function loadTvBars(pair, timeframe, o = {}) {
  const id = tvIdFor(pair);
  if (!id) throw Object.assign(new Error(`no TradingView id for ${JSON.stringify(String(pair))} (known: ${TV_PAIRS.join(', ')})`), { code: 'TV_SYMBOL_UNKNOWN', available: TV_PAIRS });
  // THE FAST PATH: an anchored (immutable) window is served from memory; a LIVE window is never cached.
  if (Number.isFinite(o.to) && o.createdAt === undefined) return anchoredWindow(pair, id, timeframe, o.to);
  return fetchTvWindow(id, timeframe, o);
}

async function anchoredWindow(pair, id, timeframe, to) {
  const key = `${id}|${timeframe}|${to}`;
  const hit = ANCHORED_CACHE.get(key);
  if (hit) { ANCHORED_CACHE.delete(key); ANCHORED_CACHE.set(key, hit); return hit; }   // LRU touch
  const flight = ANCHORED_INFLIGHT.get(key);
  if (flight) return flight;                                                          // ONE fetch, N callers
  const p = fetchTvWindow(id, timeframe, { to })
    .then((r) => { ANCHORED_CACHE.set(key, r); if (ANCHORED_CACHE.size > ANCHORED_CACHE_MAX) ANCHORED_CACHE.delete(ANCHORED_CACHE.keys().next().value); return r; })
    .finally(() => { ANCHORED_INFLIGHT.delete(key); });
  ANCHORED_INFLIGHT.set(key, p);
  return p;
}

async function fetchTvWindow(id, timeframe, o) {
  const tfMs = TF_MS[timeframe];
  if (!tfMs) throw Object.assign(new Error(`timeframe ${JSON.stringify(String(timeframe))} is not served (${TV_TIMEFRAMES.join(', ')})`), { code: 'TV_TIMEFRAME_UNKNOWN', available: TV_TIMEFRAMES });
  const q = new URLSearchParams({ symbol: id, tf: timeframe, limit: '5000' });
  if (Number.isFinite(o.to)) q.set('to', String(o.to));
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 90000);
  let j;
  try {
    const r = await fetch(`${TV_FEED}/bars?${q}`, { signal: ctl.signal });
    j = await r.json().catch(() => null);
  } catch (err) {
    throw Object.assign(new Error(`the TradingView feed ${TV_FEED} did not answer (${err.name === 'AbortError' ? 'timeout' : err.message})`), { code: 'TV_FEED_DOWN' });
  } finally { clearTimeout(t); }
  if (!j || !j.ok || !Array.isArray(j.bars)) throw Object.assign(new Error(`the feed refused ${id} ${timeframe}: ${(j && j.error) || 'no reply'}`), { code: (j && j.code) || 'TV_FEED_DOWN' });
  let bars = normalize(j.bars);
  if (Number.isFinite(o.to)) bars = bars.filter((b) => b.time <= o.to);
  if (Number.isFinite(o.createdAt)) bars = bars.filter((b) => b.time + tfMs <= o.createdAt); // CLOSED bars only
  if (!bars.length) throw Object.assign(new Error(`the feed returned 0 closed bars for ${id} ${timeframe}`), { code: 'BARS_UNAVAILABLE' });
  const barsTo = bars[bars.length - 1].time;
  return { pair: id, symbol: id, timeframe, bars, source: `tv-feed ${id} ${timeframe} to=${new Date(barsTo).toISOString()}`, provenance: null, anchorMs: null, anchorLabel: null, barsTo };
}

export default { loadBars, loadTvBars, loadTvBarsAnchored, availableCells, fixturePath, tvIdFor, TV_IDS, TV_PAIRS, TV_TIMEFRAMES, PICKER_CODES, PICKER_ALIASES };
