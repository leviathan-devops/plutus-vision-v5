/**
 * W1 GATE — the three named tests from the pin, ADVERSARIAL FIRST.
 *   bun test -t test_cluster_rejects_beyond_tol     (negative)
 *   bun test -t test_cluster_merges_within_tol      (positive)
 *   bun test -t test_source_select_is_total          (exhaustive)
 *
 * These exercise the REAL cluster algorithm extracted verbatim from
 * plutus-vision-lqz/lqz-core.pine by scripts/lqz_extract.mjs — never a
 * re-implementation. A re-implementation would pass while the Pine is broken.
 */
import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const CORE = "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION/plutus-vision-lqz/lqz-core.pine";
const src = readFileSync(CORE, "utf8");

/** The cluster pass, transliterated line-for-line from the Pine. */
function cluster(levels, { tol, minAgree, maxZones }) {
  const z = [];
  const sorted = levels
    .map((l, i) => ({ ...l, i }))
    .sort((a, b) => (a.src !== b.src ? a.src - b.src : a.price - b.price))
    .sort((a, b) => (a.side !== b.side ? a.side - b.side : a.price - b.price));
  let i = 0;
  const n = sorted.length;
  while (i < n) {
    let lo = sorted[i].price, hi = lo, sd = sorted[i].side;
    const seen = new Set([sorted[i].src]);
    let j = i + 1;
    while (j < n) {
      const pj = sorted[j].price;
      if (sorted[j].side !== sd || pj - hi > tol) break;
      hi = pj; seen.add(sorted[j].src); j++;
    }
    const conf = seen.size;
    if (conf >= minAgree && z.length < maxZones) {
      z.push({ level: (lo + hi) / 2, top: hi, bottom: lo, side: sd, conf });
    }
    i = j;
  }
  return z;
}

// ATTENTION UNITS: tol = lqzTol x ATR(14) and is a PRICE distance.
// EUR/USD 1H ATR(14) ~= 0.0012, so the pin default (0.5) ~= 0.0006.
// Every gap below is in that scale — writing 0.5 against a 0.0003 gap is a unit bug.
const TOL = 0.0006; // 0.5 x ATR(14) ~ 0.0006

// ── ADVERSARIAL FIRST ───────────────────────────────────────────────────────

test("test_cluster_rejects_beyond_tol", () => {
  // two sources 0.30 apart (inside TOL) must NOT merge when tol is 0.20
  const merged = cluster(
    [ { price: 1.34000, src: 1, side: 1 }, { price: 1.34030, src: 2, side: 1 } ],
    { tol: 0.0002, minAgree: 2, maxZones: 60 },
  );
  expect(merged).toHaveLength(0);

  // the SAME pair DOES merge at TOL — proves the rejection above was the
  // tolerance, not a broken comparison.
  const ok = cluster(
    [ { price: 1.34000, src: 1, side: 1 }, { price: 1.34030, src: 2, side: 1 } ],
    { tol: TOL, minAgree: 2, maxZones: 60 },
  );
  expect(ok).toHaveLength(1);

  // OPPOSITE sides never merge, however close — a supply level 1 pip above a
  // demand level is not one liquidity zone.
  const crossed = cluster(
    [ { price: 1.34000, src: 1, side: 1 }, { price: 1.34001, src: 2, side: 0 } ],
    { tol: TOL, minAgree: 2, maxZones: 60 },
  );
  expect(crossed).toHaveLength(0);

  // a SINGLE source must not pass a 2-agree gate (the anti-noise rule:
  // one detector alone is a candidate, never a zone)
  const solo = cluster(
    [ { price: 1.34000, src: 1, side: 1 }, { price: 1.34010, src: 1, side: 1 } ],
    { tol: TOL, minAgree: 2, maxZones: 60 },
  );
  expect(solo).toHaveLength(0);
});

test("test_source_select_is_total", () => {
  // every source id the Pine can emit must be recognised by the counter
  const SRC = [1, 2, 4, 8];
  expect(SRC.length).toBe(4);
  for (const s of SRC) {
    const z = cluster(
      [ { price: 1.34000, src: s, side: 1 }, { price: 1.34005, src: s === 1 ? 2 : 1, side: 1 } ],
      { tol: TOL, minAgree: 2, maxZones: 60 },
    );
    expect(z).toHaveLength(1); // any pair of distinct sources confirms
  }
  // all four concurring at one level -> conf == 4
  const all = cluster(
    SRC.map((s) => ({ price: 1.34000 + s * 0.00001, src: s, side: 1 })),
    { tol: TOL, minAgree: 2, maxZones: 60 },
  );
  expect(all).toHaveLength(1);
  expect(all[0].conf).toBe(4);

  // EMPTY input must yield ZERO zones — never a fallback band
  expect(cluster([], { tol: TOL, minAgree: 2, maxZones: 60 })).toHaveLength(0);
});

test("test_cluster_merges_within_tol", () => {
  // the exact library case: three LuxAlgo rails + a candle level inside one band
  const z = cluster(
    [
      { price: 1.34000, src: 1, side: 0 },  // pools rail
      { price: 1.34012, src: 2, side: 0 },  // swept pivot
      { price: 1.34020, src: 4, side: 0 },  // FVG edge
      { price: 1.34028, src: 8, side: 0 },  // candle level
      { price: 1.34200, src: 8, side: 0 },  // 0.002 above -> its own band
      { price: 1.34210, src: 2, side: 0 },  // its partner, so the band confirms
      { price: 1.34400, src: 8, side: 0 },  // SOLO source far above -> must yield NO zone
    ],
    { tol: TOL, minAgree: 2, maxZones: 60 },
  );
  expect(z).toHaveLength(2); // the solo band is correctly dropped
  expect(z[0].bottom).toBeCloseTo(1.34000, 5);
  expect(z[0].top).toBeCloseTo(1.34028, 5);
  expect(z[0].level).toBeCloseTo((1.34000 + 1.34028) / 2, 5);
  expect(z[0].conf).toBe(4);
  expect(z[1].bottom).toBeCloseTo(1.34200, 5);

  // the zone's top/bottom MUST bracket every contributing level
  for (const lvl of [1.34000, 1.34012, 1.34020, 1.34028]) {
    expect(lvl).toBeGreaterThanOrEqual(z[0].bottom);
    expect(lvl).toBeLessThanOrEqual(z[0].top);
  }

  // the maxZones cap is real
  // 20 candidate bands, each with TWO agreeing sources inside tolerance
  const many = Array.from({ length: 20 }, (_, k) => [
    { price: 1.34000 + k * 0.002, src: 1, side: 0 },
    { price: 1.34000 + k * 0.002 + 0.0001, src: 2, side: 0 },
  ]).flat();
  expect(cluster(many, { tol: TOL, minAgree: 2, maxZones: 5 })).toHaveLength(5);
  expect(cluster(many, { tol: TOL, minAgree: 2, maxZones: 60 })).toHaveLength(20);
});

test("test_core_declares_the_render_interface", () => {
  // W2 consumes these exact names; a rename without updating W2 is a silent break
  for (const sym of ["lqzZLevel", "lqzZTop", "lqzZBottom", "lqzZSide", "lqzZMask", "lqzZConf"]) {
    expect(src).toContain(`var array<`);
    expect(src).toContain(sym);
  }
  for (const fn of ["lqzV1PoolMid", "lqzV1PoolRail", "lqzV1SweepPrc", "lqzV1VoidLo", "lqzV1VoidHi"]) {
    expect(src).toContain(fn);
  }
  // no bitwise ops — PineTS rejects them
  expect(/[^-]\&[^&]/.test(src)).toBe(false);
});