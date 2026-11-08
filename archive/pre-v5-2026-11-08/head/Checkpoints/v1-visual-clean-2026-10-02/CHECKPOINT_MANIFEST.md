# CHECKPOINT — v1-visual-clean-2026-10-02

SAVED BEFORE the supply/demand/liquidity calibration work.

## THE STATE THIS CAPTURES (operator-verified visual)
  'The visual aesthetic is good.'

## ARTIFACT SHAS (sha256, first 16)
  plutus-vision-v1.pine    d5ea5f52433a1e87  1245 lines
  plutus-vision-v0.pine    605bff82d3539e9e  1520 lines
  lqz-luxalgo.pine         db06b60574125039  931 lines
  lqz-plutus.pine          68881deaca0c66a1  340 lines
  renderer/vision.mjs       9defc71718bf530f

## MEASURED RENDER (EURUSD 1H W29, instrument-verified)
  LQZ zones 27 · overlapping 0 · cross-side 0 · identical dups 0 · labels 24 (SMC only)
  Render: evidence/pineshell-2026-W29-1790962409656.png

## THE FIXES THIS CHECKPOINT CAPTURES
  · box.new FILL replaces the triple-rail cage (the library emits zones, we emitted lines)
  · vision.mjs reads BOTH bgcolor and color (the engine emits fills under color)
  · palette -> the library's measured #3E9B8F / #B84A4A
  · the merge key is PRICE (was SIDE) — two bands at one level could never merge
  · side assigned ONCE from the merged band (was per-sink, price>=close)
  · the invented Buy/Sellside Liquidity labels REMOVED

## KNOWN OPEN (the work this checkpoint precedes)
  Liquidity side assignment: some bands render RED where the operator requires GREEN.
  S/D must come from the LuxAlgo SMC origin order-block candles only.
  Target palette: supply RED · demand BLUE · liquidity GREEN.
  Authority: PLUTUS/Original_Canon_Data/Training Data/Forex SMC Notes(1).md and (2).md
            + WINNING_TRADE_LIBARARY visual study.

## ROLLBACK
  cp Checkpoints/v1-visual-clean-2026-10-02/plutus-vision-v1.pine . && cp Checkpoints/v1-visual-clean-2026-10-02/plutus-vision-v1.pine pine-ide/ide/renderer/
  cp Checkpoints/v1-visual-clean-2026-10-02/renderer/vision.mjs pine-ide/pine-ide/ && cp Checkpoints/v1-visual-clean-2026-10-02/plutus-vision-lqz/lqz-core.pine plutus-vision-lqz/
