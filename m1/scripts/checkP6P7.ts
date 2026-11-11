// checkP6P7.ts - P2.TURN-06 gate. Deterministic P6 grids (fib count, round quarter grid) and the
// P7 exchange-preference rule (exchange arena wins; option-wall fallback only when named missing).
import { pillar6, resolveP7, type Arena } from '../src/p6p7';
import { pillar7Exchange } from '../src/p7exchange';
import type { Ohlc } from '../src/bars';
import type { Swing } from '../src/p5';
import type { Conversion } from '../src/options';

const priorWeek: Ohlc = { key: '2026-06-29', from: 0, to: 1, open: 1.05, high: 1.10, low: 1.00, close: 1.08, bars: 120 };
const swings: Swing[] = [
  { price: 1.00, date: '2026-06-20', t: 0, wick: 0.01, side: 'low', qualified: true, legacy: false },
  { price: 1.10, date: '2026-06-26', t: 1, wick: 0.01, side: 'high', qualified: true, legacy: false },
];
const grid = pillar6(priorWeek, swings, { lo: 0.90, hi: 1.30 }, 0.0001);
// Fib count: prior-week leg + latest swing leg, 5 ratios each, no duplicates.
const fibs = grid.filter(l => l.kind === 'fib');
if (fibs.length !== 10) throw new Error(`P6_FIB_COUNT_FAIL: ${fibs.length} != 10`);
const ids = new Set(fibs.map(l => l.id)); if (ids.size !== fibs.length) throw new Error('P6_FIB_COUNT_FAIL: duplicate fib ids');
// Prior-week retracement values are exact: down week (close<open? close 1.08 > open 1.05 -> up week):
// upLeg: price = hi - r*(hi-lo); r=0.5 -> 1.05.
const half = fibs.find(l => l.id === 'P6|fib|W:2026-06-29|0.5')!;
if (Math.abs(half.price - 1.05) > 1e-9) throw new Error(`P6_FIB_COUNT_FAIL: 0.5 retracement ${half.price} != 1.05`);
console.log(`P6_FIB_COUNT_OK 2 legs x 5 ratios = 10 fib levels; W 0.5 retracement = ${half.price}`);
// Round grid: quarters every 25 pips from 0.90 to 1.30 (pip=0.0001 -> quarter 0.0025), majors at .00/.05 boundaries.
const rounds = grid.filter(l => l.kind === 'round');
const expectedQ = Math.floor((1.30 - 0.90) / 0.0025 + 1e-9) + 1;
if (Math.abs(rounds.length - expectedQ) > 1) throw new Error(`P6_ROUND_GRID_FAIL: ${rounds.length} quarters, expected ~${expectedQ}`);
for (const r of rounds) {
  const q = r.price / 0.0025;
  if (Math.abs(q - Math.round(q)) > 1e-6) throw new Error(`P6_ROUND_GRID_FAIL: ${r.price} not on the 25-pip grid`);
  const isMajor = Math.abs(r.price / 0.005 - Math.round(r.price / 0.005)) < 1e-6;
  if (isMajor !== r.tags!.includes('MAJOR')) throw new Error(`P6_ROUND_GRID_FAIL: major tagging wrong at ${r.price}`);
}
console.log(`P6_ROUND_GRID_OK ${rounds.length} quarters on the 25-pip grid, majors every 50 pips tagged`);
// P7 exchange preference: a configured ICE arena with >= $1.5bn walls wins over the fallback.
const ice = pillar7Exchange({ source: 'ICE', published_at: 0, walls: [
  { pair: 'EURUSD', price: 1.08, notional_usd: 2.0e9 }, { pair: 'EURUSD', price: 1.14, notional_usd: 1.6e9 },
] }, 'EURUSD', 1e12);
const conv: Conversion[] = [];
const resolved = resolveP7(ice, conv);
if (resolved.basis !== 'exchange' || resolved.arena.lo !== 1.08 || resolved.arena.hi !== 1.14)
  throw new Error(`P7_EXCHANGE_FAIL: ${JSON.stringify(resolved)}`);
console.log(`P7_EXCHANGE_PREFERRED ICE arena floor=${resolved.arena.lo} ceiling=${resolved.arena.hi} (fallback not consulted)`);
// Fallback: exchange named missing -> option-wall fallback, basis named, token carried.
const none = pillar7Exchange({ source: 'ICE', published_at: 0, walls: [{ pair: 'EURUSD', price: 1.08, notional_usd: 1.0e9 }] }, 'EURUSD', 1e12);
const fbConv: Conversion[] = [
  { pair: 'EURUSD', date: '2026-07-10', strike: 1.08, notional: 2e9, ccy: 'EUR', usd: 2.2e9, tier: 1, level: 1.08, band: 0.001, pillar: 'P8', audit: 'probe' },
  { pair: 'EURUSD', date: '2026-07-10', strike: 1.12, notional: 1e9, ccy: 'EUR', usd: 1.1e9, tier: 2, level: 1.12, band: 0.001, pillar: 'P8', audit: 'probe' },
];
const fb = resolveP7(none, fbConv);
if (fb.basis !== 'fallback' || fb.missingToken !== 'P7_NO_TIER1_WALL') throw new Error(`P7_FALLBACK_FAIL: ${JSON.stringify(fb)}`);
if (!fb.arena.basis.startsWith('fallback:')) throw new Error('P7_FALLBACK_FAIL: fallback basis unnamed');
console.log(`P7_FALLBACK_NAMED option-wall fallback floor=${fb.arena.lo} ceiling=${fb.arena.hi} token=${fb.missingToken}`);
// Post-cutoff exchange input refuses (cutoff law).
try { pillar7Exchange({ source: 'CME', published_at: 5, walls: [] }, 'EURUSD', 1); throw new Error('P7_CUTOFF_FAIL'); }
catch (e) { if (!(e as Error).message.includes('E1_CUTOFF_VIOLATION')) throw e; }
console.log('P7_AFTER_CUTOFF refused with E1_CUTOFF_VIOLATION');
