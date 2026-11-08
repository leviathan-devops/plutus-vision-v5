# SEMANTIC CONTEXT TOKEN — e1-automatic-polish-2026-10-06

feat(e1-e2): automatic institutional pressure zones + the E2 price-continuation path

## THE LINEAGE (read top-down)
- baseline: v1 sealed 0d20e8314ce992fc (the operator's candle liquidity + LuxAlgo SMC S/D)
- E1 = the 6 institutional pressure zones (RES|MID|SUP × degree × ZFP), anchored to the
  chart's own target week (anchor = the week's Monday from the payload; replay-safe, no now()).
- E2 = the predicted price path — a CONTINUOUS jagged intraday line (fine_path, 11 pts), NOT a
  5-vertex triangle.
- v2 = 04d7a89ae57d1f9f (1735 lines) — E1 + E2 injected into the v1 baseline.

## WHAT ADVANCED HERE (vs Checkpoints/e1-automatic-ship-2026-10-05)
1. E2 continuity: fine_path() ENABLED + the render loops all segments (was unrolled to 4).
2. E1 price scale: the prediction band spans the zone range so all 6 zones fit.
3. Both layers coexist (the "cannot paint together" residual resolved).

## THE OPERATOR'S NEXT DIRECTIVE (2026-10-06) — the reason this checkpoint exists
- "The E2 shape shade is improving, but still not there... play forward the price action and
  see exactly what the price action is for the rest of the trading week... map backwards to
  the E2 shape chain. Save the checkpoints. Close all gaps. The E1 zones look better. Fix the
  E2 shape chain line drawing."
- UPGRADE: the Pine IDE desktop app becomes a TWO-TAB mini-dashboard (Pine IDE + Backtest),
  plug the indicator into the backtest tab, rewind one week, press play, record a video,
  watch with mimo v2.6 flash (the pinned vision model) → the accuracy verdict, mechanically.

## OPEN (the next build)
1. The two-tab mini-dashboard (Pine IDE + Backtest bar replay).
2. The E2 shape chain line drawing (the operator: "still not there").
3. E1 zone accuracy verification (via the forward-played price action).
