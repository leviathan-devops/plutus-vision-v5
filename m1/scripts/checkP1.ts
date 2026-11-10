// checkP1.ts - P2.TURN-02 gate. Variable multi-set pivot output: formula verification on a
// deterministic OHLC, ordering sanity, set accounting (every source x variant recorded), and
// no spot-distance filter (a level arbitrarily far from spot survives). Adversarial: malformed
// OHLC refuses before any level is emitted.
import { pivotSet, pillar1, overlappingWeeks } from '../src/p1';
import type { Ohlc } from '../src/bars';

// Formula verification: classic PPs on a deterministic week (H=1.10 L=1.00 C=1.05 -> PP=1.05).
const w = pivotSet('W:probe', 'W', 'classic', 1.10, 1.00, 1.05);
const PP = 1.05, R = 0.10;
if (Math.abs(w.levels.PP - PP) > 1e-9) throw new Error(`P1_FORMULA_FAIL: PP ${w.levels.PP}`);
if (Math.abs(w.levels.R1 - (2 * PP - 1.00)) > 1e-9) throw new Error('P1_FORMULA_FAIL: R1');
if (Math.abs(w.levels.S1 - (2 * PP - 1.10)) > 1e-9) throw new Error('P1_FORMULA_FAIL: S1');
const fib = pivotSet('W:probe', 'W', 'fibonacci', 1.10, 1.00, 1.05);
if (Math.abs(fib.levels.R1 - (PP + 0.382 * R)) > 1e-9) throw new Error('P1_FORMULA_FAIL: fib R1');
const cam = pivotSet('W:probe', 'W', 'camarilla', 1.10, 1.00, 1.05);
if (Math.abs(cam.levels.R4 - (1.05 + R * 1.1 / 2)) > 1e-9) throw new Error('P1_FORMULA_FAIL: cam R4');
if (!Object.values(w.checks).every(Boolean) || !Object.values(fib.checks).every(Boolean) || !Object.values(cam.checks).every(Boolean))
  throw new Error('P1_FORMULA_FAIL: mandated verification checks reported FAIL');
console.log(`P1_FORMULA_OK classic/fib/camarilla verified, checks PASS (PP=${w.levels.PP}, fibR1=${fib.levels.R1.toFixed(5)}, camR4=${cam.levels.R4.toFixed(5)})`);
// Ordering: R2 > R1 > PP > S1 > S2 (classic) - range sanity the workflow mandates.
if (!(w.levels.R2 > w.levels.R1 && w.levels.R1 > w.levels.PP && w.levels.PP > w.levels.S1 && w.levels.S1 > w.levels.S2))
  throw new Error('P1_ORDER_FAIL: classic levels not ordered R2>R1>PP>S1>S2');
console.log('P1_ORDER_OK R2>R1>PP>S1>S2');
// Set accounting: one prior week + 3 days + 2 overlapping weeks -> (1+3+2) sources x 3 variants = 18 sets,
// every set carries its source and variant, every level traces to a set.
const mkW = (key: string, hi: number, lo: number, close: number): Ohlc => ({ key, from: 0, to: 0, open: close, high: hi, low: lo, close, bars: 10 });
const prior = mkW('2026-06-29', 1.10, 1.00, 1.05);
const days = [mkW('2026-06-29', 1.09, 1.01, 1.04), mkW('2026-06-30', 1.08, 1.00, 1.03), mkW('2026-07-01', 1.09, 1.02, 1.05)];
const historic = [mkW('2026-06-22', 1.11, 0.99, 1.04), mkW('2026-06-15', 1.09, 1.01, 1.06)];
const out = pillar1(prior, days, historic);
if (out.sets.length !== (1 + 3 + 2) * 3) throw new Error(`P1_SET_COUNT_FAIL: ${out.sets.length} sets, expected 18`);
if (!out.sets.every(s => s.source && s.variant)) throw new Error('P1_SET_COUNT_FAIL: a set lost its source/variant record');
const kinds = new Set(out.sets.map(s => `${s.source}|${s.variant}`));
if (kinds.size !== out.sets.length) throw new Error('P1_SET_COUNT_FAIL: duplicate set identity');
console.log(`P1_SET_COUNT_OK sources=6 variants=3 sets=${out.sets.length} levels=${out.levels.length}`);
// No spot filter: a level arbitrarily far from any spot survives. Levels at 1.29/0.81 (R3/S3 of R=0.10)
// must exist regardless of distance from any spot the caller might pass later.
if (!out.levels.some(l => Math.abs(l.price - w.levels.R3) < 1e-6) || !out.levels.some(l => Math.abs(l.price - w.levels.S3) < 1e-6))
  throw new Error('P1_NO_SPOT_FILTER_FAIL: extreme R3/S3 levels missing');
console.log('P1_NO_SPOT_FILTER levels preserved from R3 to S3 with no spot-distance cut');
// Adversarial: malformed OHLC refuses before any level exists.
try { pivotSet('W:bad', 'W', 'classic', 1.00, 1.10, 1.05); throw new Error('P1_OHLC_FAIL: high<low accepted'); }
catch (e) { if (!(e as Error).message.includes('P1_OHLC_MALFORMED')) throw e; }
try { pivotSet('W:bad', 'W', 'classic', NaN, 1.00, 1.05); throw new Error('P1_OHLC_FAIL: NaN accepted'); }
catch (e) { if (!(e as Error).message.includes('P1_OHLC_MALFORMED')) throw e; }
console.log('P1_OHLC_MALFORMED_REJECTED high<low and NaN both refused');
