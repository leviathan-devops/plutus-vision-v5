// checkCandlePressure.ts — P3.TURN-02 gate. Deterministic Bar fixtures (test data, not market evidence).
import type { Bar } from '../src/bars';
import { classifyTouch, type OrganZone } from '../src/organs/candlePressure';

let fail = 0;
const CUTOFF = 1_000_000;
const T = (n: number): Bar => ({ time: n, open: 0, high: 0, low: 0, close: 0 });
const B = (time: number, o: number, h: number, l: number, c: number): Bar => ({ time, open: o, high: h, low: l, close: c });
const UNIT = 1;

const zone: OrganZone = { lo: 100, hi: 100.1, side: 'demand' }; // 10-pip demand band, DXY unit

// SWEEP: from above, wick 3 pips through lo, body reclaims back inside.
{
  const before = B(1, 100.3, 100.35, 100.25, 100.3);
  const test = B(2, 100.3, 100.32, 99.97, 100.05);
  const after = B(3, 100.05, 100.1, 100.0, 100.06);
  const e = classifyTouch(zone, before, test, after, [before, test], UNIT, CUTOFF);
  if (e.kind === 'SWEEP' && e.test_bar_id === 2 && !e.gap_through && e.reclaim && e.pre_side === 'above') console.log('TOUCH_SWEEP_OK');
  else { console.log(`TOUCH_SWEEP_FAIL kind=${e.kind} reclaim=${e.reclaim} pre=${e.pre_side}`); fail = 1; }
}
// WICK_REJECT: wick enters, body stays above hi, bullish close holds.
{
  const before = B(11, 100.3, 100.35, 100.25, 100.3);
  const test = B(12, 100.32, 100.34, 100.05, 100.3);
  const after = B(13, 100.3, 100.35, 100.2, 100.28);
  const e = classifyTouch(zone, before, test, after, [before, test], UNIT, CUTOFF);
  if (e.kind === 'WICK_REJECT' && e.time === 12 && e.pre_side === 'above') console.log('TOUCH_WICK_REJECT_OK');
  else { console.log(`TOUCH_WICK_REJECT_FAIL kind=${e.kind}`); fail = 1; }
}
// BODY_DEFEND: body sits in the band, next bar turns up off hi.
{
  const before = B(21, 100.3, 100.32, 100.25, 100.28);
  const test = B(22, 100.28, 100.3, 100.02, 100.05);
  const after = B(23, 100.05, 100.3, 100.04, 100.25);
  const e = classifyTouch(zone, before, test, after, [before, test], UNIT, CUTOFF);
  if (e.kind === 'BODY_DEFEND' && e.exit_bar_id === 23) console.log('TOUCH_BODY_DEFEND_OK');
  else { console.log(`TOUCH_BODY_DEFEND_FAIL kind=${e.kind} exit=${e.exit_bar_id}`); fail = 1; }
}
// PASS_THROUGH: body closes through the defended edge (demand close < lo) — audit-only pierce, never a battle.
{
  const before = B(31, 100.3, 100.32, 100.25, 100.28);
  const test = B(32, 100.08, 100.12, 99.9, 99.95);
  const after = B(33, 99.95, 100.0, 99.9, 99.93);
  const e = classifyTouch(zone, before, test, after, [before, test], UNIT, CUTOFF);
  if (e.kind === 'PASS_THROUGH' && e.pierce && !e.gap_through) console.log('TOUCH_PASS_THROUGH_AUDIT_ONLY');
  else { console.log(`TOUCH_PASS_THROUGH_FAIL kind=${e.kind} pierce=${e.pierce} gap=${e.gap_through}`); fail = 1; }
}
// ADVERSARIAL: a post-cutoff test bar fires E1_ORGAN_INPUT_POST_CUTOFF (never classified).
{
  const before = B(41, 100.3, 100.35, 100.25, 100.3);
  const test = B(CUTOFF + 5, 100.3, 100.32, 99.97, 100.05);
  const after = B(CUTOFF + 6, 100.05, 100.1, 100.0, 100.06);
  try {
    classifyTouch(zone, before, test, after, [before, test], UNIT, CUTOFF);
    console.log('TOUCH_POST_CUTOFF_FAIL no refusal thrown');
    fail = 1;
  } catch (e) {
    if ((e as Error).message.startsWith('E1_ORGAN_INPUT_POST_CUTOFF')) console.log('TOUCH_POST_CUTOFF_REJECTED');
    else { console.log(`TOUCH_POST_CUTOFF_FAIL wrong error: ${(e as Error).message}`); fail = 1; }
  }
}
// Field contract: every event carries all nine fields.
{
  void T;
  const e = classifyTouch(zone, B(51, 100.3, 100.35, 100.25, 100.3), B(52, 100.32, 100.34, 100.05, 100.3), B(53, 100.3, 100.35, 100.2, 100.28), [], UNIT, CUTOFF);
  const keys = ['time', 'kind', 'pre_side', 'test_bar_id', 'exit_bar_id', 'pierce', 'reclaim', 'gap_through'];
  if (keys.every((k) => k in e)) console.log('TOUCH_FIELDS_OK');
  else { console.log('TOUCH_FIELDS_FAIL'); fail = 1; }
}
process.exit(fail);
