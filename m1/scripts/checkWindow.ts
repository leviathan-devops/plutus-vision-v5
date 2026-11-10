// checkWindow.ts - P2.TURN-01 gate. Deterministic run window: Monday identity, London cutoff,
// R36 two-week render span; a non-Monday week refuses with the named identity token.
import { runWindow } from '../src/window';

const W = runWindow('DXY', '2026-07-06');
// Monday identity: the week anchor is Monday 00:00 UTC.
const monday = new Date(W.openUtc + 2 * 3_600_000);
if (new Date(monday).toISOString().slice(0, 10) !== '2026-07-06' || new Date(monday).getUTCDay() !== 1)
  throw new Error(`WINDOW_MONDAY_FAIL: openUtc+2h is ${monday.toISOString()}`);
console.log(`WINDOW_MONDAY_OK week=${W.weekMonday} open=${new Date(W.openUtc).toISOString()} end=${new Date(W.endUtc).toISOString()}`);
// Cutoff: Monday 09:00 Europe/London. July = BST (UTC+1), so 08:00 UTC; verify via the same zone math.
const cutoff = new Date(W.cutoffUtc);
if (cutoff.toISOString() !== '2026-07-06T08:00:00.000Z')
  throw new Error(`WINDOW_CUTOFF_FAIL: cutoff is ${cutoff.toISOString()}, expected 2026-07-06T08:00:00.000Z (09:00 London BST)`);
// DST control: a January week must cut off at 09:00 UTC (GMT).
const jan = runWindow('DXY', '2026-01-05');
if (new Date(jan.cutoffUtc).toISOString() !== '2026-01-05T09:00:00.000Z')
  throw new Error(`WINDOW_CUTOFF_DST_FAIL: January cutoff is ${new Date(jan.cutoffUtc).toISOString()}, expected 09:00Z GMT`);
console.log(`WINDOW_CUTOFF_OK jul=${cutoff.toISOString()} jan=${new Date(jan.cutoffUtc).toISOString()} (DST table verified both seasons)`);
// R36: render_from = Monday - 7 days; render_to = Friday 21:00 UTC (no right extension).
if (W.renderFromUtc !== Date.UTC(2026, 5, 29)) throw new Error(`WINDOW_R36_FAIL: renderFrom ${new Date(W.renderFromUtc).toISOString()} != 2026-06-29`);
if (W.renderToUtc !== W.endUtc) throw new Error(`WINDOW_R36_FAIL: renderTo != endUtc (Friday 21:00)`);
const janR = runWindow('DXY', '2026-01-05');
if (janR.renderToUtc !== janR.endUtc) throw new Error('WINDOW_R36_FAIL (jan): renderTo != endUtc');
console.log(`WINDOW_R36_OK renderFrom=${new Date(W.renderFromUtc).toISOString()} renderTo=${new Date(W.renderToUtc).toISOString()} spanDays=12`);
// Adversarial: a non-Monday week refuses with the identity token.
try {
  runWindow('DXY', '2026-07-07');
  throw new Error('WINDOW_NON_MONDAY_FAIL: Tuesday week was accepted');
} catch (e) {
  const msg = (e as Error).message;
  if (!msg.includes('E1_IDENTITY_INVALID') || !msg.includes('WINDOW_NON_MONDAY_REJECTED')) throw new Error(`WINDOW_NON_MONDAY_FAIL: ${msg}`);
  console.log('WINDOW_NON_MONDAY_REJECTED ' + msg.split('\n')[0]);
}
