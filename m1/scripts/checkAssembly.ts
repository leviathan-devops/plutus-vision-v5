// checkAssembly.ts - P2.TURN-07 gate. Assembly invariants: score bounds (dims 0..2, bonus <= 2,
// total <= 14), the degree map thresholds, the 0.15-band cluster rule, the reaction-state map,
// and ZFP derived from strength/type only - never from zone width.
import { assemble, degreeOf, DEGREES, type AssembleIn } from '../src/assemble';
import type { Level } from '../src/levels';
import type { Bar, Ohlc } from '../src/bars';

const UNIT = 1.0;
const H = 3_600_000, DAY = 86_400_000;
const cutoff = Date.UTC(2026, 6, 6, 8);
const regime = { state: 'consolidation' as const, direction: 'flat' as const, basis: 'probe', ema200Cross: false };
const mkLevel = (kind: Level['kind'], pillar: Level['pillar'], price: number, id: string, formedAt?: number): Level =>
  ({ id, pillar, kind, price, label: id, formedAt: formedAt ?? cutoff - 20 * DAY, source: ['probe'] });
const baseInput = (levels: Level[], preBars: Bar[]): AssembleIn => ({
  levels, sd: [], spot: 100.00, cutoff, regime, preBars, priorDayCloses: [], optionExpiryTimes: {}, arena: { lo: 99.5, hi: 100.5 }, unit: UNIT,
});
// ---- SCORE_BOUNDS + DEGREE_MAP on a deterministic cluster ----
// A technical pivot + a nearby different-pillar technical + a structural swing + a prior close,
// all within 3 pips of 100.50, plus a far single pivot at 101.20.
const cluster: Level[] = [
  mkLevel('pivot', 'P1', 100.50, 'P1|W|classic|PP'),
  mkLevel('fib', 'P6', 100.503, 'P6|fib|leg|0.5'),
  mkLevel('swing-low', 'P5', 100.498, 'P5|swing|low|d1'),
  mkLevel('prior-close', 'P5', 100.502, 'P5|close|d1'),
  mkLevel('pivot', 'P1', 101.20, 'P1|W|classic|R1'),
];
const out = assemble(baseInput(cluster, []));
for (const l of out.scored) {
  const dims = Object.values(l.dims);
  if (dims.some(d => d < 0 || d > 2)) throw new Error(`SCORE_BOUNDS_FAIL: ${l.id} dims ${JSON.stringify(l.dims)}`);
  if (l.bonus < 0 || l.bonus > 2) throw new Error(`SCORE_BOUNDS_FAIL: bonus ${l.bonus}`);
  if (l.total > 14 || l.total < 0) throw new Error(`SCORE_BOUNDS_FAIL: total ${l.total}`);
  if (l.total !== Math.min(14, l.base + l.bonus + (l.legacy ? 0.5 : 0))) throw new Error(`SCORE_BOUNDS_FAIL: total formula ${l.id}`);
}
for (const z of out.zones) if (z.score > 14 || ![...DEGREES.map(([, d]) => d)].includes(z.degree)) throw new Error(`SCORE_BOUNDS_FAIL: zone ${z.id}`);
console.log(`SCORE_BOUNDS_OK ${out.scored.length} levels, ${out.zones.length} zones: dims 0..2, bonus <=2, total <=14`);
// Degree map: exact thresholds.
const expect: [number, string][] = [[14, 'EXTREME'], [12, 'EXTREME'], [11.99, 'HEAVY'], [10, 'HEAVY'], [9.99, 'MODERATE-HEAVY'], [8, 'MODERATE-HEAVY'], [7.99, 'MODERATE'], [6, 'MODERATE'], [5.99, 'LIGHT'], [4, 'LIGHT'], [3.99, 'MINIMAL'], [0, 'MINIMAL']];
for (const [s, d] of expect) if (degreeOf(s) !== d) throw new Error(`DEGREE_MAP_FAIL: degreeOf(${s}) = ${degreeOf(s)} != ${d}`);
for (const z of out.zones) if (z.degree !== degreeOf(z.score)) throw new Error(`DEGREE_MAP_FAIL: zone degree inconsistent`);
console.log('DEGREE_MAP_OK thresholds 12/10/8/6/4/0 verified at both boundaries');
// ---- CLUSTER_15_PIP ----
// The 100.50 cluster is one zone; 101.20 (> 0.15 away) is its own zone.
const near = out.zones.filter(z => z.lo <= 100.51 && z.hi >= 100.49);
if (near.length !== 1 || near[0].members.length !== 4) throw new Error(`CLUSTER_FAIL: expected one 4-member zone at 100.50, got ${JSON.stringify(out.zones.map(z => [z.lo, z.hi, z.members.length]))}`);
const far20 = out.zones.filter(z => z.lo >= 101.19);
if (far20.length !== 1 || far20[0].members.length !== 1) throw new Error('CLUSTER_FAIL: the 101.20 level must stand alone (> 0.15 from the cluster)');
if (near[0].hi - near[0].lo > 0.15 * UNIT + 1e-9) throw new Error('CLUSTER_FAIL: zone wider than the 0.15 band');
console.log(`CLUSTER_15_PIP_OK 4 levels within 0.15 -> one zone; 101.20 stands alone`);
// ---- REACTION_STATE ----
// preBars touching the 100.50 zone: craft 0, 1 and 3 qualifying reactions via enter-and-leave-same-side >= 0.15.
const mkBars = (touches: number): Bar[] => {
  const bars: Bar[] = []; let t = cutoff - 15 * DAY; const zLo = 100.49, zHi = 100.51;
  bars.push({ time: t, open: 100.80, high: 100.81, low: 100.79, close: 100.80 });   // start above
  for (let i = 0; i < touches; i++) {
    t += 6 * H; bars.push({ time: t, open: 100.70, high: 100.71, low: 100.50, close: 100.65 }); // wick INTO the zone (touches)
    t += 6 * H; bars.push({ time: t, open: 100.70, high: 100.71, low: 100.69, close: 100.70 }); // leave back above (strong: 0.19 above)
  }
  t += 6 * H; bars.push({ time: t, open: 100.72, high: 100.73, low: 100.71, close: 100.72 });
  return bars;
};
const stateFor = (n: number) => { const r = assemble(baseInput(cluster, mkBars(n))).zones.find(z => z.hi >= 100.49 && z.lo <= 100.51)!; return r.reactionsPreCutoff; };
if (stateFor(0) !== 0) throw new Error(`REACTION_FAIL: 0-touch run counted ${stateFor(0)}`);
if (stateFor(1) !== 1) throw new Error(`REACTION_FAIL: 1-touch run counted ${stateFor(1)}`);
if (stateFor(3) !== 3) throw new Error(`REACTION_FAIL: 3-touch run counted ${stateFor(3)}`);
const states = [0, 1, 3].map(n => { const r = assemble(baseInput(cluster, mkBars(n))).zones.find(z => z.hi >= 100.49 && z.lo <= 100.51)!; return r.reactionState; });
if (!(states[0] === 'Virgin' && states[1] === 'Active' && states[2] === 'Depleted')) throw new Error(`REACTION_FAIL: states ${states}`);
console.log(`REACTION_STATE_OK 0->Virgin 1->Active 3->Depleted (counts ${[0, 1, 3].map(stateFor).join(',')})`);
// ---- ZFP_NO_WIDTH ----
// Two zones of identical strength/type but different width must carry the same zfpBase: the ZFP
// table keys on zone type (pillars/tiers), never geometry.
const narrow = assemble(baseInput([
  mkLevel('pivot', 'P1', 100.50, 'P1|a|PP'), mkLevel('fib', 'P6', 100.502, 'P6|b|0.5'),
  mkLevel('pivot', 'P1', 102.50, 'P1|c|R3'), mkLevel('fib', 'P6', 102.510, 'P6|d|0.236'),   // same pillars, 5x wider spread
], [])).zones;
const zA = narrow.find(z => z.hi < 101)!; const zB = narrow.find(z => z.lo > 102)!;
if (zA.zoneType !== zB.zoneType) throw new Error(`ZFP_NO_WIDTH_FAIL: types diverged (${zA.zoneType} vs ${zB.zoneType}) - fixture must be same-type`);
if (zA.zfpBase !== zB.zfpBase) throw new Error(`ZFP_NO_WIDTH_FAIL: zfpBase ${zA.zfpBase} != ${zB.zfpBase} at widths ${(zA.hi - zA.lo).toFixed(3)} vs ${(zB.hi - zB.lo).toFixed(3)}`);
if (zA.zfp !== zB.zfp) throw new Error(`ZFP_NO_WIDTH_FAIL: zfp differs by width`);
console.log(`ZFP_NO_WIDTH_OK same-strength zones zfp=${zA.zfp} at widths ${(zA.hi - zA.lo).toFixed(3)} and ${(zB.hi - zB.lo).toFixed(3)}`);
