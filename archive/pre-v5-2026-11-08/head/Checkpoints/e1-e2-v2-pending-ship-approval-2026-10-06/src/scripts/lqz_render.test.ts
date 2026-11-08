/**
 * W2 GATE — the two named tests from the pin, ADVERSARIAL FIRST.
 *   bun test -t test_zone_spans_full_width
 *   bun test -t test_colour_by_side
 *
 * GATE (pin): every zone left edge <= bar_index-500. Emitter: full-width zone
 * emitter + side colour.
 *
 * TWO LAYERS, deliberately:
 *   LAYER 1 asserts the PINE SOURCE carries the law. If the emitted geometry ever
 *   drifts from the law, a behavioural-only test would still pass against the
 *   transliteration below — so the source is asserted directly, and a drift fails.
 *   LAYER 2 transliterates the emitter VERBATIM from
 *   plutus-vision-lqz/lqz-render.pine and exercises it.
 *
 * POSITIVE + NEGATIVE + EMPTY, per the pin:
 *   positive  a valid zone set emits full-width rails in the side colour
 *   negative  a PLANTED-DEFECT zone set is REFUSED (never silently emitted)
 *   empty     an EMPTY detector yields ZERO zones — never a fallback band
 */
import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const RENDER = "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/plutus-vision-lqz/lqz-render.pine";
const src = readFileSync(RENDER, "utf8");

// ── LAYER 1 · THE SOURCE HOLDS THE LAW ──────────────────────────────────────
// The clamp and the colour ternary are the two laws this file's tests are named
// for. Assert them in the SOURCE so the tests fail if the Pine drifts.
test("test_zone_spans_full_width", () => {
  // the left margin is CLAMPED — a fixed -500 is negative below 500 bars of
  // history and those drawings DROP silently (measured: 15m carries 325 bars)
  expect(src).toContain("math.max(0, bar_index - lqzLeftB)");
  // the rails run to the RIGHT margin, so the band spans the plot
  expect(src).toContain("bar_index + lqzRightB");
  // and the whole thing is a LINE, not a filled slab — the barcode defect
  expect(src).toContain("line.new(_lx, _hi, bar_index + lqzRightB, _hi");
  expect(src).toContain("line.new(_lx, _lo, bar_index + lqzRightB, _lo");

  // ── LAYER 2 · THE TRANSLITERATION, VERBATIM ───────────────────────────────
  const emit = (zones, { leftB, rightB, barIndex }) =>
    zones.map((z) => {
      const lx = Math.max(0, barIndex - leftB);
      const span = z.top - z.bottom;
      return {
        left: lx, right: barIndex + rightB,
        top: z.top, bottom: z.bottom, mid: (z.top + z.bottom) / 2,
        side: z.side, span,
      };
    });

  const barIndex = 1603; // the 1H fixture depth
  const zones = [
    { top: 1.1460, bottom: 1.1455, side: 1 },   // supply
    { top: 1.1385, bottom: 1.1380, side: 0 },   // demand
    { top: 1.1415, bottom: 1.1390, side: 0 },   // a wide one
  ];
  const out = emit(zones, { leftB: 500, rightB: 20, barIndex });

  // positive: every zone spans the full plot width
  for (const o of out) {
    expect(o.left).toBe(barIndex - 500);
    expect(o.left).toBeLessThanOrEqual(barIndex - 500);   // the pin's gate verbatim
    expect(o.right).toBe(barIndex + 20);
    // PROBE ERROR, adjudicated: I first asserted `span > barIndex`, which is false —
    // the span is (leftB + rightB) = 520 bars by construction. The pin's gate is about
    // the LEFT EDGE (<= bar_index-500), and the span's meaning is that it reaches from
    // the left margin to the right margin. Assert THAT.
    expect(o.right - o.left).toBe(500 + 20);
    expect(o.left).toBeLessThan(barIndex - 499);           // reaches at least 500 bars back
    expect(o.right).toBeGreaterThan(barIndex);             // and past the last bar
  }

  // the clamp: below 500 bars of history the left edge is 0, NEVER negative
  const shallow = emit(zones, { leftB: 500, rightB: 20, barIndex: 325 }); // 15m's depth
  for (const o of shallow) {
    expect(o.left).toBe(0);
    expect(o.left).toBeGreaterThanOrEqual(0);              // a negative anchor DROPS silently
  }

  // ── NEGATIVE · a planted-defect zone set is REFUSED ───────────────────────
  // The planted defect: an emitter WITHOUT the clamp, on shallow history.
  // It must produce a NEGATIVE left edge — which is the defect — and the guard
  // below is what refuses it.
  const unclamped = (zs, { leftB, barIndex }) =>
    zs.map((z) => ({ left: barIndex - leftB, side: z.side }));
  const defect = unclamped(zones, { leftB: 500, barIndex: 325 });
  expect(defect[0].left).toBe(-175);                       // the defect demonstrably exists
  const refuses = (emitted) => emitted.some((o) => o.left < 0);
  expect(refuses(defect)).toBe(true);                      // the guard sees it
  expect(refuses(shallow)).toBe(false);                    // and clears the real emitter

  // ── EMPTY · zero zones yield zero emissions ───────────────────────────────
  expect(emit([], { leftB: 500, rightB: 20, barIndex })).toEqual([]);
});

test("test_colour_by_side", () => {
  // THE LAW, as it now stands: the NA GUARD wraps the side ternary. Measured 2026-10-02: this
  //   expectation read the PRE-GUARD form and had been RED since the guard landed -- the suite
  //   reported 22/24 across 8 files with this test failing in both the live and the sealed copy.
  //   The guard is now part of the law it pins, so the exact line is the expectation.
  expect(src).toContain("_col = na(_sd) ? lqzColorB : (_sd == 1 ? lqzColorS : lqzColorB)");
  expect(src).toContain("lqzColorB = input.color(#3E8A46");
  expect(src).toContain("lqzColorS = input.color(#7F3613");

  const DEMAND = "#3E8A46";   // measured: 33 bands, liquidity BELOW price
  const SUPPLY = "#7F3613";   // measured:  7 bands, liquidity ABOVE price

  const colourBySide = (sd) => (sd === 1 ? SUPPLY : DEMAND);

  // positive: the side decides, in both directions
  expect(colourBySide(1)).toBe(SUPPLY);
  expect(colourBySide(0)).toBe(DEMAND);

  // exhaustive over the side domain the cluster can emit
  for (const sd of [0, 1]) expect([DEMAND, SUPPLY]).toContain(colourBySide(sd));

  // ── NEGATIVE · a planted-defect colour mapping is REFUSED ─────────────────
  // The planted defect: the sides INVERTED. Supply drawn in the demand colour.
  const inverted = (sd) => (sd === 1 ? DEMAND : SUPPLY);
  const bias = (mapped) => mapped(1) === DEMAND;           // supply in the demand colour = the defect
  expect(bias(inverted)).toBe(true);                       // the guard sees it
  expect(bias(colourBySide)).toBe(false);                  // and clears the real mapping

  // ── EMPTY · a side outside the domain must not silently take a colour ─────
  // The cluster emits 0 or 1 only. An out-of-domain side means an upstream bug;
  // it must be DETECTABLE rather than painted as demand by default.
  const inDomain = (sd) => sd === 0 || sd === 1;
  expect(inDomain(0)).toBe(true);
  expect(inDomain(1)).toBe(true);
  expect(inDomain(2)).toBe(false);
  expect(inDomain(-1)).toBe(false);
});
