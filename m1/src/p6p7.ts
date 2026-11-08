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
export function pillar6(priorWeek: Ohlc, swings: Swing[], d1Range: { lo: number; hi: number }): Level[] {
  const out: Level[] = [];
  const upWeek = priorWeek.close >= priorWeek.open;
  out.push(...fibLegs(`W:${priorWeek.key}`, priorWeek.high, priorWeek.low, `fib prior week ${priorWeek.key}`, `tv-bars W ${priorWeek.key}`, upWeek));
  const s = [...swings].sort((a, b) => a.t - b.t);
  const lastHi = [...s].reverse().find(x => x.side === 'high'), lastLo = [...s].reverse().find(x => x.side === 'low');
  if (lastHi && lastLo) {
    const up = lastHi.t > lastLo.t;
    out.push(...fibLegs(`swing:${lastLo.date}-${lastHi.date}`, lastHi.price, lastLo.price, `fib swing ${up ? lastLo.date + '->' + lastHi.date : lastHi.date + '->' + lastLo.date}`, `tv-bars D1 swings`, up));
  }
  for (let q = Math.ceil(d1Range.lo * 4) / 4; q <= d1Range.hi + 1e-9; q += 0.25) {
    const major = Math.abs((q * 2) - Math.round(q * 2)) < 1e-9;
    out.push({ id: `P6|round|${q.toFixed(2)}`, pillar: 'P6', kind: 'round', price: q, label: `${major ? 'big figure' : 'quarter'} ${q.toFixed(2)}`, source: ['arithmetic'], tags: [major ? 'MAJOR' : 'QUARTER'] });
  }
  return out;
}

export interface Arena { lo: number; hi: number; basis: string; ice: 'MISSING'; cme: 'MISSING' }
/** P7: the wide pressure arena. ICE/CME supplementary data are not acquired in M1 (recorded missing); the
 *  fallback is the 9-pillar primary mapping (:1432): the arena spans the outermost included option walls. */
export function pillar7(conv: Conversion[]): { arena: Arena | null; levels: Level[] } {
  const inc = conv.filter(c => c.tier <= 2 && c.pair === 'EURUSD');
  if (!inc.length) return { arena: null, levels: [] };
  const lo = Math.min(...inc.map(c => c.dxy)), hi = Math.max(...inc.map(c => c.dxy));
  const arena: Arena = { lo, hi, basis: 'fallback: outermost Tier 1-2 EUR/USD option walls (9-pillar primary mapping)', ice: 'MISSING', cme: 'MISSING' };
  return { arena, levels: [
    { id: 'P7|arena|lo', pillar: 'P7', kind: 'arena', price: lo, label: 'pressure arena floor', source: [arena.basis] },
    { id: 'P7|arena|hi', pillar: 'P7', kind: 'arena', price: hi, label: 'pressure arena ceiling', source: [arena.basis] } ] };
}
