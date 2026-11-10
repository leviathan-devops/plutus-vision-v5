// checkLmv.ts — P3.TURN-03 gate. Deterministic synthetic swing fixture (test data).
import type { Bar } from '../src/bars';
import { buildLmvRungs } from '../src/organs/lmv';

let fail = 0;
const UNIT = 1;
const CUTOFF = 10_000_000;

// Fixture: three swing lows clustered within 2 pips, each followed by a distinct
// reaction shape (sweep / wick-reject / body-defend) so the cluster gates pass.
// Base grid: flat closes at 100.30; shelves dip to ~100.00 triple-bottom.
const bars: Bar[] = [];
let t = 1000;
const flat = (n: number, px: number) => { for (let i = 0; i < n; i++) bars.push({ time: t++, open: px, high: px + 0.01, low: px - 0.01, close: px }); };
// Three shelf probes: lows 100.00 / 100.015 / 100.005 (span 1.5 pips <= 4), each a strict local low.
for (let s = 0; s < 3; s++) {
  flat(6, 100.3);
  const dip = [100.0, 100.01, 99.995][s]!;
  bars.push({ time: t++, open: 100.3, high: 100.32, low: 100.29, close: 100.3 });
  if (s === 0) bars.push({ time: t++, open: 100.3, high: 100.33, low: dip - 0.05, close: 100.25 }); // deep wick probe (prior low taken, reclaimed)
  else if (s === 1) bars.push({ time: t++, open: 100.1, high: 100.34, low: dip - 0.03, close: 100.28 }); // deep wick-reject shape
  else bars.push({ time: t++, open: 99.99, high: 100.02, low: dip - 0.03, close: 99.96 }); // body-in-band -> next bar turns up (BODY_DEFEND)
  bars.push({ time: t++, open: 100.24, high: 100.35, low: 100.2, close: 100.3 }); // sharp turn off the shelf (no new swing low)
}
flat(10, 100.3);

const out = buildLmvRungs(bars, UNIT, CUTOFF);
if (out.rungs.length >= 1) console.log(`LMV_CLUSTER_OK rungs=${out.rungs.length}`);
else { console.log(`LMV_CLUSTER_FAIL rungs=${out.rungs.length}`); fail = 1; }
const rung = out.rungs[0];
if (rung && rung.reactions >= 3) console.log(`LMV_REACTION_3_OK reactions=${rung.reactions}`);
else { console.log(`LMV_REACTION_3_FAIL reactions=${rung?.reactions}`); fail = 1; }
if (rung && rung.kinds.length >= 2) console.log(`LMV_KIND_2_OK kinds=${rung.kinds.join(',')}`);
else { console.log(`LMV_KIND_2_FAIL kinds=${rung?.kinds.join(',')}`); fail = 1; }
if (rung && rung.defendedEdge > 0 && rung.center > 0) console.log(`LMV_DEFENDED_EDGE_OK center=${rung.center} edge=${rung.defendedEdge}`);
else { console.log('LMV_DEFENDED_EDGE_FAIL'); fail = 1; }
// Truncation: 30 bars < 720 must name the token with the available count.
const short = buildLmvRungs(bars.slice(0, 30), UNIT, CUTOFF);
if (short.audit.some((a) => a.startsWith('E1_LMV_LOOKBACK_TRUNCATED available=30'))) console.log('LMV_TRUNCATION_NAMED');
else { console.log(`LMV_TRUNCATION_FAIL audit=[${short.audit.join(';')}]`); fail = 1; }
// ADVERSARIAL: post-cutoff bar throws E1_ORGAN_INPUT_POST_CUTOFF.
try {
  buildLmvRungs([...bars, { time: CUTOFF + 1, open: 1, high: 1, low: 1, close: 1 }], UNIT, CUTOFF);
  console.log('LMV_POST_CUTOFF_FAIL no refusal thrown');
  fail = 1;
} catch (e) {
  if ((e as Error).message.startsWith('E1_ORGAN_INPUT_POST_CUTOFF')) console.log('LMV_POST_CUTOFF_REJECTED');
  else { console.log(`LMV_POST_CUTOFF_FAIL wrong error: ${(e as Error).message}`); fail = 1; }
}
process.exit(fail);
