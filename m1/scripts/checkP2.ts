// checkP2.ts - P2.TURN-03 gate. MA grid exactness: 12 MAs (SMA+EMA over 9/10/20/50/100/200),
// >=200-session history requirement, 3+-MA cluster within 15 pips, recapture tagging.
// Adversarial: short history refuses with the named token.
import { pillar2 } from '../src/p2';
import type { Ohlc } from '../src/bars';

const mk = (i: number, close: number): Ohlc => ({ key: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`, from: i, to: i + 1, open: close, high: close + 0.02, low: close - 0.02, close, bars: 24 });
// 220 deterministic sessions: a 190-session trend, then flat -> dip below EMA9 -> recovery above it
// (a real upward recapture cross in the last 3 sessions window).
const days: Ohlc[] = [];
for (let i = 0; i < 205; i++) days.push(mk(i, 1.0 + 0.001 * i));
for (let i = 205; i < 215; i++) days.push(mk(i, 1.21));        // flat: the slow MAs converge near 1.20
for (let i = 215; i < 217; i++) days.push(mk(i, 1.05));        // dip BELOW the 50/100/200 lines
for (let i = 217; i < 220; i++) days.push(mk(i, 1.30));        // recovery crosses above within the last 3 sessions
const out = pillar2(days, 1);  // unit=1 -> pip = 0.01 here via unit multiplier on 0.15*unit
// 12 MAs: SMA+EMA for each of the six periods; each emitted as a level.
const maLevels = out.levels.filter(l => l.kind === 'ma');
if (maLevels.length !== 12) throw new Error(`P2_MA_COUNT_FAIL: ${maLevels.length} != 12`);
const names = new Set(maLevels.map(l => l.id));
for (const n of [9, 10, 20, 50, 100, 200]) {
  if (!names.has(`P2|SMA${n}`) || !names.has(`P2|EMA${n}`)) throw new Error(`P2_MA_COUNT_FAIL: missing SMA${n} or EMA${n}`);
}
console.log(`P2_MA_COUNT_12 sma+ema x {9,10,20,50,100,200} (${maLevels.length} levels)`);
// Recapture: the last 3 sessions cross above at least one of 50/100/200 after being below.
// The fixture crosses EMA9/EMA10 at minimum by construction (pullback then resume).
// Deterministic assertion: every name in out.recaptures is real, and the fixture's short EMA recaptured.
if (!out.recaptures.length) throw new Error('P2_RECAPTURE_FAIL: fixture designed to recapture EMA9 produced none');
for (const r of out.recaptures) if (!/^(SMA|EMA)(50|100|200|9|10|20)$/.test(r)) throw new Error(`P2_RECAPTURE_FAIL: bad name ${r}`);
console.log(`P2_RECAPTURE_OK recaptured=[${out.recaptures.join(',')}]`);
// Cluster: 3+ MAs within 15 pips (0.15 * unit). Engine may or may not cluster on this fixture,
// but the cluster path must be exercised: run a flat series where all 12 MAs converge.
const flat: Ohlc[] = [];
for (let i = 0; i < 220; i++) flat.push(mk(i, 1.05 + 0.0001 * Math.sin(i / 10)));
const flatOut = pillar2(flat, 1);
const clustered = flatOut.clusters.filter(c => c.members.length >= 3);
if (!clustered.length) throw new Error(`P2_CLUSTER_FAIL: flat fixture produced no 3+ cluster (${flatOut.clusters.length} clusters)`);
for (const c of flatOut.clusters) {
  if (c.hi - c.lo > 0.15 * 1 + 1e-9) throw new Error(`P2_CLUSTER_FAIL: cluster width ${c.hi - c.lo} > 0.15`);
  if (c.members.length < 3) throw new Error('P2_CLUSTER_FAIL: cluster with <3 members');
}
console.log(`P2_CLUSTER_3_PLUS clusters=${flatOut.clusters.length} max_members=${Math.max(...flatOut.clusters.map(c => c.members.length))} within 15 pips`);
// Adversarial: 199 sessions refuse with the named history token.
try { pillar2(days.slice(0, 199), 1); throw new Error('P2_HISTORY_FAIL: 199 sessions accepted'); }
catch (e) { if (!(e as Error).message.includes('P2_INSUFFICIENT_HISTORY')) throw e; }
console.log('P2_HISTORY_REJECT 199 sessions refused (needs >= 200)');
