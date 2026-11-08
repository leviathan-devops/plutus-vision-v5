# P5 ADVERSARIAL VERDICT — Plutus Vision v0 (2026-10-01)

Engine: PineTS 0.10.0 · station :9641 (forked standalone) · merged SHA fb752a1c4152817e…

## THE PASS
```
  surface map            28 exported decision functions (SMC 22 · SWEEPS 5 · VOIDS 0 · POOLS 1)
  positive half          4/4 subsystems DRAW
  negative half          control (input-only) renders 0/0/0 — zero misfire
  full artifact          12/12 fixture cells PASS
  VERDICT                FULL PASS — ZERO confirmed defects
```

## THE TWO STEP-4 "FAIL" ROWS — ADJUDICATED, NOT DEFECTS
Per the two-sided rule, both were checked against the CONTRACT before any verdict:

1. `AUD/USD 30m` → `PINE_BARS_CELL_ABSENT: no bars cell for pair=AUD/USD timeframe=30m`
   Side A (my probe wrong): YES — the station's fixture ships 12 cells = DXY/EUR/USD/GBP/USD × 15m/30m/1H/4H. **AUD/USD is not in the corpus at all.** Side B (real defect): NO — a data-availability refusal, not a code failure.
   VERDICT: **PROBE ERROR** (asked for a cell that does not exist). Not a defect.

2. `limit=1` → `bars absent (1)`
   Side A (my probe wrong): YES — one bar is fewer than the minimum the fixture's own slicing admits. Side B: NO — refusing a 1-bar request is correct.
   VERDICT: **PROBE ERROR** (degenerate input). Not a defect.

## THE ONE REAL FINDING — THE BUDGET IS DOCUMENTED, NOT ENFORCED
The §16 allocation (boxes 200/125/100/75) exists as a **comment plus drop counters**.
No cap is actually applied at any draw site. Measured ceiling pressure on real fixtures:

| cell | boxes drawn | Pine ceiling | headroom |
|---|---|---|---|
| EUR/USD 1H | 461 | 500 | 39 |
| GBP/USD 1H | 474 | 500 | 26 |
| EUR/USD 30m | 451 | 500 | 49 |
| DXY 1H | 441 | 500 | 59 |

Three of twelve cells sit within 40 boxes of the ceiling. On a denser market or a
longer history the merged file would hit Pine's hard cap and PineTS **silently drops**
the excess — which is the starvation class the probe was built to catch, arriving from
the other direction (over-draw, not starvation).

- CLASS: budget-not-enforced (the counters measure a condition the code does not control)
- ROOT CAUSE: the merge's §16 step specified counters; it never specified the `if` that
  stops a push when a subsystem's cap is reached.
- SMALLEST FIX: gate each subsystem's push site on its own counter (the counters already
  exist at all 6 drop sites — they need a companion comparison at the 4 draw sites).
- STATUS: **OPEN** — deliberately not fixed in v0. Applying it now would change drawing
  counts versus the originals, and the build's L-5 law forbids a behavior change smuggled
  in as a rename. The honest v0 ships with the ceiling risk NAMED.

## THE UNSWEPT FRONTIER (explicitly not claimed)
- PineTS ≠ TradingView. The 12-cell pass proves the file runs on the pinned engine;
  it does not prove TradingView's compiler accepts the same source. The eight
  engine-compat shims are recorded in RUNTIME_LEDGER.md and each is a Pine-legal
  construct, but the TradingView editor remains unverified.
- Visual parity (eyes on a rendered chart) is unswept — the station returns counts, not pixels.
- Tier-2 LuxAlgo candidates remain unvalidated by design (PLUTUS_VISION_COMPONENTS.md).
- The 9 closed LuxAlgo indicators (PAC, Signals & Overlays, screeners, backtesters) are
  unreadable and were never stubbed.
