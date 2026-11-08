# DPL1 SPEC — PLUTUS VISION LIQUIDITY (v0 → v1)
Project root: /home/leviathan/JARVIS_WORKSPACE/Shared_Workspace/PLUTUS_VISION
Binding authority. The wave plan is its argument; conflicts resolve against this spec.

## §0 PROBLEM (verbatim from the operator, 2026-10-01)

> "the liquidity zones right now are 3 different weird stlyes of render that make it hard to see
>  - my hand drawn liqidity zones are all 3 of these data types/triggers/instances/etc drawn as one
>  solid horizontal green zone across the level that all 3 liquidity tpyes itnersect"
>
> "all liquidity zones extend horizontally across the entire chart. look at the photos."
>
> "i want you to deeply study my winning trade library and how i've manually charted all of my
>  S/D/L zones on my winning trades setups"
>
> "Lux algo's SMC indicator already handles S/D zones basically perfect. liquidity is the issue"
>
> "your task is to fix liquidity and split test lux algos vs mine to see which is more precise"
>
> "IT IS NOT APPROVED" unless it LOOKS as solid as the winning trade library

## §1 MEASURED FAILURE INVENTORY (evidence, not hypotheticals)

| # | observed | evidence |
|---|---|---|
| F1 | three LuxAlgo liquidity renders stack at the same level | `plutus-vision-v0.pine` draw sites: POOLS 1346-1352/1407-1409, SWEEPS 936-990, VOIDS 1112-1145 — 14 primitive sites, three visual languages |
| F2 | no agreement test between them | no shared price-level array anywhere in the file; `grep -c "lqzLevels" plutus-vision-v0.pine` = 0 |
| F3 | ladder lines in the target library are FULL-WIDTH | measured: 99–100 % row coverage, `measure_ladder.py` |
| F4 | ladder spacing is IRREGULAR (detected, not a grid) | measured: n=40 gaps, 23 distinct, min 2.5 px, max 48.5 px |
| F5 | palette is exactly two level colours + one zone colour | measured: GREEN/teal 33 bands `#3E8A46`, RED 7 bands `#7F3613` |
| F6 | red-above / green-below geography matches BUY_SIDE/SELL_SIDE | RED measured in y 32–140 (upper), GREEN in y 98–378 (lower) |
| F7 | current render draws BOUNDED boxes, not full-width | `box.new(st_B, st_P, b.i + 10, st_P, …)` — +10 bars, not full width |
| F8 | no candle-pattern detector exists in Pine | grep for `bodySize\|2\.5 \*\|CONSOL_MAX_SPAN` over `sources/*.pine` returns nothing |

## §2 THE TWO DETECTORS (identical output layer)

### V1 — LUXALGO VANILLA (fewest code changes)
Do NOT touch detection. Redirect the 14 draw sites into ONE shared level array, then one
clustering pass emits the green zones. Detection stays byte-identical to what already passes
parity (SMC 195/195 · POOLS 25/25 · SWEEPS 258/258 · VOIDS 380/500).

### V2 — OPERATOR CANDLES (from SMC_Liquidity_Notes.md + measured pixels)
1. "Where has price touched multiple times? That's a liquidity build-up"  → level, ≥2 touches
2. "Price wicks just beyond the support/resistance — taking out stops"    → the sweep
3. "Structure breaks after the sweep (BOS)"                              → confirmation
4. "Consolidation right after a sweep = absorption"                      → the green zone

Observed candle mechanics (read off `/tmp/candles1.png`, `/tmp/candles2.png`):
- **A wick grab** — wick ≫ body, tip pierces a level, body closes back inside
- **A wick stack** — separate bars' tips on the same price
- **The rejection** — a decisive move away within m bars; a wick with no follow-through is volatility
- **The close-through** — price closes beyond rather than wicking

### SHARED OUTPUT (identical in both — this is what makes the A/B valid)
cluster levels within tolerance → ONE full-width zone →
`SELL_SIDE (below price) → #3E8A46 green` · `BUY_SIDE (above price) → #7F3613 red`

## §3 WAVE ORDER

| wave | owner | disjoint files | deliverable | gate |
|---|---|---|---|---|
| W1 | detector-desk | `lqz-core.pine` (new) | the shared level array + both detectors behind a `lqzSource` input | compiles; V1 parity unchanged (0 deltas vs `scripts/compare.py`) |
| W2 | render-desk | `lqz-render.pine` (new) | the full-width zone emitter | every emitted zone spans `bar_index-500 .. bar_index+20` |
| W3 | rig-desk | `scripts/lqz_ab.py` + `lqz-ab.mjs` | the split-test A/B harness | prints both detectors' zones for the same bars |

W1 and W2 are interface-disjoint (W2 consumes `lqz-core.pine`'s exported array only) → they may
run concurrently after the interface lands. W3 depends on both.

## §4 TESTING TIERS
L0 compile · L1 pure cluster tests · L2 station run on the fixture · L3/L4 the Pine IDE on :3.

## §6 SUCCESS CRITERIA (command-verifiable)
- `python3 scripts/compare.py` → SMC 195/195 · POOLS 25/25 (no regression from W1)
- `node scripts/lqz-ab.mjs` → both detectors emit; zones differ ONLY in detection
- `measure_ladder.py` on the IDE capture → full-width coverage 99–100 %
- a capture on 15m/30m/1H/4H READ by the operator, compared against ≥4 library screenshots

## §7 OPEN — the operator's calibration
- `lqzTol` — the overlap tolerance. Default 0.5 × ATR(14) (the VOIDS filter `lqTH`).
- `lqzMinAgree` — 2-of-3 (default) or 3-of-3. Default 2-of-3 with a brighter 3-of-3 core.
- `wickBodyMult` (default 2.0) and `rejectATRMult` (default 1.5) for V2 — PROPOSED, not measured.
