# INSTRUMENT FAILURES — the auditor's own misses, kept rather than deleted

## 1 · H7 duplicated-authority detector, version 1 — DISCARDED AND REBUILT
The regex `RRR[^\n]{0,40}?(\d+)` matched ANY digit within 40 characters of the keyword.
Line numbers, prices and trade counts were then reported as "conflicting RRR floors"
(356, 231, 196, 11, 14). That output is retained as evidence above, not deleted.
Rebuilt as H7v2: a claim must name the concept AND a threshold word
(floor|minimum|at least|>=|≥) AND the number in the same clause. A detector that
cannot tell a floor from a line number produces findings about itself.

## 2 · The blind-comprehension test is the real instrument
Every gate I built measures FORM (anchors resolve, types match, diagnostics 0).
None of them measures COMPREHENSION. Three blind agents are the instrument for that,
and their returns are the only evidence that the graph is sufficient.

## 3 · Counting trades per week from the Winning Trade Library — BOTH INSTRUMENTS BLIND
- **OCR (tesseract 5.3, psm 11):** returned 0 "Stop:" hits across all 19 pages, including page 1
  where two are plainly visible. A zero from a blind instrument is not an absence.
- **Colour-blob counting (red stop boxes):** found 8 boxes on page 1 where 2 stop labels exist,
  because bearish CANDLES are the same red. The detector cannot separate an annotation from a candle.
- **Conclusion:** neither instrument can count trades per week. The labels are small, anti-aliased,
  white-on-dark, and the chart is full of red candles. A reliable count needs per-page high-dpi crops
  of the annotation strip, read by eye — a desk task, not a one-liner.
- **What WAS read by eye:** page 1 = GBPUSD "Swing Scalps", with at least two position clusters
  (RRR 6.5: SL 5.2 / TP 35.8; RRR 8.5 with a separate Closed P&L). The library is 19 pages, each a
  full week of one pair, with 13 shape-chain labels in the text layer.
