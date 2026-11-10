// p6p7.ts - PILLAR 6 (Fibonacci + round-number grid, :1424-1426) and PILLAR 7 (derivatives arena, :1430-1432).
import type { Ohlc } from './bars';
import type { Level } from './levels';
import type { Swing } from './p5';
import type { Conversion } from './options';

const RATIOS = [0.236, 0.382, 0.5, 0.618, 0.786];

function fibLegs(id: string, hi: number, lo: number, label: string, src: string, upLeg: boolean): Level[] {
  // retracement levels measured from the leg's end back toward its start
  return RATIOS.map(r => { const price = upLeg ? hi - r * (hi - lo) : lo + r * (hi - lo);
    return { id: `P6|fib|${id}|${r}`, pillar: 'P6', kind: 'fib', price, label: `${label} ${r}`, source: [src], meta: { ratio: r, hi, lo } } as Level; });
}

/** P6: retracements of the prior-week range and of the latest completed D1 swing leg ("extended swing points"),
 *  plus every round number (.00/.50 major, .25/.75 quarter) inside the 90-day scanned range. No spot filter. */
export function pillar6(priorWeek: Ohlc, swings: Swing[], d1Range: { lo: number; hi: number }, pip: number): Level[] {
  const out: Level[] = [];
  const upWeek = priorWeek.close >= priorWeek.open;
  out.push(...fibLegs(`W:${priorWeek.key}`, priorWeek.high, priorWeek.low, `fib prior week ${priorWeek.key}`, `tv-bars W ${priorWeek.key}`, upWeek));
  const s = [...swings].sort((a, b) => a.t - b.t);
  const lastHi = [...s].reverse().find(x => x.side === 'high'), lastLo = [...s].reverse().find(x => x.side === 'low');
  if (lastHi && lastLo) {
    const up = lastHi.t > lastLo.t;
    out.push(...fibLegs(`swing:${lastLo.date}-${lastHi.date}`, lastHi.price, lastLo.price, `fib swing ${up ? lastLo.date + '->' + lastHi.date : lastHi.date + '->' + lastLo.date}`, `tv-bars D1 swings`, up));
  }
  const quarter = 25 * pip, dec = pip === 0.01 ? 2 : 4;                    // 25-pip quarters / 50-pip big figures on every asset
  for (let q = Math.ceil(d1Range.lo / quarter - 1e-9) * quarter; q <= d1Range.hi + 1e-9; q += quarter) {
    const major = Math.abs(q / (2 * quarter) - Math.round(q / (2 * quarter))) < 1e-9;
    out.push({ id: `P6|round|${q.toFixed(dec)}`, pillar: 'P6', kind: 'round', price: q, label: `${major ? 'big figure' : 'quarter'} ${q.toFixed(dec)}`, source: ['arithmetic'], tags: [major ? 'MAJOR' : 'QUARTER'] });
  }
  return out;
}

export interface Arena { lo: number; hi: number; basis: string; ice: 'MISSING'; cme: 'MISSING' }
/** P7: the wide pressure arena. ICE/CME supplementary data are not acquired in M1 (recorded missing); the
 *  fallback is the 9-pillar primary mapping (:1432): the arena spans the outermost included option walls. */
export function pillar7(conv: Conversion[]): { arena: Arena | null; levels: Level[] } {
  const inc = conv.filter(c => c.tier <= 2 && c.pair === 'EURUSD');
  if (!inc.length) return { arena: null, levels: [] };
  const lo = Math.min(...inc.map(c => c.level)), hi = Math.max(...inc.map(c => c.level));
  const arena: Arena = { lo, hi, basis: 'fallback: outermost Tier 1-2 EUR/USD option walls (9-pillar primary mapping)', ice: 'MISSING', cme: 'MISSING' };
  return { arena, levels: [
    { id: 'P7|arena|lo', pillar: 'P7', kind: 'arena', price: lo, label: 'pressure arena floor', source: [arena.basis] },
    { id: 'P7|arena|hi', pillar: 'P7', kind: 'arena', price: hi, label: 'pressure arena ceiling', source: [arena.basis] } ] };
}

/** P2.TURN-06: prefer the exchange arena; the option-wall fallback applies ONLY when the exchange
 *  source is named missing (P7_EXCHANGE_SOURCE_MISSING / P7_NO_TIER1_WALL). Never silent. */
import type { ExchangeArena } from './p7exchange';
export interface P7Resolved { arena: Arena; levels: Level[]; basis: 'exchange' | 'fallback'; missingToken: string | null }
export function resolveP7(
  exchange: { arena: ExchangeArena | null; levels: Level[]; missingToken: string | null },
  conv: Conversion[],
): P7Resolved {
  if (exchange.arena)
    return { arena: { lo: exchange.arena.floor, hi: exchange.arena.ceiling, basis: exchange.arena.basis, ice: 'MISSING', cme: 'MISSING' },
             levels: exchange.levels, basis: 'exchange', missingToken: null };
  const fb = pillar7(conv);
  if (!fb.arena) throw new Error('P7_NO_ARENA: neither exchange evidence nor fallback option walls produced an arena');
  return { arena: fb.arena, levels: fb.levels, basis: 'fallback', missingToken: exchange.missingToken ?? 'P7_EXCHANGE_SOURCE_MISSING' };
}
