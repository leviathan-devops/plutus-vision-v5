// bars.ts - TradingView OHLC as the single price source (R-23: TradingView, never Yahoo).
// M1 reads the bar evidence already on disk (the Pinebox TradingView store); the Worker build reads the
// same store through Pinebox's bar API. A missing month or symbol is a named refusal, never empty data.
import { sessionDate } from './window';
import { E1Refusal } from './refusals';

export interface Bar { time: number; open: number; high: number; low: number; close: number; volume?: number }
export interface Ohlc { key: string; from: number; to: number; open: number; high: number; low: number; close: number; bars: number }

export const SYMBOL: Record<string, string> = { DXY: 'TVC_DXY', EURUSD: 'FX_EURUSD', GBPUSD: 'FX_GBPUSD', USDJPY: 'FX_USDJPY' };

export interface BarSource { months(symbol: string, tf: string): Promise<string[]>; month(symbol: string, tf: string, ym: string): Promise<Bar[]> }

/** Load bars of [fromMs, toMs) for a symbol/timeframe; refuses by name when a needed month is absent. */
export async function loadBars(src: BarSource, asset: string, tf: string, fromMs: number, toMs: number): Promise<Bar[]> {
  const symbol = SYMBOL[asset];
  if (!symbol) throw new Error(`BARS_SYMBOL_UNKNOWN: ${asset}`);
  const have = new Set(await src.months(symbol, tf));
  const out = new Map<number, Bar>();
  for (let d = new Date(Date.UTC(new Date(fromMs).getUTCFullYear(), new Date(fromMs).getUTCMonth(), 1)); d.getTime() < toMs; d.setUTCMonth(d.getUTCMonth() + 1)) {
    const ym = d.toISOString().slice(0, 7);
    if (!have.has(ym)) throw new Error(`BARS_MONTH_ABSENT: no ${tf} bars for ${symbol} in ${ym} - the Pinebox TradingView store has no file for that month; fetch it (pinebox data fetch-latest) or run the engine for a week the store covers`);
    for (const b of await src.month(symbol, tf, ym)) if (b.time >= fromMs && b.time < toMs) out.set(b.time, b);
  }
  const bars = [...out.values()].sort((a, b) => a.time - b.time);
  if (!bars.length) throw new Error(`BARS_EMPTY: ${symbol}/${tf}`);
  return bars;
}

function agg(key: string, bs: Bar[]): Ohlc {
  return { key, from: bs[0].time, to: bs[bs.length - 1].time, open: bs[0].open, close: bs[bs.length - 1].close,
    high: Math.max(...bs.map(b => b.high)), low: Math.min(...bs.map(b => b.low)), bars: bs.length };
}

/** Trading-session days (17:00 NY roll). */
export function dailyBars(h1: Bar[]): Ohlc[] {
  const g = new Map<string, Bar[]>();
  for (const b of h1) { const k = sessionDate(b.time); (g.get(k) ?? g.set(k, []).get(k)!).push(b); }
  return [...g.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, bs]) => agg(k, bs));
}

/** Trading weeks keyed by their Monday session date. */
export function weeklyBars(days: Ohlc[]): Ohlc[] {
  const g = new Map<string, Ohlc[]>();
  for (const d of days) {
    const t = Date.parse(d.key + 'T00:00:00Z'); const dow = new Date(t).getUTCDay();
    const monday = new Date(t - ((dow + 6) % 7) * 86_400_000).toISOString().slice(0, 10);
    (g.get(monday) ?? g.set(monday, []).get(monday)!).push(d);
  }
  return [...g.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, ds]) => ({
    key: k, from: ds[0].from, to: ds[ds.length - 1].to, open: ds[0].open, close: ds[ds.length - 1].close,
    high: Math.max(...ds.map(d => d.high)), low: Math.min(...ds.map(d => d.low)), bars: ds.reduce((s, d) => s + d.bars, 0) }));
}
// ---- P1.TURN-01: deterministic range bar-source contract (BUILD_WORKFLOW P1.TURN-01) ----
// The pre-existing month-granularity BarSource (months/month, consumed by run.ts via loadBars)
// keeps its name. The workflow's load(asset, tf, from, to) contract lives here as RangeBarSource:
// filesystem behavior behind fsSource (m1/src/fs-source.ts), HTTP behavior behind
// httpBars (m1/src/sources/httpBars.ts). Both MUST return only real rows, never fabricated bars.
export type Asset = 'DXY' | 'EURUSD' | 'GBPUSD';
export type BarTf = '30m' | '1H' | '4H' | 'D1';
export interface RangeBarSource {
  load(asset: Asset, tf: BarTf, from: number, to: number): Promise<Bar[]>;
}

/** Validate one batch of bars: integer strictly-increasing times, finite OHLC, high/low shape. */
export function validateBars(bars: Bar[], what = 'bars'): Bar[] {
  if (!Array.isArray(bars)) throw new Error(`E1_BAR_SOURCE_FAILED: ${what} is not an array - the bar endpoint returned a non-array payload; fix the endpoint, never fabricate bars`);
  let prev = -Infinity;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    if (!b || !Number.isInteger(b?.time)) throw new Error(`E1_BAR_SOURCE_FAILED: ${what}[${i}].time is not an integer (${JSON.stringify(b?.time)}) - bar timestamps must be integer ms`);
    if (b.time <= prev) throw new Error(`E1_BAR_SOURCE_FAILED: non-monotonic timestamp at ${what}[${i}]: ${b.time} <= ${prev} - bar times must be strictly increasing`);
    prev = b.time;
    for (const k of ['open', 'high', 'low', 'close'] as const)
      if (typeof b[k] !== 'number' || !Number.isFinite(b[k])) throw new Error(`E1_BAR_SOURCE_FAILED: ${what}[${i}].${k} is not finite (${JSON.stringify(b[k])})`);
    if (b.high < Math.max(b.open, b.close, b.low)) throw new Error(`E1_BAR_SOURCE_FAILED: OHLC shape violation at ${what}[${i}]: high ${b.high} < max(open,close,low) ${Math.max(b.open, b.close, b.low)}`);
    if (b.low > Math.min(b.open, b.close, b.high)) throw new Error(`E1_BAR_SOURCE_FAILED: OHLC shape violation at ${what}[${i}]: low ${b.low} > min(open,close,high) ${Math.min(b.open, b.close, b.high)}`);
  }
  return bars;
}

/** Adapt the month-granularity BarSource (fsSource) to the range contract, validating every row. */
export function rangeFromMonths(src: BarSource): RangeBarSource {
  return { load: async (asset, tf, from, to) => validateBars(await loadBars(src, asset, tf, from, to), `${asset}/${tf} [${from},${to})`) };
}

/** Reject any bar at/after the information cutoff (Monday 09:00 London). Post-cutoff bars are
 *  test observations, never E1 inputs. Throws E1Refusal(E1_CUTOFF_VIOLATION); never filters silently. */
export function assertAllPreCutoff(bars: Bar[], cutoffMs: number, what = 'bars'): Bar[] {
  const bad = bars.find(b => b.time >= cutoffMs);
  if (bad) throw new E1Refusal('E1_CUTOFF_VIOLATION', `POST_CUTOFF_BAR: ${what} bar ${new Date(bad.time).toISOString()} >= cutoff ${new Date(cutoffMs).toISOString()} - future candles are test observations, never E1 inputs`);
  return bars;
}
