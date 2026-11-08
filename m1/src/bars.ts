// bars.ts - TradingView OHLC as the single price source (R-23: TradingView, never Yahoo).
// M1 reads the bar evidence already on disk (the Pinebox TradingView store); the Worker build reads the
// same store through Pinebox's bar API. A missing month or symbol is a named refusal, never empty data.
import { sessionDate } from './window';

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
    if (!have.has(ym)) throw new Error(`BARS_MONTH_ABSENT: ${symbol}/${tf}/${ym}`);
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
