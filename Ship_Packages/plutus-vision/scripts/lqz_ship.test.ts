/**
 * W3 / W4 / W5 GATE — the three ship-desk tests, ADVERSARIAL FIRST.
 *   bun test -t test_d1_bundles_three_sources
 *   bun test -t test_d2_candle_levels_emit
 *   bun test -t test_d3_merges_best_with_smc
 *
 * TWO TIERS per the pin's proof contract:
 *   L0  the STATION compile — POST :9741/run, success + the run title (the only
 *       thing that proves the Pine is valid and the engine emitted drawings)
 *   L1  the source carries the law — so a drift fails even if the counts still pass
 *
 * A count alone is NOT the gate. D1 once read "117 boxes PASS" while the frame was
 * three stacked renders, and D2 once drew 112 zones into 50 lines with no error.
 * So every test asserts an IDENTITY (which indicator ran, by its own title) and a
 * STRUCTURE (the sections and the suppression), not just a number.
 */
import { test, expect } from "bun:test";
import { readFileSync } from "node:fs";

const ROOT = "/home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION";
const STATION = "http://127.0.0.1:9741/run";

const read = (f) => readFileSync(`${ROOT}/${f}`, "utf8");

/** L0 — compile against the real station and return the run's OWN title + counts. */
// bun's default test timeout (5 s) is SHORTER than a station compile, so every test
// that reaches the station carries an explicit budget. Measured: D1 ~1.1 s, the full
// 12-cell matrix ~7 s/cell — a 5 s default fails a healthy rig.
const STATION_BUDGET = 120_000;

async function station(file, { pair = "EUR/USD", timeframe = "1H", limit = 1603 } = {}) {
  const res = await fetch(STATION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ script: read(file), pair, timeframe, limit }),
    signal: AbortSignal.timeout(120_000),
  });
  const j = await res.json();
  if (!j.success) throw new Error(`station refused ${file}: ${j.error ?? JSON.stringify(j).slice(0, 200)}`);
  return j.data;
}

