# BLUEPRINT — the two-detector liquidity zone

```
sources
├─ V1 LUXALGO VANILLA          W1
│   POOLS   pivot cluster      ─┐
│   SWEEPS  swept pivot        ─┼─► lqzLevels[]  ──► CLUSTER ──► lqz-render.pine
│   VOIDS   FVG                ─┘                 (tol)         └─ SELL_SIDE #3E8A46
├─ V2 OPERATOR CANDLES         W1                │             └─ BUY_SIDE  #7F3613
│   multi-touch level           │
│   wick grab + rejection       ┘
└─ lqzSource input: V1 | V2 | both                            W3
                                                             lqz-ab.mjs
                                                             both zone sets
                                                             + measurable diff
```

## THE INTERFACE (W1 → W2, lands before either consumer)
```
lqz-core.pine exports:
  var array<float>  lqzLevels      // every detected level
  var array<int>    lqzLevelSrc    // 0=v1 pools 1=v1 sweeps 2=v1 voids 3=v2 candles
  var array<int>    lqzLevelBar    // bar_index of each hit
lqz-render.pine consumes lqzLevels/lqzLevelSrc/lqzLevelBar only.
```

## WHY IDENTICAL OUTPUT
Both detectors write into the SAME array; the renderer never knows which wrote. A/B is
therefore a pure detection comparison — any visual difference is detection error, not render drift.

## FAILURE MODES
| mode | symptom | guard |
|---|---|---|
| zone budget | full-width zones + the LuxAlgo trio exhaust the one-script 500-box ceiling | count zones; evict oldest like `voi_all` does |
| `lqzSource` half-wired | a detector contributes nothing | `test_source_select_is_total` |
| cluster runaway | the envelope grows without bound as members join | cap expansion; flag to the operator |
| colour inversion | red below / green above | `test_colour_by_side` |

## OPEN CALIBRATIONS (owner: operator)
`lqzTol` default 0.5×ATR · `lqzMinAgree` default 2 · `wickBodyMult` default 2.0 ·
`rejectATRMult` default 1.5 — the last two are PROPOSED, not measured from the library.
