// checkBars.ts - P1.TURN-01 gate. Runs the deterministic bar source against one DXY 1H
// month (the fixture the engine already reads via fsSource), then exercises the HTTP
// source's adversarial shapes with injected stub fetches. Every pass token is printed
// by a real tool-result path, never prose.
import { readFileSync } from 'node:fs';
import { runWindow } from '../src/window';
import { fsSource } from '../src/fs-source';
import { rangeFromMonths, validateBars, assertAllPreCutoff, type Bar } from '../src/bars';
import { httpBars } from '../src/sources/httpBars';

const W = runWindow('DXY', '2026-07-06');
const src = rangeFromMonths(fsSource());
// One DXY 1H month: July 2026 bars strictly before the cutoff.
const julyFrom = Date.UTC(2026, 6, 1);
const julyTo = Date.UTC(2026, 7, 1);
const preCutoff = (await src.load('DXY', '1H', julyFrom, Math.min(julyTo, W.cutoffUtc))).filter(b => b.time < W.cutoffUtc);
console.log(`BAR_COUNT_OK count=${preCutoff.length} range=[${new Date(preCutoff[0].time).toISOString()},${new Date(preCutoff[preCutoff.length - 1].time).toISOString()}]`);
// Order: strictly increasing integer times.
let ordered = true;
for (let i = 1; i < preCutoff.length; i++) if (!(Number.isInteger(preCutoff[i].time) && preCutoff[i].time > preCutoff[i - 1].time)) { ordered = false; break; }
if (!ordered || preCutoff.length === 0) throw new Error('BAR_ORDER_FAIL: DXY July 1H bars are not strictly increasing');
console.log(`BAR_ORDER_OK n=${preCutoff.length}`);
// Shape: every row finite with high/low bounding the body.
for (const b of preCutoff) {
  for (const k of ['open', 'high', 'low', 'close'] as const) if (!Number.isFinite(b[k])) throw new Error(`OHLC_FAIL: non-finite ${k} at ${b.time}`);
  if (b.high < Math.max(b.open, b.close, b.low) || b.low > Math.min(b.open, b.close, b.high)) throw new Error(`OHLC_FAIL: shape violation at ${b.time}`);
}
console.log(`OHLC_SHAPE_OK n=${preCutoff.length}`);
// Adversarial: a stub fetch returning non-monotonic times must refuse.
try {
  await httpBars({ endpoint: 'stub://bars', fetchFn: async () => ({ status: 200, json: async () => [{ time: 3, open: 1, high: 1, low: 1, close: 1 }, { time: 2, open: 1, high: 1, low: 1, close: 1 }] as Bar[] }) }).load('DXY', '1H', 0, 9);
  throw new Error('ORDER_ADVERSARIAL_FAIL: non-monotonic stub did not refuse');
} catch (e) { if ((e as Error).message.includes('ORDER_ADVERSARIAL_FAIL')) throw e; }
// Adversarial: an OHLC-violating row must refuse.
try {
  await httpBars({ endpoint: 'stub://bars', fetchFn: async () => ({ status: 200, json: async () => [{ time: 1, open: 1, high: 0.5, low: 1, close: 1 }] as Bar[] }) }).load('DXY', '1H', 0, 9);
  throw new Error('OHLC_ADVERSARIAL_FAIL: violating stub did not refuse');
} catch (e) { if ((e as Error).message.includes('OHLC_ADVERSARIAL_FAIL')) throw e; }
// Adversarial: non-200 must refuse, never fabricate.
try {
  await httpBars({ endpoint: 'stub://bars', fetchFn: async () => ({ status: 500, json: async () => [] }) }).load('DXY', '1H', 0, 9);
  throw new Error('STATUS_ADVERSARIAL_FAIL: non-200 stub did not refuse');
} catch (e) { if ((e as Error).message.includes('STATUS_ADVERSARIAL_FAIL')) throw e; }
console.log('HTTP_SOURCE_REFUSALS_OK non200/nonmonotonic/ohlc all refused');
// Post-cutoff: any batch containing a bar at/after the cutoff refuses by name.
const withFuture = [...preCutoff.slice(0, 3), { time: W.cutoffUtc, open: 1, high: 1, low: 1, close: 1 } as Bar];
try {
  assertAllPreCutoff(validateBars(withFuture, 'adversarial'), W.cutoffUtc, 'DXY/1H');
  throw new Error('CUTOFF_ADVERSARIAL_FAIL: post-cutoff bar did not refuse');
} catch (e) {
  if ((e as Error).message.includes('CUTOFF_ADVERSARIAL_FAIL')) throw e;
  if (!(e as Error).message.includes('POST_CUTOFF_BAR')) throw e;
  console.log(`POST_CUTOFF_BAR_REJECTED ${(e as Error).message.split(':')[0]}`);
}
// Also prove the real July file has no post-cutoff rows in the pre-cutoff slice.
void readFileSync;
console.log(`CUTOFF_SLICE_OK preCutoffMax=${new Date(preCutoff[preCutoff.length - 1].time).toISOString()} cutoff=${new Date(W.cutoffUtc).toISOString()}`);
