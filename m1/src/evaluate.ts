// evaluate.ts - the golden-week outcome table for the repair loop (contract §8): for every card zone inside the week's
// traded range, what price DID during Mon-Fri versus what the card PREDICTED (strength-based ZFP). Mechanical, no model.
//  touched  : any 1H bar of the week intersects the zone
//  HELD     : after the first touch, price moved >= 0.15 away on the approach side before any 1H close beyond the far edge
//  BROKE    : a 1H close beyond the far edge (resistance: above hi; support: below lo)
//  predicted: ZFP <= 50 -> HOLD, ZFP > 50 -> BREAK (Part 5.3.3 :1504 BREAKOUT RISK at ZFP > 50)
// The chart verdict stays the operator's and the opened capture's; this table only measures the card against the bars.
import { readFileSync } from 'node:fs';
import { loadBars } from './bars';
import { fsSource } from './fs-source';
const ROOT = new URL('../../', import.meta.url).pathname;
const [asset = 'DXY', monday = '2026-07-06'] = process.argv.slice(2);
const { card } = JSON.parse(readFileSync(`${ROOT}m1/out/e1-card-${asset}-${monday}.json`, 'utf8'));
const wk = await loadBars(fsSource(), asset, '1H', Date.parse(card.window.cutoff), Date.parse(card.window.end));
const hi = Math.max(...wk.map(b => b.high)), lo = Math.min(...wk.map(b => b.low));
const rows: any[] = [];
for (const z of card.zones) {
  if (z.hi < lo - 0.05 || z.lo > hi + 0.05) continue;
  const i0 = wk.findIndex(b => b.low <= z.hi && b.high >= z.lo);
  let outcome = 'UNTESTED';
  if (i0 >= 0) {
    const fromAbove = i0 > 0 ? wk[i0 - 1].low > z.hi : card.spot_at_cutoff > z.hi;
    outcome = 'TOUCHED';
    for (const b of wk.slice(i0)) {
      if (fromAbove ? b.close < z.lo : b.close > z.hi) { outcome = 'BROKE'; break; }
      if (fromAbove ? b.high - z.hi >= 0.15 : z.lo - b.low >= 0.15) { outcome = 'HELD'; break; }
    }
  }
  const predicted = z.zfp > 50 ? 'BREAK' : 'HOLD';
  rows.push({ id: z.id, lo: +z.lo.toFixed(3), hi: +z.hi.toFixed(3), role: z.role, degree: z.degree, score: z.score, zfp: z.zfp, predicted, outcome,
    correct: outcome === 'UNTESTED' || outcome === 'TOUCHED' ? null : (predicted === 'HOLD') === (outcome === 'HELD') });
}
const judged = rows.filter(r => r.correct !== null);
console.log(`week ${monday} range ${lo}-${hi} | zones in range ${rows.length} | tested ${judged.length} | correct ${judged.filter(r => r.correct).length} (${judged.length ? (100 * judged.filter(r => r.correct).length / judged.length).toFixed(1) : '-'}%)`);
for (const r of rows.sort((a, b) => b.hi - a.hi)) console.log(`${r.id.padEnd(4)} ${r.lo}-${r.hi} ${r.role.padEnd(11)} ${r.degree.padEnd(14)} ${String(r.score).padEnd(4)} ZFP ${String(r.zfp).padEnd(4)} pred ${r.predicted.padEnd(5)} -> ${r.outcome.padEnd(8)} ${r.correct === null ? '' : r.correct ? 'OK' : 'MISS'}`);