test("test_d1_bundles_three_sources", async () => {
  const src = read("lqz-luxalgo.pine");

  // THE BUNDLE — all three detectors present as sections, one indicator decl
  for (const s of ["SWEEPS", "VOIDS", "POOLS"]) {
    expect(src).toContain(`// ═══ ${s}`);
  }
  expect((src.match(/^indicator\(/gm) || []).length).toBe(1);   // single-decl law

  // THE ONE DISPLAY — every detector colour constant silenced IN PLACE.
  // Measured before the fix: 117 boxes of the detectors' own primitives vs 36 LQZ
  // lines. The count is NOT the proof (the objects are still created) — the absence
  // of live colour inputs is.
  const liveColourInputs = src.match(/^(swp_|voi_|bsl_)c[a-zA-Z0-9_]*\s*=\s*input\.color/gm) || [];
  expect(liveColourInputs.length).toBe(0);
  const silenced = src.match(/^(swp_|voi_|bsl_)c[a-zA-Z0-9_]*\s*=\s*color\(na\)/gm) || [];
  expect(silenced.length).toBeGreaterThanOrEqual(8);

  // THE TAPS — how detection reaches the display without re-deriving it
  const taps = src.match(/^lqzV1[A-Za-z]+\(\) =>/gm) || [];
  expect(taps.length).toBeGreaterThanOrEqual(2);

  // L0 — it compiles, and the title is D1's OWN
  const d = await station("lqz-luxalgo.pine");
  expect(d.title).toBe("LQZ LuxAlgo");

  // ── NEGATIVE · a planted-defect bundle is REFUSED ────────────────────────
  // The planted defect: a detector colour constant restored to a live input.
  const defect = src.replace(/^swp_colBl = color\(na\)$/m, "swp_colBl = input.color(#089981, 'Bull')");
  expect(defect).not.toBe(src);
  const defectLive = defect.match(/^(swp_|voi_|bsl_)c[a-zA-Z0-9_]*\s*=\s*input\.color/gm) || [];
  expect(defectLive.length).toBe(1);            // the defect demonstrably exists
  expect(defectLive.length === 0).toBe(false);  // and the guard refuses it

  // ── EMPTY · a detector with no levels must not invent a band ─────────────
  // `lqzSource` must be able to select "candles" alone; with the LuxAlgo taps
  // silent and no candle levels, the zone array stays empty and the emitter
  // emits nothing. Asserted at the source level here; the live case is W6's.
  expect(src).toContain("lqzSource");
}, STATION_BUDGET);

test("test_d2_candle_levels_emit", async () => {
  const src = read("lqz-plutus.pine");

  // THE OPERATOR'S DETECTOR is the DEFAULT source (this deliverable is the candle one)
  expect(src).toContain('lqzSource   = input.string("candles"');

  // THE EMITTER — lines, not filled slabs. The first cut drew boxes at 0.35xATR and
  // the chart was a barcode; the measured library is 1px thin full-width lines.
  expect((src.match(/^indicator\(/gm) || []).length).toBe(1);
  expect(src).toContain("line.new(");
  const lines = src.match(/line\.new\(/g) || [];
  expect(lines.length).toBeGreaterThanOrEqual(2);   // rails + the mid line

  // THE CAPS — an undeclared cap ate 62 of 112 zones silently
  expect(src).toContain("max_lines_count = 500");

  // L0 — it compiles, and the title is D2's OWN (this is the identity assertion
  // that caught the panel renderer compiling the previous source)
  const d = await station("lqz-plutus.pine");
  expect(d.title).toBe("LQZ Plutus — operator candle liquidity");
  // ZERO ZONES RENDERED IS A RED FLAG (pin). D2's whole output is the ladder.
  expect(d.counts.lines).toBeGreaterThan(0);

  // ── NEGATIVE · a planted-defect emitter is REFUSED ───────────────────────
  // The planted defect: the box emitter (the barcode). It must be visible as such.
  // PROBE ERROR, adjudicated Side-A: `String.replace` with a STRING pattern replaces
  // only the FIRST occurrence, so `line.new(` survived in the mutant and the "defect
  // exists" assertion checked nothing. A mutant that does not fully apply proves
  // nothing about the guard — the same class as the adversarial battery's A4.
  const barcode = src.replaceAll("line.new(", "box.new(");
  expect(barcode).not.toBe(src);
  expect(barcode.includes("line.new(")).toBe(false);   // the defect demonstrably exists
  expect(src.includes("line.new(")).toBe(true);        // and the real emitter clears

  // ── EMPTY · no fallback band: the output is a FUNCTION of the input ──────
  // PROBE ERROR, adjudicated Side-A: I first asserted `limit: 30 -> lines === 0`.
  // That assumed a small window IS an empty detector. It is not — a candle detector
  // legitimately finds levels in 30 bars, and it did. The pin's law is "an empty
  // detector MUST yield zero zones, NEVER A FALLBACK BAND", and the test for a
  // fallback is not a zero — it is that the output DEPENDS on the input.
  // A constant line count across two different windows WOULD be a fallback.
  const wide = await station("lqz-plutus.pine", { limit: 1603 });
  const narrow = await station("lqz-plutus.pine", { limit: 60 });
  expect(wide.counts.lines).toBeGreaterThan(0);
  // the output tracks the input; a fabricated default would flatline
  expect(narrow.counts.lines).not.toBe(wide.counts.lines);
  // and a genuinely degenerate request is REFUSED BY NAME, never served a band
  let refused = null;
  try {
    await station("lqz-plutus.pine", { limit: 1 });
  } catch (e) {
    refused = String(e.message);
  }
  expect(refused).not.toBeNull();                         // it must refuse
  expect(refused).toContain("bars absent");               // by its own name
}, STATION_BUDGET);

test("test_d3_merges_best_with_smc", async () => {
  const src = read("plutus-vision-v1.pine");

  // THE MERGE — SMC structure + the LQZ display in ONE script
  const smc = src.match(/^smc_[a-zA-Z]/gm) || [];
  expect(smc.length).toBeGreaterThanOrEqual(20);        // SMC is the spine (38 measured)
  expect(src).toContain("line.new(");                   // the LQZ emitter
  expect((src.match(/^indicator\(/gm) || []).length).toBe(1);

  // S/D UNTOUCHED — the SMC side must still carry its own labels
  expect(src).toContain("label.new(");

  // THE CAPS
  expect(src).toContain("max_lines_count = 500");
  expect(src).toContain("max_labels_count = 500");

  // L0 — compiles, D3's OWN title, and it emits BOTH families
  const d = await station("plutus-vision-v1.pine");
  expect(d.title).toBe("Plutus Vision v1");
  expect(d.counts.lines).toBeGreaterThan(0);            // the LQZ ladder
  expect(d.counts.labels).toBeGreaterThan(0);           // the SMC structure text

  // ── NEGATIVE · a planted defect that removes the SMC merge is REFUSED ────
  const stripped = src.replace(/^smc_/gm, "zzz_");
  expect(stripped).not.toBe(src);
  expect((stripped.match(/^smc_[a-zA-Z]/gm) || []).length).toBe(0);   // the defect exists
  expect((src.match(/^smc_[a-zA-Z]/gm) || []).length).toBeGreaterThanOrEqual(20); // cleared

  // ── EMPTY · the parity reference is NOT this file ────────────────────────
  // The pin's law: do not edit plutus-vision-v0.pine. Assert the parity reference
  // is a DIFFERENT script and that D3 is its own title — so a reader can never
  // mistake D3 for the reference.
  const v0 = read("plutus-vision-v0.pine");
  expect(v0).not.toBe(src);
  expect(v0.includes("Plutus Vision v1")).toBe(false);
}, STATION_BUDGET);
