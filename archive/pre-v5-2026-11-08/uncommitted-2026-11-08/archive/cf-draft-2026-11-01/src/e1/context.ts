/**
 * THE ZFP CONTEXT — every B.2 modifier input computed from declared data, per zone.
 * Nothing here is a constant standing in for a measurement.
 *
 *   spring_release   walls (Clairic)            expiry in week AND zone inside the striking range
 *   macro_catalyst   calendar (Clairic)         high-impact print for a pair leg inside the week
 *   momentum         1H bars                    |ROC5| > k*ATR20 AND moving toward the zone
 *   cross_pair       sibling pairs' 1H bars     >=2 siblings hold a zone at the same range position
 *   cascade          1H bars in [open, anchor]  a same-direction zone closed through before the anchor
 *   regime_change    1H bars in [open, anchor]  close crossed EMA200 before the anchor
 */
import type { Bars } from "./build";
import { cluster, levels } from "./build";
import type { CalEvent, Walls } from "../steps/clairic";
import type { GateCtx, ZoneIn } from "./zfp";
import { Fatal, must } from "../steps/errors";

export interface WeekWindow {
  open: number;     // ms — the first bar of the trading week
  anchor: number;   // ms — Monday 09:00 London; the last bar the engine may read
  end: number;      // ms — Friday close
}

export interface Sibling {
  pair: string;
  inverse: boolean; // USD is the quote currency relative to the subject pair
  bars4h: Bars;
  bars1h: Bars;
  bars30m: Bars;
}

export function ema(closes: number[], n: number): number[] {
  if (closes.length < n) throw new Fatal("E1_EMA_SHORT", { have: closes.length, need: n });
  const k = 2 / (n + 1);
  const out: number[] = new Array(closes.length).fill(Number.NaN);
  let e = closes.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = e;
  for (let i = n; i < closes.length; i++) {
    e = must(closes[i], "E1_BAR_INDEX", { i }) * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

export function atr(b: Bars, n: number): number {
  if (b.close.length < n + 1) throw new Fatal("E1_ATR_SHORT", { have: b.close.length, need: n + 1 });
  let sum = 0;
  for (let i = b.close.length - n; i < b.close.length; i++) {
    const h = must(b.high[i], "E1_BAR_INDEX", { i });
    const l = must(b.low[i], "E1_BAR_INDEX", { i });
    const pc = must(b.close[i - 1], "E1_BAR_INDEX", { i });
    sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  return sum / n;
}

export function roc(closes: number[], n: number): number {
  const last = must(closes[closes.length - 1], "E1_BAR_INDEX", {});
  const prev = must(closes[closes.length - 1 - n], "E1_ROC_SHORT", { n });
  if (prev === 0) throw new Fatal("E1_ROC_ZERO_BASE", {});
  return (last - prev) / prev;
}

/** Position of a price inside the week's operating range, 0..1. */
function rangePos(price: number, lo: number, hi: number): number {
  if (hi <= lo) throw new Fatal("E1_RANGE_DEGENERATE", { lo, hi });
  return (price - lo) / (hi - lo);
}

export function siblingPositions(s: Sibling, tolFrac: number): number[] {
  const spot = must(s.bars1h.close[s.bars1h.close.length - 1], "W1_SIBLING_EMPTY", { pair: s.pair });
  const mids = cluster(levels(s.bars4h, s.bars1h, s.bars30m), spot * tolFrac).map((c) => c.mid);
  const lo = Math.min(...s.bars1h.low);
  const hi = Math.max(...s.bars1h.high);
  return mids.map((m) => (s.inverse ? 1 - rangePos(m, lo, hi) : rangePos(m, lo, hi)));
}

/** Zones whose band was closed through between the week open and the anchor. */
export function failedBeforeAnchor(zones: ZoneIn[], b1: Bars, w: WeekWindow): Set<string> {
  const failed = new Set<string>();
  for (let i = 0; i < b1.ts.length; i++) {
    const t = must(b1.ts[i], "E1_BAR_INDEX", { i }) * 1000;
    if (t < w.open || t > w.anchor) continue;
    const c = must(b1.close[i], "E1_BAR_INDEX", { i });
    for (const z of zones) {
      if (z.direction === "up" && c > z.top) failed.add(z.id);
      if (z.direction === "down" && c < z.bottom) failed.add(z.id);
    }
  }
  return failed;
}

export function emaCrossedBeforeAnchor(b1: Bars, w: WeekWindow): boolean {
  const e = ema(b1.close, 200);
  let prevSide: number | undefined;
  for (let i = 0; i < b1.ts.length; i++) {
    const t = must(b1.ts[i], "E1_BAR_INDEX", { i }) * 1000;
    const ei = must(e[i], "E1_BAR_INDEX", { i });
    if (Number.isNaN(ei)) continue;
    const side = Math.sign(must(b1.close[i], "E1_BAR_INDEX", { i }) - ei);
    if (t >= w.open && t <= w.anchor && prevSide !== undefined && side !== 0 && side !== prevSide) return true;
    if (side !== 0) prevSide = side;
  }
  return false;
}

export interface ContextInputs {
  pair: string;
  spot: number;
  walls: Walls;
  events: CalEvent[];
  b1: Bars;
  siblings: Sibling[];
  window: WeekWindow;
  momentumK: number;
  strikeRangePct: number;
  crossPairTolPct: number;
  tolFrac: number;
}

/**
 * Build the ZFP context for one zone. `cascadeZfp` maps a failed zone id to the ZFP it carries
 * WITHOUT the cascade modifier (a cascade cannot be triggered by a cascade); the caller computes
 * it in a first pass with `cascade` evaluated against an empty failure set by definition, and
 * records that definition in the receipt gate string.
 */
export function contextFor(
  z: ZoneIn,
  notional: number,
  inp: ContextInputs,
  priorFailures: { zfp: number; direction: "up" | "down" }[],
): GateCtx {
  if (inp.siblings.length < 2) throw new Fatal("W1_SIBLINGS_SHORT", { have: inp.siblings.length, need: 2 });
  const lo = Math.min(...inp.b1.low);
  const hi = Math.max(...inp.b1.high);
  const pos = rangePos((z.top + z.bottom) / 2, lo, hi);
  const crossMids: Record<string, number[]> = {};
  for (const s of inp.siblings) crossMids[s.pair] = siblingPositions(s, inp.tolFrac);

  return {
    pair: inp.pair,
    notional_b: notional,
    spot: inp.spot,
    expiryTs: inp.walls.expiry,
    strikeRangePct: inp.strikeRangePct,
    events: inp.events.map((e) => ({ ts: e.ts, impact: e.impact, currency: e.currency })),
    momentumK: inp.momentumK,
    roc5: roc(inp.b1.close, 5),
    atr20: atr(inp.b1, 20),
    toward: (z.top + z.bottom) / 2 > inp.spot ? 1 : -1,
    crossMids,
    zonePos: pos,
    tol: inp.crossPairTolPct,
    priorFailures,
    ema200Crossed: emaCrossedBeforeAnchor(inp.b1, inp.window),
    weekStart: inp.window.open,
    weekEnd: inp.window.end,
  };
}
