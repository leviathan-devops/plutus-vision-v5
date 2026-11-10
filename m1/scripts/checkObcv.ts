// checkObcv.ts — P3.TURN-04 gate. Deterministic impulse fixtures per lane.
import type { Bar } from '../src/bars';
import { detectObcvCandidates, DISPLACEMENT_FLOOR, type ObcvTf } from '../src/organs/obcv';

let fail = 0;
const UNIT = 1; // DXY: pip = 0.01
const CUTOFF = 100_000_000;

// Build a lane: quiet chop, then an origin candle, then a big impulse bar with
// 1.5x+ body, a forward close-range spanning `spanPips`, and follow-through
// closes beyond the prior extreme. Times ascend; cutoff far above.
function lane(spanPips: number, bodyPips: number, seed: number): Bar[] {
  const bars: Bar[] = [];
  let t = seed;
  for (let i = 0; i < 30; i++) { const px = 100 + i * 0.001; bars.push({ time: t++, open: px, high: px + 0.005, low: px - 0.005, close: px + 0.001 }); }
  const oLo = 100.05;
  const origin: Bar = { time: t++, open: oLo, high: oLo + 0.06, low: oLo, close: oLo + 0.055 }; // full-body origin (BoM shape)
  bars.push(origin);
  const body = bodyPips * 0.01;
  const impLo = oLo + 0.055;
  bars.push({ time: t++, open: impLo, high: impLo + body + 0.01, low: impLo - 0.005, close: impLo + body });
  // Forward drift: closes climb the full span so displacement floor clears.
  const span = spanPips * 0.01;
  for (let i = 1; i <= 10; i++) { const c = impLo + body + (span * i) / 10; bars.push({ time: t++, open: c - 0.005, high: c + 0.005, low: c - 0.01, close: c }); }
  return bars;
}

const tfOf: ObcvTf[] = ['4H', '1H', '30m'];
for (const tf of tfOf) {
  const floor = DISPLACEMENT_FLOOR[tf];
  const out = detectObcvCandidates({ [tf]: lane(floor + 10, 3, tf === '4H' ? 1000 : tf === '1H' ? 2000 : 3000) }, UNIT, CUTOFF);
  const token = tf === '4H' ? 'OBCV_4H_FLOOR_50' : tf === '1H' ? 'OBCV_1H_FLOOR_30' : 'OBCV_30M_FLOOR_20';
  const hit = out.candidates.find((c) => c.tf === tf && c.displacementPips >= floor);
  if (hit) console.log(`${token} disp=${hit.displacementPips} class=${hit.classification}`);
  else { console.log(`${token}_FAIL candidates=${out.candidates.length}`); fail = 1; }
}
// Absent 30m lane records the named token (not a throw — degradation doctrine).
{
  const out = detectObcvCandidates({ '4H': lane(60, 3, 5000), '1H': lane(40, 3, 6000) }, UNIT, CUTOFF);
  if (out.audit.includes('E1_OBCV_30M_DATA_MISSING')) console.log('OBCV_30M_MISSING_NAMED');
  else { console.log(`OBCV_30M_MISSING_FAIL audit=[${out.audit.join(';')}]`); fail = 1; }
}
// ADVERSARIAL: post-cutoff bar throws E1_ORGAN_INPUT_POST_CUTOFF.
{
  const bars = lane(60, 3, 7000);
  bars.push({ time: CUTOFF + 1, open: 100, high: 100.05, low: 99.95, close: 100.01 });
  try {
    detectObcvCandidates({ '4H': bars }, UNIT, CUTOFF);
    console.log('OBCV_POST_CUTOFF_FAIL no refusal thrown');
    fail = 1;
  } catch (e) {
    if ((e as Error).message.startsWith('E1_ORGAN_INPUT_POST_CUTOFF')) console.log('OBCV_POST_CUTOFF_REJECTED');
    else { console.log(`OBCV_POST_CUTOFF_FAIL wrong error: ${(e as Error).message}`); fail = 1; }
  }
}
process.exit(fail);
