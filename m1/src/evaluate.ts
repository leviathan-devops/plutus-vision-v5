// evaluate.ts - the golden-week outcome table for the repair loop (contract §8): for every card zone inside the week's
// traded range, what price DID during Mon-Fri versus what the card PREDICTED (strength-based ZFP). Mechanical, no model.
//  touched  : any 1H bar of the week intersects the zone (first touch time t0)
//  HELD     : after t0, price moved >= 0.15 away on the approach side before any 1H close beyond the far edge
//  BROKE    : a 1H close beyond the far edge first (break time recorded)
//  ZFP in force at t0 = card zfp + Spring Release (if t0 is after the driving option's expiry) + Cascade (if the
//  nearer same-side IP zone broke before t0) — the canon B.2 rules the card carries (m1/src/assemble.ts zfpRules)
//  predicted: ZFP in force <= 50 -> HOLD, > 50 -> BREAK (BREAKOUT RISK line, 5.3.3 :1504)
// The chart verdict stays the opened picture's and the operator's; this table only measures the card against the bars.
import { readFileSync } from 'node:fs';
import { loadBars } from './bars';
import { fsSource } from './fs-source';
import { readCard, type CardZone } from './card';
const ROOT = new URL('../../', import.meta.url).pathname;
const [asset = 'DXY', monday = '2026-07-06'] = process.argv.slice(2);
const { card } = readCard(readFileSync(`${ROOT}m1/out/e1-card-${asset}-${monday}.json`, 'utf8'));
const wk = await loadBars(fsSource(), asset, '1H', Date.parse(card.window.cutoff), Date.parse(card.window.end));
const hi = Math.max(...wk.map(b => b.high)), lo = Math.min(...wk.map(b => b.low));
const spot = card.spot_at_cutoff;
interface Row { z: CardZone; t0: number | null; outcome: string; brokeAt: number | null; zfpInForce: number; why: string[]; predicted: string; correct: boolean | null }
const inRange = card.zones.filter(z => !(z.hi < lo - 0.05 || z.lo > hi + 0.05));
// nearest to spot first, so a cascade source is resolved before the zone that depends on it
inRange.sort((a, b) => Math.min(Math.abs(a.lo - spot), Math.abs(a.hi - spot)) - Math.min(Math.abs(b.lo - spot), Math.abs(b.hi - spot)));
const done = new Map<string, Row>();
for (const z of inRange) {
  const i0 = wk.findIndex(b => b.low <= z.hi && b.high >= z.lo);
  let outcome = 'UNTESTED', brokeAt: number | null = null; const t0 = i0 >= 0 ? wk[i0].time : null;
  if (i0 >= 0) {
    const fromAbove = i0 > 0 ? wk[i0 - 1].low > z.hi : spot > z.hi;
    outcome = 'TOUCHED';
    for (const b of wk.slice(i0)) {
      if (fromAbove ? b.close < z.lo : b.close > z.hi) { outcome = 'BROKE'; brokeAt = b.time; break; }
      if (fromAbove ? b.high - z.hi >= 0.15 : z.lo - b.low >= 0.15) { outcome = 'HELD'; break; }
    }
  }
  let zfp = z.zfp; const why = [`card ${z.zfp}`];
  const r = z.zfpRules;
  if (t0 !== null && r.springReleaseAt !== null && t0 >= r.springReleaseAt) { zfp += r.springRelease; why.push(`+${r.springRelease} Spring Release (expired ${new Date(r.springReleaseAt).toISOString().slice(5, 16)})`); }
  const src = r.cascadeAfter ? done.get(r.cascadeAfter) : undefined;
  if (t0 !== null && src?.brokeAt != null && src.brokeAt <= t0) { zfp += r.cascade; why.push(`+${r.cascade} Cascade (${r.cascadeAfter} broke)`); }
  zfp = Math.min(99, zfp);
  const predicted = zfp > 50 ? 'BREAK' : 'HOLD';
  const correct = outcome === 'HELD' || outcome === 'BROKE' ? (predicted === 'HOLD') === (outcome === 'HELD') : null;
  done.set(z.id, { z, t0, outcome, brokeAt, zfpInForce: zfp, why, predicted, correct });
}
const rows = [...done.values()].sort((a, b) => b.z.hi - a.z.hi);
const judged = rows.filter(r => r.correct !== null);
console.log(`week ${monday} range ${lo}-${hi} | zones in range ${rows.length} | tested ${judged.length} | correct ${judged.filter(r => r.correct).length} (${judged.length ? (100 * judged.filter(r => r.correct).length / judged.length).toFixed(1) : '-'}%)`);
for (const r of rows) console.log(`${r.z.id.padEnd(4)} ${r.z.lo.toFixed(3)}-${r.z.hi.toFixed(3)} ${r.z.role.padEnd(11)} ${r.z.degree.padEnd(14)} ${String(r.z.score).padEnd(4)} ZFP ${String(r.zfpInForce).padEnd(5)} pred ${r.predicted.padEnd(5)} -> ${r.outcome.padEnd(8)} ${r.correct === null ? '' : r.correct ? 'OK  ' : 'MISS'} ${r.t0 ? new Date(r.t0).toISOString().slice(5, 16) : ''} ${r.why.join(' ')}`);
