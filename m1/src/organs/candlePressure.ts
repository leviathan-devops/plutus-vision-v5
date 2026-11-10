// candlePressure.ts — P3 organ: per-bar touch classification against a zone band.
// Ported semantics: lqz-matrix.ts classifyTouch (SWEEP / WICK_REJECT / BODY_DEFEND /
// CONSOL_DWELL / PASS_THROUGH piecewise-total) at single-bar granularity with the
// multi-bar CONSOL_DWELL evaluated over a caller-supplied window. All inputs pre-cutoff;
// a post-cutoff bar is refused, never classified.
import type { Bar } from '../bars';
import { E1Refusal } from '../refusals';

export type TouchKind = 'SWEEP' | 'WICK_REJECT' | 'BODY_DEFEND' | 'CONSOL_DWELL' | 'PASS_THROUGH' | 'UNCLASSIFIED_REFUSED';
export type ZoneSide = 'demand' | 'supply';

export interface OrganZone { lo: number; hi: number; side: ZoneSide }
export interface TouchEvent {
  time: number; kind: TouchKind; pre_side: 'above' | 'below' | 'inside';
  test_bar_id: number; exit_bar_id: number | null;
  pierce: boolean; reclaim: boolean; gap_through: boolean;
}

/** Defended edge = the zone edge price faces (demand defends lo, supply defends hi). Far edge = opposite. */
export function defendedEdgeOf(zone: OrganZone): number { return zone.side === 'demand' ? zone.lo : zone.hi; }
export function farEdgeOf(zone: OrganZone): number { return zone.side === 'demand' ? zone.hi : zone.lo; }

const MIN_TOUCH_DEPTH_PIPS = 2;

function anatomy(bar: Bar) {
  const bodyTop = Math.max(bar.open, bar.close);
  const bodyBottom = Math.min(bar.open, bar.close);
  return { bodyTop, bodyBottom, bodySize: Math.abs(bar.close - bar.open),
    upperWick: bar.high - bodyTop, lowerWick: bodyBottom - bar.low };
}

/**
 * classifyTouch — total predicate over (zone, before, test, after).
 * before/after are the adjacent bars (null at array edges); window is the trailing
 * run ending at test used ONLY for the CONSOL_DWELL shape. cutoffs: bars at/after
 * cutoff throw E1_ORGAN_INPUT_POST_CUTOFF. Zero-width zones throw.
 */
export function classifyTouch(
  zone: OrganZone, before: Bar | null, test: Bar, after: Bar | null,
  window: Bar[], unit: number, cutoff: number,
): TouchEvent {
  if (!(zone.hi > zone.lo)) throw new Error('CANDLE_PRESSURE_ZONE_INVALID: hi must exceed lo');
  for (const b of [before, test, after]) {
    if (b && b.time >= cutoff) throw new E1Refusal('E1_ORGAN_INPUT_POST_CUTOFF', `candle-pressure bar ${b.time} at/after cutoff ${cutoff}`);
  }
  const minDepth = MIN_TOUCH_DEPTH_PIPS * 0.01 * unit;
  const an = anatomy(test);
  const lo = zone.lo;
  const hi = zone.hi;
  const ev = (kind: TouchKind, extra: Partial<TouchEvent> = {}): TouchEvent => ({
    time: test.time, kind,
    pre_side: before ? (before.close >= hi ? 'above' : before.close <= lo ? 'below' : 'inside') : 'inside',
    test_bar_id: test.time, exit_bar_id: null,
    pierce: false, reclaim: false, gap_through: false, ...extra,
  });
  const refClose = before ? before.close : test.open;
  const fromAbove = refClose >= hi;
  const fromBelow = refClose <= lo;
  const prevDidNotDwell = before === null || before.low > hi || before.high < lo;
  // Gap-through: bar never intersects the band — being-left-behind, not a battle.
  if (test.low > hi || test.high < lo) return ev('PASS_THROUGH', { gap_through: true });
  // PIERCE: body closes through the DEFENDED edge (demand close < lo / supply
  // close > hi) while intersecting the band — the zone lost the battle. A
  // traversal, so the kind stays PASS_THROUGH (audit-only), but pierce=true
  // lets the freshness/pressure organs terminalize it. Checked before
  // BODY_DEFEND so a breakdown is never read as a defense.
  if (zone.side === 'demand' && test.close < lo) return ev('PASS_THROUGH', { pierce: true });
  if (zone.side === 'supply' && test.close > hi) return ev('PASS_THROUGH', { pierce: true });
  const wickThroughDown = test.low < lo;
  const wickThroughUp = test.high > hi;
  const beyondDown = lo - test.low;
  const beyondUp = test.high - hi;
  // SWEEP: wick crosses the DEFENDED edge and the body reclaims back inside.
  if (zone.side === 'demand' && fromAbove && wickThroughDown && beyondDown >= minDepth && test.close >= lo && prevDidNotDwell)
    return ev('SWEEP', { pierce: test.close > hi, reclaim: true });
  if (zone.side === 'supply' && fromBelow && wickThroughUp && beyondUp >= minDepth && test.close <= hi && prevDidNotDwell)
    return ev('SWEEP', { pierce: test.close < lo, reclaim: true });
  // WICK_REJECT: wick enters, body stays out, close holds the originating side.
  const lowerWickEnters = test.low < hi && an.bodyBottom > lo;
  const upperWickEnters = an.bodyTop < hi && test.high > lo;
  if (fromAbove && lowerWickEnters && !wickThroughDown && an.lowerWick >= minDepth && test.close >= hi)
    return ev('WICK_REJECT');
  if (fromBelow && upperWickEnters && !wickThroughUp && an.upperWick >= minDepth && test.close <= lo)
    return ev('WICK_REJECT');
  // BODY_DEFEND: body enters the band and the next bar turns away (immediate reversal).
  const bodyEnters = an.bodyBottom < hi && an.bodyTop > lo;
  if (bodyEnters && (fromAbove || fromBelow) && after) {
    const turnUp = fromAbove && after.close > test.close && after.close - hi >= minDepth;
    const turnDown = fromBelow && after.close < test.close && lo - after.close >= minDepth;
    if (turnUp || turnDown) return ev('BODY_DEFEND', { exit_bar_id: after.time });
  }
  // CONSOL_DWELL: >=2 closes inside the band with no direction over the trailing 3-bar window.
  const trail = [...window.slice(-2), test];
  if (trail.length >= 3) {
    const closes = trail.slice(-3).map((b) => b.close);
    const allInside = closes.every((c) => c >= lo && c <= hi);
    if (allInside) {
      const span = Math.max(...trail.slice(-3).map((b) => b.high)) - Math.min(...trail.slice(-3).map((b) => b.low));
      const net = Math.abs(closes[2]! - closes[0]!);
      if (span <= 2 * (hi - lo) && net <= (hi - lo)) return ev('CONSOL_DWELL');
    }
  }
  // PASS_THROUGH: body closes through the FAR edge (traversed — audit-only,
  // never a battle). A far-edge traverse that also closed through the
  // defended edge was already returned above as a pierce.
  if (bodyEnters) {
    if (zone.side === 'demand' && test.close > hi) return ev('PASS_THROUGH', {});
    if (zone.side === 'supply' && test.close < lo) return ev('PASS_THROUGH', {});
  }
  return ev('UNCLASSIFIED_REFUSED');
}
