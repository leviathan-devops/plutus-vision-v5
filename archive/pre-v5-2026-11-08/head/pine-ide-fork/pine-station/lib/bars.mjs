/**
 * bars.mjs — THE BAR SOURCES for the pine station.
 *
 * The station never talks to a network. Bars arrive as one of:
 *   1. an inline `bars` array on the /run request,
 *   2. a `dataFile` path (pinets-cli-shaped JSON, resolved under an allow-listed
 *      root), or
 *   3. `pair` + `timeframe` resolved from the shell's own fixture — the SAME
 *      file the dashboard API serves at GET /api/v1/chart/bars, so the chart and
 *      the station always compute on identical bars.
 *
 * Accepted candle shapes (all normalized): {timestamp|time|t|openTime,
 * open|o, high|h, low|l, close|c, volume|v}.
 *
 * PINETS-CLI SHAPES (`pinets run x.pine --data y.json`) accepted here:
 *   [ {time,open,high,low,close,volume}, … ]
 *   { bars: [...] } | { data: [...] } | { candles: [...] } | { klines: [...] }
 *   { cells: [ { pair, timeframe, bars: [...] }, … ] }   ← the pipeline fixture
 */

import fs from 'node:fs';
import path from 'node:path';

const LIVE_ROOT = process.env.PLUTUS_LIVE_ROOT
  || '/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS/LIVE';

const DEFAULT_FIXTURE = process.env.PLUTUS_BARS_FIXTURE
  || path.resolve(LIVE_ROOT, 'agent', 'reference', 'fixtures', 'bars', '2026-07-06.json');

/** Roots a `dataFile` may be read from. Loopback-only is no excuse to read /. */
function allowedRoots() {
  const env = (process.env.PLUTUS_STATION_ROOTS || '').split(':').filter(Boolean);
  const home = process.env.HOME || '/home/leviathan';
  return [
    ...env,
    LIVE_ROOT,
    path.resolve(DEFAULT_FIXTURE, '..'),
    path.join(home, '.plutus-dashboard'),
  ].map((p) => path.resolve(p));
}

export function resolveDataFile(file) {
  if (!file) throw Object.assign(new Error('dataFile is required'), { code: 'PINE_DATA_ABSENT' });
  const abs = path.resolve(String(file));
  const roots = allowedRoots();
  const ok = roots.some((root) => abs === root || abs.startsWith(root + path.sep));
  if (!ok) {
    throw Object.assign(
      new Error(`dataFile outside the allow-listed roots: ${abs} (roots: ${roots.join(', ')})`),
      { code: 'PINE_DATA_DENIED' },
    );
  }
  if (!fs.existsSync(abs)) {
    throw Object.assign(new Error(`dataFile not found: ${abs}`), { code: 'PINE_DATA_ABSENT' });
  }
  return abs;
}

const num = (v) => (v === null || v === undefined || v === '' ? undefined : Number(v));

/** One candle of any accepted shape → the canonical PineTS Kline shape. */
export function normalizeCandle(b, i, arr) {
  const time = Number(b.timestamp ?? b.time ?? b.t ?? b.openTime ?? b.date);
  const nextTime = arr[i + 1]
    ? Number(arr[i + 1].timestamp ?? arr[i + 1].time ?? arr[i + 1].t ?? arr[i + 1].openTime)
    : time + 60_000;
  return {
    openTime: time,
    open: Number(b.open ?? b.o),
    high: Number(b.high ?? b.h),
    low: Number(b.low ?? b.l),
    close: Number(b.close ?? b.c),
    volume: num(b.volume ?? b.v) ?? 0,
    closeTime: Number(b.closeTime ?? b.close_time ?? b.ct ?? (Number.isFinite(nextTime) ? nextTime - 1 : time)),
    quoteAssetVolume: num(b.quoteAssetVolume) ?? 0,
    numberOfTrades: num(b.numberOfTrades) ?? 0,
    takerBuyBaseAssetVolume: num(b.takerBuyBaseAssetVolume) ?? 0,
    takerBuyQuoteAssetVolume: num(b.takerBuyQuoteAssetVolume) ?? 0,
    ignore: b.ignore ?? 0,
  };
}

