// checkObcvReconcile.ts — P3.TURN-05 gate. Fixture SdZone rows + OBCV candidates.
import type { SdZone } from '../src/p5';
import { reconcile } from '../src/organs/reconcile';
import type { ObcvCandidate } from '../src/organs/obcv';

let fail = 0;
const CUTOFF = 50_000_000;
const HOUR = 3_600_000;

const zone = (over: Partial<SdZone>): SdZone => ({
  tf: '1H', side: 'demand', lo: 100, hi: 100.2, t: 1000, date: '2026-07-06',
  move: 1, moveDays: 4, type: 'BoM', mitigations: 0, mitigationTimes: [],
  brokenAt: null, postConsolidation: false, ...over,
});
const cand = (over: Partial<ObcvCandidate>): ObcvCandidate => ({
  id: 'OB|1H|1000|100.00000', tf: '1H', side: 'demand', lo: 100, hi: 100.2,
  originTime: 1000, classification: 'BoM', displacementPips: 40, bodyMult: 2, ...over,
});

// AGREED: same side+TF, origin within one 1H bar, overlap 1.0.
{
  const out = reconcile([zone({})], [cand({})], CUTOFF);
  if (out.rows[0]?.class === 'AGREED' && (out.rows[0]?.overlap ?? 0) >= 0.5) console.log('OBCV_AGREED_OK');
  else { console.log(`OBCV_AGREED_FAIL ${JSON.stringify(out.rows)}`); fail = 1; }
}
// EDGE_CONFLICT: origin-equivalent but overlap 0.25 < 0.5 — no geometry replacement, no zone creation.
{
  const out = reconcile([zone({})], [cand({ id: 'OB|1H|1000|100.15000', lo: 100.15, hi: 100.35 })], CUTOFF);
  const row = out.rows[0];
  if (row?.class === 'EDGE_CONFLICT' && out.additionalLevels.length === 0) console.log('OBCV_EDGE_CONFLICT_OK');
  else { console.log(`OBCV_EDGE_CONFLICT_FAIL ${JSON.stringify(out.rows)} levels=${out.additionalLevels.length}`); fail = 1; }
}
// ADDITIONAL: far-away origin -> Level only (canonical assemble decides zones).
{
  const out = reconcile([zone({})], [cand({ id: 'OB|1H|9000|101.00000', lo: 101, hi: 101.1, originTime: 1000 + 3_600_000 + 1 })], CUTOFF);
  const row = out.rows[0];
  if (row?.class === 'OBCV_ADDITIONAL' && out.additionalLevels.length === 1 && out.additionalLevels[0]?.pillar === 'P5') {
    console.log('OBCV_ADDITIONAL_LEVEL_ONLY');
  } else { console.log(`OBCV_ADDITIONAL_FAIL ${JSON.stringify(out.rows)} levels=${out.additionalLevels.length}`); fail = 1; }
}
// ADVERSARIAL: a scored passthrough is rejected — post-cutoff origins refuse (never a canonical score).
{
  try {
    reconcile([zone({})], [cand({ originTime: CUTOFF + 10 })], CUTOFF);
    console.log('OBCV_NO_CANONICAL_SCORE_FAIL no refusal thrown');
    fail = 1;
  } catch (e) {
    if ((e as Error).message.startsWith('E1_ORGAN_INPUT_POST_CUTOFF')) console.log('OBCV_NO_CANONICAL_SCORE_REJECTED');
    else { console.log(`OBCV_NO_CANONICAL_SCORE_FAIL wrong error: ${(e as Error).message}`); fail = 1; }
  }
  void HOUR;
}
process.exit(fail);
