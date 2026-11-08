# BLUEPRINT — PLUTUS VISION DYNAMIC INDICATOR
The mechanism this build creates. Reads with the DPL1; does not restate it.

## THE ONE-LINE THESIS
The operator's natural-language prompt already works as pseudocode and was visually verified.
Therefore the build is a TRANSPROSAIL — prose -> code — changing nothing in the process except
that the PDF step disappears and the indicator executes the workflow itself.

## THE TARGET SHAPE
  most-recent candle
    -> week_scope      tsL = Mon 09:00 London, tsR = Fri NY close, left = tsL - 7d, no forward
    -> sidecar /week   bars < weekStart only (replay cutoff enforced LOUD: REPLAY_DATA_LEAK)
    -> e1_pressure     report payload -> zones; zfp = value or null (null renders "ZFP n/a")
    -> e1_sd_liq       V1 SMC + LQZ rails (already working) on the SAME anchor
    -> e1_merged       ONE engine 1 (two sides of one coin)
    -> e2_chain        derive: HIGH+LOW -> holds (BS|WL); LOW+HIGH -> pierced; MOD+LM -> SS
    -> emit_pine       box/line/label, label = "<name> | <degree> | ZFP n%"
    -> render          pine-ide / backtest tab / dashboard (same emitter, three surfaces)
    -> replay          rewind Mon 09:00, 10x to Fri close, score zones + chain

## THE THREE NON-NEGOTIABLES
1. ZFP is TRANSCRIBED from the report. A computed number under that name is fabrication.
2. E2 is DERIVED from E1's table. A literal chain copied from report prose is a defect.
3. Evidence is a RENDERED SCREENSHOT whose label text is read aloud — never a count.

## THE SURFACES
  pine-ide  (pine.html, tabs: PINE IDE / BACKTEST)  -> my lane :3, cdp 9234, server 9863
  backtest  (tabs/backtest.js imports /charts/workbench.bundle.js)
  dashboard (LuxAlgo custom charts — same emitter contract)

## WHY THE SIDECAR
Pine has no network. The aether agents, the local qwen (vision/tool-calls) and the deepseek
math model live behind `sidecar/server.ts`. The indicator calls it; the user sees "open the
chart, it renders".
