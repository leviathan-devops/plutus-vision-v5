// checkFreshness.ts — P3.TURN-06 gate. Deterministic touch runs (test data).
import type { Bar } from '../src/bars';
import { buildFreshness } from '../src/organs/freshness';
import type { OrganZone } from '../src/organs/candlePressure';

let fail = 0;
const UNIT = 1;
const CUTOFF = 500_000;
const zone: OrganZone = { lo: 100, hi: 100.1, side: 'demand' };
let t = 1000;
const B = (o: number, h: number, l: number, c: number): Bar => ({ time: t++, open: o, high: h, low: l, close: c });
const away = (n: number) => { const out: Bar[] = []; for (let i = 0; i < n; i++) out.push(B(101, 101.1, 100.9, 101)); return out; };
// One qualifying touch run: approach from above, sweep lo, reclaim, leave.
const touchRun = (): Bar[] => [
  B(100.3, 100.35, 100.25, 100.3),
  B(100.3, 100.32, 99.97, 100.05),
  B(100.05, 100.12, 100.0, 100.08),
  B(100.4, 100.45, 100.35, 100.4),
];

// 0/1/2/3 runs -> FRESH / TESTED_1X / TESTED_2X / DEPLETED.
{
  const states = [buildFreshness(zone, away(4), UNIT, CUTOFF).state];
  const runs: Bar[][] = [[...away(2), ...touchRun(), ...away(2)], [...away(2), ...touchRun(), ...away(2), ...touchRun(), ...away(2)], [...away(2), ...touchRun(), ...away(2), ...touchRun(), ...away(2), ...touchRun(), ...away(2)]];
  for (const r of runs) { t = 1000; states.push(buildFreshness(zone, r, UNIT, CUTOFF).state); }
  t = 1000;
  const want = ['FRESH', 'TESTED_1X', 'TESTED_2X', 'DEPLETED'];
  if (states.join(',') === want.join(',')) console.log(`FRESHNESS_STATE_MAP_OK ${states.join(',')}`);
  else { console.log(`FRESHNESS_STATE_MAP_FAIL got=${states.join(',')} want=${want.join(',')}`); fail = 1; }
}
// VIOLATED: a run that closes through lo pierces the zone.
{
  t = 2000;
  const bars = [...away(2), B(100.3, 100.32, 100.25, 100.28), B(100.08, 100.12, 99.9, 99.95), ...away(2)];
  const out = buildFreshness(zone, bars, UNIT, CUTOFF);
  if (out.state === 'VIOLATED' && out.pierced) console.log('FRESHNESS_VIOLATED_OK');
  else { console.log(`FRESHNESS_VIOLATED_FAIL state=${out.state} pierced=${out.pierced}`); fail = 1; }
}
// Gap-through bars never start events: a jump over the band keeps FRESH.
{
  t = 3000;
  const bars = [...away(2), B(100.3, 100.32, 100.28, 100.3), B(102, 102.1, 101.9, 102), B(100.3, 100.32, 100.28, 100.3), ...away(2)];
  const out = buildFreshness(zone, bars, UNIT, CUTOFF);
  if (out.state === 'FRESH' && out.events.length === 0) console.log('FRESHNESS_GAP_NOT_DEPLETED');
  else { console.log(`FRESHNESS_GAP_NOT_DEPLETED_FAIL state=${out.state} events=${out.events.length}`); fail = 1; }
}
// Event count: two separated runs -> exactly 2 events with derived reactionState.
{
  t = 4000;
  const bars = [...away(2), ...touchRun(), ...away(3), ...touchRun(), ...away(2)];
  const out = buildFreshness(zone, bars, UNIT, CUTOFF);
  if (out.events.length === 2 && out.reactionState === 'TESTED_2X') console.log('FRESHNESS_EVENT_COUNT_OK');
  else { console.log(`FRESHNESS_EVENT_COUNT_FAIL events=${out.events.length} reaction=${out.reactionState}`); fail = 1; }
}
process.exit(fail);
