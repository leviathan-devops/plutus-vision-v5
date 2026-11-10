// lmv.ts — P3 organ: LMV defended-edge rung engine (lmv.ts donor semantics).
// strict local extrema (k=1, 1-pip prominence, plateau leaders kept) -> single-linkage
// clusters (2-pip linkage, 4-pip span cap) -> reaction extraction via classifyTouch over
// the eps-widened band -> >=3 reactions AND >=2 distinct kinds (PASS_THROUGH excluded) ->
// center = modal body close, defendedEdge = side-facing reaction extreme.
import type { Bar } from '../bars';
import { E1Refusal } from '../refusals';
import { classifyTouch, type OrganZone, type TouchKind } from './candlePressure';

export interface LmvRung {
  bottom: number; top: number; center: number; defendedEdge: number;
  side: 'BUY_SIDE' | 'SELL_SIDE'; reactions: number; kinds: TouchKind[];
  sweepCount: number; clusterSize: number;
}
export interface LmvOut { rungs: LmvRung[]; audit: string[] }

interface Swing { price: number; barIndex: number; time: number; prominence: number }

function extractSwings(bars: Bar[], pip: number): Swing[] {
  const minProm = 1 * pip; const out: Swing[] = [];
  for (let i = 1; i < bars.length - 1; i++) {
    const b = bars[i]!;
    let isHigh = true; let isLow = true; let sH = -Infinity; let sL = Infinity;
    for (const j of [i - 1, i + 1]) {
      const n = bars[j]!;
      if (n.high > b.high || (n.high === b.high && j < i)) isHigh = false;
      if (n.low < b.low || (n.low === b.low && j < i)) isLow = false;
      if (n.high > sH) sH = n.high;
      if (n.low < sL) sL = n.low;
    }
    if (isHigh) { const p = b.high - sH; if (p >= minProm || p === 0) out.push({ price: b.high, barIndex: i, time: b.time, prominence: Math.max(p, 0) }); }
    if (isLow) { const p = sL - b.low; if (p >= minProm || p === 0) out.push({ price: b.low, barIndex: i, time: b.time, prominence: Math.max(p, 0) }); }
  }
  return out;
}

function clusterSwings(points: Swing[], pip: number): Swing[][] {
  const sorted = [...points].sort((a, b) => (a.price - b.price) || (a.time - b.time));
  const tol = 2 * pip; const maxSpan = 4 * pip;
  const clusters: Swing[][] = [];
  for (const p of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && p.price - last[last.length - 1]!.price <= tol && p.price - last[0]!.price <= maxSpan) last.push(p);
    else clusters.push([p]);
  }
  return clusters;
}

/** Build defended-edge rungs from pre-cutoff bars. Post-cutoff bars throw. Short input records the named truncation. */
export function buildLmvRungs(preBars: Bar[], unit: number, cutoff = Infinity): LmvOut {
  const audit: string[] = [];
  for (const b of preBars) {
    if (b.time >= cutoff) throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', `lmv bar ${b.time} at/after cutoff ${cutoff}`);
  }
  if (preBars.length < 720) audit.push(`E1_LMV_LOOKBACK_TRUNCATED available=${preBars.length}`);
  const pip = 0.01 * unit;
  const eps = 2 * pip;
  const swings = extractSwings(preBars, pip);
  const clusters = clusterSwings(swings, pip);
  const rungs: LmvRung[] = [];
  for (const cluster of clusters) {
    let bottom = Infinity; let top = -Infinity;
    for (const p of cluster) { if (p.price < bottom) bottom = p.price; if (p.price > top) top = p.price; }
    const lo = bottom - eps; const hi = top + eps;
    const zone: OrganZone = { lo, hi, side: 'demand' };
    let reactions = 0; let sweeps = 0; const kinds = new Set<TouchKind>();
    const closes: number[] = [];
    let extreme = Infinity;
    for (let i = 0; i < preBars.length; i++) {
      // Swing bars 0 and N-1 can never be swing points, but they CAN react:
      // classifyTouch needs (before, test, after) at every index, so the
      // edges borrow the nearest inside bar instead of null.
      const before = preBars[i - 1] ?? preBars[i]!;
      const after = preBars[i + 1] ?? preBars[i]!;
      const kind = classifyTouch(zone, before, preBars[i]!,
        after, preBars.slice(Math.max(0, i - 2), i + 1), unit, cutoff).kind;
      if (kind === 'PASS_THROUGH' || kind === 'UNCLASSIFIED_REFUSED') continue;
      reactions++; kinds.add(kind); if (kind === 'SWEEP') sweeps++;
      closes.push(preBars[i]!.close);
      if (preBars[i]!.low < extreme) extreme = preBars[i]!.low;
    }
    const kindList = [...kinds];
    if (reactions < 3 || kindList.length < 2) continue;
    closes.sort((a, b) => a - b);
    let best = closes[0]!; let bestRun = 1; let run = 1;
    for (let i = 1; i < closes.length; i++) {
      run = closes[i]! - closes[i - 1]! <= pip ? run + 1 : 1;
      if (run > bestRun) { bestRun = run; best = closes[i]!; }
    }
    // Side by approach majority: closes above band probe lows -> BUY_SIDE, else SELL_SIDE.
    const above = closes.filter((c) => c >= hi).length; const below = closes.filter((c) => c <= lo).length;
    const side: LmvRung['side'] = above >= below ? 'BUY_SIDE' : 'SELL_SIDE';
    const defendedEdge = side === 'BUY_SIDE' ? extreme : top + eps;
    rungs.push({ bottom, top, center: best, defendedEdge, side, reactions, kinds: kindList, sweepCount: sweeps, clusterSize: cluster.length });
  }
  rungs.sort((a, b) => a.center - b.center || a.bottom - b.bottom);
  return { rungs, audit };
}