/**
 * THE SYMBOL FACTS a Pine script reads through `syminfo.*`.
 *
 * MEASURED (2026-09-29, PineTS 0.10.0): constructing `new PineTS(<raw array>, …)`
 * leaves `context.pine.syminfo` UNDEFINED — the engine only sets it from
 * `provider.getSymbolInfo()` (`n.pine.syminfo = this._syminfo`). A script that
 * reads `syminfo.ticker` therefore throws `TypeError: Cannot read properties of
 * undefined (reading 'ticker')` — which is exactly what the CANON v8 indicator
 * did on a raw array and stopped doing the moment a provider was supplied.
 * So the station ALWAYS wraps its bars in a provider.
 *
 * `mintick`/`pricescale` are DERIVED FROM THE DATA (the decimals actually
 * present in the feed), never invented — the canon script's `math.round_to_mintick`
 * and `precision` paths depend on them.
 */
function decimalsOf(v) {
  const s = String(v);
  const m = s.match(/\.(\d+)/);
  return m ? m[1].replace(/0+$/, '').length : 0;
}

function deriveTicks(raw) {
  let decimals = 0;
  for (let i = 0; i < Math.min(raw.length, 200); i++) {
    const b = raw[i];
    decimals = Math.max(decimals, decimalsOf(b.close ?? b.c ?? 0), decimalsOf(b.low ?? b.l ?? 0));
  }
  const pricescale = 10 ** decimals;
  return { decimals, pricescale, mintick: 1 / pricescale };
}

/** A minimal IProvider over an in-memory bar set — see the note above. */
export function makeProvider({ bars, symbol = 'EUR/USD', mintick = 0.00001, pricescale = 100000 }) {
  const ticker = String(symbol).includes(':') ? String(symbol).split(':').pop() : String(symbol);
  return {
    async getMarketData() { return bars; },
    async getSymbolInfo(tickerId) {
      return {
        current_contract: '', description: String(symbol), isin: '',
        main_tickerid: String(tickerId || symbol), prefix: '', root: ticker,
        ticker, tickerid: String(tickerId || symbol), type: 'forex',
        basecurrency: '', country: '', currency: 'USD', timezone: 'UTC',
        employees: 0, industry: '', sector: '', shareholders: 0,
        shares_outstanding_float: 0, shares_outstanding_total: 0,
        expiration_date: 0, session: '24x7', volumetype: '',
        mincontract: 0, minmove: 0, mintick, pointvalue: 1, pricescale,
        recommendations_buy: 0, recommendations_buy_strong: 0, recommendations_date: 0,
        recommendations_hold: 0, recommendations_sell: 0, recommendations_sell_strong: 0,
        recommendations_total: 0, target_price_average: 0, target_price_date: 0,
        target_price_estimates: 0, target_price_high: 0, target_price_low: 0, target_price_median: 0,
      };
    },
  };
}

function assertUsable(bars, source, min = 2) {
  if (!Array.isArray(bars) || bars.length < min) {
    throw Object.assign(
      new Error(`bars unusable from ${source}: ${Array.isArray(bars) ? bars.length : typeof bars} candles (need ≥${min})`),
      { code: 'PINE_BARS_ABSENT' },
    );
  }
  for (let i = 0; i < Math.min(bars.length, 8); i++) {
    const b = bars[i];
    if (!Number.isFinite(b.openTime) || !Number.isFinite(b.close)) {
      throw Object.assign(
        new Error(`bars unusable from ${source}: candle ${i} is not numeric (${JSON.stringify(bars[i]).slice(0, 120)})`),
        { code: 'PINE_BARS_MALFORMED' },
      );
    }
  }
  return bars;
}

