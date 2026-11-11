// obcv.ts — P3 organ: OBCV order-block vision (obcv.ts donor semantics).
// Per lane (4H/1H/30m): rolling ATR(14) EXCLUDING the candidate bar; impulse =
// body>=1.5x mean prior-4 bodies AND body>=1.5x ATR AND forward close-range >= floor AND
// structural break; origin = candle immediately before impulse; BoM/MoM classifier with
// width gates; 30m is MoM-only; deterministic IDs.
import type { Bar } from '../bars';
import { E1Refusal } from '../refusals';

export type ObcvTf = '4H' | '1H' | '30m';
export interface ObcvCandidate {
  id: string; tf: ObcvTf; side: 'demand' | 'supply'; lo: number; hi: number;
  originTime: number; classification: 'BoM' | 'MoM' | 'PHANTOM_BOM';
  displacementPips: number; bodyMult: number;
}
export interface ObcvOut { candidates: ObcvCandidate[]; audit: string[] }

export const DISPLACEMENT_FLOOR: Record<ObcvTf, number> = { '4H': 50, '1H': 30, '30m': 20 };
const MOVE_WINDOW: Record<ObcvTf, number> = { '4H': 18, '1H': 36, '30m': 24 };

function tr(a: Bar, prev: Bar): number {
  return Math.max(a.high - a.low, Math.abs(a.high - prev.close), Math.abs(a.low - prev.close));
}
function atrExcluding(bars: Bar[], i: number): number {
  const from = Math.max(1, i - 14); const vals: number[] = [];
  for (let j = from; j < i; j++) vals.push(tr(bars[j]!, bars[j - 1]!));
  if (!vals.length) return 0;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}
function structureBroken(bars: Bar[], i: number, tf: ObcvTf, dir: 1 | -1): boolean {
  const from = Math.max(0, i - Math.floor(MOVE_WINDOW[tf] * 0.5));
  if (dir === 1) { let mx = -Infinity; for (let j = from; j < i; j++) if (bars[j]!.high > mx) mx = bars[j]!.high; return bars[i]!.close > mx; }
  let mn = Infinity; for (let j = from; j < i; j++) if (bars[j]!.low < mn) mn = bars[j]!.low; return bars[i]!.close < mn;
}

/** Detect OBCV candidates on pre-cutoff lanes. Lanes with a post-cutoff bar throw; absent 30m records the named token. */
export function detectObcvCandidates(
  lanes: Partial<Record<ObcvTf, Bar[]>>, unit: number, cutoff: number,
): ObcvOut {
  const audit: string[] = []; const candidates: ObcvCandidate[] = [];
  const pip = 0.01 * unit;
  const tfs: ObcvTf[] = ['4H', '1H', '30m'];
  const avail = tfs.filter((t) => (lanes[t] ?? []).length > 0);
  if (!avail.includes('30m')) audit.push('E1_OBCV_30M_DATA_MISSING');
  for (const tf of avail) {
    const bars = lanes[tf]!.filter((b) => b.time < cutoff);
    for (const b of lanes[tf]!) {
      if (b.time >= cutoff) throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', `obcv ${tf} bar ${b.time} at/after cutoff ${cutoff}`);
    }
    if (!bars.length) continue;
    const k = MOVE_WINDOW[tf];
    for (let i = 4; i < bars.length; i++) {
      const bar = bars[i]!;
      const body = Math.abs(bar.close - bar.open);
      const prior = bars.slice(i - 4, i).map((b) => Math.abs(b.close - b.open));
      const avg = prior.reduce((s, v) => s + v, 0) / prior.length;
      if (!(avg > 0) || body < 1.5 * avg) continue;
      const atr = atrExcluding(bars, i);
      if (!(atr > 0) || body < 1.5 * atr) continue;
      const end = Math.min(bars.length, i + 1 + k);
      if (end <= i + 1) continue;
      let mx = -Infinity; let mn = Infinity;
      for (let j = i + 1; j < end; j++) { const c = bars[j]!.close; if (c > mx) mx = c; if (c < mn) mn = c; }
      const dispPips = (mx - mn) / pip;
      if (dispPips < DISPLACEMENT_FLOOR[tf]) continue;
      const dir: 1 | -1 = bar.close > bar.open ? 1 : -1;
      if (!structureBroken(bars, i, tf, dir)) continue;
      const o = bars[i - 1]!;
      const bodyO = Math.abs(o.close - o.open); const rng = o.high - o.low;
      if (!(bodyO > 0) || !(rng > 0)) continue;
      const bw = bodyO / Math.max(o.high - Math.max(o.open, o.close), Math.min(o.open, o.close) - o.low, 1e-12);
      const bf = bodyO / rng;
      const dirO: 1 | -1 = o.close > o.open ? 1 : -1;
      let classification: 'BoM' | 'MoM' | 'PHANTOM_BOM' | null = null;
      if (bw >= 3.0 && bf >= 0.65) classification = tf === '30m' ? 'PHANTOM_BOM' : 'BoM';
      else classification = 'MoM';
      if (tf === '30m' && classification === 'BoM') classification = 'MoM';
      const side = dirO === 1 ? 'demand' : 'supply';
      const id = `OB|${tf}|${o.time}|${o.low.toFixed(5)}`;
      candidates.push({ id, tf, side, lo: o.low, hi: o.high, originTime: o.time, classification,
        displacementPips: Math.round(dispPips * 10) / 10, bodyMult: Math.round((body / avg) * 100) / 100 });
    }
  }
  candidates.sort((a, b) => a.tf.localeCompare(b.tf) || a.lo - b.lo || a.originTime - b.originTime);
  return { candidates, audit };
}