/** Pull a candle array out of any accepted envelope. */
export function candlesFromDoc(doc, { pair, timeframe } = {}) {
  let raw;
  let label;
  if (Array.isArray(doc)) { raw = doc; label = 'array'; }
  else if (doc && Array.isArray(doc.cells)) {
    const cell = pair
      ? doc.cells.find((c) => c.pair === pair && (!timeframe || c.timeframe === timeframe))
      : null;
    if (!cell) {
      throw Object.assign(new Error(
        `no bars cell for pair=${pair} timeframe=${timeframe} (available: ${doc.cells.map((c) => `${c.pair} ${c.timeframe}`).join(', ')})`,
      ), { code: 'PINE_BARS_CELL_ABSENT' });
    }
    raw = cell.bars; label = `cell ${cell.pair} ${cell.timeframe}`;
  }
  else if (doc && Array.isArray(doc.bars)) { raw = doc.bars; label = 'bars'; }
  else if (doc && Array.isArray(doc.data)) { raw = doc.data; label = 'data'; }
  else if (doc && Array.isArray(doc.candles)) { raw = doc.candles; label = 'candles'; }
  else if (doc && Array.isArray(doc.klines)) { raw = doc.klines; label = 'klines'; }
  else {
    throw Object.assign(new Error(
      `dataFile has no candle array (keys: ${doc && typeof doc === 'object' ? Object.keys(doc).slice(0, 12).join(',') : typeof doc})`,
    ), { code: 'PINE_BARS_ABSENT' });
  }
  return { bars: raw.map(normalizeCandle), label, anchorMs: doc?.anchorMs ?? null, ticks: deriveTicks(raw) };
}

export function candlesFromInline(bars) {
  return { bars: assertUsable(bars.map(normalizeCandle), 'inline bars'), ticks: deriveTicks(bars), label: `inline ${bars.length}`, anchorMs: null };
}

export function barsFromFixture({ pair = 'EUR/USD', timeframe = '1H' } = {}) {
  const abs = resolveDataFile(DEFAULT_FIXTURE);
  const doc = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const out = candlesFromDoc(doc, { pair, timeframe });
  out.file = abs;
  return out;
}

/** The bar set for a /run or /bars request, honouring the documented precedence. */
export function resolveBars({ bars, dataFile, pair, timeframe } = {}) {
  if (Array.isArray(bars) && bars.length) {
    const out = candlesFromInline(bars);
    return { bars: out.bars, source: 'inline', label: out.label, anchorMs: null, ticks: out.ticks };
  }
  if (dataFile) {
    const abs = resolveDataFile(dataFile);
    const doc = JSON.parse(fs.readFileSync(abs, 'utf8'));
    const out = candlesFromDoc(doc, { pair, timeframe });
    return { bars: assertUsable(out.bars, abs), source: abs, label: out.label, anchorMs: out.anchorMs, ticks: out.ticks };
  }
  const out = barsFromFixture({ pair, timeframe });
  return { bars: assertUsable(out.bars, out.file), source: out.file, label: out.label, anchorMs: out.anchorMs, ticks: out.ticks };
}

/** Every pair/timeframe cell a fixture file carries — the chart's data picker. */
export function cellsOf(file) {
  const abs = resolveDataFile(file || DEFAULT_FIXTURE);
  const doc = JSON.parse(fs.readFileSync(abs, 'utf8'));
  if (!Array.isArray(doc.cells)) return { file: abs, cells: [], anchorMs: doc.anchorMs ?? null };
  return {
    file: abs,
    anchorMs: doc.anchorMs ?? null,
    anchorLabel: doc.anchorLabel ?? null,
    provenance: doc.provenance ?? null,
    cells: doc.cells.map((c) => ({
      pair: c.pair, timeframe: c.timeframe, symbol: c.symbol, exchange: c.exchange, bars: (c.bars || []).length,
    })),
  };
}

export { DEFAULT_FIXTURE, LIVE_ROOT };
